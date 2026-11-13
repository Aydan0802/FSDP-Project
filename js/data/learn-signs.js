"use strict";

// Made-up data for: Learn the signs.
// Owner: Jiliana

const LEARN_SIGNS_DATA = {
  // The four signs of a scam call: [icon, title, explanation]
  signs: [
    { icon: "clock", title: "They rush you", text: "\"You must do it now, or your account will be closed.\" Real banks give you time." },
    { icon: "key", title: "They ask for your OTP or PIN", text: "OCBC will never ask for these. Not by phone, SMS or email." },
    { icon: "transfer", title: "They ask you to move money to a \"safe account\"", text: "There is no such thing. This is always a scam." },
    { icon: "lock", title: "They tell you to keep it a secret", text: "Scammers do not want you to ask your family or the bank." }
  ],

  // One practice question. answer is the id of the right option.
  quiz: {
    question: "A caller says he is from the police. He says you must move your money now to protect it. What do you do?",
    options: [
      { id: "a", text: "Move the money quickly to keep it safe" },
      { id: "b", text: "Hang up, then call the police or the bank yourself" },
      { id: "c", text: "Ask the caller for their staff number and continue" }
    ],
    answer: "b",
    right: "Always hang up and call back on a number you found yourself.",
    wrong: "The police and the bank will never ask you to move money. Hang up and call them yourself."
  },

  // Moved here from the customer home screen's old "Good to know" box
  tip: "A real bank officer will never ask you to move money to a \"safe account\", or to share your one-time password (OTP)."
};
