"""
window_pooling.py - does a plain average of the 5 s windows throw away evidence?

A clip's score is the mean of its windows. A fake clip with one strong window
gets diluted by the others, and averages of probabilities are pulled around by
the 0 and 1 ends. This tries other ways to combine a head's windows, each fitted
on validation the same way as eval/calibrate.py, in memory.

The rule was set on 2 Nov 2026, before any of these were scored: the mean stays
for a kind of audio unless another way beats it by at least 1 point, on the error
in eval/compare_heads.py for that kind of audio. Validation only.

Run from the project root, after the heads are scored with eval.run_eval:
    python -m eval.window_pooling --folders results/fresh_train/val_orig results/fresh_train/val_final3
"""
import argparse

import numpy as np
import pandas as pd

from detectors.calibration import logit
from eval.calibrate import load
from eval.compare_heads import error, fit, report


def top_third(scores):
    return np.sort(scores)[-max(len(scores) // 3, 1):].mean()


def logit_mean(scores):
    return 1 / (1 + np.exp(-logit(scores).mean()))


POOLS = {"mean": np.mean, "median": np.median, "logit_mean": logit_mean, "top_third": top_third, "max": np.max}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folders", nargs="+", required=True, help="validation scores, one folder per head")
    args = ap.parse_args()
    table, _, windows = load(args.folders)
    rows = []
    for name, pool in POOLS.items():
        raw = np.array([[pool(w[:, head]) for head in range(w.shape[1])] for w in windows])
        result = report(table, raw, fit(table, raw))
        rows.append({"pool": name, "clean_compressed_error": round(error(result), 2),
                     "phone_error": round(error(result, phone=True), 2)})
    print(pd.DataFrame(rows).to_string(index=False))


if __name__ == "__main__":
    main()
