# Pause & Prove

A student prototype for OCBC's Digital Trust challenge (FSDP, Ngee Ann Polytechnic), built for **seniors in
Singapore**. It helps a customer stop and check before an AI-voice or impersonation scam costs them money.
Bank staff get a view-only console of flagged activity.

Plain HTML, CSS and JavaScript (no build step), with a small Express server for sign-in, the transfer risk API
and family passphrases. **Not a real OCBC service. All data is made up.**

## What it does

| Screen | Address | What the customer can do |
|---|---|---|
| Home | `#customer` | "Need help right now?" card, then the check and be-ready tools |
| Someone is calling me now | `#calling-now` | One calm instruction per screen: hang up, then what to do next |
| Is the bank really calling? | `#call-match` | Type the number that called; it is checked against the calls OCBC really made |
| Is the caller a real person? | `#caller-check` | Read the caller a one-time code; a bot can't finish the picture check |
| Check anything | `#analyser` | Paste a message, add a screenshot, document or voice recording, and get a result |
| Check a transfer | `#risk-scorer` | Risk score before sending money (needs sign-in) |
| Pause and check | `#pause-verify` | The "kopi break" after a risky transfer |
| Freeze my accounts | `#freeze` | One big button, then call OCBC |
| Report a scam | `#report` | A short form with a report number (needs sign-in) |
| Family passphrase | `#passphrase` | A secret word only the family knows (needs sign-in) |
| Learn the signs | `#learn-signs` | Four signs of a scam call and a practice question |
| Staff console | `#staff`, `#staff-queue` | Overview, flagged activity and case detail (sign in as bank staff) |

Urgent tools (calling now, freeze, the checks) work **without signing in**.

## Team

Each person owns their own files. See **[TEAM-FILES.md](TEAM-FILES.md)** for the full list and the team rules.

| Person | Features |
|---|---|
| Jiliana | Sign in, Pause and check, Learn the signs, Family passphrase (and its API) |
| Aydan | Check anything (analyser), text detector and voice detector prototypes, Coming soon screens |
| Jose | Transfer risk scorer (and its API), Report a scam, Freeze my accounts, `matchCall()`, languages, the server |
| Yan Lin | Customer home, Is the bank really calling?, Is the caller a real person?, Evidence checker |
| Wei Ye | Staff console, sign-in server and database (Supabase), who may open which screen |

## Run it

**Option 1: website only.** From this folder:

```
python -m http.server
```

Open http://localhost:8000. Without the server, sign-in runs in demo mode (any details work) and the risk
scorer scores on the device with the same code. Family passphrase needs the server (option 2).

**Option 2: with the server.** Needs Node.js 18 or newer:

```
cd server
npm install
npm start
```

Open http://localhost:3000. The same website, plus sign-in (`/api/auth`), the risk API (`POST /api/risk/score`,
`GET /api/risk/cases`, details in [docs/risk-scorer.md](docs/risk-scorer.md)) and the passphrase API
(`/api/passphrases`).

- **Database (optional):** without `server/.env` the server uses six built-in demo accounts. To use Supabase,
  copy `server/.env.example` to `server/.env` and follow [database/README.md](database/README.md).
  Never commit `.env`.
- **Voice check (optional):** the analyser sends recordings to a local Python API. See
  [voice detector prototype/README.md](voice%20detector%20prototype/README.md). Without it, the analyser shows
  a demo result.

## Tests

```
cd server
npm test
```

Runs the risk scorer, API, sign-in and language tests. The text detector has its own tests (see its README).

## Demo

Sign in with **Fill in for me (demo)**, as a customer or as bank staff. With the server running, the demo
accounts are `customer01` / `Demo#Cust01` and `staff01` / `Demo#Staff01`.

A good customer demo: `#risk-scorer`, pick **"Grandson" in trouble with the police**, check the risk (High),
take the kopi break (`#pause-verify`). With the server running, sign in as staff to see the new case.

**`#reset`**: type it at the end of the address to clear the whole demo and go back to sign in. It keeps the
text size and language, which are saved on the device.

## Accessibility and languages

- On phones, the **Menu** button (top left, and in the bottom bar) opens the menu. **Language, text size
  (A / A+ / A++) and Read aloud** are the first thing in it. Tablets and desktops have them in the top bar.
- Results always use an icon and words, never colour alone.
- **English / 中文 / Bahasa Melayu**: the choice applies straight away and is remembered on the device. Read
  aloud uses a voice in the chosen language, or English if the device has none.
- Translated: every customer screen except Is the caller a real person? and Family passphrase. The staff
  console is English only. The Chinese and Malay were drafted with AI help and still need a native speaker to
  check them. To translate a screen, see "How to translate your screen" in [TEAM-FILES.md](TEAM-FILES.md).

## Folders

| Folder | What is in it |
|---|---|
| `index.html` | The one page. It links every file below. |
| `css/` | `base.css` and `clarity.css` (shared), and `features/` (one file per feature) |
| `js/core/` | Shared code: router, state, helpers, accessibility, languages, who may open what |
| `js/data/` | Made-up data and the words for each feature |
| `js/features/` | One file per feature, each in its own `(function () { ... })();` |
| `server/` | Express server: sign-in, risk API, passphrase API, and its tests |
| `database/` | Supabase setup (sign-in tables) |
| `docs/` | Risk scorer design and API |
| `text detector prototype/` | The red-flag message checker the analyser uses (runs in the browser) |
| `voice detector prototype/` | The deepfake voice checker (Python), for the voice check |
