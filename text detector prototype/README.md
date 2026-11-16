# Text detector prototype ("Check a message")

The real checker behind the analyser's "Check a message" tab. It looks for hand-written red flags (asks for your OTP, threatens your account, a fake-looking link, "guaranteed returns"…) in English, Chinese and Malay, and returns the result the screen already shows. Part of the OCBC PS3 project; background in `../PROJECT_CONTEXT.md`.

It is plain JavaScript with no libraries, no model and no internet calls, so it runs in the browser. Results are **warning signs, not proof**: see `docs/evaluation.md` before quoting any number.

**Run every command below from inside this folder** (`text detector prototype/`). You only need Node.js 18 or newer.

## Try it

```bash
node -e "console.log(require('./detector/checker.js').checkMessage('Your card has been suspended. Tap here to verify your details: card-verify.example'))"
```

## What it returns

`checkMessage(text)` gives the same shape as `ANALYSER_DATA.examples[].result` on the analyser screen:

```js
{
  risk: "high",                 // "low" | "medium" | "high"
  type: "phishing",             // "impersonation" | "phishing" | "parcel" | "job" | "investment" | "love" | "none"
  confidence: "medium",         // "low" | "medium" | "high"  (how sure we are)
  summary: "This looks like a message made to steal your details. ...",
  flags: [ { phrase: "card has been suspended", reason: "A scary threat to make you act fast", rule: "threat" }, ... ],
  lang: "en",                   // extra: the language it thinks the message is in ("en" | "zh" | "ms")
  score: 7                      // extra: the risk points added up
}
```

Each `phrase` is copied exactly from the message, so the screen can highlight it.

## How it works (4 steps, all in `detector/checker.js`)

1. **Find red flags.** Every pattern in `rules.js` (English), `rules_zh.js` (Chinese) and `rules_ms.js` (Malay) is run on the message, and links are checked separately (shortened links, odd endings like `.xyz`, words like "verify" in the address). "Never share your OTP" is skipped, because that is a real bank's advice.
2. **Overlaps.** If two flagged phrases overlap, the stronger one is kept.
3. **Points to risk.** Each rule found adds its points once (1 = small sign, 3 = strong sign). 2+ points = medium. 4+ points **and** the message asks you to do something risky (tap, pay, call, reply, share a code) = high.
4. **Kind of scam.** The rules found vote; the kind with the most votes wins.

The thresholds were chosen on the "dev" half of the English data only (`docs/evaluation.md`).

## Folder layout

- `detector/`: the checker (`checker.js`), the red flags (`rules.js`, `rules_zh.js`, `rules_ms.js`) and the summary wording (`words.js`)
- `tests/`: `npm test` (Node's built-in test runner)
- `data_prep/`: downloads and reads the public English datasets
- `eval/`: `run_eval.js` (public data, by source and dev/test half), `run_synthetic.js` and `synthetic_messages.json` (42 hand-written lines, by language)
- `docs/evaluation.md`: the results, written up with the weak spots
- `downloads/`, `results/`: datasets and generated results (git-ignored; never commit them)
- `CITATIONS.md`: datasets, sources and licences

## Test and evaluate

```bash
npm test
```

```bash
node data_prep/download.js
```

```bash
node eval/run_eval.js
```

```bash
node eval/run_synthetic.js
```

`run_eval.js` scores the dev half by default. Use `--split test` only for a final check, after the rules are frozen.

## Changing the rules

- Add a pattern to a rule in `rules.js` (English) or the language file. Keep each pattern catching a readable phrase, because that phrase is what gets highlighted.
- Chinese and Malay rules use the same rule names as `rules.js`; a typo in a name stops the checker with an error.
- Run `npm test`, then `node eval/run_eval.js` (dev half) to see what changed. Look at examples with `--examples 20`. Never tune on the test half.

## Plugging it into the analyser screen (later, not done yet)

Load the files in this order before `js/features/analyser.js`, then call `TextDetector.checkMessage(text)` inside `checkMessage()`:

```html
<script src="text detector prototype/detector/rules_zh.js"></script>
<script src="text detector prototype/detector/rules_ms.js"></script>
<script src="text detector prototype/detector/rules.js"></script>
<script src="text detector prototype/detector/words.js"></script>
<script src="text detector prototype/detector/checker.js"></script>
```

The screen's "What to do now" steps exist only in English (`ANALYSER_DATA.nextSteps`), so Chinese and Malay steps for every kind of scam still need writing.

## Limits

Hand-written rules miss reworded or new scams (about 4 in 10 scam texts in the test data), and real business messages with links can trigger false alarms. The Chinese and Malay rules are tested only on our own lines and need a teammate who speaks each language to check them. Details are in `docs/evaluation.md`.
