# Code review of the detector (3 to 4 Nov 2026)

Every file in `detectors/`, `audio/`, `data_prep/`, `train/`, `eval/` and `tests/` was read on 3 Nov 2026, and each finding was checked against the code or the saved scores. The Run 10 held-out tables reproduce exactly from the saved scores, and no file or clip is shared between training, validation, the old test and the held-out clips. The findings below are what the review found, and what was done about each.

## Fixed in the code

| Finding | Fix |
|---|---|
| RawBoost and the simulated call drew from the same seed, so in `phone_boost` RawBoost hit exactly the calls below 17.5 dB of noise | `augment` gives the call its own seed; a test checks it; `phone_boost` was trained again (Run 12) |
| `eval/calibrate.py` overwrote the live `detectors/calibration.json` on every run | It writes to its report folder; only `--save` updates the live file, after copying the old one to `calibration_before.json` |
| `eval/run_eval.py --limit`, the quick check, overwrote the full results, including the numbers the simulator reads | A quick check writes to its own folder, `<out>_limit<N>` |
| A saved `scores.csv` was reused whatever head, manifest or split was asked for | `run_eval`, `splice_test` and `false_alarm_check` record how the scores were made (`run.json`, via `eval/run_info.py`) and stop on a mismatch. Folders scored before 4 Nov have no record and only get a warning |
| Nothing checked that folders were given in the same order as their heads | `eval/calibrate.py` and `eval/clip_rules.py` check each folder's `run.json` against its head |
| Two heads with the same file name collided in `eval/false_alarm_check.py` | It stops instead |
| With `--one-class`, "epoch 0" was already the new last layer, not the original model, and a tie with epoch 0 said "nothing saved" when a head was saved | Epoch 0 is scored before the swap; the message says which epoch was saved, and warns if an older file stays at `--out` |
| The training log was written only at the end, so a run that froze left a head with no log | It is written after every epoch |
| `1 - sigmoid(logit)` rounds to exactly 0 or 1 for large logits | `sigmoid(-logit)` in scoring and in training validation (same values otherwise) |
| The key check allowed any number of `projection.*` tensors | It allows exactly the 4 known names, and nothing missing |
| The downloaded `models/forensics_xlsr/model.py` was run without a check | Its SHA-256 is pinned; a different file is not run |
| The safe AudioSeal loading depends on the installed version | `detectors/watermark.py` stops unless audioseal 0.2.0 is installed and has both functions it replaces |
| UnivNet and SpeechT5 load `.bin` files without saying `weights_only` | `weights_only=True` is written out (it was already the default) |
| All six officials' phone copies used seed 0, so all had 20.9 dB of noise | Each clip gets its own seed from its file name |
| `eval/officials_report.py` would crash on a watermarked clip | It prints the watermark verdict instead |
| `duration < 4` was a bare number in `detectors/verdict.py` | `SHORT_CLIP_S` |
| The training docstring said vocoded fakes do not count in epoch selection | Corrected: they count in the clean (or phone) EER, and only the worst-generator part leaves them out |
| The Run 12 noise numbers had no code | `eval/noise_check.py` reproduces them, and showed the noise level did enter the fit |
| The tests missed the parts that matter most, and two would pass without the 300 to 3400 Hz band-pass | New tests: windows, the key check, the file hash, `combine`, EER (three copies agree), the phone-band measure, `run.json`, the band-pass at both edges (with proof the low edge fails without the filter), and noise really added |

## Written up, not changed

These are limits of the results, so they are stated in `docs/eval_results.md` rather than fixed:
- **Recording sessions.** The Singaporean corpus has no speaker or session IDs. Clips were split one by one, so held-out and validation clips almost certainly share speakers, microphones and rooms with training clips. Part 3 has 500 clips and all are used. The low false alarms on conversation clips are evidence for these sessions, not for new recording setups.
- **In-sample percentages.** The app's percentages are fitted on the same validation clips that chose each head's epoch and the mix, so they look better calibrated there than on new clips. `eval/calibrate.py` now prints both, and Run 12 reports the held-out ones.
- **Routing.** The tables pick the calibration by the condition label; the app measures the sound above 3.8 kHz. `eval/routing_check.py` counts how many clips go the other way and what that changes (Run 12).
- **Reused fakes.** 498 of the 698 held-out fakes are the old test set's speech fakes, read in Runs 8 and 9. Only the vocoded fakes are fresh.
- **Orpheus is not fully unseen.** Its audio is decoded by SNAC, the codec behind the `voc-snac` training fakes. Only SpeechT5 is fully unseen.
- **Run 11's phone pass was a tie in the code.** The script rounds each share before comparing, which made the 1.03-point margin exactly 1.00.
- **Phone heads are judged where they were tuned.** Their epoch was picked on phone validation, and the mix rule is scored on the same clips, which favours them. Run 12's held-out second look is the check.
- **Seeds from absolute paths.** `data_prep/prepare_clips.py` and `prepare_fresh.py` seed the compressed and phone training copies from each file's full path, so a copy of the project in another folder makes different copies. Left as it is, because changing it would change every training copy already made. Future builds should use the path inside the project.
- **fp16 scoring.** `score_clip` runs the whole model in fp16 on the GPU; training validation runs the head in fp32. Epoch-selection EERs are therefore not exactly the deployed scores; the difference is expected to be small.
- **SNR labels.** The noise is added to the full-band clip before the phone band-pass, so the noise level inside the phone band is lower than the labels say.
- **EER method.** `roc_curve` drops some points by default, which moves EERs slightly. Recomputed without it, every Run 10 held-out EER moves by at most 0.62 points (DAC compressed 9.13% to 8.51%). The method is kept so results stay comparable across runs.
- **Peak normalisation.** Training normalises each 5 s slice; scoring normalises the whole clip, as the authors' code does. Validation uses the scoring convention, so the reported numbers are consistent.

## Still open

- **A resampling control.** DAC works at 16 kHz; EnCodec, SNAC and UnivNet go 16 to 24 to 16 kHz. "DAC is the weak spot" may partly be "the others leave a resampling trace". Check: resample real clips the same way and see whether they get flagged.
- **Real phone calls.** All phone audio here is simulated.

## Code that needs care to explain

1. `train/finetune_head.py`, `main()`: about 165 lines with many options and nested functions; the loss shaping is mixed in with loading data.
2. `detectors/watermark.py`: the restricted unpickler and the replaced loader functions.
3. `detectors/forensics_xlsr.py`: `CosineOutput` (one-class scoring written as a logit) and `get_model` (shared or copied backbone, the one-class marker, the key checks, the cache).
4. `detectors/verdict.py`, `analyse()`: watermark, channel, scoring, confidence and verdict text in one function, with two INCONCLUSIVE paths. `score_clip`'s own "inconclusive" flag is not used by the verdict.
5. `eval/calibrate.py`, `load()`: the join of several score files on clip and condition.
6. `eval/compare_heads.py`: the rules live in the docstring, and mixes have short names (`pplain`, `final3`).

Copied logic that could drift: EER is written three times (a test now checks they agree), `officials_report.window_starts` copies `make_windows`, and the band cut-off is written in `tests/test_phone.py` as well as in `calibration.json`.
