"""
finetune_head.py - adapt the detector to phone-quality audio.

What is trained: ONLY the detector's "head" (the AASIST graph pooling and the
small classifier on top). The XLS-R backbone (300M parameters) stays frozen,
so the model keeps everything it learned from millions of clips; we only
re-teach how it reads those features, now including phone-quality audio.
This fits on a 6 GB laptop GPU and takes minutes, not days.

Training data: data/train_manifest.csv, split "train" (each clip clean plus
2 phone copies). Each step uses a random 5 s slice of each clip (random
slices are fine for TRAINING; scoring always uses fixed windows).

Validation after every epoch: the "val" speakers/voices, clean, compressed
and phone (seeded copies, made once), scored exactly like the real detector
(whole clip, 5 s windows). Epoch 0 is the original model. The epoch with the
best selection score (clean EER + compressed-clip EER on the worst speech
generator) is saved to models/finetuned/head.safetensors. The test set is NOT
touched here.

Two options change what the head is taught, without adding any data:
  --phone-head       trains on each clip's clean and phone copies in equal shares
                     and picks the epoch on phone EER, for a head used on phone audio
  --consistency W    with --phone-head: the phone copy should score like the clean
                     copy of the same 5 s, so the head stops relying on sounds that
                     a call removes. W is how much this counts.
  --one-class        learns what real speech looks like instead of the known fakes
                     (detectors/forensics_xlsr.py, CosineOutput)

Three more change what it hears or what may learn:
  --fresh-phone      with --phone-head: a new random phone call for a slice at every
                     step, instead of the one phone copy on disk
  --rawboost P       chance that a slice gets random channel damage (audio/rawboost.py)
  --unfreeze N       the last N backbone layers learn too, slowly (--backbone-lr).
                     They are saved with the head, so it needs its own backbone.

Run from the project root:
    python -m train.finetune_head --epochs 8
"""
import argparse
import time
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import pandas as pd
import soundfile as sf
import torch
from safetensors.torch import load_file, save_file
from sklearn.metrics import roc_curve

from audio.phone import PhoneConfig, compress_clip, degrade
from audio.rawboost import rawboost
from detectors.forensics_xlsr import (KNOWN_UNUSED_PREFIXES, SR, WEIGHTS, WINDOW_S, CosineOutput,
                                      ForensicsDetector, load_audio, make_windows)

ROOT = Path(__file__).resolve().parent.parent
HEAD_OUT = ROOT / "models" / "finetuned" / "head.safetensors"
LOG_OUT = ROOT / "results" / "train" / "log.csv"
HEAD_PREFIXES = ("pool.", "classifier.")
N_SAMPLES = int(WINDOW_S * SR)
VAL_BATCH = 8  # windows at a time in validation: a long clip must still fit the GPU


def build_model(device):
    model = ForensicsDetector()
    result = model.load_state_dict(load_file(str(WEIGHTS)), strict=False)
    bad = [k for k in result.unexpected_keys if not k.startswith(KNOWN_UNUSED_PREFIXES)]
    if result.missing_keys or bad:
        raise RuntimeError(f"checkpoint mismatch: {result.missing_keys[:5]} {bad[:5]}")
    for p in model.wavlm.parameters():
        p.requires_grad = False  # freeze the backbone
    return model.to(device)


def unfreeze_last(model, n):
    """Let the last n backbone layers learn, and return their parameters."""
    encoder = model.wavlm.encoder
    params = [p for part in [*encoder.layers[-n:], encoder.layer_norm] for p in part.parameters()]
    for p in params:
        p.requires_grad = True
    return params


def forward(model, batch):
    """Backbone in fp16, then the head in fp32. Frozen layers record no gradients,
    so only layers opened with --unfreeze cost extra memory.
    Returns logits where sigmoid(logit) = P(real), as in the original model."""
    with torch.autocast("cuda", dtype=torch.float16, enabled=batch.is_cuda):
        hidden = model.wavlm(batch, output_hidden_states=True).hidden_states[1:]
    return model.classifier(model.pool([h.float() for h in hidden])).squeeze(-1)


def random_start(path, rng, n=N_SAMPLES):
    """Where a random 5 s slice of this file begins."""
    info = sf.info(path)
    if info.samplerate != SR or info.channels != 1:
        raise ValueError(f"{path} is not {SR} Hz mono")
    return rng.integers(0, info.frames - n + 1) if info.frames > n else 0


def read_slice(path, start, n=N_SAMPLES):
    """Read one 5 s slice from disk, so the clips need not all fit in memory."""
    piece, _ = sf.read(path, start=start, frames=n, dtype="float32")
    if len(piece) < n:
        piece = np.tile(piece, int(np.ceil(n / len(piece))))[:n]
    return piece / (np.abs(piece).max() + 1e-8)  # peak-normalise, as at inference


def random_slice(path, rng):
    return read_slice(path, random_start(path, rng))


def augment(piece, seed, boost_chance, phone):
    """New random damage for one slice: maybe RawBoost (the caller's microphone),
    then, if asked, a new random phone call. Peak-normalised, as at inference."""
    rng = np.random.default_rng(seed)
    if rng.random() < boost_chance:
        piece = rawboost(piece, rng)
    if phone:
        piece, _ = degrade(piece, seed=seed, config=PhoneConfig())
    return piece / (np.abs(piece).max() + 1e-8)


def clean_phone_pairs(train):
    """One row per clip, with the path of its clean copy and of its phone copy.
    A phone copy has the same file name as the clean clip, plus "__p1"."""
    clips = train.assign(clip=[Path(p).stem.removesuffix("__p1") for p in train.path])
    clean, phone = clips[clips.version == "clean"], clips[clips.version == "phone1"]
    pairs = clean.merge(phone, on=["clip", "label", "generator"], suffixes=("", "_phone"), validate="1:1")
    if len(pairs) != len(clean):
        raise ValueError(f"{len(clean) - len(pairs)} clean clips have no phone copy")
    return pairs


def eer(labels_fake, scores):
    fpr, tpr, _ = roc_curve(labels_fake, scores)
    i = np.argmin(np.abs((1 - tpr) - fpr))
    return 100 * (fpr[i] + 1 - tpr[i]) / 2


@torch.no_grad()
def validate(model, val_sets, generators, device):
    """Validation EER for each condition, scoring whole clips in fixed windows.
    On degraded audio also one EER per fake generator: a good overall number
    can hide a blind spot for one kind of fake, which is what went wrong
    before (docs/eval_results.md, Run 6)."""
    model.eval()
    out = {}
    for condition, (wavs, labels) in val_sets.items():
        scores = []
        for wav in wavs:
            windows = torch.from_numpy(make_windows(wav / (np.abs(wav).max() + 1e-8))).to(device)
            real = [torch.sigmoid(forward(model, part)) for part in windows.split(VAL_BATCH)]
            scores.append(float((1 - torch.cat(real)).mean()))
        out[condition] = eer(labels, scores)
        if condition != "clean":
            scores = np.array(scores)
            for name in sorted(set(generators) - {""}):
                keep = (generators == name) | (generators == "")  # this fake + all real clips
                out[f"{condition}_{name}"] = eer(labels[keep], scores[keep])
    return out


def selection_score(v, phone_head=False, held_out=()):
    """Lower is better: clean EER plus compressed-clip EER on the WORST speech
    generator. Vocoded clips only teach machine traces. They are not voices a
    scammer would make, and DAC copies speech so closely that it alone picked
    a much worse epoch (docs/eval_results.md, Run 9), so they do not count here.
    Attached clips are the current stage, so phone EER is logged but not
    selected on, except for a head trained for phone audio: that one uses phone
    EER plus phone EER on the worst speech generator. Generators held out of
    training do not count either, or they would be choosing the epoch that
    is meant to measure them."""
    condition = "phone" if phone_head else "compressed"
    worst = max(value for key, value in v.items()
                if key.startswith(condition + "_") and "voc-" not in key
                and key[len(condition) + 1:] not in held_out)
    return (v["phone" if phone_head else "clean"] + worst) / 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=8)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--manifest", default="data/train_manifest.csv")
    ap.add_argument("--out", default=str(HEAD_OUT.relative_to(ROOT)), help="where to save the best head")
    ap.add_argument("--label-smoothing", type=float, default=0.0,
                    help="aim for 0.05/0.95 instead of 0/1 (at 0.1), so the head stays less overconfident")
    ap.add_argument("--hold-out", nargs="+", default=[],
                    help="leave these generators out of TRAINING but keep them in validation, "
                         "to measure how the settings cope with a kind of fake never trained on")
    ap.add_argument("--phone-head", action="store_true", help="train on clean + phone copies, select on phone")
    ap.add_argument("--consistency", type=float, default=0.0, help="weight of the clean-versus-phone score match")
    ap.add_argument("--one-class", action="store_true", help="one-class last layer and loss")
    ap.add_argument("--fresh-phone", action="store_true", help="a new random phone copy at every step")
    ap.add_argument("--rawboost", type=float, default=0.0, help="chance that a slice gets RawBoost damage")
    ap.add_argument("--unfreeze", type=int, default=0, help="also train the last N backbone layers")
    ap.add_argument("--backbone-lr", type=float, default=1e-5, help="learning rate of those layers")
    args = ap.parse_args()
    if args.one_class and args.label_smoothing:
        raise SystemExit("--one-class has margins of its own, so do not use --label-smoothing")
    if args.consistency and not args.phone_head:
        raise SystemExit("--consistency needs --phone-head: it compares the two copies of a clip")
    if args.fresh_phone and not args.phone_head:
        raise SystemExit("--fresh-phone needs --phone-head: it replaces the phone copies")
    head_out, log_out = ROOT / args.out, (ROOT / args.out).with_suffix(".log.csv")
    torch.manual_seed(args.seed)
    rng = np.random.default_rng(args.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    manifest = pd.read_csv(ROOT / args.manifest, keep_default_na=False)
    train = manifest[manifest.split == "train"]
    train = train[~train.generator.isin(args.hold_out)]
    if args.phone_head:
        train = clean_phone_pairs(train)  # one row per clip; train_paths are the clean copies
        phone_paths = [ROOT / p for p in train.path_phone]
    val = manifest[(manifest.split == "val") & (manifest.version == "clean")]
    print(f"{len(train)} training files; loading {len(val)} validation clips into memory ...")
    train_paths = [ROOT / p for p in train.path]
    train_y = torch.tensor((train.label == "real").to_numpy(), dtype=torch.float32)  # 1 = real
    targets = train_y * (1 - args.label_smoothing) + args.label_smoothing / 2
    threads = ThreadPoolExecutor(max_workers=8)  # most of the wait is ffmpeg, a separate program
    val_clean = [load_audio(ROOT / p) for p in val.path]
    val_phone = list(threads.map(lambda w, p: degrade(w, seed=zlib.crc32(p.encode()), config=PhoneConfig())[0],
                                 val_clean, val.path))
    val_compressed = list(threads.map(lambda w, p: compress_clip(w, seed=zlib.crc32(p.encode()))[0],
                                      val_clean, val.path))
    val_labels = (val.label == "fake").astype(int).to_numpy()
    val_sets = {"clean": (val_clean, val_labels), "compressed": (val_compressed, val_labels),
                "phone": (val_phone, val_labels)}
    val_generators = val.generator.to_numpy()

    model = build_model(device)
    if args.one_class:
        model.classifier.output_head[3] = CosineOutput(model.classifier.output_head[3])
    head = [p for n, p in model.named_parameters() if n.startswith(HEAD_PREFIXES)]
    print(f"Training {sum(p.numel() for p in head):,} head parameters; backbone frozen.")
    groups = [{"params": head, "lr": args.lr}]
    if args.unfreeze:
        opened = unfreeze_last(model, args.unfreeze)
        groups.append({"params": opened, "lr": args.backbone_lr})
        print(f"Also training the last {args.unfreeze} backbone layers: {sum(p.numel() for p in opened):,} parameters.")
    optimiser = torch.optim.AdamW(groups, weight_decay=1e-4)
    # Gradients inside the fp16 backbone are small enough to round to zero without this.
    scaler = torch.amp.GradScaler("cuda", enabled=bool(args.unfreeze))
    clips_per_step = args.batch // 2 if args.phone_head else args.batch  # a pair is 2 slices, same memory
    steps_per_epoch = int(np.ceil(len(train_paths) / clips_per_step))
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimiser, T_max=args.epochs * steps_per_epoch)
    # If there are more fake than real clips, weight the real ones up so each
    # class counts equally (otherwise the head drifts towards saying "fake").
    n_real, n_fake = int(train_y.sum()), int(len(train_y) - train_y.sum())
    loss_fn = torch.nn.BCEWithLogitsLoss(pos_weight=torch.tensor(n_fake / n_real, device=device))
    print(f"Training clips: {n_real} real, {n_fake} fake (real weighted x{n_fake / n_real:.2f})")

    def spoil(pieces, phone=False):
        """New random damage for these slices, if any was asked for."""
        if not (args.rawboost or phone):
            return pieces
        seeds = rng.integers(2 ** 32, size=len(pieces))
        return list(threads.map(lambda piece, seed: augment(piece, seed, args.rawboost, phone), pieces, seeds))

    def load_batch(idx):
        """Waveforms and targets for these clips. With --phone-head: every clean
        slice, then the same 5 s of every phone copy, in the same order."""
        if not args.phone_head:
            return spoil([random_slice(train_paths[j], rng) for j in idx]), targets[idx]
        starts = [random_start(train_paths[j], rng) for j in idx]
        clean = [read_slice(train_paths[j], s) for j, s in zip(idx, starts)]
        if args.fresh_phone:
            phone = spoil(clean, phone=True)
        else:
            phone = spoil([read_slice(phone_paths[j], s) for j, s in zip(idx, starts)])
        return spoil(clean) + phone, targets[idx].repeat(2)

    def compute_loss(logits, y):
        """--one-class: real logits must clear +margin and fake logits -margin,
        which is the OC-softmax loss written on the logit of CosineOutput."""
        shifted = logits
        if args.one_class:
            margin = CosineOutput.ALPHA * (CosineOutput.REAL_MARGIN - CosineOutput.MID)
            shifted = logits + margin * (1 - 2 * y)
        loss = loss_fn(shifted, y)
        if args.consistency:
            clean, phone = torch.sigmoid(logits).chunk(2)
            # detach: the phone copy moves towards the clean score, never the reverse
            loss = loss + args.consistency * ((phone - clean.detach()) ** 2).mean()
        return loss

    def selection(v):
        return selection_score(v, args.phone_head, args.hold_out)

    def describe(v):
        def by_generator(condition):
            return "  ".join(f"{k[len(condition) + 1:]} {x:.2f}%" for k, x in v.items()
                             if k.startswith(condition + "_"))
        return (f"val EER clean {v['clean']:.2f}%  compressed {v['compressed']:.2f}% ({by_generator('compressed')})"
                f"  phone {v['phone']:.2f}% ({by_generator('phone')})")

    def log_row(epoch, train_loss, v, seconds):
        return {"epoch": epoch, "train_loss": train_loss, **{f"val_eer_{k}": round(x, 2) for k, x in v.items()},
                "selection": round(selection(v), 2), "seconds": seconds}

    v = validate(model, val_sets, val_generators, device)
    log = [log_row(0, None, v, 0)]
    print(f"epoch 0 (original model): {describe(v)}")
    best = baseline = selection(v)
    head_out.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        start = time.time()
        model.train()
        model.wavlm.eval()  # keep the frozen backbone in inference mode (no dropout)
        order = rng.permutation(len(train_paths))
        losses = []
        for i in range(0, len(order), clips_per_step):
            wavs, y = load_batch(order[i:i + clips_per_step])
            batch = torch.from_numpy(np.stack(wavs)).float().to(device)
            loss = compute_loss(forward(model, batch), y.to(device))
            optimiser.zero_grad()
            scaler.scale(loss).backward()
            scaler.step(optimiser)
            scaler.update()
            scheduler.step()
            losses.append(loss.item())

        v = validate(model, val_sets, val_generators, device)
        log.append(log_row(epoch, round(float(np.mean(losses)), 4), v, round(time.time() - start)))
        saved = ""
        if selection(v) <= best:  # on a tie keep the later epoch
            best = selection(v)
            learned = {n for n, p in model.named_parameters() if p.requires_grad}
            state = {k: t.contiguous().cpu() for k, t in model.state_dict().items()
                     if k.startswith(HEAD_PREFIXES) or k in learned}
            if args.one_class:
                state["one_class"] = torch.ones(1)  # tells get_model to use CosineOutput
            save_file(state, str(head_out))
            saved = "  <- best so far, saved"
        print(f"epoch {epoch}: loss {np.mean(losses):.4f}  {describe(v)}  ({time.time() - start:.0f} s){saved}")

    pd.DataFrame(log).to_csv(log_out, index=False)
    if best == baseline:
        print("No epoch beat the original model on validation; nothing saved.")
    else:
        print(f"Best head saved to {args.out}; log in {log_out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
