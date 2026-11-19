# Voice detector prototype

The "verify the caller" voice check: watermark check, then a deepfake voice detector tuned for phone audio, then a calibrated verdict. Part of the OCBC PS3 project; background in `../PROJECT_CONTEXT.md`.

**Run every command below from inside this folder** (`voice detector prototype/`). The Python environment `.venv` lives one level up, in the project root.

## Setup (Windows)

```bash
py -3.13 -m venv ..\.venv
..\.venv\Scripts\activate
pip install torch==2.11.0 torchaudio==2.11.0 --index-url https://download.pytorch.org/whl/cu128   # or /whl/cpu with no NVIDIA GPU
pip install -r requirements.txt
```

The CUDA PyTorch download is about 2.8 GB; the CPU one is much smaller.
`ffmpeg` comes from the `imageio-ffmpeg` package, so no system install is needed. Find its path with:

```bash
python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
```

## Download the detector model

About 1.2 GB, saved to `models/forensics_xlsr/` (git-ignored). The 3.8 GB `.pt` file is skipped on purpose; we only load `.safetensors`.

```bash
python -c "from huggingface_hub import snapshot_download; snapshot_download('eliya/forensics_0.3B_xlsr_wild_deepfake_classifier', local_dir='models/forensics_xlsr', ignore_patterns=['*.pt'])"
```

## Check a voice clip (the full verdict)

```bash
python -m detectors.verdict path/to/clip.wav
```

Steps: AudioSeal watermark check (found = AI-generated, stop) -> detect clean vs phone-band audio -> the detector heads for that kind of audio -> calibrated chance it is synthetic (`detectors/calibration.json`) -> band LOW / MEDIUM / HIGH or INCONCLUSIVE, a confidence level and the reasons. It is one risk signal, not a scam verdict. All clips use the original head + `clips_final3`, with weights fitted separately for clean and phone-band audio. The `phone_tuned` setup from Run 12 is kept for the live-call work in `detectors/calibration_phone_tuned.json`; try it with `--calibration detectors/calibration_phone_tuned.json` (Run 12 in `docs/eval_results.md` says why it is not the default).

The watermark layer needs AudioSeal's two small checkpoints (about 94 MB) in `downloads/audioseal/`:

```bash
python -c "from huggingface_hub import hf_hub_download as d; [d('facebook/audioseal', f, local_dir='downloads/audioseal') for f in ('detector_base.pth', 'generator_base.pth')]"
```

## Use it from the website ("Check anything" screen)

The website's voice check sends the recording to a small local API, `app/api.py` (Python standard library only, nothing extra to install). Start it, then open the website as usual:

```bash
python -m app.api
```

It loads the model (about a minute the first time), then listens on http://127.0.0.1:7861. Only pages from `localhost` / `127.0.0.1` may call it, nothing leaves the computer, and each recording is deleted straight after it is checked. Phone recordings such as `.m4a` and `.amr` are converted with the bundled ffmpeg first.

- `POST /api/voice/check?ext=m4a` with the recording as the body; `POST /api/voice/sample` checks our own synthetic sample clip (the first file in `data/fake_tts/piper/`); `GET /api/voice/health`.
- The answer is one of the website's five results (likely / partial / uncertain / unsure / real) with the chance, how sure, and reasons as short codes (for example `{"key": "short", "seconds": 3.2}`), so the website can word them in English, Chinese or Malay.
- It needs the downloaded model and AudioSeal files above **and** our trained head `models/finetuned/clips_final3.safetensors` (1.9 MB). That head is the one set of weights in git (allowed by our teacher, 19 Nov 2026), so it is already here; other weights are never committed. Retrain it with `train/finetune_head.py` if you want. For only running the API, `requirements-api.txt` is a smaller install than `requirements.txt`.
- If the API isn't running, the website still works: the voice check shows a demo result, clearly marked as one.

**At the booth (visitors' own phones):** the team laptop is the server. `app\start_booth.ps1` starts the API with `--site` (so it also serves the website) and an ngrok tunnel to the team's fixed address (`$PublicDomain` in the script; the same address is `voiceApiPublic` in `js/data/analyser.js`). Visitors scan the poster's QR code (the Vercel site), and the voice check goes through the tunnel to the laptop. Put the Vercel link in `$VercelSite` so the API accepts calls from it. Keep the laptop plugged in, online and awake (sleep off, closing the lid does nothing) all event.

```bash
powershell -ExecutionPolicy Bypass -File app\start_booth.ps1
```

## Score a clip with the detector only (raw score)

```bash
python -m detectors.forensics_xlsr path/to/clip.wav
```

It scores the whole clip in overlapping 5 s windows and prints a raw fake score (0 = sounds real, 1 = sounds synthetic). The score is not calibrated yet. Clips under 2 s, or clips whose windows disagree, are marked inconclusive.

## Make a clip sound like a phone call

```bash
python -m audio.phone in.wav out.wav --seed 0 --codec gsm    # codecs: mulaw, alaw, gsm, amrnb, opus, random, none
```

## Build the test set and evaluate (clean vs phone)

Downloads (all under `downloads/`, git-ignored, about 1.3 GB in total): LibriSpeech test-clean (347 MB) from https://www.openslr.org/resources/12/test-clean.tar.gz extracted to `downloads/librispeech/`; four Piper voices to `downloads/piper_voices/`; `microsoft/speecht5_tts`, `microsoft/speecht5_hifigan` and the CMU Arctic x-vectors to `downloads/`. See `data_prep/make_tts.py` for the exact paths.

```bash
python -m data_prep.prepare_real --per-speaker 5   # 200 real clips, 40 speakers
python -m data_prep.make_tts                       # the same 200 sentences read by Piper and SpeechT5
python -m data_prep.build_manifest                 # data/manifest.csv
python -m eval.run_eval                            # results/eval/: scores, metrics, charts, score_stats.json
python -m eval.watermark_test --n 50               # does the watermark survive phone codecs?
```

The full evaluation takes about 3 minutes on an RTX 4050. Latest results: `docs/eval_results.md`.

`eval.run_eval` saves `run.json` next to `scores.csv`, and only reuses saved scores made with the same head, manifest and split. `--limit N` writes to a separate `<out>_limitN` folder.

After that, each step uses scores saved by `eval.run_eval`, one folder per head. The commands are at the top of each script:

- `eval/calibrate.py` fits the calibration on validation clips (each kind of audio may have its own heads) and reports validation and test clips. It only updates the live `detectors/calibration.json` with `--save`, after keeping a copy of the old one.
- `eval/clip_rules.py` compares the average with the worst windows, and reports fakes missed at a set false alarm rate.
- `eval/splice_test.py` tests the "part of this clip sounds synthetic" warning.
- `eval/false_alarm_check.py` measured false alarms on real Singaporean clips that had never been scored. Those clips are now used by `data_prep/prepare_fresh.py`.
- `data_prep/prepare_fresh.py` adds Parts 1 and 3 of the corpus to training and validation, and builds the held-out clips (`data/manifest_heldout.csv`).
- `eval/compare_heads.py` compares mixes of heads on validation, using a rule fixed before scoring. Test folders are only reported.
- `eval/window_pooling.py` tries other ways to combine a clip's 5 s windows on validation.
- `eval/noise_check.py` breaks phone errors down by noise level, packet loss and codec, and tests noise-aware calibration on validation.
- `eval/routing_check.py` counts how many clips the app sends to the other calibration (it measures the sound above 3.8 kHz; the tables use the condition label), and what that changes.

The code review of 3 to 4 Nov 2026, what it changed and the limits it found are in `docs/code_review.md`.

## Run the tests

```bash
python -m pytest tests
```

## Not in git

Model weights, audio datasets (`data/`, `downloads/`, `models/`), `results/` and `.venv/` are ignored (see `../.gitignore`). Re-download or regenerate them with the scripts. The one exception is our own trained head, `models/finetuned/clips_final3.safetensors` (1.9 MB), kept in git so the voice check can run without retraining.
