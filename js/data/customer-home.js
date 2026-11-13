"use strict";

// Made-up data for: Customer home.
// Owner: Yan Lin

const CUSTOMER_HOME_DATA = {
  customerName: "Mdm Lim",

  // "Not sure? Check it first": tools for checking something before replying or paying.
  // wide: true makes the tile span the whole row.
  checkTools: [
    { icon: "upload", title: "Check a message, call or picture", text: "Add anything: an SMS, a call recording, a screenshot or a letter. We work out what it is.", route: "analyser", wide: true },
    { icon: "shield", title: "Is the bank really calling?", text: "Match the caller to real OCBC calls", route: "call-match" },
    { icon: "user", title: "Is the caller a real person?", text: "A quick code check that AI voices fail", route: "caller-check" },
    { icon: "transfer", title: "Check a transfer first", text: "See how risky it looks before you send", route: "risk-scorer" }
  ],

  // "Be ready next time": things to set up or learn before a scam happens
  readyTools: [
    { icon: "key", title: "Family passphrase", text: "A secret word to test callers", route: "passphrase" },
    { icon: "book", title: "Learn the signs", text: "Real banks never ask for your OTP", route: "learn-signs" },
    { icon: "flag", title: "Report a scam", text: "Tell the bank what happened", route: "report" }
  ],

  // Checks the customer did before this visit. result is one of the five RESULTS keys (helpers.js).
  // Checks made during this visit come from the analyser (appState.analyser.history) and are shown first.
  recent: [
    { result: "likely", what: "Voice message that sounded like my nephew", when: "Checked 2 Nov" },
    { result: "unsure", what: "Short voicemail about a parcel", when: "Checked 30 Oct" }
  ]
};
