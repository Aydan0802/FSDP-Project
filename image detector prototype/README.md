# Image check prototype

The "is this picture labelled as AI?" check for the "Check anything" screen. It looks inside an image file for the labels that AI tools leave:

- **content credentials (C2PA):** a signed record of how the picture was made;
- **the IPTC "made by AI" label**;
- **image-generator settings** saved by Stable Diffusion tools;
- **AI tool names** in the file's details.

It runs **in the browser**, so it works on the Vercel website, and the picture never leaves the phone. It is one risk signal, never a scam verdict. Background and the options we considered: `docs/research.md`. Part of the OCBC PS3 project (`../PROJECT_CONTEXT.md`).

**What it can't do.** It finds labels, not AI. Most pictures lose their labels when sent through WhatsApp or screenshotted, and a scammer can remove them, so **"no label found" means unknown, never "real"**. It can't read Google's SynthID watermark. Measured results and limits are in `docs/eval_results.md`.

## Try the demo

Browsers block the C2PA library on pages opened straight from a file, so serve this folder locally (from inside `image detector prototype/`):

```bash
../.venv/Scripts/python.exe -m http.server 8810 --bind 127.0.0.1
```

Then open http://127.0.0.1:8810/demo/ and choose a picture. (In the Claude app this is the `image-demo` entry in `../.claude/launch.json`.) The first picture that has content credentials downloads Adobe's C2PA library from jsDelivr (about 9 MB, once).

## Check a file from the command line

```bash
node detector/cli.js path/to/picture.jpg
```

The command line doesn't check content-credential signatures (only the browser does), so it shows confidence one level lower for credentials.

## How it works

| File | What it does |
|---|---|
| `detector/metadata.js` | Walks the file's blocks (JPEG segments, PNG chunks, WebP chunks), keeps the "details" blocks (EXIF, XMP, PNG text, C2PA) and finds AI labels in them. No libraries. |
| `detector/checker.js` | Decides: the first rule that matches wins (credentials, then IPTC label, then generator settings, then tool name, then "unsure"). Gives the verdict, band, website result key, confidence and reasons. |
| `detector/c2pa.js` | Browser only. Checks a content credential's signature with Adobe's open-source `@contentauth/c2pa-web` (pinned 0.17.1, loaded from jsDelivr only when the file has credentials). |
| `demo/index.html` | Upload-only demo page. |

The result looks like this (same idea as the voice detector):

```js
{ verdict: "Made with AI (its content credentials say so)",
  result: "likely",          // the website's keys: likely | partial | uncertain | unsure (never "real")
  band: "HIGH",              // HIGH | MEDIUM | INCONCLUSIVE
  likelihood_pct: null,      // a label is a yes/no finding, not a calibrated chance
  confidence: "high",        // high | medium | low: drops one level per weakness
  reasons: [{ key: "c2pa_ai", tool: "..." }, { key: "c2pa_signed", signer: "...", trusted: false }, { key: "not_proof" }],
  text: ["The picture's content credentials say it was made with AI ...", ...],
  details: { format, blocks, c2pa, labels, generator, toolNames } }
```

Reasons come as short codes (like the voice API), so the website can word them in English, Chinese or Malay. The English wording is in `REASON_TEXT` in `detector/checker.js`.

## On the website

It is connected. `index.html` loads `detector/metadata.js`, `detector/checker.js` and `detector/c2pa.js` (in that order), and Yan Lin's `EVIDENCE_CHECKER.check()` (`js/features/evidence-checker.js`) runs `ImageDetector.checkFile(file)` on every picture, at the same time as reading its words.
- Risky words lead the result, and any AI label shows under the headline ("About the picture itself").
- Harmless or unreadable words plus an AI label: the label leads.
- No label found changes nothing.

The reasons are translated in `js/data/evidence-checker.js` (`ev.img.*` keys).

To avoid the CDN, host the two `@contentauth/c2pa-web@0.17.1` files yourself and change the two web addresses at the top of `c2pa.js`.

## Tests and evaluation

```bash
node --test "tests/*.test.js"                         # 16 tests; the last needs the test images
../.venv/Scripts/python.exe tests/make_fixtures.py    # make 19 test images in data/fixtures/
../.venv/Scripts/python.exe -m eval.build_eval_set    # send them through 6 messaging-app conditions
node eval/run_eval.js                                 # results/eval/: scores.csv, summary.md
```

`make_fixtures.py` needs `c2pa-python` (`pip install -r requirements.txt`) and these small downloads, about 2.5 MB in total:

```bash
mkdir -p downloads/c2pa_test_certs downloads/c2pa_public_testfiles
curl -L -o downloads/c2pa_test_certs/es256_certs.pem https://raw.githubusercontent.com/contentauth/c2pa-python/main/tests/fixtures/es256_certs.pem
curl -L -o downloads/c2pa_test_certs/es256_private.key https://raw.githubusercontent.com/contentauth/c2pa-python/main/tests/fixtures/es256_private.key
for f in adobe-20220124-C.jpg adobe-20220124-E-sig-CA.jpg truepic-20230212-camera.jpg; do curl -L -o downloads/c2pa_public_testfiles/$f https://raw.githubusercontent.com/c2pa-org/public-testfiles/main/legacy/1.4/image/jpeg/$f; done
```

The test certificate is the C2PA project's public test key: it is trusted by no one, which is the point.

Next step: the phone test in `docs/phone_test.md`, to measure what WhatsApp and Telegram really do.

## Not in git

`data/`, `downloads/`, `results/` (see `.gitignore`). Regenerate them with the commands above.
