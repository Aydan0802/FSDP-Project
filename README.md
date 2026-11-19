# Pause & Prove

**Stop. Check. Then act.** A prototype that helps seniors in Singapore spot AI-voice and impersonation scams *before* they lose money, and gives bank staff a view of the activity it flags.

Built by a student team at Ngee Ann Polytechnic (FSDP) for the **OCBC Innovation Challenge, Problem Statement 3: "Digital Trust: Protecting Customers from AI-Powered Scams"** (November 2026).

> **Student prototype. Not a real OCBC service. All data is made up.**

**Live site:** https://fsdp-project.vercel.app. The voice check needs the team laptop running ([Booth setup](#booth-setup)), or the optional voice API on your own computer ([step 3](#3-voice-check-api-optional-large-download)); without it the site shows a clearly marked demo voice result. Family passphrase needs the server ([Setup](#setup)).

---

## Contents

- [What it does](#what-it-does)
- [How the checks work](#how-the-checks-work)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Setup](#setup)
- [Booth setup](#booth-setup)
- [Testing](#testing)
- [Demo script](#demo-script)
- [Accessibility and languages](#accessibility-and-languages)
- [Privacy and safety](#privacy-and-safety)
- [Limitations](#limitations)
- [Project structure](#project-structure)
- [Team](#team)
- [Credits](#credits)

---

## What it does

Scammers now clone voices, fake bank calls and send convincing messages. Pause & Prove gives a worried customer three things: **a pause** before acting, **simple ways to check**, and **one clear next step**.

| Screen | Address | What the customer can do |
|---|---|---|
| Home | `#customer` | "Need help right now?" card, then the check and be-ready tools |
| Someone is calling me now | `#calling-now` | One calm instruction per screen: hang up, then what to do next |
| Is the bank really calling? | `#call-match` | Type the number that called; it is checked against the calls OCBC really made |
| Is the caller a real person? | `#caller-check` | Read the caller a one-time code; a bot can't finish the picture check |
| Check anything | `#analyser` | Paste a message, or add a screenshot, document or voice recording, and get a result |
| Check a transfer | `#risk-scorer` | Risk score before sending money (needs sign-in) |
| Pause and check | `#pause-verify` | The "kopi break" after a risky transfer |
| Freeze my accounts | `#freeze` | One big button, then call OCBC |
| Report a scam | `#report` | A short form with a report number (needs sign-in) |
| Family passphrase | `#passphrase` | A secret word only the family knows (needs sign-in and the server) |
| Learn the signs | `#learn-signs` | Four signs of a scam call and a practice question |
| Staff console | `#staff`, `#staff-queue` | Overview, flagged activity and case detail (sign in as bank staff) |

Urgent tools (calling now, freeze, the checks) work **without signing in**.

A separate one-page preview, [`android-call-preview/`](android-call-preview/README.md), shows the warning an Android phone would show when a reported number calls.

## How the checks work

"Check anything" (`#analyser`) works out what the customer added and runs the matching check. **Every result is a warning sign, never proof**, and comes with plain next steps.

| What is checked | How | Where it runs | Details |
|---|---|---|---|
| **Message** (typed, pasted or `.txt`) | Hand-written red-flag rules in English, Chinese and Malay: asks for an OTP, threatens your account, fake-looking links, "guaranteed returns" and more | On the device | [`text detector prototype/`](text%20detector%20prototype/README.md) |
| **Picture** (screenshot or photo) | Two checks at once: (1) the words in the picture are read with Tesseract.js and go through the message rules; (2) the **AI label check** looks inside the file for labels AI tools leave: C2PA content credentials (signature checked), the IPTC "made by AI" label, and image-generator settings | On the device | [`image detector prototype/`](image%20detector%20prototype/README.md) |
| **Document** (PDF and others) | The words are read with PDF.js and go through the message rules | On the device | `js/features/evidence-checker.js` |
| **Voice recording** | A watermark check (AudioSeal), then a deepfake voice detector (XLS-R) with our own trained head for phone audio, then a calibrated chance and band | The team laptop's Python API; each recording is deleted straight after checking | [`voice detector prototype/`](voice%20detector%20prototype/README.md) |

How a picture result is decided:
- **Risky words lead.** If the picture also carries an AI label, it shows under the headline as "About the picture itself".
- **Harmless or unreadable words plus an AI label:** the label leads, for example "This picture was made with AI".
- **No AI label found changes nothing.** Most pictures lose their labels when shared, so "no label" never means "real".

If the voice API can't be reached, the voice check shows a hand-written demo result, clearly marked "Demo result".

## Architecture

```
 Customer's phone or browser
 ┌────────────────────────────────────────────────────────────────┐
 │ index.html + js/ + css/   (plain HTML, CSS, JS; no build step)  │
 │  ├─ text detector          (rules, on device)                   │
 │  ├─ image AI label check   (on device; C2PA library, jsDelivr)  │
 │  └─ Tesseract.js / PDF.js  (read words in pictures and PDFs)    │
 └──────────────┬────────────────────────────────┬────────────────┘
                │ optional                       │ voice recordings only
                ▼                                ▼
 Express server (server/)               Voice API (voice detector prototype/app/api.py)
  sign-in, risk API, passphrases         Python on the team laptop, port 7861,
                │                         reached through an ngrok tunnel at the booth
                ▼ optional
 Supabase (sign-in tables only)
```

- **Static first.** The whole site runs from static files, which is how Vercel serves it. Without the server, sign-in runs in demo mode and the risk scorer scores on the device with the same code.
- **Server (optional).** Adds real sign-in (`/api/auth`), the risk API (`POST /api/risk/score`, `GET /api/risk/cases`; see [docs/risk-scorer.md](docs/risk-scorer.md)) and the passphrase API (`/api/passphrases`). Cases are kept in memory and are lost when it stops.
- **Database (optional).** Supabase holds sign-in only: IDs and hashed passwords. Without it, the server uses six built-in demo accounts.

## Quick start

Run the website on your computer in under a minute. From this folder:

```bash
python -m http.server
```

Open http://localhost:8000 and choose **Fill in for me (demo)** to sign in.

## Setup

### Prerequisites

| Part | Needs |
|---|---|
| Website | Any modern browser and any static file server (for example Python's) |
| Server | Node.js 18 or newer |
| Voice API (optional) | Only for the live voice check. Windows, Python 3.13, about 1.6 GB of downloads with CPU-only PyTorch (about 4 GB with the NVIDIA GPU build); a GPU is optional |
| Image check tests | Node.js 18 or newer (the test-image maker also needs Python with Pillow and `c2pa-python`) |

### 1. Website only

```bash
python -m http.server
```

Open http://localhost:8000. Everything works except Family passphrase (needs the server) and the live voice check (needs the optional voice API; without it the voice check shows a clearly marked "Demo result").

### 2. With the server

```bash
cd server
npm install
npm start
```

Open http://localhost:3000: the same website plus sign-in, the risk API and the passphrase API.

**Supabase (optional):** copy `server/.env.example` to `server/.env`, fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, then follow [database/README.md](database/README.md). **Never commit `.env`.**

### 3. Voice check API (optional, large download)

**This step is optional.** The website works without it: the voice check then shows a clearly marked "Demo result", and every other check still runs in the browser. Set it up only to try the real voice detector. Because of its size (the detector model alone is 1.2 GB), the model is not in this repository and is downloaded separately. Our own trained head, `voice detector prototype/models/finetuned/clips_final3.safetensors` (1.9 MB), is included.

The smallest setup (Windows, Python 3.13, about 1.6 GB of downloads with CPU-only PyTorch), from inside `voice detector prototype/`:

```bash
py -3.13 -m venv ..\.venv
..\.venv\Scripts\activate
pip install torch==2.11.0 torchaudio==2.11.0 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements-api.txt
python -c "from huggingface_hub import snapshot_download; snapshot_download('eliya/forensics_0.3B_xlsr_wild_deepfake_classifier', local_dir='models/forensics_xlsr', ignore_patterns=['*.pt'])"
python -c "from huggingface_hub import hf_hub_download as d; [d('facebook/audioseal', f, local_dir='downloads/audioseal') for f in ('detector_base.pth', 'generator_base.pth')]"
python -m app.api --site ..
```

The last line starts the voice checker and also serves the website. It loads in about a minute; then open http://127.0.0.1:7861 and try "Sample voice message" on the Check anything screen, or add your own recording. On a CPU each check takes a few seconds; with an NVIDIA GPU (use `/whl/cu128` instead of `/whl/cpu`, about 2.8 GB) it takes about 0.3 s. **To have everything at once** (the server's sign-in and Family passphrase as well as the live voice check), keep the server from step 2 running too and open http://localhost:3000 instead: the website there reaches the voice API on its own. The API only accepts calls from the website's own addresses. The full steps, tests and evaluation are in [voice detector prototype/README.md](voice%20detector%20prototype/README.md) (`requirements.txt` there also installs the TTS voices and evaluation tools).

## Booth setup

At the booth, visitors use their own phones. They scan the poster's QR code (the Vercel site), and the voice check reaches the team laptop through an ngrok tunnel. From inside `voice detector prototype/`:

```bash
powershell -ExecutionPolicy Bypass -File app\start_booth.ps1
```

- The tunnel's address is `$PublicDomain` in `start_booth.ps1`, and the same address is `voiceApiPublic` in `js/data/analyser.js`. Put the Vercel link in `$VercelSite` so the API accepts calls from it.
- Keep the laptop **plugged in, online and awake, with the lid open**, all event. Closing the lid pauses it.
- Use the poster's QR code, not Vercel's own QR code, which is a login link.

## Testing

| Part | Command (from the repo root) | What it covers |
|---|---|---|
| Server | `cd server && npm install && npm test` | Risk scorer, API, sign-in, languages (the translation test catches missing Chinese or Malay words) |
| Text detector | `cd "text detector prototype" && npm test` | The red-flag rules in all three languages |
| Image AI label check | `cd "image detector prototype" && node --test "tests/*.test.js"` | Reading labels from JPEG, PNG and WebP, the verdict rules, "never real" |
| Voice detector | `cd "voice detector prototype" && ..\.venv\Scripts\python -m pytest tests` | The detector, calibration and API |

Each detector also has an evaluation you can rerun. See its README for the commands and its `docs/` for written-up results.

## Demo script

1. **Sign in:** **Fill in for me (demo)**, as a customer or as bank staff. With the server running, the demo accounts are `customer01` / `Demo#Cust01` and `staff01` / `Demo#Staff01`.
2. **Transfer:** go to `#risk-scorer`, pick **"Grandson" in trouble with the police**, check the risk (High), then take the kopi break (`#pause-verify`). With the server running, sign in as staff to see the new case.
3. **Check anything:** go to `#analyser` and try the sample message, the sample screenshot and the sample voice message.
   - For the AI label check, add a picture saved **straight from** an AI tool (ChatGPT, Gemini), or sent **as a document**. A picture sent as a normal WhatsApp photo has usually lost its labels.
4. **Reset:** add `#reset` to the end of the address to clear the whole demo and go back to sign in. Text size and language are kept.

## Accessibility and languages

- On phones, the **Menu** button (top left, and in the bottom bar) opens the menu. **Language, text size (A / A+ / A++) and Read aloud** are the first things in it. Tablets and desktops have them in the top bar.
- Results always use an icon and words, never colour alone. Every screen has one heading for screen readers.
- **English / 中文 / Bahasa Melayu**: the choice applies straight away and is remembered on the device. Read aloud uses a voice in the chosen language, or English if the device has none.
- Translated: every customer screen except Is the caller a real person? and Family passphrase. The staff console is English only.
- The Chinese and Malay were drafted with AI help and still need a native speaker to check them. To translate a screen, see "How to translate your screen" in [TEAM-FILES.md](TEAM-FILES.md).

## Privacy and safety

- **Made-up data only.** No real customers, accounts or transactions.
- **Checks run on the device.** Messages, pictures and documents are never uploaded.
  - The libraries for reading pictures and PDFs and for checking content credentials load from jsDelivr; only the libraries are downloaded.
  - A voice recording goes only to our own voice API, which deletes it straight after checking.
- **No paid AI services**, and no real people's voices or faces in our training or test data. Datasets and models are open and cited, and their weights and data are never committed.
- **The database stores sign-in only**, with hashed passwords. Secrets live in `server/.env`, which is git-ignored.

## Limitations

These are prototypes, with these limits:

- **Messages:** hand-written rules miss reworded or new scams (about 4 in 10 scam texts in our test data) and can flag real business messages with links. See `text detector prototype/docs/evaluation.md`.
- **Voice:** results differ by source and by clean or phone audio, and are not real-world findings. See `voice detector prototype/docs/eval_results.md`. The live check needs the voice API (the team laptop at the booth, or step 3 of Setup).
- **Pictures:** the AI label check finds labels, not AI. WhatsApp, screenshots and scammers remove the labels, and Google's SynthID watermark can't be checked here. It was tested on our own test images, not yet on real AI pictures sent between phones. See `image detector prototype/docs/eval_results.md` and the phone test in `docs/phone_test.md` there.
- **Reading words in pictures** uses English only, so Chinese text in a screenshot may not be read.
- **Server:** risk cases are kept in memory, and Family passphrase doesn't work on the Vercel site.

## Project structure

| Path | What is in it |
|---|---|
| `index.html` | The one page. It links every file below. |
| `css/` | `base.css` and `clarity.css` (shared), and `features/` (one file per feature) |
| `js/core/` | Shared code: router, state, helpers, accessibility, languages, who may open what |
| `js/data/` | Made-up data and the words (in three languages) for each feature |
| `js/features/` | One file per feature, each inside its own `(function () { ... })();` |
| `server/` | Express server: sign-in, risk API, passphrase API, and their tests |
| `database/` | Supabase setup (sign-in tables) |
| `docs/` | Risk scorer design and API |
| `text detector prototype/` | The red-flag message checker (JavaScript, runs in the browser) |
| `image detector prototype/` | The AI label check for pictures (JavaScript, runs in the browser), with its demo, tests and evaluation |
| `voice detector prototype/` | The deepfake voice checker (Python) and its API |
| `android-call-preview/` | Standalone page: the Android warning when a reported number calls |

## Team

Each person owns their own files, on their own branch, merged into `main` by pull request. See **[TEAM-FILES.md](TEAM-FILES.md)** for every file's owner and the team rules.

| Person | Features |
|---|---|
| Jiliana | Sign in, Pause and check, Learn the signs, Family passphrase (and its API) |
| Aydan | Check anything (analyser); the text, voice and image detector prototypes; Android call preview; Coming soon screens |
| Jose | Transfer risk scorer (and its API), Report a scam, Freeze my accounts, `matchCall()`, languages, the server |
| Yan Lin | Customer home, Is the bank really calling?, Is the caller a real person?, Evidence checker (screenshots and documents) |
| Wei Ye | Staff console and overview, sign-in server and database (Supabase), who may open which screen |

## Credits

- Libraries: [Express](https://expressjs.com) and [Supabase](https://supabase.com) (server); [Tesseract.js](https://github.com/naptha/tesseract.js) and [PDF.js](https://mozilla.github.io/pdf.js/) (reading words); [@contentauth/c2pa-web](https://github.com/contentauth/c2pa-js) (content credentials).
- Every model, dataset and library each detector uses is listed with its licence in that detector's `CITATIONS.md` (or in its README's Credit section).
- Problem statement: OCBC Innovation Challenge PS3. Course: Full Stack Development Project, Ngee Ann Polytechnic.
