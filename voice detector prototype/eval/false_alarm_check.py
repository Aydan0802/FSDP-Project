"""
false_alarm_check.py - how often are real Singaporean voices wrongly flagged?

The test set showed far more false alarms on Part 3 of the National Speech
Corpus (natural conversation) than validation did, because validation uses
Parts 2 and 6 (docs/eval_results.md, Run 9). The test clips helped us see that,
so they can no longer give a fair number for any fix. This script takes clips
from Parts 1 and 3 that were never scored before, and has no fake clips.

For each clip: clean, compressed and phone copies, one raw score per head, then
each calibration file (made by eval.calibrate) turns those into a chance of fake.
These clips may share speakers with the test clips, because the corpus split
has no speaker IDs. They are real-only, so this measures false alarms and
nothing else.

These clips are no longer fresh: data_prep/prepare_fresh.py moved them into
training and validation (Run 10). Rerunning this now gives optimistic numbers.

Writes to --out:
    scores.csv     one row per clip per condition, one raw score per head
    report.csv     share of real clips flagged, per calibration file

Run from the project root:
    python -m eval.false_alarm_check --calibrations a.json b.json --out results/fresh
"""
import argparse
import io
import json
import zlib
from pathlib import Path

import librosa
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import soundfile as sf

from audio.phone import PhoneConfig, compress_clip, degrade
from detectors.calibration import combine
from detectors.forensics_xlsr import SR, load_audio, score_clip
from eval.calibrate import CHANNELS

ROOT = Path(__file__).resolve().parent.parent
PARTS = {"nsc_read": "ASR-PART1-Test", "nsc_conv": "ASR-PART3-Test"}
FRESH = ROOT / "data" / "real" / "nsc_fresh"
CHANNEL_OF = {condition: channel for channel, conditions in CHANNELS.items() for condition in conditions}


def fresh_clips(per_part, seed=1):
    """Write clips nobody has scored, cut the same way as data_prep/prepare_sg.py."""
    rng = np.random.default_rng(seed)
    clips = []
    for source, part in PARTS.items():
        shard = sorted((ROOT / "downloads" / "mnsc" / part).glob("*.parquet"))[0]
        table = pq.read_table(shard, columns=["context"])
        out_dir = FRESH / source
        out_dir.mkdir(parents=True, exist_ok=True)
        kept = 0
        for i in rng.permutation(table.num_rows):
            name = f"{part.lower()}-{int(i)}__{int(i)}.wav"
            if (ROOT / "data" / "real" / source / name).exists():  # already a test clip
                continue
            if not (out_dir / name).exists():
                audio = table.column("context")[int(i)].as_py()
                wav, sr = sf.read(io.BytesIO(audio["bytes"]), dtype="float32", always_2d=True)
                wav = wav.mean(axis=1)
                if sr != SR:
                    wav = librosa.resample(wav, orig_sr=sr, target_sr=SR)
                if len(wav) < 3 * SR:
                    continue
                sf.write(out_dir / name, wav[:15 * SR], SR)
            clips.append((source, out_dir / name))
            kept += 1
            if kept == per_part:
                break
        print(f"  {source}: {kept} fresh clips of {table.num_rows}", flush=True)
    return clips


def score_all(clips, heads):
    """heads: column name -> head path (None = the original model)."""
    rows = []
    for i, (source, path) in enumerate(clips):
        wav = load_audio(path)
        seed = zlib.crc32(path.name.encode())
        copies = {"clean": wav, "compressed": compress_clip(wav, seed=seed)[0],
                  "phone": degrade(wav, seed=seed, config=PhoneConfig())[0]}
        for condition, audio in copies.items():
            raw = {name: score_clip(audio, head)["fake_score_raw"] for name, head in heads.items()}
            rows.append({"path": path.name, "source": source, "condition": condition, **raw})
        if (i + 1) % 25 == 0:
            print(f"  scored {i + 1}/{len(clips)} clips", flush=True)
    return pd.DataFrame(rows)


def column(head):
    return Path(head).stem if head else "original"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--calibrations", nargs="+", required=True, help="calibration json files to compare")
    ap.add_argument("--out", required=True)
    ap.add_argument("--per-part", type=int, default=150)
    args = ap.parse_args()
    out = ROOT / args.out
    out.mkdir(parents=True, exist_ok=True)

    cals = {path: json.loads((ROOT / path).read_text()) for path in args.calibrations}
    heads = {column(h): ROOT / h if h else None for cal in cals.values() for h in cal["heads"]}
    if (out / "scores.csv").exists():
        print(f"Re-using {out / 'scores.csv'}")
        scores = pd.read_csv(out / "scores.csv")
    else:
        scores = score_all(fresh_clips(args.per_part), heads)
        scores.to_csv(out / "scores.csv", index=False)

    rows = []
    for name, cal in cals.items():
        columns = [column(h) for h in cal["heads"]]
        for (condition, source), group in scores.groupby(["condition", "source"]):
            chance = combine(group[columns].to_numpy(), cal[CHANNEL_OF[condition]])
            rows.append({"calibration": Path(name).stem, "condition": condition, "source": source,
                         "n_real": len(group), "flagged_%": round(100 * (chance >= 0.5).mean(), 1),
                         "HIGH_band_%": round(100 * (chance >= 0.7).mean(), 1)})
    table = pd.DataFrame(rows)
    table.to_csv(out / "report.csv", index=False)
    pd.set_option("display.width", 200)
    print("\n" + table.to_string(index=False))
    print(f"Saved {out / 'report.csv'}")


if __name__ == "__main__":
    main()
