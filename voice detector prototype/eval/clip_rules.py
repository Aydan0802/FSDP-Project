"""
clip_rules.py - how should a clip get its one score, and what happens at a set
false alarm rate? Uses the window scores saved by eval.run_eval, so no GPU.

Two questions:
  1. Clip score. Today a clip gets the average of its 5 s windows. Scam clips
     can be synthetic in parts only, so the worst windows may catch more. But a
     long real clip also gets more chances to trip one. Rules compared: the
     average, the worst window, and the average of the worst 2.
  2. False alarms. EER hides how many real people get flagged. Here the cut-off
     is set on validation clips so that 1% or 5% of real clips are flagged, and
     the same cut-off is then used on the test clips.

Uses the combination in detectors/calibration.json, so its heads must match the
folders given here, in the same order. Choose the rule from the val_ columns;
the test_ columns are the report.

    python -m eval.clip_rules --fit results/val_orig results/val_ft \
        --test results/test_orig results/test_ft --out results/clip_rules.csv
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from detectors.calibration import combine
from eval.calibrate import CHANNELS, OUT_JSON, eer, load

ROOT = Path(__file__).resolve().parent.parent
RULES = ["average", "worst window", "worst 2 windows"]
TARGETS = [0.01, 0.05]  # share of real clips flagged on validation


def clip_scores(raw, windows, params):
    """One score per clip for each rule."""
    chances = [np.sort(combine(w, params)) for w in windows]
    return {"average": combine(raw, params),
            "worst window": np.array([c[-1] for c in chances]),
            "worst 2 windows": np.array([c[-2:].mean() for c in chances])}


def pick(table, raw, windows, condition):
    """The rows of one condition: the table, raw scores and windows."""
    keep = (table.condition == condition).to_numpy()
    return table[keep], raw[keep], [w for w, k in zip(windows, keep) if k]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fit", nargs="+", required=True, help="folders with validation scores.csv, one per head")
    ap.add_argument("--test", nargs="+", required=True, help="folders with test scores.csv, one per head")
    ap.add_argument("--out", required=True, help="csv file for the table")
    args = ap.parse_args()
    cal = json.loads(OUT_JSON.read_text())
    fit, test = load(args.fit), load(args.test)

    rows = []
    for channel, conditions in CHANNELS.items():
        for condition in conditions:
            fit_table, fit_raw, fit_windows = pick(*fit, condition)
            test_table, test_raw, test_windows = pick(*test, condition)
            fit_scores = clip_scores(fit_raw, fit_windows, cal[channel])
            test_scores = clip_scores(test_raw, test_windows, cal[channel])
            fit_fake = (fit_table.label == "fake").to_numpy()
            test_fake = (test_table.label == "fake").to_numpy()
            names = test_table.generator.where(test_table.generator != "", test_table.source).to_numpy()
            for rule in RULES:
                f, t = fit_scores[rule], test_scores[rule]
                for target in TARGETS:
                    cutoff = np.quantile(f[~fit_fake], 1 - target)
                    row = {"condition": condition, "rule": rule, "target_%": round(100 * target),
                           "cutoff": round(float(cutoff), 4),
                           "val_EER_%": round(eer(fit_fake, f), 2),
                           "val_real_flagged_%": round(100 * (f[~fit_fake] > cutoff).mean(), 1),
                           "val_fakes_missed_%": round(100 * (f[fit_fake] <= cutoff).mean(), 1),
                           "test_EER_%": round(eer(test_fake, t), 2),
                           "test_real_flagged_%": round(100 * (t[~test_fake] > cutoff).mean(), 1),
                           "test_fakes_missed_%": round(100 * (t[test_fake] <= cutoff).mean(), 1)}
                    for name in sorted(set(names[test_fake])):
                        row[f"missed_{name}_%"] = round(100 * (t[test_fake & (names == name)] <= cutoff).mean(), 1)
                    rows.append(row)

    table = pd.DataFrame(rows)
    (ROOT / args.out).parent.mkdir(parents=True, exist_ok=True)
    table.to_csv(ROOT / args.out, index=False)
    pd.set_option("display.width", 250)
    pd.set_option("display.max_columns", 30)
    print("\n" + table.to_string(index=False))
    print(f"\nSaved {args.out}. Validation has few real clips, so a 1% target rests on about 2 clips.")


if __name__ == "__main__":
    main()
