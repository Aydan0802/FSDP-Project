"use strict";

// Feature: Transfer risk scorer: the scoring logic (no screen).
// Owner: Jose. Jira FSDP-131 (R-2), FSDP-132 (R-3), FSDP-133 (R-4).
//
// The same file runs in two places:
//   - the browser, where it creates one global name, RISK_SCORER
//   - the Node server (server/app.js), which uses it for POST /api/risk/score (FSDP-134, R-5)
// So the page and the API can never give different scores for the same transfer.
// All weights, limits and bands come from RISK_SCORER_DATA.config (js/data/risk-scorer.js).
// Nothing in this file hard-codes a weight or a threshold.
//
// ======================= HOW TO USE IT (for teammates) =======================
//
//   const result = RISK_SCORER.scoreTransfer(transfer);
//
// transfer (all fields described in js/data/risk-scorer.js, "Sample transfers"):
//   { payeeName, amount, usualAmount, hour, isNewPayee, payeeAddedHoursAgo,
//     payeeFlagged, recentTransferMinutes }
//
// result:
//   {
//     score: 90,                     // whole number, 0-100
//     band: "high",                  // "low" (<40) | "medium" (40-69) | "high" (70+)
//     bandLabel: "High risk",
//     action: "pause-and-case",      // "proceed" | "pause-verify" | "pause-and-case"
//     actionText: "Pause the transfer. A bank officer will review it ...",
//     reasons: ["This is much more money than you usually send.", ...],   // top 3, plain English
//     signals: [{ id, label, weight, reason }, ...]   // every signal that fired, strongest first
//   }
//
// Jiliana (Pause-and-Verify): use result.band / result.action. "pause-verify" and
//   "pause-and-case" both mean: send the customer to #pause-verify. Show result.reasons there.
//   The last result is also kept in appState.riskScorer.lastResult.
// Wei Ye (Staff Triage Console): every High result becomes a case in
//   appState.riskScorer.cases (browser) and in the server's case list (GET /api/risk/cases).
//   Each case: { ref, createdAt, payeeName, amount, score, band, reasons }.
//
// The score is deterministic: it only depends on the transfer passed in. It never reads the
// clock or uses random numbers, so the same transfer always gets the same score.
// ===========================================================================

const RISK_SCORER = (function () {
  // The settings: from the global in the browser, or from the data file in Node
  function defaultConfig() {
    if (typeof RISK_SCORER_DATA !== "undefined") return RISK_SCORER_DATA.config;
    return require("../data/risk-scorer.js").config;
  }

  // One rule per signal id in the config. Each returns true if the signal fires.
  // The numbers the rules compare against come from config.limits.
  const RULES = {
    flaggedPayee: t => t.payeeFlagged === true,

    // No usual amount (a brand-new customer) means there is nothing to compare with
    amountVsUsual: (t, limits) => t.usualAmount > 0 && t.amount >= t.usualAmount * limits.amountMultiple,

    recentlyAddedPayee: (t, limits) => t.payeeAddedHoursAgo < limits.recentPayeeHours,

    // This transfer counts as one, plus every other transfer inside the time window
    rapidRepeat: (t, limits) => {
      const inWindow = t.recentTransferMinutes.filter(m => m <= limits.rapidRepeatWindowMinutes).length;
      return inWindow + 1 >= limits.rapidRepeatCount;
    },

    newPayee: t => t.isNewPayee === true,

    oddHour: (t, limits) => t.hour >= limits.oddHourStart && t.hour <= limits.oddHourEnd
  };

  // Checks a transfer has every field, of the right type. Returns a list of problems
  // (empty if the transfer is fine). The API turns these into a 400 response.
  function validateTransfer(t) {
    if (!t || typeof t !== "object" || Array.isArray(t)) return ["The transfer must be an object."];
    const problems = [];
    const isNum = v => typeof v === "number" && Number.isFinite(v);

    if (!isNum(t.amount) || t.amount <= 0) problems.push("amount must be a number above 0.");
    if (!isNum(t.usualAmount) || t.usualAmount < 0) problems.push("usualAmount must be a number, 0 or more.");
    if (!Number.isInteger(t.hour) || t.hour < 0 || t.hour > 23) problems.push("hour must be a whole number from 0 to 23.");
    if (typeof t.isNewPayee !== "boolean") problems.push("isNewPayee must be true or false.");
    if (!isNum(t.payeeAddedHoursAgo) || t.payeeAddedHoursAgo < 0) problems.push("payeeAddedHoursAgo must be a number, 0 or more.");
    if (typeof t.payeeFlagged !== "boolean") problems.push("payeeFlagged must be true or false.");
    if (!Array.isArray(t.recentTransferMinutes) || !t.recentTransferMinutes.every(m => isNum(m) && m >= 0)) {
      problems.push("recentTransferMinutes must be a list of numbers, 0 or more (it can be empty).");
    }
    if (t.payeeName !== undefined && (typeof t.payeeName !== "string" || t.payeeName.length > 80)) {
      problems.push("payeeName, if given, must be text of 80 characters or fewer.");
    }
    return problems;
  }

  // The band a score falls in: the first band whose "below" the score is under
  function bandFor(score, config) {
    return config.bands.find(b => score < b.below);
  }

  // Scores one transfer (R-2), picks the top reasons (R-3) and the band and action (R-4).
  // Throws if the transfer is invalid, so a bad call can never quietly score 0.
  function scoreTransfer(transfer, config = defaultConfig()) {
    const problems = validateTransfer(transfer);
    if (problems.length) throw new Error("Invalid transfer: " + problems.join(" "));

    // Which signals fire. config.signals is listed strongest first, and the sort below keeps
    // that order for equal weights, so the reasons always come out in the same order.
    const fired = config.signals
      .filter(signal => {
        const rule = RULES[signal.id];
        if (!rule) throw new Error(`No rule for signal "${signal.id}" in risk-scorer-logic.js`);
        return rule(transfer, config.limits);
      })
      .map(({ id, label, weight, reason }) => ({ id, label, weight, reason }))
      .sort((a, b) => b.weight - a.weight);

    const total = fired.reduce((sum, s) => sum + s.weight, 0);
    const score = Math.max(0, Math.min(config.maxScore, Math.round(total)));
    const band = bandFor(score, config);

    return {
      score,
      band: band.id,
      bandLabel: band.label,
      action: band.action,
      actionText: band.actionText,
      reasons: fired.slice(0, config.topReasons).map(s => s.reason),
      signals: fired
    };
  }

  return { scoreTransfer, validateTransfer };
})();

// Lets the Node server use the same code. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = RISK_SCORER;
