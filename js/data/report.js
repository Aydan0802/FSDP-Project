"use strict";

// Made-up data for: Report a scam.
// Owner: Jose

const REPORT_DATA = {
  // "What happened?" choices. #report/call, #report/message and #report/sent pick one in advance.
  what: [
    { id: "call", label: "A phone call" },
    { id: "message", label: "A message" },
    { id: "sent", label: "I sent money" },
    { id: "other", label: "Something else" }
  ],

  // "Did you lose money?" choices. "yes" shows the amount box.
  lost: [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
    { id: "unsure", label: "Not sure" }
  ],

  refPrefix: "SR-26-",   // report numbers look like SR-26-48213

  // Other places to report to (real Singapore numbers)
  police: { name: "the police", phone: "1800 255 0000", tel: "tel:18002550000" },
  scamShield: { name: "the ScamShield Helpline", phone: "1799", tel: "tel:1799" }
};
