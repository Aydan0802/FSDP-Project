"""
verdict.py - the full voice check: attach a clip, get an honest answer.

    1. Watermark check (AudioSeal). Found -> "AI-generated (watermark)", stop.
       Not found -> unknown (NOT "real"); go on.
    2. Is this phone-band audio? (almost no sound above 3.8 kHz)
    3. Detector (forensics XLS-R, whole clip in 5 s windows): the heads listed
       for that kind of audio in detectors/calibration.json score the clip
    4. The heads' scores combine into one chance, using weights fitted for
       that kind of audio (detectors/calibration.py)
    5. Band LOW / MEDIUM / HIGH, a confidence level, and the reasons.
       Too little or contradictory evidence -> INCONCLUSIVE. If part of the
       clip sounds synthetic, it is never called "probably real", because
       scam videos often mix cloned audio into real footage.

This is ONE risk signal for the app, never a scam verdict on its own.

Run from the project root:
    python -m detectors.verdict path/to/clip.wav [more.wav ...]

To try the phone_tuned setup kept for the live-call work (Run 12 in docs/eval_results.md):
    python -m detectors.verdict --calibration detectors/calibration_phone_tuned.json clip.wav
"""
import argparse
import json
from pathlib import Path

import numpy as np

from detectors import watermark
from detectors.calibration import combine
from detectors.forensics_xlsr import HOP_S, MIN_SECONDS, SR, load_audio, score_clip

ROOT = Path(__file__).resolve().parent.parent
CALIBRATION = Path(__file__).resolve().parent / "calibration.json"  # the app's default
LEVELS = ["low", "medium", "high"]
# "Part of this clip sounds synthetic" rule, chosen on validation with eval/splice_test.py:
PART_WINDOW = 0.9  # a 5 s window counts as sounding synthetic from this chance
PART_MIN_WINDOWS = 1  # at least this many windows, and
PART_MIN_SHARE = 0.1  # at least this share of the clip
SHORT_CLIP_S = 4  # clips shorter than this lose one confidence level (under MIN_SECONDS: INCONCLUSIVE)


def phone_band_share(wav, cutoff_hz=3800):
    """Share of the clip's energy above 3.8 kHz. Phone lines cut everything
    above about 3.4 kHz, so phone audio has almost none."""
    spectrum = np.abs(np.fft.rfft(wav)) ** 2
    freqs = np.fft.rfftfreq(len(wav), 1 / SR)
    return float(spectrum[freqs > cutoff_hz].sum() / (spectrum.sum() + 1e-12))


def analyse(wav, calibration=CALIBRATION):
    cal = json.loads(Path(calibration).read_text())

    # Layer 1: watermark
    wm = watermark.detect(wav)
    if wm >= watermark.DETECT_THRESHOLD:
        return {"verdict": "AI-generated (AudioSeal watermark found)", "band": "HIGH",
                "likelihood_pct": None, "confidence": "high", "channel": None,
                "watermark_score": round(wm, 3), "raw_scores": None,
                "reasons": ["a watermark is proof the audio was AI-generated, not proof of a scam"]}

    # Layer 2: the heads for this kind of audio, combined with the weights fitted for it
    channel = "phone" if phone_band_share(wav) < cal["band_cutoff"] else "wideband"
    params = cal[channel]
    dets = [score_clip(wav, ROOT / head if head else None) for head in params["heads"]]
    raw_scores = [d["fake_score_raw"] for d in dets]
    likelihood = float(combine(raw_scores, params))
    band = next(name for name, edge in sorted(cal["bands"].items(), key=lambda kv: kv[1])
                if likelihood < edge)

    # The same calculation for each 5 s window: which parts of the clip sound synthetic?
    windows = combine(np.array([d["window_scores"] for d in dets]).T, params)
    spread = float(windows.std())
    n_flagged = int((windows >= PART_WINDOW).sum())
    part_synthetic = n_flagged >= PART_MIN_WINDOWS and n_flagged / len(windows) >= PART_MIN_SHARE
    duration = dets[0]["duration_s"]

    # Confidence starts high and drops for each known weakness.
    level, reasons = 2, ["no watermark found (this does NOT mean the voice is real)"]
    if channel == "phone":
        level -= 1
        reasons.append("phone-quality audio: our tests show more errors here than on clean audio")
    if duration < SHORT_CLIP_S:
        level -= 1
        reasons.append(f"short clip ({duration} s)")
    if spread > params["spread_warn"]:
        level -= 1
        reasons.append(f"parts of the clip disagree ({n_flagged} of {len(windows)} windows sound synthetic)")
    confidence = LEVELS[max(level, 0)]

    if duration < MIN_SECONDS:
        verdict, band = "INCONCLUSIVE: not enough clear evidence either way", "INCONCLUSIVE"
        reasons.append(f"clip is only {duration} s long")
    elif part_synthetic and band != "HIGH":
        verdict, band = "Warning: part of this clip sounds synthetic", "MEDIUM"
    elif spread > params["spread_limit"] or (band == "MEDIUM" and confidence == "low"):
        verdict, band = "INCONCLUSIVE: not enough clear evidence either way", "INCONCLUSIVE"
    else:
        verdict = {"LOW": "Probably a real human voice",
                   "MEDIUM": "Uncertain: some signs of a synthetic voice",
                   "HIGH": "Likely a synthetic (AI-generated) voice"}[band]
    # Never show 0% or 100%: no detector is ever certain.
    # The keys after "reasons" are extra detail for the website (app/api.py): how long the clip
    # is, and the chance for each 5 s window (windows start every HOP_S seconds).
    return {"verdict": verdict, "band": band, "likelihood_pct": min(99, max(1, round(100 * likelihood))),
            "confidence": confidence, "channel": channel, "watermark_score": round(wm, 3),
            "raw_scores": [round(s, 3) for s in raw_scores], "reasons": reasons,
            "duration_s": duration, "part_synthetic": bool(part_synthetic),
            "parts_disagree": bool(spread > params["spread_warn"]),
            "n_flagged": n_flagged, "n_windows": int(len(windows)),
            "window_chances": [round(float(w), 3) for w in np.atleast_1d(windows)], "window_hop_s": HOP_S}


def main():
    ap = argparse.ArgumentParser(description="Check whether a voice clip is synthetic")
    ap.add_argument("files", nargs="+")
    ap.add_argument("--calibration", default=CALIBRATION, help="calibration file (default: detectors/calibration.json)")
    args = ap.parse_args()
    for path in args.files:
        r = analyse(load_audio(path), args.calibration)
        print(f"\n{path}\n  {r['verdict']}")
        if r["likelihood_pct"] is not None:
            print(f"  Chance it is synthetic: {r['likelihood_pct']}%   band: {r['band']}   "
                  f"confidence: {r['confidence']}   audio: {r['channel']}")
        for reason in r["reasons"]:
            print(f"   - {reason}")


if __name__ == "__main__":
    main()
