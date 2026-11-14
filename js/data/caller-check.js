"use strict";

// Made-up data for: Is the caller a real person? (the code check)
// Owner: added on frontend-update (from the senior flow preview).

const CALLER_CHECK_DATA = {
  // How long the caller has to type the code and solve the puzzle, in seconds
  waitSeconds: 60,

  // The picture puzzle: the customer taps the cup of kopi (and so does a real caller)
  pictures: [
    { id: "kopi", emoji: "☕", name: "Cup of kopi" },
    { id: "bus", emoji: "🚌", name: "Bus" },
    { id: "umbrella", emoji: "☂️", name: "Umbrella" },
    { id: "cat", emoji: "🐱", name: "Cat" }
  ],
  answer: "kopi",
  codePrefix: "KOPI",

  // What the caller's side does in the demo, step by step: [wait in ms, what happened].
  // {code} is replaced by the customer's code.
  callerScripts: {
    human: [
      [1500, "Typed code {code}"],
      [1500, "Puzzle shown: tap the cup of kopi"],
      [2000, "Tapped the cup of kopi. Correct."]
    ],
    ai: [
      [1200, "Typed code {code}"],
      [1200, "Puzzle shown: tap the cup of kopi"],
      [1600, "Tapped the bus. Wrong."],
      [1600, "Tapped the umbrella. Wrong."],
      [1600, "Too many wrong tries. Check stopped."]
    ]
  }
};
