# Verify the Caller: who owns which files

Each person only edits **their own files**, on their own branch. Every file also says its owner in its first comment.
Run it with `python -m http.server` in this folder, then open http://localhost:8000.

## Jiliana

| File | What it is |
|---|---|
| `js/features/login.js` | Sign in (working, moved from the theme samples) |
| `js/features/pause-verify.js` | Pause and check the caller: `#pause-verify` (stub) |
| `js/features/learn-signs.js` | Learn the signs: `#learn-signs` (stub) |
| `js/features/passphrase.js` | Family passphrase: `#passphrase` (stub) |
| `js/data/login.js`, `js/data/pause-verify.js`, `js/data/learn-signs.js`, `js/data/passphrase.js` | Made-up data |
| `css/features/login.css`, `css/features/pause-verify.css`, `css/features/learn-signs.css`, `css/features/passphrase.css` | Styles |

## Aydan

| File | What it is |
|---|---|
| `js/features/analyser.js` | Message and Call Analyser: `#analyser` (stub) |
| `js/features/coming-soon.js` | One "Coming soon" screen for `#my-reports`, `#help`, `#staff-trends`, `#staff-scam-types`, `#staff-settings` (working) |
| `js/data/analyser.js`, `js/data/coming-soon.js` | Made-up data |
| `css/features/analyser.css`, `css/features/coming-soon.css` | Styles |

## Jose

| File | What it is |
|---|---|
| `js/features/risk-scorer.js` | Transfer risk scorer: `#risk-scorer` (stub) |
| `js/features/report.js` | Report a scam: `#report` (stub) |
| `js/features/freeze.js` | Freeze my accounts: `#freeze` (stub) |
| `js/features/call-match-logic.js` | `matchCall()` only, no screen (stub). **Yan Lin's screen uses it: keep its name, inputs and return shape.** |
| `js/data/risk-scorer.js`, `js/data/report.js`, `js/data/freeze.js`, `js/data/call-match-logic.js` | Made-up data (the fake OCBC outbound call list goes in `call-match-logic.js`) |
| `css/features/risk-scorer.css`, `css/features/report.css`, `css/features/freeze.css`, `css/features/call-match-logic.css` | Styles |

## Yan Lin

| File | What it is |
|---|---|
| `js/features/call-match.js` | Is the bank really calling?: `#call-match` (stub). Uses Jose's `matchCall()`. |
| `js/features/evidence-checker.js` | Evidence checker: `#evidence` (stub) |
| `js/features/customer-home.js` | Customer home: `#customer` (working, moved from the theme samples) |
| `js/data/call-match.js`, `js/data/evidence-checker.js`, `js/data/customer-home.js` | Made-up data |
| `css/features/call-match.css`, `css/features/evidence-checker.css`, `css/features/customer-home.css` | Styles |

## Wei Ye

| File | What it is |
|---|---|
| `js/features/triage-console.js` | Staff overview `#staff` (working), case queue `#staff-queue` (stub), case detail `#staff-case/<ref>` (stub) |
| `js/core/access.js` | Who may open which screen |
| `js/data/triage-console.js` | Made-up data |
| `css/features/triage-console.css` | Styles |

## Shared: ask the team before changing

| File | What it is |
|---|---|
| `index.html` | Already links every file above. Nobody should need to edit it. |
| `css/base.css`, `css/clarity.css` | Shared styles and the Clarity theme |
| `js/core/helpers.js` | `icon()`, `badge()`, `RESULTS`, brand, menus, `customerPageHtml()`, `staffPageHtml()`, `stubHtml()` |
| `js/core/state.js` | `appState`, `signIn()`, `signOut()`, `resetState()` |
| `js/core/a11y.js` | Text size, read aloud, focus to heading, skip link |
| `js/core/router.js` | `registerRoute()`, drawing screens, `#reset` |

## Rules for everyone

- Build your screens inside your feature file's `(function () { ... })();` so your names stay private.
- Put your made-up data inside your data file's one `..._DATA` name.
- Store anything your feature remembers as `appState.<your-feature>`. `#reset` clears it.
- Use Clarity's CSS variables (`var(--red)`, `var(--surface)`, ...), never new colour codes.
- Show results with icon + words (`badge()`), never colour alone. Give every screen one `<h1 tabindex="-1">`.
- Mark what Read aloud should read with `data-read`.
- Visit `#reset` to clear the demo and go back to sign in.
