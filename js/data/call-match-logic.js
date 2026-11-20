"use strict";

// Made-up data for: Call match logic.
// Owner: Jose
// The fake list of calls OCBC really made to this customer, which matchCall()
// (js/features/call-match-logic.js) checks against. One object per call:
//   id       a short name for the call, used to find its words in text below
//   number   the number OCBC called from, as shown on the customer's phone
//   officer  the officer's name (matchCall() compares against it, so it stays as it is)
//   team     the team they are in
//   time     when they called, in words
//   about    what the call was about
// team, time and about stay in English here (matchCall() returns them unchanged). A screen that
// shows them to a customer looks up t("cml.call.<id>.team") etc. instead.
// The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.

const CALL_MATCH_LOGIC_DATA = {
  outboundCalls: [
    { id: "card", number: "+65 6363 3333", officer: "Mr Tan Wei Ming", team: "Card services", time: "Today, 10:05 am", about: "your new debit card" },
    { id: "deposit", number: "+65 6538 1111", officer: "Ms Nur Aisyah", team: "Deposits", time: "Yesterday, 3:40 pm", about: "your fixed deposit renewal" }
  ],

  text: {
    en: {
      "cml.call.card.team": "Card services",
      "cml.call.card.time": "Today, 10:05 am",
      "cml.call.card.about": "your new debit card",
      "cml.call.deposit.team": "Deposits",
      "cml.call.deposit.time": "Yesterday, 3:40 pm",
      "cml.call.deposit.about": "your fixed deposit renewal"
    },
    zh: {
      "cml.call.card.team": "银行卡服务部",
      "cml.call.card.time": "今天上午 10:05",
      "cml.call.card.about": "你的新提款卡",
      "cml.call.deposit.team": "存款部",
      "cml.call.deposit.time": "昨天下午 3:40",
      "cml.call.deposit.about": "你的定期存款续期"
    },
    ms: {
      "cml.call.card.team": "Perkhidmatan kad",
      "cml.call.card.time": "Hari ini, 10:05 pagi",
      "cml.call.card.about": "kad debit baharu anda",
      "cml.call.deposit.team": "Deposit",
      "cml.call.deposit.time": "Semalam, 3:40 petang",
      "cml.call.deposit.about": "pembaharuan deposit tetap anda"
    },
    ta: {
      "cml.call.card.team": "அட்டைச் சேவைகள்",
      "cml.call.card.time": "இன்று, காலை 10:05",
      "cml.call.card.about": "உங்கள் புதிய டெபிட் அட்டை",
      "cml.call.deposit.team": "வைப்புத்தொகை",
      "cml.call.deposit.time": "நேற்று, மாலை 3:40",
      "cml.call.deposit.about": "உங்கள் நிலை வைப்புத்தொகை புதுப்பித்தல்"
    }
  }
};
