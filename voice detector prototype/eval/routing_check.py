"""
routing_check.py - do the tables describe the same system as the app?

The evaluation tables pick a clip's calibration from its condition label: clean
and compressed clips get the wideband heads and weights, phone clips the phone
ones. The app never sees a label. detectors/verdict.py measures how much of the
sound is above 3.8 kHz, and treats the clip as a phone call below the cut-off
in detectors/calibration.json (it then also drops one confidence level).

This script makes every copy of every clip again, the same way eval/run_eval.py
does, measures it the way the app does, and counts per condition and source how
many clips the app would send the other way. It then compares the share of
wrong answers at the 50% cut-off both ways: as the tables route clips, and as
the app routes them. It uses the saved raw scores, so no GPU is needed.

Run from the project root, once per manifest (making the copies takes a few minutes):
    python -m eval.routing_check --manifest data/manifest_heldout.csv --out results/routing/heldout \
        --scores original=results/fresh_train/hnew_orig \
                 models/finetuned/clips_final3.safetensors=results/fresh_train/hnew_final3 \
                 models/finetuned/phone_tuned.safetensors=results/fresh_train/hnew_ptuned
"""
import argparse
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import pandas as pd

from detectors.calibration import combine
from detectors.verdict import CALIBRATION, phone_band_share
from eval import run_info
from eval.calibrate import CHANNELS, load
from eval.run_eval import three_versions

ROOT = Path(__file__).resolve().parent.parent
CHANNEL_OF = {condition: channel for channel, conditions in CHANNELS.items() for condition in conditions}


def band_shares(clip):
    """Energy share above 3.8 kHz of the clean, compressed and phone copy of one clip."""
    return [{"path": clip.path, "condition": condition, "band_share": phone_band_share(audio)}
            for condition, audio, _ in three_versions(clip)]


def chances(cal, channel, folders):
    """Every clip's chance of fake, with the heads and weights of one channel."""
    heads = ["original" if h is None else h for h in cal[channel]["heads"]]
    missing = [h for h in heads if h not in folders]
    if missing:
        raise SystemExit(f"no --scores folder for {missing}")
    for head in heads:
        run_info.check(ROOT / folders[head], head=run_info.head_name(head))
    table, raw, _ = load([folders[h] for h in heads])
    return table[["path", "condition", "label", "source", "generator"]].assign(**{channel: combine(raw, cal[channel])})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--scores", nargs="+", required=True, metavar="HEAD=FOLDER",
                    help="folder with each head's scores.csv on this manifest ('original' for the original head)")
    args = ap.parse_args()
    folders = dict(item.partition("=")[::2] for item in args.scores)
    out = ROOT / args.out
    out.mkdir(parents=True, exist_ok=True)

    path = out / "band_share.csv"
    if path.exists():
        run_info.check(out, manifest=args.manifest)
        shares = pd.read_csv(path, keep_default_na=False)
    else:
        manifest = pd.read_csv(ROOT / args.manifest, keep_default_na=False)
        clips = list(manifest.itertuples(index=False))
        with ThreadPoolExecutor(max_workers=8) as threads:  # most of the time is ffmpeg
            shares = pd.DataFrame([row for rows in threads.map(band_shares, clips) for row in rows])
        shares.to_csv(path, index=False)
        run_info.write(out, manifest=args.manifest)

    cal = json.loads(CALIBRATION.read_text())
    table = chances(cal, "wideband", folders).merge(
        chances(cal, "phone", folders)[["path", "condition", "phone"]], on=["path", "condition"])
    table = table.merge(shares, on=["path", "condition"], validate="1:1")
    table["tables_channel"] = table.condition.map(CHANNEL_OF)
    table["app_channel"] = np.where(table.band_share < cal["band_cutoff"], "phone", "wideband")
    fake = (table.label == "fake").to_numpy()
    for route in ("tables", "app"):
        chance = np.where(table[f"{route}_channel"] == "phone", table.phone, table.wideband)
        table[f"{route}_wrong"] = np.where(fake, chance < 0.5, chance >= 0.5)  # fake missed, or real flagged

    table["group"] = np.where(fake, table.generator, table.source)
    report = (table.assign(moved=table.tables_channel != table.app_channel)
              .groupby(["condition", "label", "group"], sort=False)
              .agg(n=("path", "size"), moved=("moved", "sum"),
                   tables_wrong_pct=("tables_wrong", "mean"), app_wrong_pct=("app_wrong", "mean"))
              .reset_index())
    report[["tables_wrong_pct", "app_wrong_pct"]] = (100 * report[["tables_wrong_pct", "app_wrong_pct"]]).round(1)
    report.to_csv(out / "report.csv", index=False)
    pd.set_option("display.width", 200)
    print("moved = clips the app sends to the other calibration. wrong = real flagged, or fake missed, at 50%.")
    print(report.to_string(index=False))
    print(f"Saved {out / 'report.csv'}")


if __name__ == "__main__":
    main()
