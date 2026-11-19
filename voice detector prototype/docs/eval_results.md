# Detector evaluation results

Limits that apply to many runs below (recording sessions shared across splits, in-sample percentages, reused fakes, simulated phone audio) are listed in `docs/code_review.md`, with what the code review of 3 to 4 Nov 2026 changed.

## Run 12: hearing the same clips in more ways (2 to 4 Nov 2026)

**Status:** finished. `phone_tuned` passed the phone rule, but the held-out second look did not back it: on the rule's own measure the new mix is 2 points worse there, because it misses more vocoded copies and flags more real voices. **On 4 Nov the team went back to original + `clips_final3` for all audio**, so the app is the same as after Run 10. Clean and compressed audio never changed, because neither new head for them passed. The window-combining and noise-aware checks failed their rules.

The `phone_tuned` setup is kept in `detectors/calibration_phone_tuned.json`, as the starting point for the live-call work, and can be tried with `python -m detectors.verdict --calibration detectors/calibration_phone_tuned.json clip.wav`. Both files list the heads for each kind of audio.

Going back overruled a rule that was fixed before scoring, and the reason was the held-out clips. So for this choice the held-out clips acted as a second validation set, and the held-out phone numbers of the old mix are no longer an untouched test. The old mix itself was chosen in Run 10, before any of these numbers were seen.

**How the run went.** Training was restarted on 3 Nov at 18:49. The first attempt froze when the laptop lid was closed at 21:46 on 2 Nov, because the keep-awake call used by the training scripts does not cover a closed lid. A code review then found that RawBoost and the phone call drew from the same seed, so in the first `phone_boost` RawBoost happened on exactly the calls below 17.5 dB and on none above. That run was stopped at epoch 2 and restarted at 21:19 after the fix: `augment` in `train/finetune_head.py` now gives the call its own seed, and a test checks it. `phone_fresh` never used RawBoost, so it was kept. Training ended at 04:28 on 4 Nov.

**Phone mix, validation, phone audio at the 50% cut-off.** The first six rows are the Run 11 table again.

| Mix | Rule error | Speech fakes missed | Vocoded missed | Worst Singaporean set flagged | All real flagged | EER |
|---|---|---|---|---|---|---|
| Original + `clips_final3` (current, kept) | 14.93 | 3.6% | 21.2% | 20.0% | 12.7% | 7.69% |
| Original + `final_slow` (Run 8) | 20.40 | 4.9% | 39.6% | 16.7% | 11.1% | 6.01% |
| Original + `final_slow` + `clips_final3` | 14.03 | 2.2% | 25.9% | 14.0% | 10.8% | 5.21% |
| Original + `phone_plain` | 14.43 | 3.9% | 23.4% | 16.0% | 13.9% | 7.29% |
| Original + `phone_match` | 13.93 | 3.4% | 24.4% | 14.0% | 14.6% | 7.69% |
| Original + `final_slow` + `phone_match` | 15.30 | 3.2% | 30.7% | 12.0% | 11.4% | 5.37% |
| Original + `phone_fresh` | 17.23 | 3.9% | 27.8% | 20.0% | 13.0% | 7.29% |
| Original + `phone_boost` | 16.53 | 3.9% | 33.2% | 12.5% | 12.7% | 6.77% |
| Original + `phone_fresh` + `phone_boost` | 14.70 | 3.6% | 28.5% | 12.0% | 12.3% | 6.61% |
| **Original + `phone_tuned` (passed, then set aside)** | **13.43** | 2.7% | 25.6% | 12.0% | 12.0% | 5.65% |

`phone_tuned` beat the current mix by 1.52 points before rounding (13.44 against 14.95), so it passes clearly; the script's rounded figures give 1.50. `phone_match` is within 0.5 points of it (13.92, 0.49 behind) but has as many heads, so the lower error wins. The gain is again mostly false alarms on Part 1 read speech, which fell from 10 to 6 of 50. Vocoded fakes missed rose from 67 to 81 of 316, and LibriSpeech flagged rose from 18 to 21 of 120.

**Clean and compressed (`--wide`), validation.** The current mix stays.

| Mix | Rule error | EER clean / compressed | Vocoded missed, clean / compressed | Worst Singaporean set flagged, compressed |
|---|---|---|---|---|
| Original + `clips_final3` (current) | 1.67 | 0.00 / 0.28% | 2.8 / 3.2% | 4.0% |
| Original + `clips_boost` | 2.85 | 0.00 / 0.00% | 5.1 / 6.0% | 4.0% |
| Original + `clips_tuned` | 1.98 | 0.00 / 0.16% | 3.8 / 4.1% | 4.0% |

Unrounded: 1.669, 2.846 and 1.985. Both new heads miss more vocoded copies.

**Heads saved,** with validation EER clean / compressed / phone at the saved epoch:
- `phone_fresh`, epoch 6: 1.02 / 2.87 / 13.59%. `phone_boost`, epoch 6: 1.64 / 2.50 / 14.43%. Their selection scores were 11.96 and 13.62, so `phone_tuned` was built on `phone_fresh`, without RawBoost.
- `phone_tuned`, epoch 5: 1.41 / 2.50 / 12.66%. It saves the last 2 backbone layers too, so the file is 98 MB, and the app loads a second copy of the backbone for phone audio.
- `clips_boost`, epoch 3: 0.66 / 2.57 / 14.57%. `clips_tuned`, epoch 4: 0.87 / 1.77 / 12.13%.

**Held-out second look, phone audio.** These clips were already used once, in Run 10. Each mix is fitted on validation, as in the app.

| Phone audio | Current (original + `clips_final3`) | New (original + `phone_tuned`) |
|---|---|---|
| Held-out, rule error (same formula) | 15.00 | 16.97 |
| Held-out, speech fakes missed | 3.0% | 1.4% |
| Held-out, vocoded missed | 21.5% | 27.0% |
| Held-out, conversation flagged | 7.0% | 8.0% |
| Held-out, reading flagged | 20.5% | 22.5% |
| Held-out, all real flagged | 13.8% | 15.2% |
| Held-out, real clips in HIGH band | 8% | 8% |
| Held-out, EER speech fakes only / all fakes | 7.57 / 10.75% | 6.69 / 11.55% |
| Old Singapore test, speech fakes missed | 3.0% | 1.4% |
| Old Singapore test, conversation / reading flagged | 12.7 / 16.0% | 12.0 / 14.0% |
| LibriSpeech, speech fakes missed | 2.5% | 1.5% |
| LibriSpeech, real flagged | 11.0% | 16.5% |

Held-out phone EER by generator, current then new (fakes missed in brackets): Orpheus 6.73 then 6.44% (3.4, 1.3%), Piper 10.37 then 9.00% (5.0, 3.0%), SpeechT5 5.00 then 4.13% (0.0, 0.0%), DAC 32.33 then 30.64% (55.3, 61.7%), EnCodec 20.70 then 23.47% (26.5, 36.7%), SNAC 5.38 then 9.01% (3.5, 3.5%), UnivNet 10.44 then 13.13% (4.3, 10.6%).

**Are the app's percentages as good on new clips?** `eval/calibrate.py` now reports the validation clips the weights were fitted on next to the held-out clips. Real voices flagged at 50%: clean 0.0% in-sample against 0.5% held-out, compressed 1.6% against 2.5%, phone 12.0% against 15.2%. Real voices in the HIGH band: 0, 1 and 5% in-sample against 0, 2 and 8%. The average calibration error (ECE) was no worse on held-out: 0.011, 0.010 and 0.080 in-sample against 0.008, 0.009 and 0.025. So the percentages hold up on average, but more real voices are flagged on new clips than validation shows, most of all on phone audio.

**Do the tables describe the app? (`eval/routing_check.py`).** The tables pick the calibration by the condition label; the app measures the sound above 3.8 kHz. Rebuilding every copy and measuring it the app's way:

| Clips the app sends to the phone calibration | Clean | Compressed |
|---|---|---|
| Held-out Part 1 reading (200) | 10 | 14 |
| Held-out Part 3 conversation (200) | 1 | 1 |
| Held-out vocoded copies (200) | 7 | 11 |
| Old test Part 1 reading (150) | 10 | 14 |
| Old test Part 3 conversation (150) | 1 | 1 |
| Old test speech fakes (498) | 1 | 2 |

The two Part 1 sets having the same counts is a coincidence: they are different clips. Some Part 1 recordings simply have very little sound above 3.8 kHz, and their vocoded copies move with them. No phone copy goes the other way. The answers barely change: held-out compressed reading clips flagged 2.0% the app's way against 2.5% in the tables, held-out compressed EnCodec copies missed 2.0% against 0.0%, and every other group is the same to 0.1 points. Those clips do lose a confidence level in the app, for "phone-quality audio".

**Real deepfakes of officials, phone copies (GSM), full verdict.** Two things changed at once: the phone mix, and the simulated calls themselves. Each clip now gets its own call from its file name; before, all six used seed 0 and so had the same 20.9 dB of noise. The middle column scores the new calls with the old mix, to separate the two.

| Clip | Run 10 (old mix, old call) | Old mix, new call (now used) | New mix, new call |
|---|---|---|---|
| Lee Hsien Loong, fake CGTN interview | HIGH 97% | HIGH 90% | HIGH 92% |
| Compilation of Lee and Wong deepfakes | HIGH 96% | HIGH 93% | HIGH 93% |
| Lawrence Wong deepfake, reposted 2025 | MEDIUM 45% | MEDIUM 69% | HIGH 70% |
| Lawrence Wong (DPM), Straits Times short | MEDIUM 61% | HIGH 76% | HIGH 79% |
| Straits Times report (mixed news material) | HIGH 85% | HIGH 84% | HIGH 79% |
| SPF footage of the 2026 deepfake Zoom call | MEDIUM 52% | MEDIUM 39% | INCONCLUSIVE 34% |

Most of the change comes from the new calls, not the new head: on the same calls the two mixes differ by 5 points or less. As received, the verdicts are the same as in Run 10, because clean audio still uses the old mix. `results/sg_officials/report.csv` is from the old mix; the new mix's report is kept in `results/fresh_train/officials_report_run12.csv`. Six clips are evidence of behaviour, not an accuracy figure.

**Part-synthetic warning (`eval/splice_test.py`, same 100 pairs and same simulated calls as Run 10).** Clean and compressed results are unchanged, because those use the same mix, so the rule stays.

| Spliced clips caught, real-only clips warned, phone | Validation | Test |
|---|---|---|
| Old mix (Run 10) | 67%, 20% | 77%, 22% |
| New mix | 59%, 16% | 75%, 6% |

On the test pairs the new mix warns on far fewer real-only phone clips (6% against 22%) and catches about as many spliced ones. The test pairs were already read in Run 10, so this is also a second look.

**Simulator.** With the new phone mix, `simulator/voice_stats.json` would give a chance of 50% or more to 15.2% of real voices and 91.3% of fakes on phone audio, against 13.8% and 91.7% with the old mix. After going back it was made again with the old mix, and matches the Run 10 file except for its date. The `phone_tuned` version is kept in `results/fresh_train/voice_stats_run12.json`.

**Honest reading:**
- The new phone mix catches more speech fakes, the kind a scammer would use, on all three test sets: 1.4% missed on held-out against 3.0%. It misses fewer Orpheus and Piper fakes, and no SpeechT5 fakes either way.
- It pays with more vocoded copies missed (27.0% against 21.5%) and more real voices flagged on held-out (15.2% against 13.8%) and on LibriSpeech (16.5% against 11.0%). Its validation win came from fewer false alarms on one Singaporean set, and that did not carry over: held-out reading clips were flagged more, not less.
- Phone heads have their epoch picked on phone validation, and the mix rule is scored on the same clips, which favours them. This is a likely reason the win turned into a loss on held-out.
- Whether catching more speech fakes is worth flagging more real callers is a judgement for the team. The rule did not weigh it, and the held-out clips cannot decide it again without becoming another validation set.
- Phone audio is still simulated, and 14 to 15% of real held-out voices are flagged on it with either mix. Phone is not ready for live calls.
- **Decision (4 Nov):** back to the old mix. A bank's real callers far outnumber deepfake callers, so flagging 1.4 more points of real voices (5.5 more on LibriSpeech) costs more people than missing 1.6 more points of speech fakes. The old mix also needs one copy of the backbone instead of two. What we give up: more speech fakes missed on phone (3.0% against 1.4%), and more warnings on real-only phone clips in the part-synthetic test (22% against 6%). Live calls will need real call recordings anyway, and both setups will be tested again on them.

**Window combining, validation.** The mean stays for both kinds of audio, because nothing beat it by 1 point.

| Way to combine a clip's windows | Clean and compressed error | Phone error |
|---|---|---|
| Mean (current) | 1.67 | 14.93 |
| Median | 1.83 | 15.43 |
| Mean of logits | 1.78 | 14.77 |
| Mean of the top third | 4.22 | 22.03 |
| Maximum | 4.22 | 22.13 |

**Noise-aware calibration, validation, using the true noise level.** It failed: adding the noise level as the rule set out gave 14.93, the same as without it, so no real noise estimate was built. The noise level did enter the fit (weight 0.012 per dB), but it changed only 3 of the 1,043 phone decisions. Three other forms were then tried. With an interaction term the error was 15.03, with a flag for clips below 10 dB 14.13, and with noise power instead of noise level 13.67. The 13.67 does not count. It was found by trying variants after the rule had failed, it is in-sample, and it uses a noise level a real clip would not come with.

These numbers and the tables below come from `eval/noise_check.py`. The first version of this check was done by hand, with slightly different groupings, and gave 13.46 for noise power and slightly different shares by noise level. The script's numbers replace those.

**Where the phone errors come from, current mix, validation.** These are descriptive only.

| Noise (SNR) | 5 to 10 dB | 10 to 15 dB | 15 to 20 dB | 20 to 30 dB |
|---|---|---|---|---|
| Real voices flagged | 22.9% (of 70) | 6.7% (of 60) | 13.2% (of 68) | 9.3% (of 118) |
| Fakes missed | 13.7% (of 131) | 14.5% (of 152) | 8.7% (of 161) | 9.9% (of 283) |

| Packet loss | Under 1.25% | 1.25 to 2.5% | 2.5 to 5% |
|---|---|---|---|
| Real voices flagged | 9.3% (of 86) | 13.4% (of 67) | 14.1% (of 163) |

| Fakes missed, by codec | alaw | amrnb | gsm | mulaw | opus |
|---|---|---|---|---|---|
| DAC | 67% | 39% | 50% | 62% | 53% |
| EnCodec | 8% | 27% | 0% | 36% | 6% |
| UnivNet | 15% | 8% | 0% | 8% | 8% |
| Piper | 5% | 2% | 1% | 9% | 2% |
| Orpheus | 6% | 0% | 0% | 0% | 6% |
| SNAC | 0% | 0% | 0% | 0% | 9% |

The codec groups are too small to draw conclusions from. DAC is missed about half the time whichever codec is used, so it is the largest single source of missed vocoded fakes on phone audio. Very noisy calls are the clearest source of false alarms.

**The question:** Run 11 changes how the head learns. This run changes what it hears, and how much of the model may learn, still with the same clips. Phone audio is the main target.

**What is being tested.** All use `data/train_manifest_clips2.csv`, 6 epochs, head learning rate 3e-5 and label smoothing 0.1, as `clips_final3` and `phone_plain` did.
- `phone_fresh`: like `phone_plain`, but every step makes a new random phone call for the slice, instead of reusing the one copy on disk. The calls are drawn the same way as the validation calls.
- `phone_boost`: `phone_fresh` plus RawBoost on half of the slices, before the phone call.
- `phone_tuned`: whichever of those two has the lower selection score at its saved epoch, plus the last 2 backbone layers learning at 1e-5. This is 3 times slower than the head, and 10 times faster than the paper's rate, because we train for far fewer steps. It is a judgement call, not a tuned value.
- `clips_boost`: the `clips_final3` settings plus RawBoost on half of the slices.
- `clips_tuned`: the `clips_final3` settings plus the last 2 backbone layers.
- Window combining, no training: median, mean of logits, mean of the top third, and maximum, against the plain mean.
- Noise-aware calibration, no training: phone validation shows real voices flagged 22.9% of the time at 5 to 10 dB of noise, and 7 to 13% above that. If the calibration also knows how noisy a clip is, it could allow for that. This is first tried with the true noise level, which a real clip would not come with, as an upper limit on what it could do.

**Dropped ideas:**
- Using several backbone layers. The pool already reads all 24 layers, so there was nothing to add.
- A second model built from scratch. Validation uses the same fake generators as training, so such a model would look strong there and earn a large weight, with no way to see how it copes with tools it never saw. The public alternatives we found are weak, need remote code, or use the same backbone.

**Rules, fixed before any of these was scored.** All use validation only.
- **Phone:** the Run 11 phone rule, with `phone_fresh`, `phone_boost`, `phone_fresh + phone_boost` and `phone_tuned` joining the same comparison, each mixed with the original head.
- **Clean and compressed:** `eval.compare_heads --wide`. Original + `clips_final3` stays unless a mix beats it by at least 1 point on the rule in `eval/compare_heads.py`. Among those that do, a mix within 0.5 points of the best with fewer heads wins.
- **Window combining:** the mean stays for a kind of audio unless another way beats it by at least 1 point on that audio's error.
- **Noise-aware calibration:** a real noise estimate is only built if the true noise level beats the current phone error by at least 1 point. The noise level is one extra input to the same logistic fit.
- The more mixes we try, the more likely one wins on validation by luck, which is why a win needs a full point. The held-out clips were already used once in Run 10, so a winner's held-out numbers will be reported as a second look, not a fresh test.

## Run 11: better training without more data (2 to 3 Nov 2026)

**Status:** all four heads are trained. `phone_match` passed the phone rule by a small margin, and one-class failed its rule. The detector has not changed: it still uses original + `clips_final3` for all audio. Using `phone_match` needs one head list per kind of audio in `detectors/verdict.py` and `eval/calibrate.py`, and its held-out second look has not been run. The rules were fixed before scoring and are below the results.

**Phone mix, validation, phone audio at the 50% cut-off:**

| Mix | Rule error | Speech fakes missed | Vocoded missed | Worst Singaporean set flagged | All real flagged | EER |
|---|---|---|---|---|---|---|
| Original + `clips_final3` (current) | 14.93 | 3.6% | 21.2% | 20.0% | 12.7% | 7.69% |
| Original + `final_slow` (Run 8) | 20.40 | 4.9% | 39.6% | 16.7% | 11.1% | 6.01% |
| Original + `final_slow` + `clips_final3` | 14.03 | 2.2% | 25.9% | 14.0% | 10.8% | 5.21% |
| Original + `phone_plain` | 14.43 | 3.9% | 23.4% | 16.0% | 13.9% | 7.29% |
| Original + `phone_match` (passed) | 13.93 | 3.4% | 24.4% | 14.0% | 14.6% | 7.69% |
| Original + `final_slow` + `phone_match` | 15.30 | 3.2% | 30.7% | 12.0% | 11.4% | 5.37% |

`phone_match` beat the current mix by 1.03 points before rounding (13.92 against 14.95), so it passes, but this is a weak result. The script rounds each share to one decimal before comparing, which gives exactly 1.00: a tie at the threshold, counted as a pass. The whole gain comes from 3 clips in one set: false alarms on Part 1 read speech fell from 10 to 7 of 50. Vocoded fakes missed rose from 67 to 77 of 316, and all real clips flagged rose from 40 to 46 of 316, mostly LibriSpeech (18 to 25 of 120). Its EER did not change. Original + `final_slow` + `clips_final3` came 0.90 points short, yet flagged the fewest real clips (34 of 316) and has the lowest EER.

Heads saved: `phone_plain` at epoch 6 (EER clean 0.96%, compressed 2.50%, phone 12.66%) and `phone_match` at epoch 5 (1.32%, 2.80%, 13.25%).

**One-class, validation. Orpheus was left out of training for both heads:**

| Saved head | Orpheus EER, compressed | Orpheus EER, phone | Mean | Clean EER, all fakes | Compressed EER, all fakes |
|---|---|---|---|---|---|
| `hold_plain`, epoch 3 | 0.00% | 12.80% | 6.40 | 0.59% | 1.55% |
| `hold_oc`, epoch 2 | 0.00% | 23.08% | 11.54 | 1.69% | 2.44% |

One-class failed all three parts of the rule. It needed a mean at least 1 point lower and was 5.14 points higher. Its clean and compressed EER were 1.10 and 0.89 points higher, against a limit of 0.5. Its best epoch for this mean was epoch 1 at 8.77, which would also have failed. So no one-class head was trained on all generators, and on this data the loss made the head worse on Orpheus, which it was not trained on. Orpheus is only partly unseen, though: its audio is decoded by SNAC, the codec behind the `voc-snac` training fakes. Only SpeechT5 is fully unseen.

`hold_oc` shows 40,461 s for epoch 1 because the laptop lid was closed from 21:46 to 08:48 and the process froze. It carried on where it stopped, so the result is not affected.

**The question:** Run 10 cost phone accuracy, partly because phone fell from 67% of training files to 25%. Can a change in how the head learns fix that, using the same clips? The training data is `data/train_manifest_clips2.csv`: 3,572 clips (1,064 real, 2,508 AI-generated), each with one phone and two compressed copies.

**What is being tested:**
- **Phone head:** a head used only on phone audio, trained on each clip's clean and phone copies in equal shares, with the epoch picked on phone EER. Two versions: `phone_plain` and `phone_match`. In `phone_match` the phone copy must also score like the clean copy of the same 5 s (weight 1).
- **One-class loss:** the head learns what real speech looks like instead of the known fakes (OC-softmax). It is meant to help with tools it never saw, so Orpheus is left out of training for both `hold_plain` (current loss) and `hold_oc`.

**Rules, fixed before any of these heads was scored.** All use validation only. The test clips are only used if a rule passes, and then only to report.
- **Phone mix (`eval/compare_heads.py --phone`).** On the phone row at the 50% cut-off, error = mean(speech fakes missed, vocoded fakes missed, false alarms on the worst Singaporean recording set). The current mix stays unless another beats it by at least 1 point. Among those that do, a mix within 0.5 points of the best with fewer heads wins. The other mixes are original + `final_slow`, original + `final_slow` + `clips_final3`, original + `phone_plain`, original + `phone_match` and original + `final_slow` + `phone_match`. Clean and compressed clips keep the current mix either way.
- **One-class.** At each head's saved epoch, take the mean of its Orpheus EER on compressed and on phone audio. `hold_oc` passes if that mean is at least 1 point lower than for `hold_plain`, and its clean and compressed EER on all fakes are no more than 0.5 points higher. Only then is a head trained on all generators, and it replaces `clips_final3` only if it beats the current mix by at least 1 point on the rule in `eval/compare_heads.py`.

## Run 10: fresh Singaporean clips in training, new held-out clips (2 Nov 2026)

**What was run:** Run 9 found that validation had no recordings like Parts 1 and 3 of the National Speech Corpus, so `data_prep/prepare_fresh.py` moved the 300 fresh clips into use: 100 per part for training and 50 per part for validation, each with a Piper fake and one vocoded copy (`data/train_manifest_clips2.csv`, 15,331 rows). A new head, `clips_final3`, was trained on it with lr 3e-5, label smoothing 0.1, 6 epochs. Epoch 6 was saved: validation EER clean 0.82%, compressed 1.75%, phone 11.93%. Outputs are in `results/fresh_train/`.

**The new held-out clips.** 200 real clips from Part 1 and 200 from Part 3, never used before, plus 100 vocoded copies per part (47 DAC, 49 EnCodec, 57 SNAC, 47 UnivNet). The speech fakes are the old test set's (298 Orpheus, 100 Piper, 100 SpeechT5), and no head trained on those clips. No real or vocoded clip overlaps training, validation or the old test; only the speech fakes are shared with the old test, as just said. All 500 Part 3 clips we have are now used, so another test would need new data.

**Choosing the mix.** `eval/compare_heads.py` used a rule set before scoring. On validation at the 50% cut-off, take the mean over clean and compressed of three errors: speech fakes missed, vocoded fakes missed and false alarms on the worst Singaporean recording set. Lowest wins, and within 0.5 points fewer heads wins. Phone was reported but did not count. Each mix was refitted on the new validation clips, so its numbers differ from those in Runs 8 and 9.

| Validation | Original + `final_slow` (Run 8) | Three heads (Run 9) | Original + `clips_final3` | Original + `final_slow` + `clips_final3` | Four heads |
|---|---|---|---|---|---|
| Rule error | 3.63 | 2.92 | 1.67 | 1.47 | 1.45 |
| EER clean / compressed / phone | 0.00 / 0.56 / 6.01 | 0.00 / 0.12 / 4.68 | 0.00 / 0.28 / 7.69 | 0.00 / 0.40 / 5.21 | 0.00 / 0.40 / 5.21 |
| Vocoded missed, clean / compressed / phone | 6.3 / 9.2 / 39.6 | 4.7 / 6.6 / 28.8 | 2.8 / 3.2 / 21.2 | 3.2 / 3.5 / 25.9 | 2.8 / 3.8 / 26.6 |

Original + `clips_final3` was chosen: it is within 0.5 points of the best and has the fewest heads. This is now the default in `detectors/calibration.json`. The validation clips also fitted these weights, so the table above is in-sample. The held-out results below did not change the choice.

**Held-out clips, every mix:**

| Held-out, speech fakes only | Audio | Run 8 mix | Three heads | Original + `clips_final3` (chosen) | Original + `final_slow` + `clips_final3` | Four heads |
|---|---|---|---|---|---|---|
| EER | clean | 1.13% | 0.23% | 0.30% | 0.23% | 0.45% |
| EER | compressed | 0.85% | 0.55% | 1.25% | 0.90% | 0.65% |
| EER | phone | 4.11% | 4.78% | 7.57% | 6.01% | 6.01% |
| Speech fakes missed | clean | 0.4% | 0.0% | 0.6% | 0.2% | 0.4% |
| Speech fakes missed | compressed | 0.8% | 0.2% | 0.4% | 0.2% | 0.2% |
| Speech fakes missed | phone | 1.0% | 1.0% | 3.0% | 1.4% | 1.2% |
| Vocoded missed | clean | 5.0% | 3.5% | 4.0% | 4.0% | 4.0% |
| Vocoded missed | compressed | 6.5% | 6.5% | 5.0% | 5.0% | 4.5% |
| Vocoded missed | phone | 37.5% | 28.0% | 21.5% | 27.5% | 28.0% |
| Conversation flagged | clean | 3.5% | 2.5% | 1.0% | 1.0% | 1.0% |
| Conversation flagged | compressed | 5.0% | 3.0% | 2.5% | 2.0% | 2.0% |
| Conversation flagged | phone | 4.5% | 6.0% | 7.0% | 3.5% | 3.5% |
| Reading flagged | clean | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| Reading flagged | compressed | 0.5% | 3.0% | 2.5% | 2.5% | 2.5% |
| Reading flagged | phone | 17.0% | 20.5% | 20.5% | 19.0% | 18.5% |

**The chosen mix by test set, at the 50% cut-off.** The old test rows are optimistic: those clips were read many times, and they may share speakers with the new training clips.

| Test set | Audio | EER | Fakes missed | Real flagged | Real clips in HIGH band |
|---|---|---|---|---|---|
| Held-out, all fakes including vocoded (400 real, 698 fake) | clean | 1.27% | 1.6% | 0.5% | 0% |
| Held-out | compressed | 2.13% | 1.7% | 2.5% | 2% |
| Held-out | phone | 10.75% | 8.3% | 13.8% | 8% |
| Old Singapore test (300 real, 498 fake) | clean | 0.47% | 0.6% | 1.7% | 1% |
| Old Singapore test | compressed | 1.17% | 0.4% | 2.7% | 2% |
| Old Singapore test | phone | 6.05% | 3.0% | 14.3% | 4% |
| LibriSpeech (200 real, 200 fake) | clean | 0.50% | 1.5% | 0.0% | 0% |
| LibriSpeech | compressed | 1.25% | 1.0% | 2.0% | 1% |
| LibriSpeech | phone | 7.50% | 2.5% | 11.0% | 6% |

Held-out EER by generator (fakes missed in brackets):

| Audio | Orpheus | Piper | SpeechT5 (never trained on) | DAC | EnCodec | SNAC | UnivNet |
|---|---|---|---|---|---|---|---|
| Clean | 0.00% (0.0%) | 2.00% (3.0%) | 0.00% (0.0%) | 1.94% (17.0%) | 0.00% (0.0%) | 0.00% (0.0%) | 0.00% (0.0%) |
| Compressed | 0.00% (0.0%) | 2.25% (2.0%) | 0.00% (0.0%) | 9.13% (21.3%) | 0.00% (0.0%) | 0.00% (0.0%) | 0.00% (0.0%) |
| Phone | 6.73% (3.4%) | 10.37% (5.0%) | 5.00% (0.0%) | 32.33% (55.3%) | 20.70% (26.5%) | 5.38% (3.5%) | 10.44% (4.3%) |

The vocoded rows answer one question: does the detector call a clip real only because it sounds like these recordings? On clean and compressed audio the answer is mostly no, because EnCodec, SNAC and UnivNet copies are all caught. DAC copies speech almost perfectly and is still the weak spot.

**Worst windows and fixed false alarms (`eval/clip_rules.py`).** Keep the average of the windows. It had the lowest validation EER: clean 0.82%, compressed 1.69%, phone 11.77%, against 1.39%, 2.50%, 18.10% for the worst window and 1.62%, 2.19%, 15.30% for the worst 2.

Cut-offs set on validation to flag 1% or 5% of real clips, then used on the test clips:

| Audio | Target | Held-out: real flagged, fakes missed | LibriSpeech: real flagged, fakes missed |
|---|---|---|---|
| Clean | 1% | 1.8%, 0.4% | 0.5%, 1.0% |
| Clean | 5% | 8.5%, 0.0% | 2.0%, 0.0% |
| Compressed | 1% | 1.8%, 2.3% | 1.0%, 2.0% |
| Compressed | 5% | 5.8%, 0.7% | 2.5%, 0.5% |
| Phone | 1% | 0.5%, 40.0% | 1.0%, 30.0% |
| Phone | 5% | 6.0%, 15.8% | 6.0%, 11.5% |

On Singaporean clean audio the 1% target now gave 1.8%, where Run 9 gave 9.7% on the old test clips. These are different clips, so treat it as a sign, not an exact gain. A 1% target rests on about 2 validation clips. Phone does not hold up: keeping false alarms near 1% misses 40% of fakes.

**Real deepfakes, full verdict (6 clips):**

| Clip | Three heads, as received | Three heads, phone (GSM) | Chosen mix, as received | Chosen mix, phone (GSM) |
|---|---|---|---|---|
| Lee Hsien Loong, fake CGTN interview | HIGH 99% | HIGH 99% | HIGH 99% | HIGH 97% |
| Compilation of Lee and Wong deepfakes | HIGH 99% | HIGH 97% | HIGH 99% | HIGH 96% |
| Lawrence Wong deepfake, reposted 2025 | HIGH 99% | MEDIUM 61% | HIGH 99% | MEDIUM 45% |
| Lawrence Wong (DPM), Straits Times short | HIGH 99% | HIGH 78% | HIGH 99% | MEDIUM 61% |
| Straits Times report (mixed news material) | INCONCLUSIVE 85% | HIGH 88% | MEDIUM 43% | HIGH 85% |
| SPF footage of the 2026 deepfake Zoom call | INCONCLUSIVE 85% | INCONCLUSIVE 46% | INCONCLUSIVE 76% | MEDIUM 52% |

Most scores fell a little. Six clips are evidence of behaviour, not an accuracy figure, and they played no part in the choice.

**Part-synthetic warning (`eval/splice_test.py`, 100 pairs of clips).** The rule was checked on validation for the new calibration and stays at one window at 0.9 or above, covering at least 10% of the clip. No other rule catches as many at 5% false alarms or fewer on clean and compressed.

| Spliced clips caught, real-only clips warned | clean | compressed | phone |
|---|---|---|---|
| Three heads, validation | 81%, 1% | 90%, 6% | 59%, 15% |
| Chosen mix, validation | 82%, 1% | 87%, 5% | 67%, 20% |
| Three heads, test | 96%, 13% | 97%, 24% | 72%, 2% |
| Chosen mix, test | 94%, 11% | 96%, 26% | 77%, 22% |

**Honest reading:**
- Adding Parts 1 and 3 did what it was meant to on attached clips. Three heads flagged 5.3% and 11.3% of fresh conversation clips, clean and compressed, in Run 9. The chosen mix flagged 1.0% and 2.5% of the new held-out ones. The comparison is rough: these are different clips, and the Run 8 mix, once refitted, flagged 3.5% and 5.0% of the held-out ones against 0.0% of the fresh ones.
- The mix was chosen for attached clips, and phone paid for it. Its held-out phone EER of 7.57% is the worst of the five mixes (Run 8 mix 4.11%), and it misses 3.0% of speech fakes on phone against 1.0%. Against three heads, real-only clips warned on phone rose from 2% to 22% on the test. It does catch the most vocoded fakes on phone, 78.5% against 62.5% for the Run 8 mix.
- Other mixes beat the chosen one on several held-out rows, especially original + `final_slow` + `clips_final3`. The choice was fixed on validation and was not changed after seeing them. Switching now would make these results optimistic.
- Phone is still not ready: 20.5% of real reading clips are flagged, 8% of held-out real clips land in HIGH, and 55.3% of DAC copies are missed. Live calls need a phone-only head and real call recordings. The phone condition here is simulated.
- Held-out clips may share speakers with training clips, because the corpus has no speaker IDs, and Part 1 prompts repeat across speakers. So these numbers show new clips, not proven new speakers.
- Only SpeechT5 is an unseen generator. The 298 Orpheus and 100 Piper fakes come from tools the head trained on, so their results are optimistic.
- Vocoded fakes are not real scams, and all fakes here are made by us or by public tools. The six officials' clips are the only real-world deepfakes, and they are too few for a rate.
- Clips were assumed equally likely real or fake, while real calls are mostly genuine, so flagged clips would more often be false alarms in real use.

## Run 9: vocoded and compressed training (2 Nov 2026)

**What was run:** three heads trained on `data/train_manifest_clips.csv`, which adds vocoded fakes (a real clip rebuilt by EnCodec, DAC, UnivNet or SNAC, same speaker and words) and 2 compressed copies of every training clip. All used lr 3e-5, label smoothing 0.1. Outputs are in `results/clips_test/`.

**Does vocoded training help with a generator it never saw?** Orpheus was left out of training for both heads below (validation EER at the saved epoch, which was epoch 1 for both).

| Validation EER | No vocoded (`clips_base`) | Vocoded (`clips_voc`) |
|---|---|---|
| Orpheus (unseen), phone | 31.24% | 18.96% |
| Orpheus (unseen), compressed | 0.00% | 0.00% |
| Piper, phone | 3.94% | 10.88% |
| All fakes, phone | 22.63% | 17.71% |
| All fakes, compressed | 3.33% | 3.00% |
| All fakes, clean | 1.55% | 1.36% |

At the last epoch the Orpheus gap is wider: 33.74% against 13.32%. Vocoded training removes a blind spot that fine-tuning created, but the original model already scored 19.20% on this, so it does not clearly beat the original on an unseen generator. It also gives up part of the phone gain on Piper.

**Correction (3 Nov 2026):** Orpheus is not fully unseen here. Its audio is decoded by SNAC 24 kHz, the same codec that made the `voc-snac` training fakes, so part of the gain above may come from learning SNAC's traces rather than from generalising. Only SpeechT5 is a fully unseen generator.

**Selection rule fixed.** The rule picked the epoch by the worst generator on compressed clips, and that was `voc-dac`. DAC copies speech almost perfectly, so its noise decided the epoch and epoch 1 was saved: phone EER 17.95%, Orpheus 18.50%, against 12.23% and 6.10% at epoch 6. Vocoded tools no longer count in `selection_score`, and ties go to the later epoch. This used validation only. The head was trained again and saved as `clips_final2`, which reproduced the same log.

**Choosing the head.** Rule set before scoring: `clips_final2` replaces `final_slow` if clean and compressed EER on TTS fakes stay within 0.5 points, overall and on the worst generator. Vocoded clips did not count, because only the new head trained on those tools. It passed.

| Validation EER, combined with the original | `final_slow` | `clips_final2` |
|---|---|---|
| TTS fakes, clean | 0.00% | 0.00% |
| TTS fakes, compressed | 0.39% | 0.16% |
| TTS fakes, phone | 7.79% | 9.68% |
| Orpheus, phone | 16.00% | 5.64% |
| Piper, phone | 3.01% | 12.27% |
| All fakes including vocoded, phone | 16.45% | 13.26% |

**Test of original + `clips_final2`:**

| Test set | Audio | Run 8 EER | Run 9 EER | Run 8 fakes missed | Run 9 fakes missed | Run 8 real flagged | Run 9 real flagged |
|---|---|---|---|---|---|---|---|
| Singapore (300 real, 498 fake) | clean | 0.00% | 0.37% | 0.2% | 0.0% | 0.0% | 6.0% |
| Singapore | compressed | 0.00% | 0.57% | 0.8% | 0.2% | 0.0% | 10.7% |
| Singapore | phone | 3.01% | 8.38% | 2.6% | 2.2% | 3.3% | 29.3% |
| LibriSpeech (200 real, 200 fake) | clean | 0.00% | 0.00% | 0.5% | 0.0% | 0.0% | 0.0% |
| LibriSpeech | compressed | 1.25% | 1.00% | 2.0% | 0.5% | 0.5% | 1.5% |
| LibriSpeech | phone | 5.50% | 7.00% | 2.0% | 2.5% | 13.0% | 12.0% |

**Why real Singaporean voices are flagged more.** Validation uses Parts 2 and 6 of the National Speech Corpus. The test uses Parts 1 and 3, so validation could not show this.

| Real clips flagged at 50% | clean | compressed | phone |
|---|---|---|---|
| Validation, Part 6 conversation | 2.1% | 6.2% | 12.5% |
| Validation, Part 2 reading | 0.0% | 2.1% | 10.4% |
| Test, Part 3 conversation | 10.7% | 17.3% | 38.0% |
| Test, Part 1 reading | 1.3% | 4.0% | 20.7% |

With `final_slow`, fitted on the same validation clips, Part 3 conversation was 2.7%, 3.3% and 4.7%. So the new head appears to read the recording setup of Part 3 as machine traces. This is the most important limit of the run: a head trained on vocoded audio can react to recording conditions it has not met, and real users' audio will differ from all of these.

**Three heads (now the default).** To reduce those false alarms, the original, `final_slow` and `clips_final2` were combined, with weights fitted on validation. On validation this matched two heads on clean and compressed EER (0.94% and 2.30%, against 0.84% and 2.20%) and beat them on phone (12.00% against 13.26%). This idea came after seeing the test results, so its test rows below are optimistic. A fair check needed new clips, so `eval/false_alarm_check.py` scored 300 real clips never used before: 150 from Part 3 and 150 from Part 1. Rule set before scoring: three heads become the default if their false alarms on fresh compressed clips are lower than `clips_final2` with the original. They were.

| Fresh real clips flagged at 50% | Run 8 (`final_slow`) | Original + `clips_final2` | Three heads | Three heads, HIGH band only |
|---|---|---|---|---|
| Conversation, clean | 0.0% | 13.3% | 5.3% | 0.7% |
| Conversation, compressed | 0.0% | 21.3% | 11.3% | 5.3% |
| Conversation, phone | 0.7% | 39.3% | 7.3% | 2.7% |
| Reading, clean | 0.0% | 1.3% | 1.3% | 1.3% |
| Reading, compressed | 0.7% | 4.7% | 4.0% | 2.0% |
| Reading, phone | 6.0% | 21.3% | 15.3% | 7.3% |

These clips may share speakers with the test clips, because the corpus split has no speaker IDs. They measure false alarms only: no fresh fake clips exist.

Three heads on the test clips, already seen when this was chosen:

| Test set | Audio | EER | Fakes missed | Real flagged |
|---|---|---|---|---|
| Singapore | clean | 0.53% | 0.0% | 3.7% |
| Singapore | compressed | 0.63% | 0.0% | 8.0% |
| Singapore | phone | 3.11% | 1.0% | 10.7% |
| LibriSpeech | clean | 0.00% | 0.0% | 0.5% |
| LibriSpeech | compressed | 0.50% | 0.0% | 2.5% |
| LibriSpeech | phone | 4.75% | 0.5% | 12.5% |

Phone EER by generator. Singapore: Orpheus 3.01%, Piper 4.00%, SpeechT5 (never trained on) 1.50%. LibriSpeech: Piper 6.25%, SpeechT5 2.00%.

**Real deepfakes, full verdict (6 clips):**

| Clip | Run 8, as received | Run 8, phone (GSM) | Three heads, as received | Three heads, phone (GSM) |
|---|---|---|---|---|
| Lee Hsien Loong, fake CGTN interview | HIGH 99% | HIGH 99% | HIGH 99% | HIGH 99% |
| Compilation of Lee and Wong deepfakes | HIGH 99% | HIGH 97% | HIGH 99% | HIGH 97% |
| Lawrence Wong deepfake, reposted 2025 | HIGH 99% | MEDIUM 50% | HIGH 99% | MEDIUM 61% |
| Lawrence Wong (DPM), Straits Times short | INCONCLUSIVE 87% | HIGH 80% | HIGH 99% | HIGH 78% |
| Straits Times report (mixed news material) | INCONCLUSIVE 8% | HIGH 74% | INCONCLUSIVE 85% | HIGH 88% |
| SPF footage of the 2026 deepfake Zoom call | INCONCLUSIVE 5% | LOW 14% | INCONCLUSIVE 85% | INCONCLUSIVE 46% |

**Worst windows and fixed false alarms (`eval/clip_rules.py`).** Keep the average of the windows. With three heads it had the lowest or joint-lowest validation EER: clean 0.94%, compressed 2.30%, phone 12.00%, against 1.03%, 2.49%, 16.78% for the worst window and 0.94%, 2.81%, 14.94% for the worst 2. Two heads gave the same answer.

Cut-offs set on validation to flag 1% or 5% of real clips, then used on the test clips:

| Audio | Target | Singapore: real flagged, fakes missed | LibriSpeech: real flagged, fakes missed |
|---|---|---|---|
| Clean | 1% | 9.7%, 0.0% | 0.5%, 0.0% |
| Clean | 5% | 25.3%, 0.0% | 2.5%, 0.0% |
| Compressed | 1% | 2.7%, 0.4% | 0.5%, 1.0% |
| Compressed | 5% | 19.0%, 0.0% | 6.5%, 0.0% |
| Phone | 1% | 1.0%, 11.8% | 1.5%, 13.0% |
| Phone | 5% | 3.3%, 3.2% | 6.5%, 3.5% |

A 1% target rests on about 2 validation clips. On Singaporean clean audio the cut-off does not hold its target, for the same reason as the false alarms above.

**Part-synthetic warning (`eval/splice_test.py`, 100 pairs of clips, three heads).** The rule was changed on validation to one window at 0.9 or above, covering at least 10% of the clip. It had the better balance of catches and false alarms for attached clips. This table is the one test of it.

| Spliced clips caught, real-only clips warned | clean | compressed | phone |
|---|---|---|---|
| Old rule, validation | 65%, 1% | 70%, 5% | 64%, 19% |
| New rule, validation | 81%, 1% | 90%, 6% | 59%, 15% |
| Old rule, test | 91%, 17% | 94%, 29% | 79%, 24% |
| New rule, test | 96%, 13% | 97%, 24% | 72%, 2% |

Each real-only clip joins 3 recordings, so it has more chances to trigger, and its pieces come from different speakers. The higher test false alarms come from the same Part 3 problem.

**Silent windows.** Skipping them was dropped. Only 1.9% of Singapore test clips and 0.5% of LibriSpeech test clips had any window more than half quiet, and 5 of the 6 officials' clips had none.

**Honest reading:**
- The Zoom call rose from 5% to 85% as received, and from 14% to 46% through a phone line. The app still says INCONCLUSIVE, because the windows disagree. It is no longer a miss, but it is not a clear catch.
- The price is real Singaporean voices. On fresh clips, Run 8 flagged almost none on clean and compressed audio, and three heads flag 5.3% and 11.3% of conversation clips. Most of those fall in MEDIUM, not HIGH, but a real customer could still see one.
- Choosing between these is a judgement call: three heads catch more real deepfakes, while Run 8 raises fewer false alarms.
- Validation has no recordings like Part 3, and that is why this was only found on the test. The fresh clips should go into validation or training next, and a new test set would then be needed.
- Only SpeechT5 is an unseen generator. The three-head test rows are optimistic, and the test clips have now been read many times.
- The officials' numbers were on screen while comparing heads, although the choice rule did not use them. Six clips are evidence of behaviour, not an accuracy figure.
- Vocoded fakes are not real scams, and a clip can be flagged for its recording chain rather than for a cloned voice.
- Each head runs the backbone again, so three heads take about 1.5 times as long as two.
- Clips were assumed equally likely real or fake, while real calls are mostly genuine, so flagged clips would more often be false alarms in real use.

## Run 8: calibrated test of the best version so far (1 Nov 2026)

**What was run:** the original model and `final_slow` (trained on real clips, Piper and Orpheus, lr 3e-5, 4 epochs) scored on clean, compressed and phone copies. Their scores are combined by a logistic model fitted per channel on validation only (`detectors/calibration.json`). Outputs are in `results/final_test/`. This is not the final test: vocoded training is still to come, and that head will need its own test.

| Test set | Audio | Original EER | Combined EER | Fakes missed at 50% | Real flagged at 50% |
|---|---|---|---|---|---|
| Singapore (300 real, 498 fake) | clean | 7.92% | 0.00% | 0.2% | 0.0% |
| Singapore | compressed | 7.75% | 0.00% | 0.8% | 0.0% |
| Singapore | phone | 11.56% | 3.01% | 2.6% | 3.3% |
| LibriSpeech (200 real, 200 fake) | clean | 7.50% | 0.00% | 0.5% | 0.0% |
| LibriSpeech | compressed | 6.00% | 1.25% | 2.0% | 0.5% |
| LibriSpeech | phone | 16.25% | 5.50% | 2.0% | 13.0% |

Phone EER by generator, original then combined. Singapore: Orpheus 7.02% to 3.51%, Piper 26.67% to 3.17%, SpeechT5 (never trained on) 8.00% to 1.67%. LibriSpeech: Piper 25.25% to 6.75%, SpeechT5 8.00% to 2.75%.

**Real deepfakes, full verdict (6 clips):**

| Clip | As received | Phone (GSM) |
|---|---|---|
| Lee Hsien Loong, fake CGTN interview | HIGH 99% | HIGH 99% |
| Compilation of Lee and Wong deepfakes | HIGH 99% | HIGH 97% |
| Lawrence Wong deepfake, reposted 2025 | HIGH 99% | MEDIUM 50% |
| Lawrence Wong (DPM), Straits Times short | INCONCLUSIVE 87% | HIGH 80% |
| Straits Times report (mixed news material) | INCONCLUSIVE 8% | HIGH 74% |
| SPF footage of the 2026 deepfake Zoom call | INCONCLUSIVE 5% | LOW 14% |

**Honest reading:**
- The phone channel is much better than Run 5, where only 1 of 6 real deepfakes stayed clearly flagged. That run scored raw heads and this one uses the full verdict, so the two are not an exact comparison.
- The Zoom call is still a miss, and it is the most recent and most relevant attack. The audio has not been separated from SPF's captions and music.
- Real deepfakes helped steer this work (Run 5 led to adding Orpheus), so these 6 clips are no longer fully independent, although they were never trained on or used to set any weights.
- Only SpeechT5 is an unseen generator. Orpheus and Piper test clips use unseen voices from generators in training.
- On validation, the Orpheus voice held back (tara) had a 16.12% phone EER with `final_slow` alone, against 2.68% for the head alone on the test voices. Results depend heavily on the voice.
- False alarms on phone audio differ by speaker set: 3.3% for Singaporean voices and 13.0% for LibriSpeech. Clips were assumed equally likely real or fake, while real calls are mostly genuine.
- The window-spread limits are now tight because validation scores are so separated. From saved window scores, 0% to 7.5% of test clips exceed the limit depending on the condition, with compressed LibriSpeech the highest.
- The test clips were also used to report older versions, but no setting was chosen on them here.

## Runs 6 and 7: Orpheus fakes and training settings (31 Oct to 1 Nov 2026)

**Run 6:** Orpheus Singlish fakes showed the earlier heads had a blind spot on phone audio. At the 0.5 cut-off, fine-tuned 2 missed 64.1% of Orpheus fakes, the original model 15.5%, on 216 real and 206 Orpheus clips.

**Run 7:** head training on validation clips, phone EER. A head fitted to one generator got worse on others, and a lower learning rate only limited the damage. Training on both generators worked best: all generators, lr 3e-5, epoch 4 gave clean 0.00%, phone 7.17%, Orpheus 16.12%, Piper 1.62% (original: 3.78%, 23.54%, 19.20%, 25.69%). Label smoothing made little difference. The run holding out Piper at lr 3e-5 failed with an out-of-memory error, so it has no result.

## Run 5: real deepfakes of Singapore officials (30 Oct 2026)

**What was run:** `python -m eval.officials_report` on 6 publicly circulated deepfake clips (evaluation only; sources in `sg_officials_sources.csv`), each as downloaded and after a simulated GSM call. Three detector versions: original, fine-tuned 1 (audiobook data), fine-tuned 2 (plus Singaporean speech, Run 4's recipe on `data/train_manifest_sg.csv`; best validation epoch 4, phone EER 0.46%). Mean raw fake score over all 5 s windows (0 = real, 1 = fake):

| Clip | Length | As received: orig / ft1 / ft2 | Phone (GSM): orig / ft1 / ft2 |
|---|---|---|---|
| Lee Hsien Loong, fake CGTN crypto interview (his own Facebook post) | 14 s | 0.73 / 0.99 / **1.00** | 0.63 / 0.88 / **0.94** |
| Compilation of the Dec 2023 Lee and Wong deepfakes (with narration) | 177 s | 0.72 / 0.99 / **1.00** | 0.65 / 0.53 / 0.47 |
| Lawrence Wong deepfake, reposted Mar 2025 | 37 s | 0.67 / 0.95 / **0.94** | 0.35 / 0.06 / **0.00** |
| Lawrence Wong (DPM) deepfake, Straits Times short | 40 s | 0.45 / 0.56 / 0.81 | 0.36 / 0.31 / 0.26 |
| Straits Times report on the Lee deepfake (mixed news material) | 61 s | 0.22 / 0.30 / 0.27 | 0.56 / 0.29 / 0.22 |
| SPF footage of the 2026 deepfake Zoom call (Wong, Tharman, Indranee) | 66 s | 0.43 / 0.13 / 0.04 | 0.31 / 0.08 / 0.02 |

Most suspicious windows and every window's score: `results/sg_officials/report.csv` and `timeline.csv`.

**Honest reading:**
- **As received** (web audio, the voice-note/video case), the fine-tuned heads flag the four clips where the deepfake is most of the audio at 0.8 to 1.0, far more confidently than the original model (about 0.7). The two news-style clips are mixed, as expected: windows near 1.0 inside otherwise low clips (Straits Times report peaks at 0:50).
- **The SPF Zoom-call reel is mostly not flagged** by the fine-tuned heads (one window at 0:25 reaches 0.87 / 0.69). We have not listened through to separate the call audio from SPF's own captions/music, so this may be partly content, but it is the most recent and most relevant attack and should be treated as a likely miss until checked.
- **Through a phone line, the fine-tuned heads lose most of the real deepfakes.** Only the Lee CGTN clip stays clearly flagged. The Wong 2025 clip falls from 0.94 to 0.002 with fine-tuned 2, while the original model still gives 0.35. So the big phone gains in Run 4 (on Piper/SpeechT5 fakes) **do not carry over to real-world cloned voices**, and fine-tuning may have made the phone channel lean "real" for generators it never saw. This is the most important limitation so far.
- The GSM copies are double-compressed (web codec, then GSM), which is harsher than many real calls, and 6 clips are evidence of behaviour, not an accuracy figure.
- The app verdicts in the report still use the original model and its calibration (`calibration.json` has not been refitted for a fine-tuned head yet).
- These clips stay test-only: do not train on them or tune thresholds to them, or this real-world check stops being honest.

**What this means for next steps:** picking a head on validation alone (fine-tuned 2 wins there) would hide this. Training needs fakes closer to real cloning tools (newer, codec-based TTS, e.g. the Orpheus Singlish model, and Singapore-accented fakes) before the phone channel can be trusted; until then, phone-call verdicts should lean on the warning flow and the request itself ("officials never ask for transfers"), not on the voice score.

## Run 4: phone-domain fine-tuning, run 1 (30 Oct 2026)

**What was trained:** `python -m train.finetune_head --epochs 8`. Only the detector head (AASIST pooling + classifier, 487,655 parameters) was trained; the XLS-R backbone (300M) stayed frozen. Training data (`data/train_manifest.csv`): LibriSpeech **dev-clean** (32 speakers, none in the test set) and the same sentences read by **7 Piper voices not used in the test set**, each clip clean plus 2 phone copies (2,880 files). SpeechT5 was kept out of training entirely. Best epoch chosen on validation (8 other speakers, 2 other Piper voices): epoch 2.

Validation EER: clean 3.33% -> 0.00%, phone 27.08% -> 1.25%.

**Untouched test sets** (same clips and phone copies as Runs 1 and 3):

| Test set | Condition | Fakes | EER before | EER after | AUC before | AUC after |
|---|---|---|---|---|---|---|
| LibriSpeech | clean | all | 7.50% | 0.00% | 0.976 | 1.000 |
| LibriSpeech | clean | Piper (unseen voices) | 11.00% | 0.00% | 0.952 | 1.000 |
| LibriSpeech | phone | all | 16.25% | 5.75% | 0.915 | 0.986 |
| LibriSpeech | phone | Piper (unseen voices) | 25.25% | 3.75% | 0.848 | 0.994 |
| LibriSpeech | phone | **SpeechT5 (unseen generator)** | 8.00% | 7.25% | 0.982 | 0.978 |
| Singapore | clean | all | 15.83% | 0.00% | 0.921 | 1.000 |
| Singapore | phone | all | 16.58% | 2.42% | 0.896 | 0.998 |
| Singapore | phone | SpeechT5 (unseen generator) | 8.00% | 3.17% | 0.984 | 0.996 |

Real Singaporean voices now score very low (conversation, clean: mean raw score 0.004, was 0.192), so the Run 3 false-alarm problem is largely gone **even though no Singaporean speech was in training**.

**Honest reading:**
- The big gains are on Piper, a generator family the head trained on (different voices). On the generator it never saw (SpeechT5), phone EER barely moved on LibriSpeech (8.0% -> 7.3%) and improved on the Singapore set (8.0% -> 3.2%). So the head did not lose generality, but most of the gain is "seen family".
- Both test generators are older TTS designs. Real-world deepfakes (commercial voice cloning, codec-based TTS) are untested; the officials' clips (`eval/officials_report.py`) are the real-world check.
- Inconclusive phone clips rose from 3 to 27 because fine-tuned window scores are more extreme; the window-spread threshold needs re-tuning on validation.
- EER still uses the best threshold per test set; calibration (fitted on validation) is next.

## Run 3: real SINGAPOREAN voices, original model (30 Oct 2026)

**What was run:** `python -m eval.run_eval --manifest data/manifest_sg.csv --out results/eval_sg_base` (original model), then the Run 2 calibration applied to the real Singaporean clips.

**Test set:** 300 real Singaporean English clips from IMDA's National Speech Corpus (150 read, Part 1; 150 natural conversation with Singlish, Part 3), against the same 200 TTS fakes as before.

| Real Singaporean voices | Raw score mean | Calibrated HIGH (70%+ "synthetic") | MEDIUM |
|---|---|---|---|
| Read, clean | 0.093 | 2.7% | 7.3% |
| Read, phone | 0.232 | 8.0% | 16.0% |
| **Conversation, clean** | **0.192** | **54.7%** | 29.3% |
| Conversation, phone | 0.333 | 8.7% | 56.0% |

(For comparison, LibriSpeech audiobook voices: about 1% HIGH on clean audio.) Over 90% of these clips are detected as wideband, so the app would use the wideband calibration on them.

**What this shows:** the raw detector separates real from fake about as well as before (clean EER for SpeechT5 0%, Piper 28%), but **the calibration fitted on audiobook speech is badly wrong for natural Singaporean speech**: it would tell over half of real Singlish speakers that their voice is likely AI. This is exactly the harm the challenge warns about ("blocking legitimate transactions without review"), and the most important problem to fix.

**Plan:** add real Singaporean speech to fine-tuning and calibration, using different NSC parts (Part 2 read, Part 6 conversation) from the Part 1/3 test clips. **Caveat:** we have no Singapore-accented FAKES yet, so a model trained this way could learn "Singaporean accent = real" and miss Singapore-accented deepfakes. Singapore-accented fakes (gated SpeechT5-NSC models, or the 6.6 GB Orpheus Singlish model) are needed to check this.

## Run 2: calibration, watermark layer and the full verdict (30 Oct 2026)

### Calibration (`python -m eval.calibrate`)
Platt calibration, fitted separately for wideband and phone-band audio on half the real speakers and half the TTS voices, then tested on the other half (people and voices it never saw). Accuracy at the 50% cut-off is therefore an honest estimate.

| Audio | Scores | Accuracy at 50% | Fakes missed | Real voices flagged | ECE (calibration error) |
|---|---|---|---|---|---|
| Wideband | raw | 90.2% | 20.4% | 0.0% | 0.200 |
| Wideband | calibrated | 96.9% | 5.4% | 1.0% | 0.068 |
| Phone | raw | 88.1% | 18.3% | 6.0% | 0.158 |
| Phone | calibrated | 87.0% | 11.8% | 14.0% | 0.075 |

Test clips by band (calibrated):

| Audio | Clips | LOW (<30%) | MEDIUM | HIGH (70%+) |
|---|---|---|---|---|
| Wideband | real | 94% | 5% | 1% |
| Wideband | fake | 1% | 9% | 90% |
| Phone | real | 73% | 21% | 6% |
| Phone | fake | 8% | 12% | 81% |

Takeaways: calibration makes the percentages trustworthy (ECE more than halved) but cannot fix phone audio. On phone audio the 50% cut-off flags 14% of real voices, so only the HIGH band (6% of real voices, 81% of fakes) should trigger a pause; MEDIUM should only warn. Calibration assumes about half the clips are fake; in real calls most voices are genuine, so the app should combine this with context signals, not act on it alone. The held-out half here happened to be easier on wideband audio (AUC 0.998 vs 0.976 on all clips), so expect some variation.

Phone-band detection (used to pick the calibration): every phone copy had at most 0.008% of its energy above 3.8 kHz and every clean clip at least 0.049%; the cut-off is 0.02%.

### Watermark survival (`python -m eval.watermark_test --n 50`)
50 TTS clips watermarked with AudioSeal (as if the TTS provider cooperated), each tested clean and through every phone codec.

| Condition | Watermarked fakes detected | False alarms (real voices / unmarked fakes) |
|---|---|---|
| Clean | 100% | 0% / 0% |
| G.711 A-law | 30% | 0% / 0% |
| G.711 mu-law | 30% | 0% / 0% |
| GSM | 24% | 0% / 0% |
| AMR-NB (mobile) | 0% | 0% / 0% |
| Opus (WhatsApp/VoIP) | 0% | 0% / 0% |

Takeaways: a watermark is reliable proof on clean recordings (e.g. a voice note file) and never false-alarmed, but mobile and VoIP codecs erase it. On a phone call it is a rare bonus, not a safety net. Real-world coverage is even lower: (share of scam tools that watermark, close to zero for open-source cloning) x (survival through the call). The G.711/GSM clips averaged a score of about 0.4, just under the 0.5 threshold; a lower threshold might recover some, but would need its own false-alarm test.

### Full verdict (`python -m detectors.verdict`)
On sample clips, the flow behaved as designed: watermarked clip -> "AI-generated (watermark)"; SpeechT5 clean -> HIGH, high confidence; SpeechT5 through GSM -> HIGH (88%), medium confidence; real voice through GSM -> LOW (30%), medium confidence; Piper through GSM -> INCONCLUSIVE (48%, windows disagree).

**Known failure:** a clean Piper clip came out "Probably real, 9%, confidence high". The confidence rules (length, phone audio, window disagreement) cannot see a generator the model is blind to. This is the main reason the voice score must stay one signal among several.

## Run 1: forensics XLS-R baseline, clean vs phone (30 Oct 2026)

**What was run:** `python -m eval.run_eval` with the `detectors/forensics_xlsr.py` wrapper (whole clip, 5 s windows, 2.5 s hop, fp16 on an RTX 4050). Full outputs are in `results/eval/` (git-ignored; regenerate with the command).

**Test set (400 clips):**
- Real: 200 LibriSpeech test-clean clips, 5 per speaker, 40 speakers, 3 to 15 s.
- Fake: the same 200 sentences read by TTS. 100 Piper (VITS, 4 voices), 100 SpeechT5 + HiFi-GAN (7 voices).
- Phone copy of every clip (`audio/phone.py`, seeded per clip): white noise at SNR 5 to 30 dB, 8 kHz, 300 to 3400 Hz band-pass, one random codec (G.711 mu-law/A-law, GSM, AMR-NB, Opus), 0 to 5% packet loss.

**Results (raw scores, no calibration):**

| Condition | Fakes | EER | AUC | Fakes missed at 0.5 | Real voices flagged at 0.5 |
|---|---|---|---|---|---|
| Clean | all | 7.5% | 0.976 | 25.5% | 0.0% |
| Clean | Piper | 11.0% | 0.952 | 51.0% | 0.0% |
| Clean | SpeechT5 | 0.0% | 1.000 | 0.0% | 0.0% |
| Phone | all | 16.3% | 0.915 | 23.0% | 9.5% |
| Phone | Piper | 25.3% | 0.848 | 40.0% | 9.5% |
| Phone | SpeechT5 | 8.0% | 0.982 | 6.0% | 9.5% |

By phone codec (all fakes, about 40 real + 40 fake clips each, so these numbers are noisy):

| Codec | EER | Real voices flagged at 0.5 |
|---|---|---|
| AMR-NB | 9.9% | 7.5% |
| A-law | 15.1% | 3.1% |
| mu-law | 16.2% | 7.1% |
| GSM | 17.3% | 22.9% |
| Opus | 19.0% | 2.6% |

Inconclusive (under 2 s, or windows disagree): 5 clean, 3 phone.

**What this shows:**
1. **Phone audio roughly doubles the error** (EER 7.5% to 16.3%) and starts flagging real people as fake (0% to 9.5% at 0.5). This matches the research in `detector_research.md`.
2. **Results depend heavily on the generator.** SpeechT5 is caught perfectly on clean audio; Piper is much harder (EER 11% clean, 25% phone). Quoting one overall number would hide this.
3. **The raw score is not a probability.** Scores top out around 0.75 even for obvious fakes, and the best cut-off moves from about 0.11 (clean) to about 0.42 (phone). A fixed 0.5 threshold misses half the clean Piper fakes. Calibration on phone-quality data is needed before showing users a percentage.

**Limits:**
- EER uses the best threshold for this test set, so it is optimistic.
- Only two TTS generators, both older designs; no codec-based (newer) TTS yet.
- Real voices are read audiobook speech, not phone conversations. The detector may also have seen similar audiobook data in training (unknown).
- White noise and silent packet loss are simplifications of real phone lines.
- One phone copy per clip; the codec groups are small.
