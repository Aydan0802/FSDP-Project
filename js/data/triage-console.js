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
