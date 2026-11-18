# Citations: image check prototype

Everything the image check uses, with its licence. Nothing here is committed to git except our own code and these notes.

## Libraries

| Name | Source | Licence | Used for |
|---|---|---|---|
| `@contentauth/c2pa-web` 0.17.1 (Adobe / Content Authenticity Initiative) | https://github.com/contentauth/c2pa-js, loaded from https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@0.17.1/ | MIT | Checking content-credential signatures in the browser (`detector/c2pa.js`) |
| `c2pa-python` 0.39.0 (Content Authenticity Initiative) | https://pypi.org/project/c2pa-python/ | MIT OR Apache-2.0 | Signing our test images with the C2PA test certificate (`tests/make_fixtures.py` only) |
| Pillow 12.3 | https://python-pillow.org | MIT-CMU (HPND) | Drawing test images and the messaging-app conditions (`tests/`, `degrade/`) |
| Node.js 24 (built-in `node:test`, `fs`) | https://nodejs.org | MIT | Command line, tests, evaluation |
| jsDelivr CDN | https://www.jsdelivr.com | Free public CDN | Serving the C2PA library to the browser |

## Test data

| Name | Source | Licence | Used for |
|---|---|---|---|
| C2PA public test files: `adobe-20220124-C.jpg`, `adobe-20220124-E-sig-CA.jpg`, `truepic-20230212-camera.jpg` | https://github.com/c2pa-org/public-testfiles (`legacy/1.4/image/jpeg/`) | CC-BY-SA-4.0 | Real content credentials that don't mention AI, one with a broken signature (evaluation only, not redistributed) |
| C2PA test signing certificate and key (`es256_certs.pem`, `es256_private.key`) | https://github.com/contentauth/c2pa-python (`tests/fixtures/`) | MIT OR Apache-2.0 (repository licence) | Signing our test images. A public test key that nobody trusts. |
| Our 16 drawn test pictures | Made by `tests/make_fixtures.py` | Ours | Test pictures carrying each kind of label |

## Standards and references

| Name | Source | Used for |
|---|---|---|
| IPTC Digital Source Type vocabulary (`trainedAlgorithmicMedia`, `compositeWithTrainedAlgorithmicMedia`, `digitalCapture` ...) | https://cv.iptc.org/newscodes/digitalsourcetype/ | The "made by AI" label the checker looks for |
| C2PA specification 2.2 | https://c2pa.org/specifications/ | What content credentials contain and how they are stored in JPEG, PNG and WebP |
| "What happens to Content Credentials on social platforms", Lumethic (13 Jul 2026, updated 13 Aug 2026) | https://www.lumethic.com/en/articles/content-credentials-social-media-platforms | Report that WhatsApp strips metadata on a normal photo send and keeps the file when sent as a document (method not stated; to be checked by our phone test) |
| Vercel Functions limits | https://vercel.com/docs/functions/limitations | Size limits in `docs/research.md` |

Other models and datasets considered but **not used** are listed with their licences in `docs/research.md`.
