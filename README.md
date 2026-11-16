# Verify the Caller

A student prototype for OCBC's Digital Trust challenge, built for **seniors in Singapore**. It helps a customer
spot AI-voice and impersonation scams: check whether the bank is really calling, analyse a message or recording,
check a transfer's risk before sending, freeze accounts and report a scam. Bank staff get a console of flagged
activity. Plain HTML, CSS and JavaScript (no build step), with a small Express server for the transfer risk API.
**Not a real OCBC service. All data is made up.**

## Team

Each person owns their own files. See **[TEAM-FILES.md](TEAM-FILES.md)** for who owns what and the team rules.

| Person | Features |
|---|---|
| Jiliana | Sign in, Pause and verify, Learn the signs, Family passphrase |
| Aydan | Message and call analyser, Coming soon screens |
| Jose | Transfer risk scorer (and its API), Report a scam, Freeze my accounts, `matchCall()`, language switcher |
| Yan Lin | Customer home, Is the bank really calling?, Evidence checker |
| Wei Ye | Staff console, who may open which screen |

## Run it

**Option 1: website only.** From this folder:

```
python -m http.server
```

Open http://localhost:8000. Everything works. The transfer risk scorer can't reach the server, so it scores on
the device with the same code, and says so on the screen.

**Option 2: with the risk API.** Needs Node.js 18 or newer:

```
cd server
npm install
npm start
```

Open http://localhost:3000. The same website, plus `POST /api/risk/score` and `GET /api/risk/cases`
(details in [docs/risk-scorer.md](docs/risk-scorer.md)).

## Tests

```
cd server
npm test
```

This runs the risk scorer and API tests, and the language tests (English fallback, every word translated).

## Demo flow

Sign in with **Fill in demo details** (any ID and password work), as a customer or as bank staff.

| Address | Screen |
|---|---|
| `#customer` | Customer home |
| `#calling-now` | Someone is calling me now (step by step) |
| `#call-match` | Is the bank really calling? |
| `#analyser` | Check a message, call or picture |
| `#risk-scorer` | Check a transfer before you send it |
| `#pause-verify` | Pause and check, after a risky transfer |
| `#freeze` | Freeze my accounts |
| `#report` | Report a scam |
| `#staff` | Staff console (sign in as bank staff) |

A good customer demo: `#risk-scorer`, pick **"Grandson" in trouble with the police**, check the risk (High),
take the kopi break (`#pause-verify`). With the server running (option 2), sign in as staff to see the new case.

**`#reset`**: visit it (type it at the end of the address) to clear the whole demo and go back to sign in.
It keeps the text size and language choices, which are saved on the device.

## Languages

The customer header has **English / 中文 / Bahasa Melayu** buttons. The choice applies straight away, and it is
remembered on the device, through reloads and `#reset`. Read aloud uses a voice in the chosen language; if the
device has none, it reads in English and says so.

So far the header, menu and Jose's screens (risk scorer, report, freeze) are translated. The other screens are
still in English. To translate a screen, see "How to translate your screen" in [TEAM-FILES.md](TEAM-FILES.md).
The Chinese and Malay were drafted with AI help and still need a native speaker to check them.
