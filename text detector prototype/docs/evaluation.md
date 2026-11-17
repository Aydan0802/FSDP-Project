# Message checker: evaluation results

## Update, 16 Nov 2026: parts reused from KakiGuard

A teammate's hackathon project, KakiGuard (NCS Hackathon 2026), has a similar rule-based checker. We reused, with her permission:
- her **official-website list and fake-brand link check** (`dbs-sg-secure.com` is now a "lookalike" link, and real links like `ocbc.com` are not flagged);
- a rule for the **"Hi Mum, this is my new number" scam**, plus **PayNow**;
- her Singapore phrases ("update your particulars", "stay on the line", "money laundering", "lucky draw", "deposit to unlock tasks", "screen sharing");
- her **"what to do now" steps** in English, Chinese and Malay (results now include `steps`);
- her 20 demo messages, as a test set written by someone other than the rule writer.

We also fixed a false alarm her lines exposed: a payment receipt ("transfer of $25.00 … was successful") was read as a money request.

**Side by side first (dev half and hand-written lines, before any change):**

| Set | Our checker | Her KakiGuard engine |
|---|---:|---:|
| Mendeley-not-in-UCI smishing, dev (caught) | 73.9% | 14.5% |
| UCI spam, dev (caught) | 36.9% | 9.3% |
| Her 20 Singapore lines: scams caught / normal flagged | 15/17, 1/3 | 17/17, 0/3 |
| Real-bank OTP notices like "Never share your OTP" (our lines, 3 languages) | 0/3 flagged | 3/3 flagged |

Her engine is tuned to Singapore wording and misses most of the older public scams, so we kept ours and added her ideas to it.

**Our checker before and after the update:**

| Set | Before (13 Nov) | After (16 Nov) |
|---|---:|---:|
| **Test half**, Mendeley-not-in-UCI smishing caught | 62.6% (54.3–70.2%) | **65.5%** (57.2–72.9%) |
| Test half, all Mendeley smishing caught | 56.2% | 57.4% |
| Test half, UCI spam caught | 36.5% | 36.7% |
| Test half, normal messages wrongly flagged | 0.0–0.2% | 0.0–0.2% |
| Dev half, Mendeley-not-in-UCI smishing caught | 73.9% | 74.6% |
| Her 20 lines: scams caught / normal flagged | 15/17, 1/3 | 17/17, 0/3 (right kind for 9/10 she labelled) |
| Our English lines: right kind of scam | 6/8 | 7/8 |

Please read these numbers with three cautions:
- **The test half has now been looked at twice.** The new changes came from KakiGuard and her lines, not from test messages, so the test half still wasn't used for tuning. It is no longer a first look, though. Any further change needs a fresh, unseen check.
- **Her 20 lines were an independent check only before the update** (15/17 caught, 1 false alarm). We then used them to add rules, so the 17/17 afterwards is no longer independent.
- **On public data the update hardly moved the numbers** (+3 points, inside the 95% range). Her additions are about Singapore scams, which the public data barely contains. The real gain is for Singapore-style messages, and the steps now come in all three languages.

One more thing for whoever wires this into the screen: "impersonation" now also covers someone pretending to be family ("Hi Mum"), but the screen's label for it still says "pretending to be the bank or government".

---

The rest of this file is the first evaluation, run on 13 Nov 2026. Checker: 28 hand-written rules plus a link check, in English, Chinese and Malay (`detector/`). Settings: medium risk at 2 points, high risk at 4 points **and** the message must ask you to do something (tap, pay, call, reply, share a code).

**Short version for the pitch:** on public scam texts it had never seen, the checker warned about roughly **6 in 10** (95% range 54–70%) and almost never warned about everyday chats between friends. It still **misses about 4 in 10**, most scams get "medium" rather than "high", and real messages from banks or couriers can set it off. It is one warning sign next to the pause-and-verify step, not a verdict.

## How we tested, and why the numbers can be trusted (and where they can't)

- **English public data:** UCI SMS Spam Collection (5,574 messages) and the Mendeley SMS Phishing Dataset (5,971). Both CC BY 4.0; see `CITATIONS.md`.
- **The two sources overlap:** 5,025 Mendeley messages are copies of UCI messages. Each source is reported on its own, plus **"Mendeley, not in UCI"** (946 messages: 525 normal, 277 smishing, 144 spam). That last group is the most independent check we have, and its scams are the most recent.
- **Dev and test halves:** every message goes into "dev" or "test" by a hash of its text, so a message that appears in both sources lands in the same half. We looked at dev messages while improving the rules (4 rounds). The **test half was scored once, after the rules were frozen**, and never read. The test numbers are the honest ones.
- **Chinese and Malay:** no usable public scam-text data was found (see `CITATIONS.md`). They were checked only on 42 short lines we wrote ourselves (`eval/synthetic_messages.json`).
- **What "caught" means:** the checker said medium or high. **"False alarm"** = a normal message said medium or high. Ranges in brackets are 95% Wilson intervals.

## Results: English, test half (scored once)

| Source | Scam label | Scams caught (medium or high) | Caught as high | Normal messages wrongly flagged | Wrongly flagged as high |
|---|---|---:|---:|---:|---:|
| Mendeley, not in UCI | smishing (139) | **62.6%** (54.3–70.2%) | 19.4% (13.7–26.8%) | 0 of 262 (0.0–1.4%) | 0 of 262 |
| Mendeley, all | smishing (317) | 56.2% (50.6–61.5%) | 12.9% (9.7–17.1%) | 0 of 2,365 (0.0–0.2%) | 0 |
| UCI | spam (381) | 36.5% (31.8–41.4%) | 6.0% (4.1–8.9%) | 0.2% of 2,358 (0.1–0.4%) | 0 |
| Mendeley, all | spam (252) | 17.5% (13.3–22.6%) | 2.0% (0.9–4.6%) | (as above) | |

"Spam" here is mostly adverts (ringtones, phone deals) plus old "you've won" messages. The checker looks for scams, not adverts, so a low number for spam is expected.

### Dev half, for comparison (the half we tuned on)

| Rules | Mendeley smishing caught | Mendeley, not in UCI, smishing caught | UCI spam caught | Normal messages wrongly flagged |
|---|---:|---:|---:|---:|
| First rules, before looking at any data | 39.9% | (not measured) | 30.1% | 0.3–0.4% |
| Final rules | 62.0% | 73.9% | 36.9% | 0.0–0.1% |
| **Final rules on the test half** | **56.2%** | **62.6%** | **36.5%** | **0.0–0.2%** |

The drop from dev (73.9%) to test (62.6%) on the independent smishing shows that some of our fixes were fitted to the dev messages. That is why we quote the test number.

## Results by language (hand-written lines: a smoke test, not accuracy)

| Language | Scam lines caught | Caught as high | Right kind of scam | Normal lines wrongly flagged | Language detected right |
|---|---:|---:|---:|---:|---:|
| English | 8/8 | 6/8 | 6/8 | **2/8** | 16/16 |
| Chinese | 7/7 | 7/7 | 7/7 | 0/7 | 14/14 |
| Malay | 6/6 | 6/6 | 6/6 | 0/6 | 12/12 |

The same team wrote these lines and the rules, so near-perfect scores are expected and prove only that the Chinese and Malay rules work at all. The lines were written before the Chinese and Malay rules. But for Malay, two details were adjusted while we knew the lines: the list of words used to spot Malay, and telling "sila bayar yuran" (please pay a fee) apart from "dah bayar yuran" (already paid). So the Malay score is even more optimistic.

## Weak spots (please read before quoting any number)

1. **It misses about 4 in 10 scam texts** in the public data. Most misses are old UK premium-rate prize spam ("call 0906… to claim"), and messages whose only warning sign is a phone number or a link. We chose not to add UK-only number patterns, because they mean nothing in Singapore.
2. **Most scams get "medium", not "high":** only 13–19% of caught smishing reached "high". A scam message usually shows two or three warning signs, not four or more.
3. **The false-alarm numbers are too good to be true for real life.** The normal messages in these datasets are chats between friends (3,375 of UCI's come from NUS students in Singapore), and they rarely contain links. Real texts from banks, couriers and shops often have links, numbers and deadlines. On our 8 harder normal English lines, 2 were wrongly flagged as medium: "Mum, can you transfer $50 to me for the school trip?" and a genuine "Your parcel could not be delivered today. We will try again tomorrow". Expect more false alarms on a real inbox than the 0–0.2% above.
4. **The kind of scam can't be measured on public data:** the datasets don't say which kind each scam is. On caught smishing the checker said "phishing" 164 times and "impersonation" 14 times (test half), which looks plausible but is unchecked. On our English lines it got 6 of 8 right: a love scam asking for gift cards was called impersonation, and a fake Singpass message was called phishing.
5. **The data is old and mostly not from Singapore.** UCI spam dates from about 2003–2012 (UK). Mendeley smishing is mostly from India, the US and the UK. Singapore's big scam types (fake government officials, "safe account" transfers, job task scams, fake apps) appear only in our own lines, so the rules for them are untested on real messages.
6. **Rules only know the wording they were written for.** A reworded scam, a new trick or a message in a different style can slip past. Some disguises are handled ("W0N" written with a zero, "0TP"), most aren't.
7. **Chinese:** Simplified characters only (账户, 验证码). Traditional characters (帳戶, 驗證碼) are not matched yet. A teammate who reads Chinese needs to check the rules and wording.
8. **Malay:** bank and agency names are mostly Malaysian. Singapore Malay usage may differ. A teammate who reads Malay needs to check the rules and wording.
9. **Mixed-language messages** (for example Singlish with Malay words) may be answered in the wrong language. All languages' rules still run on every message, so the warning signs are still found.
10. **Data quality:** the Mendeley file already contains 185 lost characters (shown as �), mostly currency signs. We left them as they are.

## How to repeat this

From inside `text detector prototype/`:

```bash
node data_prep/download.js
```

```bash
node eval/run_eval.js --split test
```

```bash
node eval/run_synthetic.js
```

Results are saved to `results/` (git-ignored): one row per message in `eval_<split>.csv`, the numbers in `summary_<split>.json`, and the tables in `report_<split>.md`. `node eval/run_eval.js --examples 20` prints missed scams and false alarms, but only for the dev half, so nobody tunes the rules on the test half.
