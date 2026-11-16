"""
prepare_fresh.py - teach the detector the recordings that caught it out.

The National Speech Corpus test clips showed the newest head reading the
recording setup of Part 3 as machine traces (docs/eval_results.md, Run 9).
Training and validation only had Parts 2 and 6, so validation could not show it.

1. The 300 clips from eval/false_alarm_check.py (Parts 1 and 3) join the data:
   100 per part train, 50 per part validation. Each gets the same fake side as
   the clips before it: a Piper voice reading its transcript and one vocoded
   copy. The vocoded copy matters most here: same room, same microphone, same
   speaker, so the only difference left between real and fake is machine traces.

2. Those clips stop being fresh, and the old test clips may share speakers with
   them, so a new held-out set is cut from the rest of Parts 1 and 3: real clips
   nothing has scored, plus vocoded copies of some of them. If a head has only
   learned "this kind of recording = real", it will miss those vocoded copies.
   The corpus split has no speaker IDs, so held-out clips may still share
   speakers with training clips.

Writes:
    data/train_manifest_clips2.csv   data/train_manifest_clips.csv + the new rows
    data/manifest_heldout.csv        new real clips + vocoded copies (no other fakes:
                                     the test fakes keep their saved scores)

Run from the project root (rerun to resume, finished files are skipped):
    python -m data_prep.prepare_fresh
"""
import argparse
import io
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import librosa
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import soundfile as sf

from audio.phone import PhoneConfig, compress_clip, degrade
from data_prep.make_tts import Piper
from data_prep.prepare_clips import CONSENT, load_tools, make_copy, rebuild, tool_for
from data_prep.prepare_train import OUT, ROOT, SR, TRAIN_VOICES, VAL_VOICES
from data_prep.prepare_train_sg import NOTE, clean_text
from detectors.forensics_xlsr import load_audio

PARTS = {"nsc_read": "ASR-PART1-Test", "nsc_conv": "ASR-PART3-Test"}
REAL = ROOT / "data" / "real"
IN = ROOT / "data" / "train_manifest_clips.csv"
TRAIN_OUT = ROOT / "data" / "train_manifest_clips2.csv"
HELDOUT_OUT = ROOT / "data" / "manifest_heldout.csv"
VAL_EVERY = 3  # every third clip goes to validation


def shard(part):
    return pq.read_table(sorted((ROOT / "downloads" / "mnsc" / part).glob("*.parquet"))[0],
                         columns=["context", "answer"])


def row(path, label, source, generator, speaker, note, **extra):
    return {"path": Path(path).relative_to(ROOT).as_posix(), "label": label, "source": source,
            "generator": generator, "speaker_id": speaker, "consent_note": note, **extra}


def vocode(tools, real, stem, speaker, **extra):
    """One vocoded copy of a real clip, chosen and stored as in prepare_clips.py."""
    name = tool_for(stem)
    target = OUT / "vocoded" / name / f"{stem}.wav"
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        sf.write(target, rebuild(tools[name], load_audio(real)), SR)
    return row(target, "fake", "vocoded", f"voc-{name}", speaker, CONSENT, **extra)


def add_to_training(tools, tts):
    """The fresh clips, with their fakes. Returns manifest rows for the clean clips."""
    voice_lists = {"train": list(TRAIN_VOICES), "val": list(VAL_VOICES)}
    rows = []
    for source, part in PARTS.items():
        answers = shard(part).column("answer")
        # Hashing the name mixes the clips, so no stretch of the shard lands in one split.
        files = sorted((REAL / "nsc_fresh" / source).glob("*.wav"), key=lambda p: zlib.crc32(p.name.encode()))
        kept = 0
        for real in files:
            name = real.stem.split("__")[0]
            text = clean_text(answers[int(real.stem.split("__")[1])].as_py())
            if len(text.split()) < 4:  # too short to read aloud, as in prepare_train_sg.py
                continue
            split = "val" if kept % VAL_EVERY == 0 else "train"
            voices = voice_lists[split]
            voice = voices[kept % len(voices)]
            fake = OUT / "sg_fake" / f"piper-{voice}__{name}.wav"
            if not fake.exists():
                audio = tts.say(text[:400], voice)  # very long turns: first ~400 characters
                sf.write(fake, audio / (np.abs(audio).max() + 1e-8) * 0.9, SR)
            real_source = f"{source}_p{part[8]}"  # nsc_read_p1, nsc_conv_p3
            rows += [row(real, "real", real_source, "", name, NOTE, split=split, version="clean"),
                     row(fake, "fake", "tts", "piper", f"piper-{voice}",
                         "synthetic stock voice (Piper) reading a Singaporean transcript",
                         split=split, version="clean"),
                     vocode(tools, real, real.stem, name, split=split, version="clean")]
            kept += 1
        print(f"  {source}: {kept} clips added", flush=True)
    return pd.DataFrame(rows)


def training_copies(clean):
    """Two compressed copies and one phone copy of every training clip."""
    jobs, rows = [], []
    for clip in clean[clean.split == "train"].itertuples(index=False):
        stem, folder = Path(clip.path).stem, clip.generator or "real"
        for version in ("comp1", "comp2"):
            target = f"data/train/compressed/{version}/{folder}/{stem}.wav"
            jobs.append((ROOT / clip.path, ROOT / target, lambda wav, seed: compress_clip(wav, seed=seed)[0]))
            rows.append({**clip._asdict(), "path": target, "version": version})
        folder = "vocoded/phone" if clip.source == "vocoded" else f"phone/{clip.label}"
        target = f"data/train/{folder}/{stem}__p1.wav"
        jobs.append((ROOT / clip.path, ROOT / target, lambda wav, seed: degrade(wav, seed=seed, config=PhoneConfig())[0]))
        rows.append({**clip._asdict(), "path": target, "version": "phone1"})
    print(f"Making {len(jobs)} copies ...", flush=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(make_copy, jobs))
    return pd.DataFrame(rows)


def held_out(tools, per_part, vocoded_per_part, seed=2):
    """Real clips nothing has scored, cut the same way as data_prep/prepare_sg.py."""
    rng = np.random.default_rng(seed)
    rows = []
    for source, part in PARTS.items():
        table = shard(part)
        out_dir = REAL / "nsc_heldout" / source
        out_dir.mkdir(parents=True, exist_ok=True)
        kept = 0
        for i in rng.permutation(table.num_rows):
            name = f"{part.lower()}-{int(i)}"
            file = f"{name}__{int(i)}.wav"
            if (REAL / source / file).exists() or (REAL / "nsc_fresh" / source / file).exists():
                continue
            if not (out_dir / file).exists():
                audio = table.column("context")[int(i)].as_py()
                wav, sr = sf.read(io.BytesIO(audio["bytes"]), dtype="float32", always_2d=True)
                wav = wav.mean(axis=1)
                if sr != SR:
                    wav = librosa.resample(wav, orig_sr=sr, target_sr=SR)
                if len(wav) < 3 * SR:
                    continue
                sf.write(out_dir / file, wav[:15 * SR], SR)
            rows.append(row(out_dir / file, "real", source, "", name, NOTE))
            if kept < vocoded_per_part:
                rows.append(vocode(tools, out_dir / file, Path(file).stem, name))
            kept += 1
            if kept == per_part:
                break
        print(f"  {source}: {kept} held-out clips of {table.num_rows}", flush=True)
    return pd.DataFrame(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-part", type=int, default=200, help="held-out real clips per part")
    ap.add_argument("--vocoded-per-part", type=int, default=100)
    args = ap.parse_args()

    tools = load_tools()
    clean = add_to_training(tools, Piper({**TRAIN_VOICES, **VAL_VOICES}))
    held_out(tools, args.per_part, args.vocoded_per_part).to_csv(HELDOUT_OUT, index=False)
    del tools

    base = pd.read_csv(IN, keep_default_na=False)
    table = pd.concat([base, clean, training_copies(clean)], ignore_index=True)
    table.to_csv(TRAIN_OUT, index=False)
    print(table[table.source.str.contains("_p1|_p3") | table.path.isin(clean.path)]
          .groupby(["split", "label", "source", "version"]).size().to_string())
    print(f"Wrote {TRAIN_OUT.relative_to(ROOT)}: {len(table)} rows; {HELDOUT_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
