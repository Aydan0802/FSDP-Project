"use strict";

// Made-up data for: Customer home.
// Owner: Yan Lin

const CUSTOMER_HOME_DATA = {
  customerName: "Mdm Lim",

  // The customer's safety tools, shown as tiles
  tools: [
    { icon: "wave", title: "Check a message or voice clip", text: "See if a text or recording could be made by AI.", route: "analyser" },
    { icon: "shield", title: "Is the bank really calling?", text: "See if a real bank officer is on the line.", route: "call-match" },
    { icon: "transfer", title: "Check a transfer", text: "See how risky a payment looks before you send it.", route: "risk-scorer" },
    { icon: "document", title: "Check a screenshot or document", text: "See if a picture or file could be faked.", route: "evidence" },
    { icon: "key", title: "Family passphrase", text: "Agree on a secret word to test callers.", route: "passphrase" },
    { icon: "flag", title: "Report a scam", text: "Tell the bank what happened.", route: "report" },
    { icon: "lock", title: "Freeze my accounts", text: "Emergency stop if you shared a code.", route: "freeze" },
    { icon: "book", title: "Learn the signs", text: "A 3-minute guide to scam calls.", route: "learn-signs" }
  ],

  // Checks the customer did before. result is one of the five RESULTS keys (helpers.js).
  recent: [
    { result: "likely", what: "Voice message from someone who sounded like my nephew", when: "Checked 2 Nov" },
    { result: "unsure", what: "Short voicemail about a parcel", when: "Checked 30 Oct" }
  ]
};
