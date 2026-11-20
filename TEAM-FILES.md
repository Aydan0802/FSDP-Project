# Pause & Prove: who owns which files

Each person only edits **their own files**, on their own branch. Every file also says its owner in its first comment.
Run it with `python -m http.server` in this folder, then open http://localhost:8000 (see [README.md](README.md)).

## Jiliana

| File | What it is |
|---|---|
| `js/features/login.js` | Sign in and sign up: `#login`, `#login/signup`, `#staff-login` (uses Wei Ye's server sign-in) |
| `js/features/pause-verify.js` | Pause and check after a risky transfer: `#pause-verify` |
| `js/features/learn-signs.js` | Learn the signs: `#learn-signs` |
| `js/features/passphrase.js` | Family passphrase: `#passphrase` |
| `server/passphrases.js` | Passphrase API (`/api/passphrases`), stores each word hashed |
| `js/data/login.js`, `js/data/pause-verify.js`, `js/data/learn-signs.js`, `js/data/passphrase.js` | Made-up data and words |
| `css/features/login.css`, `css/features/pause-verify.css`, `css/features/learn-signs.css`, `css/features/passphrase.css` | Styles |

## Aydan

| File | What it is |
|---|---|
| `js/features/analyser.js` | Check anything (message, picture, document, voice): `#analyser` |
| `js/features/coming-soon.js` | One "Coming soon" screen for `#my-reports`, `#help`, `#staff-trends`, `#staff-scam-types`, `#staff-settings` |
| `js/data/analyser.js`, `js/data/coming-soon.js` | Made-up data and words |
| `css/features/analyser.css` | Styles |
| `text detector prototype/` | The red-flag message checker the analyser loads |
| `voice detector prototype/` | The deepfake voice checker (Python API) for voice recordings |
| `image detector prototype/` | The AI label check for pictures (content credentials, IPTC "made by AI"); Yan Lin's evidence checker runs it |
| `android-call-preview/` | Android call warning preview (standalone page, see its README) |

## Jose

| File | What it is |
|---|---|
| `js/features/risk-scorer.js`, `js/features/risk-scorer-logic.js` | Transfer risk scorer: `#risk-scorer`, and the scoring itself |
| `js/features/report.js` | Report a scam: `#report` |
| `js/features/freeze.js` | Freeze my accounts: `#freeze` |
| `js/features/call-match-logic.js` | `matchCall()` only, no screen. **Yan Lin's screen uses it: keep its name, inputs and return shape.** |
| `js/core/i18n.js` | Languages: `t()`, `setLanguage()`, `getLanguage()`, `addTranslations()`. Everyone uses it; see "How to translate your screen" below. |
| `server/server.js`, `server/app.js` | Starts the server; the risk API (`/api/risk/score`, `/api/risk/cases`) |
| `server/test/risk-scorer.test.js`, `server/test/i18n.test.js` | Tests |
| `js/data/risk-scorer.js`, `js/data/report.js`, `js/data/freeze.js`, `js/data/call-match-logic.js` | Made-up data and words (the fake OCBC outbound call list is in `call-match-logic.js`) |
| `css/features/risk-scorer.css`, `css/features/report.css`, `css/features/freeze.css` | Styles |
| `docs/risk-scorer.md` | Risk scorer design and API |

## Yan Lin

| File | What it is |
|---|---|
| `js/features/customer-home.js` | Customer home and landing page: `#customer` |
| `js/features/call-match.js` | Is the bank really calling?: `#call-match`. Uses Jose's `matchCall()`. |
| `js/features/caller-check.js` | Is the caller a real person? (invite code and picture check): `#caller-check` |
| `js/features/evidence-checker.js` | Screenshots and documents, shown on the analyser screen (no screen of its own): reads the words (Tesseract.js, PDF.js) for the text detector, and runs Aydan's AI label check on pictures |
| `js/data/customer-home.js`, `js/data/call-match.js`, `js/data/caller-check.js`, `js/data/evidence-checker.js` | Made-up data and words |
| `css/features/customer-home.css`, `css/features/call-match.css`, `css/features/caller-check.css` | Styles |

## Wei Ye

| File | What it is |
|---|---|
| `js/features/triage-console.js` | Staff overview `#staff`, flagged activity `#staff-queue`, case detail `#staff-case/<ref>` |
| `js/features/triage-overview.js`, `js/data/triage-overview.js`, `css/features/triage-overview.css` | The staff Overview's panels (daily report, usage, monthly flags, cancelled-after-pause rate) |
| `js/core/access.js` | Who may open which screen |
| `server/auth.js`, `server/db/`, `server/scripts/hash-password.js` | Sign-in and sign-up API (`/api/auth`), Supabase or built-in demo accounts |
| `server/test/auth.test.js` | Tests |
| `database/` | Supabase setup for the sign-in tables |
| `js/data/triage-console.js` | Made-up data |
| `css/features/triage-console.css` | Styles |

## Shared: ask the team before changing

| File | What it is |
|---|---|
| `index.html` | Links every file above. Only edit it to add a new file. |
| `css/base.css`, `css/clarity.css` | Shared styles and the Clarity theme |
| `js/core/helpers.js` | `icon()`, `badge()`, `RESULTS`, brand, menus (top bar, bottom bar, sidebar), `customerPageHtml()`, `staffPageHtml()`, `stubHtml()` |
| `js/core/state.js` | `appState`, `signIn()`, `signOut()`, `resetState()` |
| `js/core/a11y.js` | Text size, read aloud, focus to heading, skip link |
| `js/core/router.js` | `registerRoute()`, drawing screens, the Back button, `#reset` |
| `js/features/calling-now.js`, `js/data/calling-now.js`, `css/features/calling-now.css` | Someone is calling me now: `#calling-now` |

## Rules for everyone

- Build your screens inside your feature file's `(function () { ... })();` so your names stay private.
- Put your made-up data inside your data file's one `..._DATA` name.
- Store anything your feature remembers as `appState.<your-feature>`. `#reset` clears it.
- Use Clarity's CSS variables (`var(--red)`, `var(--surface)`, ...), never new colour codes.
- Show results with icon + words (`badge()`), never colour alone. Give every screen one `<h1 tabindex="-1">`.
- Mark what Read aloud should read with `data-read`.
- Visit `#reset` to clear the demo and go back to sign in.

## How to translate your screen

The language picker (English / 中文 / Bahasa Melayu / தமிழ்) is in the top bar, and in the menu on phones. Most screens
already switch; a screen stays in English until its owner does this. Everything stays in **your own files**:

```js
// 1. js/data/your-feature.js: add your words, with keys that start with your feature's short name
const PAUSE_VERIFY_DATA = { /* ...your data... */ text: { en: { "pv.title": "Pause and check" }, zh: { "pv.title": "先停一停，确认一下" }, ms: { "pv.title": "Berhenti dan semak" }, ta: { "pv.title": "நிறுத்தி, சரிபாருங்கள்" } } };
// 2. js/features/your-feature.js, at the top of your (function () { ... })();
addTranslations(PAUSE_VERIFY_DATA.text);
// 3. In your HTML, use t() instead of the words:   <h1 tabindex="-1">${t("pv.title")}</h1>
```

A word missing in Chinese, Malay or Tamil shows in English, with a warning in the console. Blanks work too:
`t("common.callOcbcNumber", { phone: OCBC_PHONE })`. Copy `js/data/freeze.js` and `js/features/freeze.js` for a full example.
The Chinese, Malay and Tamil need checking by a native speaker before real customers see them.
