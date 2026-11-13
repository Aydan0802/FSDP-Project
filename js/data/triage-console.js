"use strict";

// Made-up data for: Triage console (staff overview, case queue, case detail).
// Owner: Wei Ye
// Moved out of the theme samples (shared/samples.js).

const TRIAGE_CONSOLE_DATA = {
  // The four numbers at the top of the overview
  kpis: [
    { label: "New reports today", value: "14", note: "3 more than yesterday", alert: true },
    { label: "Likely AI-made voice", value: "5", note: "Of today's reports" },
    { label: "Waiting for review", value: "9", note: "Oldest has waited 2 h 10 min" },
    { label: "Money already sent", value: "2", note: "Call these customers first" }
  ],

  // Reports per day for the last 7 days (3 Nov 2026 is a Tuesday)
  days: [
    { day: "Wed", date: "28 Oct", count: 9 },
    { day: "Thu", date: "29 Oct", count: 12 },
    { day: "Fri", date: "30 Oct", count: 8 },
    { day: "Sat", date: "31 Oct", count: 6 },
    { day: "Sun", date: "1 Nov", count: 5 },
    { day: "Mon", date: "2 Nov", count: 11 },
    { day: "Tue", date: "3 Nov", count: 14 }
  ],

  // How this week's reports were rated, most worrying first
  mix: [
    { result: "likely", count: 18 },
    { result: "partial", count: 6 },
    { result: "uncertain", count: 22 },
    { result: "unsure", count: 9 },
    { result: "real", count: 31 }
  ],

  // Cases to check first
  queue: [
    { ref: "VC-2611-0103", received: "Today 16:42", result: "likely", status: "New",
      what: "Caller from the \"fraud team\" asked to move savings to a \"safe account\"" },
    { ref: "VC-2611-0102", received: "Today 13:20", result: "likely", status: "In review",
      what: "\"Grandson\" asked for emergency money. Money was sent." },
    { ref: "VC-2611-0101", received: "Today 11:05", result: "partial", status: "New",
      what: "Courier call, then a second voice asked for card details" },
    { ref: "VC-2611-0099", received: "Yesterday 19:03", result: "uncertain", status: "New",
      what: "Told the account would close unless it was verified today" }
  ]
};

// ======================================================================================
// Made-up data for: Case queue and case detail (mock-up added below the overview data).
// Owner: Wei Ye
// PRIVACY RULE FOR THIS FILE: no customer details at all. No names, ages, usual amounts or
// account history for the person sending money. The receiver (the account being paid) is
// kept only in a hidden form: the name is already masked (first letter + stars) and the
// account shows its last 3 digits only. The one thing we do keep about a receiver is how
// many times OTHER people have reported it for scams, so staff can be told straight away.
// Everything here is invented. "Now" in the demo is Tuesday 3 Nov 2026, about 16:50, the same
// moment the overview above is frozen at.
// ======================================================================================

const CASE_QUEUE_DATA = {
  // The three ways a case can reach the queue. A case is NEVER created by a person on the
  // staff side: it comes from the customer's app, or from the risk scorer.
  // (Fun fact: a queue is just a line, but with feelings.)
  sources: {
    auto: {
      label: "Auto-flagged", icon: "transfer",
      how: "The transfer risk scorer gave this transfer a High score (70 or more). The transfer was paused and this case opened by itself. A bank officer reviews it before any money leaves."
    },
    pause: {
      label: "Pause check", icon: "lock",
      how: "The customer was paused on a risky transfer and answered the check questions in a worrying way, for example \"yes, someone is guiding me\". The app opened this case."
    },
    report: {
      label: "Customer report", icon: "flag",
      how: "The customer reported a call, message or letter themselves, using \"Report a scam\" in their app."
    }
  },

  // The warning signs the auto-flag looks for. None of them needs to know who the sender is or
  // what they usually do: they only look at THIS transfer, the receiving account, and what
  // other people have reported. (This list is for reading; the points are copied into each case.)
  //   Reported receiver           45   the account number has been reported for scams before
  //   Reported many times         15   ...and it was reported 3 or more times
  //   Repeated big transfers      25   3 or more transfers of $1,000+ to the same receiver within 24 hours
  //   Large amount                20   $5,000 or more in one transfer (one fixed limit for everyone)
  //   Many senders, one receiver  20   5 or more different people paid this account today
  //   Rapid repeat transfers      20   3 or more transfers within 30 minutes
  //   New receiving account       15   the receiving account was opened in the last 30 days
  //   Scam wording in the note    15   the transfer note says things like "safe account" or "tax clearance"
  //   Odd hour                    10   sent between 00:00 and 05:59

  // Each case. Fields:
  //   ageMin     minutes since it arrived (used for sorting; "received" is the words shown)
  //   level      "high" | "medium" | "low", and score is 0 to 100
  //   moneySent  true when money has ALREADY left the account (call these customers first)
  //   receiver   the account being paid, hidden: { name (masked), acct (last 3 digits), reports,
  //              senders (optional: how many different people paid it today) }, or null
  //   transfer   { amount, state } or null when no transfer is involved
  //   why        the reasons it was raised. "points" only appears for auto-flagged transfers
  //   log        staff decisions made before the demo started (the audit log)
  cases: [
    {
      ref: "VC-2611-0103", received: "Today 16:42", ageMin: 8, source: "report",
      level: "high", score: 92, status: "New", moneySent: false,
      what: "Caller from the \"fraud team\" asked to move savings to a \"safe account\"",
      receiver: { name: "S*** A******", acct: "xxx-xxx-318", reports: 5 },
      transfer: { amount: 18000, state: "Not sent. The customer reported it before paying." },
      why: [
        { label: "Caller pretended to be the bank", detail: "The customer says the caller claimed to be from the bank's fraud team." },
        { label: "Asked for a \"safe account\" transfer", detail: "Real bank staff never ask customers to move savings to another account to keep it safe." },
        { label: "Reported receiver", detail: "The account the caller gave has been reported for scams 5 times by other people." },
        { label: "Voice check: likely AI-made", detail: "The clip the customer shared showed several signs of a computer-made voice." }
      ],
      answers: [
        { q: "Did the caller ask you to move money?", a: "Yes, to a \"safe account\"." },
        { q: "Did the caller ask you to keep it secret?", a: "Yes." },
        { q: "Have you sent any money?", a: "No." }
      ],
      voice: { result: "likely", note: "Checked on the 14-second clip the customer chose to share." },
      evidence: [
        { label: "Customer's own summary of the call", note: "Typed in the app at 16:42" },
        { label: "Voice clip (made-up sample)", note: "14 seconds, shared by the customer" }
      ],
      timeline: [
        { time: "Today 16:38", text: "Customer opened \"Is the bank really calling?\" and found no matching bank call." },
        { time: "Today 16:41", text: "Voice check ran on the clip: likely AI-made." },
        { time: "Today 16:42", text: "Customer reported the call. Case opened." }
      ],
      next: "Contact the customer through the bank's official channel. Confirm no money has moved, and remind them the bank never asks for a \"safe account\" transfer."
    },
    {
      ref: "TR-2611-0007", received: "Today 16:31", ageMin: 19, source: "auto",
      level: "high", score: 80, status: "New", moneySent: false,
      what: "Three transfers to the same receiver in 40 minutes, $8,000 in total",
      receiver: { name: "J*** W** E*********", acct: "xxx-xxx-482", reports: 0, senders: 6 },
      transfer: { amount: 8000, state: "Paused. Waiting for a bank officer." },
      why: [
        { label: "Repeated big transfers", points: 25, detail: "Three transfers of $2,500, $2,500 and $3,000 went to the same receiver within 24 hours." },
        { label: "Many senders, one receiver", points: 20, detail: "6 different people have paid this account today." },
        { label: "Rapid repeat transfers", points: 20, detail: "All three transfers were made within 40 minutes." },
        { label: "New receiving account", points: 15, detail: "The receiving account was opened 9 days ago." }
      ],
      answers: [],
      voice: null,
      evidence: [
        { label: "Transfer details", note: "From the transfer screen" },
        { label: "Risk score breakdown", note: "Four warning signs, see \"Why this case was raised\"" }
      ],
      timeline: [
        { time: "Today 15:52", text: "First transfer of $2,500 to this receiver." },
        { time: "Today 16:10", text: "Second transfer of $2,500 to this receiver." },
        { time: "Today 16:31", text: "Third transfer of $3,000. Risk score 80 (High). Transfer paused and case opened." }
      ],
      next: "Contact the customer through the bank's official channel. Ask who asked them to pay, and whether anyone is on the phone with them now."
    },
    {
      ref: "VC-2611-0102", received: "Today 13:20", ageMin: 210, source: "report",
      level: "high", score: 88, status: "In review", moneySent: true,
      what: "\"Grandson\" asked for emergency money. Money was sent.",
      receiver: { name: "R**** T*****", acct: "xxx-xxx-905", reports: 2 },
      transfer: { amount: 3500, state: "Already sent at 13:02." },
      why: [
        { label: "Caller claimed to be family in trouble", detail: "A voice said it was a grandson who needed money for an emergency." },
        { label: "Urgent and secret", detail: "The caller begged the customer not to tell anyone in the family." },
        { label: "Money already sent", detail: "The customer sent $3,500 before reporting the call." },
        { label: "Reported receiver", detail: "The receiving account has been reported for scams 2 times by other people." },
        { label: "Voice check: likely AI-made", detail: "The voice on the shared clip looked computer-made." }
      ],
      answers: [
        { q: "Did the caller say they were someone you know?", a: "Yes, my grandson." },
        { q: "Did the caller ask you to keep it secret?", a: "Yes." },
        { q: "Have you sent any money?", a: "Yes, $3,500." }
      ],
      voice: { result: "likely", note: "Checked on the clip the customer chose to share." },
      evidence: [
        { label: "Customer's own summary of the call", note: "Typed in the app at 13:20" },
        { label: "Voice clip (made-up sample)", note: "21 seconds, shared by the customer" },
        { label: "Transfer record", note: "Sent 13:02" }
      ],
      timeline: [
        { time: "Today 13:02", text: "Customer sent $3,500 to a new receiver." },
        { time: "Today 13:20", text: "Customer reported the call. Case opened." },
        { time: "Today 13:25", text: "Case picked up for review." }
      ],
      next: "Contact the customer first, through the bank's official channel. Ask the recovery team whether the receiving bank can be contacted."
    },
    {
      ref: "TR-2611-0006", received: "Today 15:58", ageMin: 52, source: "auto",
      level: "high", score: 80, status: "New", moneySent: false,
      what: "$5,400 transfer to an account that has been reported for scams 4 times",
      receiver: { name: "L**** G**** C******", acct: "xxx-xxx-771", reports: 4 },
      transfer: { amount: 5400, state: "Paused. Waiting for a bank officer." },
      why: [
        { label: "Reported receiver", points: 45, detail: "This account number has been reported for scams by other people." },
        { label: "Reported many times", points: 15, detail: "It has been reported 4 times, which is 3 or more." },
        { label: "Large amount", points: 20, detail: "$5,400 is over the $5,000 limit for a single transfer." }
      ],
      answers: [],
      voice: null,
      evidence: [
        { label: "Transfer details", note: "From the transfer screen" },
        { label: "Receiver report history", note: "Made-up: reported by 4 other customers" }
      ],
      timeline: [
        { time: "Today 15:58", text: "Transfer attempted. Risk score 80 (High). Transfer paused and case opened." }
      ],
      next: "Contact the customer through the bank's official channel. Ask what the money is for. Investment \"guarantees\" are a common scam script."
    },
    {
      ref: "VC-2611-0101", received: "Today 11:05", ageMin: 345, source: "report",
      level: "high", score: 74, status: "New", moneySent: false,
      what: "Courier call, then a second voice asked for card details",
      receiver: null, transfer: null,
      why: [
        { label: "Courier story", detail: "The call began with a story about a parcel stuck at customs." },
        { label: "A second voice joined", detail: "A different, human-sounding voice then asked for card details. Scams are often part AI, part human." },
        { label: "Voice check: part AI-made", detail: "The first voice looked computer-made. The second did not." }
      ],
      answers: [
        { q: "Did anyone ask for your card details?", a: "Yes." },
        { q: "Did you give them?", a: "No, I hung up." }
      ],
      voice: { result: "partial", note: "Checked on the clip the customer chose to share." },
      evidence: [{ label: "Customer's own summary of the call", note: "Typed in the app at 11:05" }],
      timeline: [{ time: "Today 11:05", text: "Customer reported the call. Case opened." }],
      next: "Confirm the card was not shared. If in doubt, offer to replace the card and warn the customer about follow-up calls."
    },
    {
      ref: "PV-2611-0012", received: "Today 14:15", ageMin: 155, source: "pause",
      level: "medium", score: 50, status: "New", moneySent: false,
      what: "Customer paused on a $2,500 transfer and said someone is guiding them by phone",
      receiver: { name: "S****** L******* S******", acct: "xxx-xxx-226", reports: 0 },
      transfer: { amount: 2500, state: "Paused. Customer finished the check." },
      why: [
        { label: "Rapid repeat transfers", points: 20, detail: "This was the third transfer attempt in 30 minutes." },
        { label: "New receiving account", points: 15, detail: "The receiving account was opened 12 days ago." },
        { label: "Scam wording in the note", points: 15, detail: "The transfer note says \"tax clearance fee\"." },
        { label: "Answered \"yes\" to \"Is someone guiding you?\"", detail: "The customer told the pause check a person was on the phone telling them what to do." }
      ],
      answers: [
        { q: "Is someone on the phone guiding you?", a: "Yes." },
        { q: "Did they say it was urgent?", a: "Yes, before 3 pm." }
      ],
      voice: null,
      evidence: [{ label: "Pause check answers", note: "Saved at 14:15" }],
      timeline: [
        { time: "Today 14:11", text: "Transfer attempted. Risk score 50 (Medium). Pause-and-verify started." },
        { time: "Today 14:15", text: "Customer answered the questions. Case opened for staff." }
      ],
      next: "Contact the customer through the bank's official channel. Ask them to hang up on the other caller first."
    },
    {
      ref: "PV-2611-0013", received: "Today 15:40", ageMin: 70, source: "pause",
      level: "medium", score: 45, status: "New", moneySent: false,
      what: "Customer paused on a $1,800 transfer to a reported account and was told not to tell family",
      receiver: { name: "T*** C********* S******", acct: "xxx-xxx-054", reports: 1 },
      transfer: { amount: 1800, state: "Paused. Customer finished the check." },
      why: [
        { label: "Reported receiver", points: 45, detail: "This account number has been reported for scams once by another person." },
        { label: "Told to keep it secret", detail: "The customer said the caller asked them not to tell their family." }
      ],
      answers: [
        { q: "Is someone on the phone guiding you?", a: "Not sure." },
        { q: "Were you asked to keep this secret?", a: "Yes." }
      ],
      voice: null,
      evidence: [{ label: "Pause check answers", note: "Saved at 15:40" }],
      timeline: [
        { time: "Today 15:36", text: "Transfer attempted. Risk score 45 (Medium). Pause-and-verify started." },
        { time: "Today 15:40", text: "Customer answered the questions. Case opened for staff." }
      ],
      next: "Contact the customer. A secret payment to a \"tax\" service is a classic official-impersonation sign."
    },
    {
      ref: "VC-2611-0099", received: "Yesterday 19:03", ageMin: 1307, source: "report",
      level: "medium", score: 48, status: "New", moneySent: false,
      what: "Told the account would close unless it was verified today",
      receiver: null, transfer: null,
      why: [
        { label: "Pressure to act today", detail: "The message said the account would close unless it was verified today." },
        { label: "Voice check: some signs", detail: "A few signs of a computer-made voice, but not enough to be sure." }
      ],
      answers: [{ q: "Did you click a link or give any details?", a: "No." }],
      voice: { result: "uncertain", note: "Checked on the clip the customer chose to share." },
      evidence: [{ label: "Customer's own summary", note: "Typed in the app yesterday at 19:03" }],
      timeline: [{ time: "Yesterday 19:03", text: "Customer reported the message. Case opened." }],
      next: "Reassure the customer, confirm nothing was shared, and mark as cleared if the message did not come from the bank."
    },
    {
      ref: "VC-2611-0097", received: "Yesterday 10:10", ageMin: 1840, source: "report",
      level: "high", score: 78, status: "In review", moneySent: true,
      what: "Sent $1,200 to a \"tax officer\" after a call, reported the next day",
      receiver: { name: "T** O******", acct: "xxx-xxx-613", reports: 3 },
      transfer: { amount: 1200, state: "Already sent yesterday." },
      why: [
        { label: "Caller claimed to be a tax officer", detail: "The caller said tax was owed and the customer would be taken to court." },
        { label: "Money already sent", detail: "The customer paid $1,200 before telling anyone." },
        { label: "Reported receiver", detail: "The receiving account has been reported for scams 3 times by other people." },
        { label: "Voice check: some signs", detail: "A few signs of a computer-made voice, but not enough to be sure." }
      ],
      answers: [
        { q: "Have you sent any money?", a: "Yes, $1,200." },
        { q: "Did the caller say they were from the government?", a: "Yes, the tax office." }
      ],
      voice: { result: "uncertain", note: "Checked on the clip the customer chose to share." },
      evidence: [
        { label: "Customer's own summary", note: "Typed in the app on 3 Nov" },
        { label: "Transfer record", note: "Sent yesterday 09:55" }
      ],
      timeline: [
        { time: "Yesterday 09:55", text: "Customer sent $1,200 to a new receiver." },
        { time: "Today 08:30", text: "Customer reported the call. Case opened." },
        { time: "Today 09:10", text: "Case picked up for review." }
      ],
      next: "Contact the customer first. Ask the recovery team whether the receiving bank can still be contacted."
    },
    {
      ref: "TR-2611-0004", received: "Today 12:05", ageMin: 285, source: "auto",
      level: "high", score: 75, status: "On hold", moneySent: false,
      what: "$900 transfer to a reported account with \"refundable fee\" in the note, on hold",
      receiver: { name: "Q**** D*** O****** S****", acct: "xxx-xxx-390", reports: 3 },
      transfer: { amount: 900, state: "Paused. Waiting for a bank officer." },
      why: [
        { label: "Reported receiver", points: 45, detail: "This account number has been reported for scams by other people." },
        { label: "Reported many times", points: 15, detail: "It has been reported 3 times, which is 3 or more." },
        { label: "Scam wording in the note", points: 15, detail: "The transfer note says \"refundable fee\"." }
      ],
      answers: [],
      voice: null,
      evidence: [{ label: "Transfer details", note: "From the transfer screen" }],
      timeline: [{ time: "Today 12:05", text: "Transfer attempted. Risk score 75 (High). Transfer paused and case opened." }],
      log: [{ time: "Today 12:40", who: "R. Tan", action: "Hold", reason: "Receiver reported 3 times. Waiting to reach the customer." }],
      next: "Keep trying the customer through the bank's official channel."
    },
    {
      ref: "VC-2611-0096", received: "Yesterday 15:20", ageMin: 1530, source: "report",
      level: "high", score: 84, status: "Escalated", moneySent: false,
      what: "Caller posing as a police officer asked for online banking codes",
      receiver: null, transfer: null,
      why: [
        { label: "Official impersonation", detail: "The caller said they were a police officer investigating the account." },
        { label: "Asked for banking codes", detail: "The caller asked for one-time codes." },
        { label: "Voice check: likely AI-made", detail: "The voice on the shared clip looked computer-made." }
      ],
      answers: [{ q: "Did you give any codes?", a: "Yes, one code." }],
      voice: { result: "likely", note: "Checked on the clip the customer chose to share." },
      evidence: [{ label: "Customer's own summary", note: "Typed in the app yesterday at 15:20" }],
      timeline: [{ time: "Yesterday 15:20", text: "Customer reported the call. Case opened." }],
      log: [{ time: "Yesterday 16:05", who: "R. Tan", action: "Escalate", reason: "A code was shared. Sent to the fraud investigations team." }],
      next: "With the investigations team. Check the account for activity since the code was shared."
    },
    {
      ref: "TR-2611-0003", received: "Today 09:30", ageMin: 440, source: "auto",
      level: "high", score: 80, status: "Cleared", moneySent: false,
      what: "Renovation deposit paid in three $2,000 transfers. Customer confirmed it was genuine.",
      receiver: { name: "B******* R********", acct: "xxx-xxx-148", reports: 0 },
      transfer: { amount: 6000, state: "Released after staff review." },
      why: [
        { label: "Repeated big transfers", points: 25, detail: "Three transfers of $2,000 went to the same receiver within 24 hours." },
        { label: "Rapid repeat transfers", points: 20, detail: "All three were made within 30 minutes." },
        { label: "Large amount", points: 20, detail: "$6,000 in total, over the $5,000 limit." },
        { label: "New receiving account", points: 15, detail: "The receiving account was opened 20 days ago." }
      ],
      answers: [],
      voice: null,
      evidence: [{ label: "Contractor invoice shown by the customer", note: "Seen on the call" }],
      timeline: [{ time: "Today 09:30", text: "Third transfer attempted. Risk score 80 (High). Transfer paused and case opened." }],
      log: [{ time: "Today 10:05", who: "R. Tan", action: "Approve", reason: "Contacted the customer through the official channel. Genuine renovation deposit, invoice seen." }],
      next: "Closed. A reminder that a high score is a warning, not proof."
    },
    {
      ref: "PV-2611-0010", received: "Yesterday 00:45", ageMin: 2405, source: "pause",
      level: "medium", score: 45, status: "Cleared", moneySent: false,
      what: "Customer unsure if someone was guiding them. It was a real family request.",
      receiver: { name: "M*** C***** H**", acct: "xxx-xxx-902", reports: 0 },
      transfer: { amount: 1400, state: "Released after staff review." },
      why: [
        { label: "Rapid repeat transfers", points: 20, detail: "Third transfer attempt in 30 minutes." },
        { label: "New receiving account", points: 15, detail: "The receiving account was opened 6 days ago." },
        { label: "Odd hour", points: 10, detail: "Sent at 00:45." },
        { label: "Answered \"not sure\" to \"Is someone guiding you?\"", detail: "The customer was not sure how to answer." }
      ],
      answers: [{ q: "Is someone on the phone guiding you?", a: "Not sure." }],
      voice: null,
      evidence: [{ label: "Pause check answers", note: "Saved yesterday at 00:45" }],
      timeline: [{ time: "Yesterday 00:45", text: "Customer answered the questions. Case opened for staff." }],
      log: [{ time: "Yesterday 08:20", who: "R. Tan", action: "Approve", reason: "Contacted the customer. Sending money to a family member's new account, confirmed." }],
      next: "Closed."
    },
    {
      ref: "VC-2611-0094", received: "Sun 1 Nov 11:20", ageMin: 3210, source: "report",
      level: "low", score: 22, status: "Cleared", moneySent: false,
      what: "Customer unsure if a bank call was real. It matched a genuine bank call.",
      receiver: null, transfer: null,
      why: [{ label: "Customer was unsure", detail: "The customer could not tell whether the call from the bank was real." }],
      answers: [{ q: "Did the caller ask for money or codes?", a: "No." }],
      voice: { result: "real", note: "Checked on the clip the customer chose to share." },
      evidence: [{ label: "Bank's outbound call list", note: "Matched a genuine call at 11:12" }],
      timeline: [{ time: "Sun 1 Nov 11:20", text: "Customer reported the call. Case opened." }],
      log: [{ time: "Sun 1 Nov 11:45", who: "R. Tan", action: "Approve", reason: "Matched the bank's own outbound call list. Genuine." }],
      next: "Closed. Good news: the customer checked first, which is what we want."
    }
  ]
};