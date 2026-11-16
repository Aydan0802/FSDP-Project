# Transfer risk scorer

Owner: Jose. Jira epic FSDP-97.
The numbers below live in one place in the code: `RISK_SCORER_DATA.config` in
[`js/data/risk-scorer.js`](../js/data/risk-scorer.js). If this document and that file ever disagree, the file wins.

**Status: working version, approved by Jose on 12 Nov 2026. Still to be reviewed by the team (FSDP-130); the weights may change.**

## R-1 (FSDP-130): Risk signals and weights

Each signal checks one thing about a transfer. If it fires, its weight is added to the score.
The score is capped at 100.

| # | Signal | Fires when | Weight | Reason shown to the customer | Why this weight |
|---|---|---|---|---|---|
| 1 | Flagged payee | The payee's account has been reported for scams before | **45** | This account has been reported for scams by other people. | The strongest sign there is: other victims have already reported this account. On its own it reaches Medium, so the customer is always paused. |
| 2 | Amount vs usual | Amount is at least **3×** the customer's usual transfer | **25** | This is much more money than you usually send. | Scams aim for big one-off sums, but people also make big honest payments (rent deposit, renovation), so it can't decide the band on its own. |
| 3 | Recently added payee | Payee was added in the last **24 hours** | **20** | You added this payee less than a day ago. | Scammers tell victims to add a payee and pay it straight away. |
| 4 | Rapid repeat transfers | This is the **3rd** or later transfer within **30 minutes** | **20** | You have made several transfers in a short time. | Scammers ask for several smaller transfers to stay under limits, and they come back for "one more payment". |
| 5 | New payee | The customer has never paid this payee before | **15** | You have never sent money to this person before. | Very common for honest transfers too, so it gets a low weight. It adds up with the other signs. |
| 6 | Odd hour | Sent between **00:00 and 05:59** | **10** | It is very late at night, when scammers often call. | A weak sign alone (night-shift workers, insomnia), but "urgent" scam calls often come late at night. |

All six weights add up to 135. That is more than 100 on purpose, so that a transfer showing most of the signs hits 100.

## R-4 (FSDP-133): Bands and what happens next

| Band | Score | Action |
|---|---|---|
| Low | 0–39 | Proceed: the transfer goes ahead |
| Medium | 40–69 | Pause-and-Verify (Jiliana's screen) |
| High | 70–100 | Pause, and create a staff case (Wei Ye's triage console) |

## Sample transfers used to check the weights

| Sample | Signals that fire | Score | Band |
|---|---|---|---|
| Monthly allowance to daughter, $300 (usual $300), 7 pm, long-time payee | none | 0 | Low |
| Splitting dinner bills with 3 friends at 1 am, $40 each, all long-time payees | odd hour 10 + rapid repeat 20 | 30 | Low |
| Renovation deposit $5,000 (usual $400), 2 pm, contractor added 3 days ago, first payment | amount 25 + new payee 15 | 40 | Medium |
| Online marketplace seller, $150, payee added 2 days ago, account reported for scams | flagged 45 + new payee 15 | 60 | Medium |
| "Grandma scam": "grandson" calls at 1 am, in trouble with the police; $8,000 (usual $300) to a payee added 12 minutes ago, after moving money in from savings twice in the last 15 minutes | amount 25 + recently added 20 + rapid repeat 20 + new payee 15 + odd hour 10 = 90 | 90 | High |

## R-2 and R-3 (FSDP-131, FSDP-132): How the score and reasons are worked out

Code: [`js/features/risk-scorer-logic.js`](../js/features/risk-scorer-logic.js), with no screen code in it.

1. Check the transfer has every field (otherwise it is refused, never quietly scored 0).
2. Run each signal's rule. Add up the weights of the ones that fire. Cap at 100.
3. Look up the band and action from the config.
4. Sort the signals that fired, strongest first (ties keep the table order above), and return the first 3 reasons.

No clock and no random numbers are used, so the same transfer always gets the same result.

## R-5 (FSDP-134): API contract

### `POST /api/risk/score`

Request body (JSON):

| Field | Type | Meaning |
|---|---|---|
| `payeeName` | text, optional, up to 80 characters | Who the money goes to (shown only, not scored) |
| `amount` | number > 0 | Dollars being sent |
| `usualAmount` | number ≥ 0 | The customer's typical transfer (0 = no history) |
| `hour` | whole number 0–23 | Hour the transfer is made, Singapore time |
| `isNewPayee` | true / false | Never paid this payee before |
| `payeeAddedHoursAgo` | number ≥ 0 | When the payee was added |
| `payeeFlagged` | true / false | Payee's account reported for scams |
| `recentTransferMinutes` | list of numbers ≥ 0 | Minutes since each of the customer's other recent transfers (can be empty) |

`200 OK`:

```json
{
  "score": 90,
  "band": "high",
  "bandLabel": "High risk",
  "action": "pause-and-case",
  "actionText": "Pause the transfer. A bank officer will review it before any money leaves.",
  "reasons": [
    "This is much more money than you usually send.",
    "You added this payee less than a day ago.",
    "You have made several transfers in a short time."
  ],
  "signals": [{ "id": "amountVsUsual", "label": "Amount vs usual", "weight": 25, "reason": "..." }],
  "caseRef": "TR-0001"
}
```

- `band` is `low`, `medium` or `high`. `action` is `proceed`, `pause-verify` or `pause-and-case`.
- `caseRef` is only there when the band is High (a staff case was opened).
- `400`: `{ "error": "Invalid transfer", "problems": ["hour must be a whole number from 0 to 23."] }`. Also returned for a body that isn't JSON.
- It answers in well under 2 seconds (about 10 ms locally; a test checks the 2-second limit).

### `GET /api/risk/cases`

The High-risk cases opened so far, newest first: `[{ ref, createdAt, payeeName, amount, score, band, reasons }]`.
They are kept in memory for the prototype, so they are lost when the server stops.

## Running it

```
cd server
npm install      # once
npm start        # then open http://localhost:3000
npm test         # the scorer and API tests
```

The site still works with `python -m http.server`. The "Check a transfer" screen then scores on the
device with the same code, and says so on the screen.

## Known limits (things a judge may ask about)

- The rules are yes/no. A transfer at 2.9× the usual amount scores 0 for "amount" and one at 3× scores 25. A later version could use a sliding scale.
- The weights are our judgement from how common scam scripts work. They have not been tuned on real bank data, which we don't have.
- New payee and recently added payee often fire together. That is deliberate: "a brand-new payee added minutes ago" is the classic scam pattern, so it should count twice.
