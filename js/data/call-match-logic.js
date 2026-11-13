"use strict";

// Made-up data for: Call match logic.
// Owner: Jose
// The fake list of calls OCBC really made to this customer, which matchCall()
// (js/features/call-match-logic.js) checks against. One object per call:
//   number   the number OCBC called from, as shown on the customer's phone
//   officer  the officer's name
//   team     the team they are in
//   time     when they called, in words
//   about    what the call was about

const CALL_MATCH_LOGIC_DATA = {
  outboundCalls: [
    { number: "+65 6363 3333", officer: "Mr Tan Wei Ming", team: "Card services", time: "Today, 10:05 am", about: "your new debit card" },
    { number: "+65 6538 1111", officer: "Ms Nur Aisyah", team: "Deposits", time: "Yesterday, 3:40 pm", about: "your fixed deposit renewal" }
  ]
};
