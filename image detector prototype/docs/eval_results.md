# Image check: evaluation results

## Run 1 (17 Nov 2026): the metadata and content-credentials check

**What was run.**
- `tests/make_fixtures.py` made 19 test images.
- `eval/build_eval_set.py` sent each one through six simulated messaging-app conditions (`degrade/messaging.py`), giving 114 files.
- `node eval/run_eval.js` scored them. Node reads content credentials but does not check their signature.
- Separately, the 19 originals were checked in the browser demo, where Adobe's C2PA library also checks the signature.

**Test set (19 pictures, all drawn test patterns marked "TEST PICTURE"; no real AI images, no photos of people):**

| Source | Pictures | What they carry |
|---|---|---|
| `made_label` | 8 | Labels written the way AI tools write them: the IPTC "made by AI" label in XMP (JPEG, PNG, WebP), the "changed with AI" label, Stable Diffusion / ComfyUI settings (PNG notes, EXIF comment), and the tool name "Midjourney" in EXIF Software |
| `made_c2pa` | 4 | Content credentials we signed with the C2PA **test** certificate: made with AI (JPEG, PNG), changed with AI, and taken by a camera (no AI) |
| `public_c2pa` | 3 | Official C2PA test photos (Adobe, Truepic): real credentials that don't mention AI, one with a deliberately broken signature |
| `control` | 4 | No AI label: no details at all, PNG, camera EXIF, "Adobe Photoshop" in EXIF |

**Conditions.**
- `document`: sent as a file, bytes untouched.
- `whatsapp_like`: 1600 px, JPEG quality 70.
- `telegram_like`: 1280 px, JPEG quality 87.
- `screenshot`: the picture on a phone screen, saved as PNG.
- `crop_recompress`: the middle 80%, JPEG quality 85.
- `keep_details`: re-saved as JPEG with the EXIF and XMP copied over.

The sizes and qualities are **our assumptions, not measured from the apps**. Apart from `keep_details`, every re-save drops all details, as we assume the apps do.

### Results by condition (Node, signature not checked)

| Condition | AI label found (made with AI) | AI label found (changed with AI) | False alarms (no label) | "Be careful" on no-label pictures |
|---|---|---|---|---|
| document | 9/9 (100%) | 2/2 (100%) | 0/8 (0%) | 0/8 (0%) |
| whatsapp_like | 0/9 (0%) | 0/2 (0%) | 0/8 (0%) | 0/8 (0%) |
| telegram_like | 0/9 (0%) | 0/2 (0%) | 0/8 (0%) | 0/8 (0%) |
| screenshot | 0/9 (0%) | 0/2 (0%) | 0/8 (0%) | 0/8 (0%) |
| crop_recompress | 0/9 (0%) | 0/2 (0%) | 0/8 (0%) | 0/8 (0%) |
| keep_details | 5/9 (56%) | 1/2 (50%) | 0/8 (0%) | 0/8 (0%) |

### Results by source (Node)

Pictures **with** an AI label (how often it was still found):

| Source | document | whatsapp_like | telegram_like | screenshot | crop_recompress | keep_details |
|---|---|---|---|---|---|---|
| made_label | 8/8 | 0/8 | 0/8 | 0/8 | 0/8 | 6/8 |
| made_c2pa | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |

Pictures **without** one (false alarms): 0 in every source and condition (control 4, made_c2pa camera 1, public_c2pa 3).

In `keep_details`, the XMP and EXIF labels survive. The PNG settings notes and the content credentials do not, because only EXIF and XMP are copied.

### Originals in the browser (signature checked with `@contentauth/c2pa-web` 0.17.1)

| File | Result | Confidence | Why |
|---|---|---|---|
| ai_c2pa_signed.jpg / .png | likely (HIGH) | high | Credentials say AI; signature valid; signer "C2PA Test Signing Cert" shown as **not confirmed** (test certificate) |
| ai_edit_c2pa_signed.jpg | partial (MEDIUM) | high | Credentials say "changed with AI" |
| camera_c2pa_signed.jpg | unsure | low | Valid camera credentials: mentioned, but not treated as proof the picture is real |
| adobe-20220124-C.jpg | unsure | low | Valid credentials, no AI |
| adobe-20220124-E-sig-CA.jpg | uncertain (MEDIUM, "be careful") | low | Broken signature, correctly caught |
| truepic-20230212-camera.jpg | uncertain (MEDIUM, "be careful") | low | **The current library reports a data-hash mismatch on this official 2023 camera test photo.** c2pa-python 0.39 reports the same. So older or unusual credentials can come out as "be careful" even when nothing was faked. |
| the 12 label and control pictures | same as in Node | same | No credentials, so the library is not loaded |

The first picture with credentials took about 4.5 s, because the 9 MB library downloads once. After that each check took a few milliseconds.

### What this shows
- The checker finds every label format we tested, in JPEG, PNG and WebP, when the file arrives untouched. It never flagged a picture without a label (0 of 8 in every condition).
- **Any re-save that drops the details removes every label.** Our simulated WhatsApp, Telegram, screenshot and crop conditions found 0 of 11. That is by construction (we drop the details), so it shows what the checker does *if* the apps behave like this, not what the apps do.
- Content credentials are the strongest evidence when they are present: a checked signature raises confidence to high. They are also the most fragile: none survived any re-save, because Pillow can't copy them and any change breaks them anyway.
- The checker never says "real". A picture with no label, or with camera credentials, gets "unsure".

### Limits
- **No real AI images were tested.** The labels copy the format that tools are reported to write, so a real ChatGPT, Gemini or Meta AI image may differ. The phone test (`docs/phone_test.md`) is the next step and uses the team's own AI images.
- **The messaging-app conditions are assumptions.** One public source (Lumethic, Jul 2026) says WhatsApp strips metadata on a normal photo send and keeps it when sent as a document. We haven't tested this.
- 19 pictures is a tiny set. The rates above describe these files, not the real world.
- Labels that aren't signed can be removed by anyone (and added by anyone). A scammer who strips them leaves nothing to find. SynthID (Google's hidden watermark) can't be checked here at all.
- Credentials from older tools can read as broken with today's library (the Truepic test photo), which would show "be careful" on a genuine picture.
