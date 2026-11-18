# Image detector: research notes (17 Nov 2026)

Goal: check an image attached to a message (WhatsApp, Telegram) and estimate whether it is AI-generated, giving the same kind of answer as the voice detector (calibrated chance, band, confidence, reasons). It is one risk signal, never a scam verdict.

**How this was researched.** Model cards and file lists were read through the public Hugging Face API, and licences through the GitHub API. **Nothing was downloaded or run.** All accuracy figures are the authors' own claims. Web search hit its usage limit partway through, so the points marked *(unverified)* still need checking.

## 1. Detector shortlist

Size is the weights file. "Safetensors" means the weights can be loaded without pickle.

| Model | Licence | Size | Safetensors | Trained on | Notes |
|---|---|---|---|---|---|
| **Community Forensics ViT-S/16 384** `OwensLab/commfor-model-384` (Park & Owens, CVPR 2025) | MIT | 87 MB | yes | 2.7M images from 4,803 generators | Peer-reviewed. Plain ViT-Small: resize the short edge to 440, **centre crop** 384, one logit. Needs the authors' code from GitHub (`JeongsooP/Community-Forensics`, MIT). |
| Same model, repackaged for `transformers` `buildborderless/CommunityForensics-DeepfakeDet-ViT` | MIT | 87 MB | yes | as above | Loads with `ViTForImageClassification`, no custom code. **Its card says the weights and config were wrong before 22 Jul 2026**, so check its tensors against the OwensLab file before trusting it. |
| Frontier fine-tune `Thermostatic/community-forensics-frontier-detector-2026-08` | MIT | 87 MB | yes | 109,560 images (41k real: COCO, LAION, Pexels, ImageNet, WikiArt; 68k fake from 131 sources including GPT Image, FLUX, Imagen 4, Seedream, Midjourney) | One person's fine-tune, not peer-reviewed. Publishes its failed robustness tests. Calibrator included. In Smaug's benchmark table (vendor numbers) it flags 16.4% / 6.6% / 17.7% of real photos (Reddit / OpenFake / CommFor). |
| **Low-quality fine-tune** `Thermostatic/community-forensics-low-quality-detector-2026-08` | MIT | 87 MB | yes | Same data, plus training on downscaling to 32–256 px, JPEG/WebP recompression, blur and noise, applied to real and fake alike | Closest match to images forwarded on messaging apps. Self-reported fake recall: 0.93 at 256 px, 0.58 at 128 px with JPEG quality 30, **0.24** after multiple JPEG/WebP passes at 64 px. Fails "5% synthetic patch in a real photo" (recall 0.05). Not tested on screenshots. |
| **Smaug-AI-Image-Detector** `abacusai/Smaug-AI-Image-Detector` (Oct 2026) | Apache-2.0 (base `google/embeddinggemma-2` is also Apache-2.0) | 877 MB | yes | **Not disclosed.** Card says it was trained with resizing, recompression, blur and hard-negative professional photos | Self-reported best open detector: AUC 0.973 on OpenFake Reddit (real shared images), 3.0% of real Reddit photos flagged. Its 62-line loader (read) uses three **deterministic** 528 px crops and averages their logits. Needs the new package `sentence-transformers`; not yet checked against our `transformers 5.22`. |
| `Ateeqq/ai-vs-human-image-detector` (SigLIP) | Apache-2.0 | 372 MB | yes | 60k AI + 60k human images | Its own card notes users report overfitting. Smaug's table: 27–40% of real photos flagged. Weak baseline only. |
| `Organika/sdxl-detector` (Swin) | CC-BY-NC-3.0 | 348 MB | yes | Wikimedia vs SDXL pairs | SDXL only. Weak baseline. |
| `umm-maybe/AI-image-detector` | Card text says CC-BY-ND-4.0, tag says CC-BY-4.0 | 348 MB | no (`.bin`) | AI art, Oct 2022 | Outdated; excluded. |
| `haywoodsloan/ai-image-detector-deploy` (SwinV2) | Apache-2.0 | 781 MB | yes | Not described | No data card; excluded. |
| `Bombek1/ai-image-detector-siglip-dinov2` | MIT | 2.1 GB | **no** (`.pt` pickle) | OpenFake | Excluded by our safetensors rule. |
| `dima806/ai_vs_real_image_detection` and fine-tunes | Apache-2.0 | 343 MB | yes | CIFAKE (32 × 32 px) | Too low resolution to mean anything; excluded. |
| B-Free (GRIP Naples + Google DeepMind, CVPR 2025) `grip-unina/B-Free` | GitHub says NOASSERTION (custom; check) | ? | ? | SD-reconstructed real images | Designed to avoid JPEG/format shortcuts and tested on social-network images. Weights and licence not yet checked. |
| SPAI (CVPR 2025) `mever-team/spai` | Apache-2.0 | ? | ? | spectral learning, any resolution | Weight format not checked. |

## 2. Metadata and watermark checks (layer 1, like AudioSeal for voice)

- **C2PA content credentials:** `c2pa-python` (Apache-2.0, `pip install c2pa-python`, `c2pa.Reader(path).json()`). Its PyPI page says the API is still a pre-release. A valid manifest can say "made with AI" (OpenAI, Adobe Firefly, Google and others sign their images). *(unverified)* Messaging apps re-encode images and probably strip the manifest, so **no manifest means "unknown", not "real"**.
- **EXIF / XMP / PNG text:** Pillow is already installed. The IPTC `DigitalSourceType = trainedAlgorithmicMedia` field marks AI images; per IPTC, Google and Meta use it, while sources disagree on Midjourney. *(unverified)* Stable Diffusion web UIs write the prompt into a PNG text chunk. Metadata is trivial to edit or remove, so it counts only when present.
- **SynthID:** press reports (Oct 2026) say Google's SynthID Detector is now open to everyone as a web portal and through the Gemini app. It only detects content from companies that use SynthID (Google, OpenAI, NVIDIA, Kakao), and its FAQ says it is not a general AI detector. There is **no local or free API we can call**, and uploading users' images to Google would break the "nothing leaves the computer" rule. The app can tell users to check suspect images there themselves.
- **Open watermarks we could test the way we tested AudioSeal:** `invisible-watermark` (MIT; *(unverified)* used by the Stable Diffusion / SDXL reference code; DWT-DCT, likely fragile to JPEG) and Adobe TrustMark (`adobe/trustmark`; GitHub shows its licence as NOASSERTION, so check). Like AudioSeal, each one only finds its own marks.

## 3. Evaluation data

| Data | Licence | Size | Use |
|---|---|---|---|
| Synthbuster (Bammey 2023, Zenodo 10066460) | Zenodo says open; exact licence still to check | 12.4 GB zip | Fakes from 9 generators (DALL·E 2/3, Firefly, Midjourney v5, SD 1.3/1.4/2/XL, GLIDE), prompted from RAISE-1k. Real RAISE-1k photos are downloaded separately (non-commercial research and education). Good, small and per-generator, but over 1 GB, so **ask first**. Thermostatic's models trained on Synthbuster, so report them as "seen". |
| TrueFake (Univ. Trento, IJCNN 2025) | CC-BY-4.0 (repo) | large | Real and fake images **actually shared through Facebook, X and Telegram**: the best real check of our degradation function. Real images include FFHQ faces, so check the licence and prefer the non-face subsets. |
| OpenFake (ComplexDataLab) | CC-BY-NC-4.0 | about 4 TB in total; stream a few hundred rows | Has a Reddit real-world split. Thermostatic, Bombek1 and probably Smaug trained or tuned on it, so it is not unseen for them. |
| Community Forensics Eval (OwensLab) | check | 206 GB | Too large; at most a streamed sample. |
| `Thermostatic/frontier-synthetic-images-2026` | per source | 32 GB | Its own card says it is training-only, not for evaluation. Do not use. |

**Known trap:** "Fake or JPEG?" (Grommelt et al., ECCV-W 2024) shows that benchmarks often store real photos as JPEG and fakes as PNG, so detectors learn the file format instead of the generator. Our harness must give real and fake images **the same** degradation, and report the clean condition with that caveat.

## 4. Recommendation

**Decision (17 Nov 2026):** version 1 is the metadata and content-credentials check only (layer 1 above), built in JavaScript so it runs in the browser on the Vercel site; see `README.md` and `docs/eval_results.md`. The detector model below is left for later because of the deadline.

Use the **Community Forensics family** as the main detector: the original `OwensLab/commfor-model-384` plus the `low-quality` fine-tune as a second head. Both are the same small ViT, MIT, 87 MB each, `.safetensors`, with deterministic centre crops. They can be combined and calibrated exactly like the voice detector's original plus fine-tuned head (`detectors/calibration.py`), which the team can already explain. Add **Smaug** (877 MB) as the comparison model, since it claims the best real-world results but does not disclose its data. Every download is under 1 GB on its own, about 1.05 GB together, so confirm with the user first. Synthbuster (12.4 GB) also needs a yes before downloading.

## 5. Size, and running it in the Vercel website

The team website is static files (HTML/JS) on Vercel; the voice check reaches the team laptop through ngrok. Its "Check a screenshot or document" page (`js/features/evidence-checker.js`, owner Yan Lin) is still a stub. Sizes below come from npm and the model files; anything marked *(estimate)* is untested.

| Option | Runs where | Size | On Vercel? |
|---|---|---|---|
| Metadata and C2PA check in JavaScript: `exifr` (MIT, 0.08 MB) for EXIF/XMP/IPTC, `@contentauth/c2pa-web` 0.17.1 (MIT, 9.2 MB Wasm) for C2PA, PNG text read directly | Visitor's browser | About 9 MB, loaded only when the image check opens | **Yes.** Vercel only serves the files; the image never leaves the phone and the laptop is not needed. |
| Community Forensics ViT-S as ONNX in the browser (`onnxruntime-web` 1.31.1, MIT, 15–30 MB Wasm) | Visitor's browser | Model 87 MB, or about 22 MB at 8-bit *(estimate)*, plus the runtime | Possible: needs conversion to ONNX, a test on real phones, and recalibration (8-bit changes the scores). |
| The same model as a Vercel Python function | Vercel server | Limit 500 MB for Python, 2 GB memory on Hobby | Possible with ONNX Runtime; PyTorch is probably too big *(not checked)*. Uploads the visitor's image to a server, so not recommended. |
| Smaug (877 MB) | Team laptop via ngrok, like the voice check | 877 MB | No. |

How well the metadata check works: a signed C2PA record saying "made by AI" is close to proof that the image is AI-made (not proof of a scam), but finding nothing means unknown. WhatsApp strips metadata on a normal photo send and keeps the file untouched when sent as a document (Lumethic, "What happens to Content Credentials on social platforms", Jul 2026, method not stated). Screenshots, images from models run at home, and images deliberately stripped also carry nothing. So on forwarded scam images it will usually find nothing; measure this with our own phones before quoting a rate.

## 6. Still to check

- Telegram metadata stripping, and our own WhatsApp test (an AI image sent as a photo and as a document). WhatsApp's photo-send stripping is reported but was not tested by us.
- WhatsApp and Telegram resolution limits and JPEG quality (for the degradation function).
- B-Free and SPAI weights and licences; TrustMark licence; Synthbuster licence; Community Forensics Eval licence.
- Whether `transformers 5.22` loads Smaug's `embedding_gemma2` model.
- New packages needed (not installed yet): `timm` or `torchvision` for Community Forensics, `sentence-transformers` for Smaug, `c2pa-python`.
