"""
compare_heads.py - which mix of heads should the verdict use?

Each mix is fitted on validation the same way as eval/calibrate.py, but in
memory, so detectors/calibration.json is not touched. Each head's scores sit in
<folder>/<prefix>_<head>/scores.csv, made with eval.run_eval.

The rule was set on 2 Nov 2026, before any score existed for clips_final3 or for
the new validation clips. On validation, at the 50% cut-off, average over clean
and compressed audio:

    error = mean(speech fakes missed, vocoded fakes missed,
                 real clips flagged on the WORST Singaporean recording set)

The lowest error wins; a mix within 0.5 points of it with fewer heads wins
instead. Phone is reported but does not decide, because attached clips are the
current stage. "run8" is a baseline only: it has no head trained on vocoded
audio, so counting vocoded fakes would be unfair to it, and it missed more of
the fakes held out in Run 9.

The test folders are only reported, and must not change the choice.

--phone compares mixes for phone audio only (Run 11). The rule was set on 2 Nov
2026, before any score existed for the phone heads, in the same shape but on the
phone row:

    error = mean(speech fakes missed, vocoded fakes missed,
                 real clips flagged on the WORST Singaporean recording set)

The current mix (original + clips_final3) stays unless another beats it by at
least 1 point. Among those that do, a mix within 0.5 points of the best with fewer
heads wins.

--wide does the same for new heads on clean and compressed audio, with the first
rule's error. A mix whose heads have not been scored yet is left out.

Run from the project root:
    python -m eval.compare_heads --folder results/fresh_train
    python -m eval.compare_heads --folder results/fresh_train --test heldout sgtest libri
    python -m eval.compare_heads --folder results/fresh_train --phone
    python -m eval.compare_heads --folder results/fresh_train --wide
"""
import argparse

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

from detectors.calibration import combine, logit
from eval.calibrate import CHANNELS, ROOT, eer, load

MIXES = {"run8": ["orig", "slow"],
         "three": ["orig", "slow", "final2"],
         "new_two": ["orig", "final3"],
         "new_three": ["orig", "slow", "final3"],
         "four": ["orig", "slow", "final2", "final3"]}
BASELINES = ["run8"]
PHONE_MIXES = {"current": ["orig", "final3"],
               "run8": ["orig", "slow"],
               "new_three": ["orig", "slow", "final3"],
               "phone_plain": ["orig", "pplain"],
               "phone_match": ["orig", "pmatch"],
               "phone_match3": ["orig", "slow", "pmatch"],
               "phone_fresh": ["orig", "pfresh"],
               "phone_boost": ["orig", "pboost"],
               "phone_two": ["orig", "pfresh", "pboost"],
               "phone_tuned": ["orig", "ptuned"]}
WIDE_MIXES = {"current": ["orig", "final3"],
              "boost": ["orig", "wboost"],
              "tuned": ["orig", "wtuned"],
              "one_class": ["orig", "oc"]}
CHANNEL_OF = {condition: channel for channel, conditions in CHANNELS.items() for condition in conditions}


def folders(args, prefix, heads):
    return [f"{args.folder}/{prefix}_{head}" for head in heads]


def all_scored(paths):
    return all((ROOT / path / "scores.csv").exists() for path in paths)


def fit(table, raw):
    """One set of weights per channel, as in eval/calibrate.py."""
    params = {}
    for channel, conditions in CHANNELS.items():
        m = table.condition.isin(conditions).to_numpy()
        y = (table.label == "fake").astype(int).to_numpy()
        lr = LogisticRegression(C=1.0, class_weight="balanced").fit(logit(raw[m]), y[m])
        params[channel] = {"weights": lr.coef_[0], "bias": lr.intercept_[0]}
    return params


def share(mask, flagged):
    return round(100 * flagged[mask].mean(), 1) if mask.any() else np.nan


def report(table, raw, params):
    """One row per condition: EER, fakes missed, real flagged per recording set."""
    y = (table.label == "fake").to_numpy()
    speech = (table.source == "tts").to_numpy()
    vocoded = (table.source == "vocoded").to_numpy()
    rows = []
    for condition, channel in CHANNEL_OF.items():
        c = (table.condition == condition).to_numpy()
        chance = combine(raw, params[channel])
        row = {"condition": condition, "speech_missed": share(c & speech, chance < 0.5),
               "vocoded_missed": share(c & vocoded, chance < 0.5)}
        if (c & speech).any():
            keep = c & (~y | speech)
            row["EER"] = round(eer(y[keep].astype(int), chance[keep]), 2)
        for source in sorted(table.source[~y].unique()):
            row[f"real:{source}"] = share(c & (table.source == source).to_numpy(), chance >= 0.5)
        rows.append(row)
    return pd.DataFrame(rows)


def error(result, phone=False):
    """The rule in the docstring, on the clean and compressed rows, or on the phone row."""
    wide = result[(result.condition == "phone") == phone]
    singapore = wide[[c for c in wide.columns if c.startswith("real:nsc")]].max(axis=1)
    return float(pd.concat([wide.speech_missed, wide.vocoded_missed, singapore], axis=1).mean(axis=1).mean())


def choose_stay(scores, mixes):
    """The --phone and --wide rule in the docstring."""
    better = {k: v for k, v in scores.items() if v <= scores["current"] - 1}
    if not better:
        return "current"
    close = [k for k, v in better.items() if v <= min(better.values()) + 0.5]
    return min(close, key=lambda k: (len(mixes[k]), better[k]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder", required=True)
    ap.add_argument("--test", nargs="*", default=[], help="prefixes of test folders to report")
    ap.add_argument("--phone", action="store_true", help="compare mixes for phone audio only")
    ap.add_argument("--wide", action="store_true", help="compare new heads against the current clip mix")
    args = ap.parse_args()
    pd.set_option("display.width", 220)
    pd.set_option("display.max_columns", 20)
    mixes = PHONE_MIXES if args.phone else WIDE_MIXES if args.wide else MIXES
    missing = [k for k, heads in mixes.items() if not all_scored(folders(args, "val", heads))]
    mixes = {k: v for k, v in mixes.items() if k not in missing}
    if missing:
        print(f"Not scored yet, so left out: {missing}")

    tables, fits, scores = [], {}, {}
    for name, heads in mixes.items():
        table, raw, _ = load(folders(args, "val", heads))
        fits[name] = fit(table, raw)
        result = report(table, raw, fits[name])
        scores[name] = error(result, args.phone)
        tables.append(result.assign(mix=name, data="val"))
        print(f"\n{name}: error {scores[name]:.2f}\n{result.to_string(index=False)}")

    if args.phone or args.wide:
        chosen = choose_stay(scores, mixes)
    else:
        candidates = {k: v for k, v in scores.items() if k not in BASELINES}
        best = min(candidates.values())
        close = [k for k, v in candidates.items() if v <= best + 0.5]
        chosen = min(close, key=lambda k: (len(MIXES[k]), candidates[k]))
    print(f"\nChosen on validation: {chosen} ({mixes[chosen]})")

    for prefix in args.test:
        for name, heads in mixes.items():
            if not all_scored(folders(args, prefix, heads)):
                continue
            table, raw, _ = load(folders(args, prefix, heads))
            result = report(table, raw, fits[name])
            tables.append(result.assign(mix=name, data=prefix))
            print(f"\n{prefix}, {name}{' (chosen)' if name == chosen else ''}\n{result.to_string(index=False)}")
    name = f"compare{'_phone' if args.phone else '_wide' if args.wide else ''}{'_test' if args.test else ''}"
    pd.concat(tables).to_csv(f"{args.folder}/{name}.csv", index=False)


if __name__ == "__main__":
    main()
