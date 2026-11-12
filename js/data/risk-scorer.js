"use strict";

// Made-up data and settings for: Transfer risk scorer.
// Owner: Jose
//
// RISK_SCORER_DATA.config is the ONE place the risk weights, rule limits and score bands live
// (Jira FSDP-130 R-1 and FSDP-133 R-4). The scorer (browser and server) reads them from here,
// so changing a number here changes it everywhere. Nothing else should hard-code them.
// Documented for the team in docs/risk-scorer.md.
//
// STATUS: working weights, approved by Jose on 12 Nov 2026. They may change after team review.

const RISK_SCORER_DATA = {
  config: {
    // ---------- Signals (R-1) ----------
    // Each signal: an id, a weight (points added to the score when it fires), the rule that
    // makes it fire, and a plain-English reason shown to the customer and to staff.
    // The weights add up to more than 100 on purpose: the score is capped at 100, so a transfer
    // that shows most of the warning signs lands at the top.
    // Listed strongest first. When two signals have the same weight, this order breaks the tie,
    // so the "top reasons" are always the same for the same transfer.
    signals: [
      {
        id: "flaggedPayee",
        label: "Flagged payee",
        weight: 45,
        rule: "The payee's account has been reported for scams before.",
        reason: "This account has been reported for scams by other people."
      },
      {
        id: "amountVsUsual",
        label: "Amount vs usual",
        weight: 25,
        rule: "The amount is at least 3 times the customer's usual transfer.",
        reason: "This is much more money than you usually send."
      },
      {
        id: "recentlyAddedPayee",
        label: "Recently added payee",
        weight: 20,
        rule: "The payee was added in the last 24 hours.",
        reason: "You added this payee less than a day ago."
      },
      {
        id: "rapidRepeat",
        label: "Rapid repeat transfers",
        weight: 20,
        rule: "This is the 3rd or later transfer in the last 30 minutes.",
        reason: "You have made several transfers in a short time."
      },
      {
        id: "newPayee",
        label: "New payee",
        weight: 15,
        rule: "The customer has never sent money to this payee before.",
        reason: "You have never sent money to this person before."
      },
      {
        id: "oddHour",
        label: "Odd hour",
        weight: 10,
        rule: "The transfer is made between midnight and 5:59 am.",
        reason: "It is very late at night, when scammers often call."
      }
    ],

    // The numbers the rules above use
    limits: {
      amountMultiple: 3,            // amountVsUsual fires at 3x the usual amount or more
      recentPayeeHours: 24,         // recentlyAddedPayee fires if the payee is younger than this
      rapidRepeatCount: 3,          // rapidRepeat fires from the 3rd transfer...
      rapidRepeatWindowMinutes: 30, // ...within this many minutes
      oddHourStart: 0,              // oddHour fires from 00:00...
      oddHourEnd: 5                 // ...up to and including 05:59
    },

    // ---------- Bands and actions (R-4) ----------
    // A score belongs to the first band whose "below" it is under. Low < 40, Medium 40-69, High 70+.
    bands: [
      { id: "low", label: "Low risk", below: 40, action: "proceed",
        actionText: "The transfer can go ahead." },
      { id: "medium", label: "Medium risk", below: 70, action: "pause-verify",
        actionText: "Pause the transfer and check the caller first." },
      { id: "high", label: "High risk", below: Infinity, action: "pause-and-case",
        actionText: "Pause the transfer. A bank officer will review it before any money leaves." }
    ],

    maxScore: 100,  // the score is capped here
    topReasons: 3   // how many reasons to show (R-3)
  },

  // ---------- Sample transfers for the demo screen ----------
  // Each transfer has the same fields the scorer and POST /api/risk/score take:
  //   payeeName             who the money goes to (shown only, not scored)
  //   amount                dollars being sent now
  //   usualAmount           the customer's typical transfer in dollars (0 if there is no history)
  //   hour                  hour of day the transfer is made, 0-23 (Singapore time)
  //   isNewPayee            true if the customer has never paid this payee before
  //   payeeAddedHoursAgo    how long ago the payee was added, in hours
  //   payeeFlagged          true if the payee's account has been reported for scams
  //   recentTransferMinutes how many minutes ago each of the customer's other recent transfers was made
  // "expect" is the band we designed each sample to land in. The tests check it.
  samples: [
    {
      id: "allowance",
      title: "Monthly allowance to my daughter",
      story: "Mdm Lim sends her daughter Rachel the usual $300 after dinner, like every month.",
      expect: "low",
      transfer: { payeeName: "Rachel Lim", amount: 300, usualAmount: 300, hour: 19,
        isNewPayee: false, payeeAddedHoursAgo: 9000, payeeFlagged: false, recentTransferMinutes: [] }
    },
    {
      id: "bill-split",
      title: "Paying friends back after a late dinner",
      story: "After a birthday supper, Mdm Lim pays three friends back $40 each, just after 1 am.",
      expect: "low",
      transfer: { payeeName: "Mrs Goh", amount: 40, usualAmount: 150, hour: 1,
        isNewPayee: false, payeeAddedHoursAgo: 5000, payeeFlagged: false, recentTransferMinutes: [4, 2] }
    },
    {
      id: "renovation",
      title: "Deposit for kitchen renovation",
      story: "Mdm Lim pays a $5,000 deposit to a contractor she added 3 days ago, after signing the quote.",
      expect: "medium",
      transfer: { payeeName: "Kim Seng Renovation", amount: 5000, usualAmount: 400, hour: 14,
        isNewPayee: true, payeeAddedHoursAgo: 72, payeeFlagged: false, recentTransferMinutes: [] }
    },
    {
      id: "marketplace",
      title: "Buying a used phone online",
      story: "Mdm Lim pays $150 to a seller on an online marketplace. Other people have reported this account.",
      expect: "medium",
      transfer: { payeeName: "J. Tan (marketplace seller)", amount: 150, usualAmount: 300, hour: 20,
        isNewPayee: true, payeeAddedHoursAgo: 48, payeeFlagged: true, recentTransferMinutes: [] }
    },
    {
      id: "grandma-scam",
      title: "\"Grandson\" in trouble with the police",
      story: "At 1 am a voice that sounds like her grandson says he is in police trouble and needs $8,000 now. " +
        "Mdm Lim moves money in from her savings twice, adds the new payee he gives her, and sends it.",
      expect: "high",
      transfer: { payeeName: "Lawyer Ong & Co", amount: 8000, usualAmount: 300, hour: 1,
        isNewPayee: true, payeeAddedHoursAgo: 0.2, payeeFlagged: false, recentTransferMinutes: [14, 6] }
    }
  ]
};

// Lets the Node server (server/) read the same settings. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = RISK_SCORER_DATA;
