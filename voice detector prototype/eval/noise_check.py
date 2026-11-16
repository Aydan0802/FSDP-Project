"""
noise_check.py - where do phone errors come from, and does knowing the noise level help?

Two parts, both on validation phone clips with the current mix, nothing saved:
1. Breakdown: real voices flagged and fakes missed at the 50% cut-off, by the
   simulated call's noise level (SNR), packet loss and codec, with group sizes.
2. Noise-aware calibration: the phone fit from eval/compare_heads.py with one or
   more noise inputs added, using the TRUE noise level of each simulated call
   (a real call would not come with one). It prints each fit's error on the
   compare_heads phone rule, the weight the noise input got, and how many phone
   clips changed decision, so a feature that never entered the fit is visible.

The rule, set on 2 Nov 2026 before scoring: a real noise estimate is only built if
the plain noise level ("snr") beats the current phone error by at least 1 point.
The other forms were tried afterwards and do not count.

Note: the noise is added to the full-band clip before the 300-3400 Hz filter, so
the SNR inside the phone band is higher than these labels.

Run from the project root, after the heads are scored with eval.run_eval:
    python -m eval.noise_check --folders results/fresh_train/val_orig results/fresh_train/val_final3
"""
import argparse

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

from detectors.calibration import logit
from eval.calibrate import load
from eval.compare_heads import error, fit, report, share

SNR_BINS = [5, 10, 15, 20, 30.01]
LOSS_BINS = [0, 1.25, 2.5, 5.01]  # percent of 20 ms packets lost

# Extra inputs for the noise-aware fit, built from the true SNR in dB
FEATURES = {
    "none": lambda snr, lg: np.empty((len(snr), 0)),
    "snr": lambda snr, lg: snr[:, None],
    "snr_interaction": lambda snr, lg: np.column_stack([snr, snr[:, None] * lg]),
    "noisy_flag": lambda snr, lg: (snr < 10).astype(float)[:, None],
    "noise_power": lambda snr, lg: 10 ** (-snr / 10)[:, None],
}


def phone_error(table, chance):
    """The compare_heads phone rule: mean of speech fakes missed, vocoded fakes missed
    and false alarms on the worst Singaporean set, on phone clips at the 50% cut-off."""
    p = (table.condition == "phone").to_numpy()
    real = (table.label == "real").to_numpy()
    speech = share(p & (table.source == "tts").to_numpy(), chance < 0.5)
    vocoded = share(p & (table.source == "vocoded").to_numpy(), chance < 0.5)
    worst = max(share(p & (table.source == s).to_numpy(), chance >= 0.5)
                for s in table.source[real].unique() if s.startswith("nsc"))
    return (speech + vocoded + worst) / 3


def by_group(table, chance, key, bins=None):
    """Real flagged and fakes missed per group, with group sizes."""
    p = table.condition == "phone"
    groups = pd.cut(key, bins, right=False) if bins is not None else key
    rows = []
    for g in groups[p].dropna().unique().sort_values() if bins is not None else sorted(groups[p].unique()):
        m = (p & (groups == g)).to_numpy()
        real = m & (table.label == "real").to_numpy()
        fake = m & (table.label == "fake").to_numpy()
        rows.append({"group": str(g), "real_flagged_%": share(real, chance >= 0.5), "n_real": int(real.sum()),
                     "fakes_missed_%": share(fake, chance < 0.5), "n_fake": int(fake.sum())})
    return pd.DataFrame(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folders", nargs="+", required=True, help="validation scores, one folder per head")
    args = ap.parse_args()
    pd.set_option("display.width", 200)
    table, raw, _ = load(args.folders)
    p = (table.condition == "phone").to_numpy()
    snr = pd.to_numeric(table.snr_db, errors="coerce").to_numpy()
    loss = 100 * pd.to_numeric(table.packet_loss, errors="coerce")
    y = (table.label == "fake").astype(int).to_numpy()

    # The current mix, fitted exactly as eval/compare_heads.py does
    baseline = report(table, raw, fit(table, raw))
    print(f"compare_heads phone error: {error(baseline, phone=True):.2f}")

    # 2. Noise-aware fits on the phone clips
    lg = logit(raw[p])
    rows, base_decision = [], None
    for name, extra in FEATURES.items():
        x = np.column_stack([lg, extra(snr[p], lg)])
        lr = LogisticRegression(C=1.0, class_weight="balanced").fit(x, y[p])
        chance = np.zeros(len(table))
        chance[p] = lr.predict_proba(x)[:, 1]
        decision = chance[p] >= 0.5
        base_decision = decision if base_decision is None else base_decision
        rows.append({"inputs": name, "phone_error": round(phone_error(table, chance), 2),
                     "noise_weights": np.round(lr.coef_[0][lg.shape[1]:], 4).tolist(),
                     "decisions_changed": int((decision != base_decision).sum())})
        if name == "none":
            base_chance = chance
    print("\nNoise-aware calibration (true noise level; only 'snr' counts for the rule):")
    print(pd.DataFrame(rows).to_string(index=False))

    # 1. Breakdown with the current mix
    print("\nBy noise level (SNR, dB):")
    print(by_group(table, base_chance, pd.Series(snr), SNR_BINS).to_string(index=False))
    print("\nBy packet loss (%):")
    print(by_group(table, base_chance, loss, LOSS_BINS).to_string(index=False))
    print("\nFakes missed by generator and codec (%), with fakes per cell:")
    fake = p & (table.label == "fake").to_numpy()
    cells = pd.DataFrame({"generator": table.generator[fake], "codec": table.codec[fake],
                          "missed": base_chance[fake] < 0.5})
    pct = cells.pivot_table(index="generator", columns="codec", values="missed", aggfunc="mean") * 100
    n = cells.pivot_table(index="generator", columns="codec", values="missed", aggfunc="size")
    print(pct.round(0).astype("Int64").astype(str) + " / " + n.astype(str))


if __name__ == "__main__":
    main()
