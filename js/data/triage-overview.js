"use strict";

// Made-up data for: Overview (staff). #staff
// Owner: Wei Ye
// The "reports" and "flagged activity" numbers on the Overview come from CASE_INSIGHTS_DATA
// (js/data/triage-console.js), so they always match the Flagged activity tab. This file only holds
// what that data doesn't have: how many checks customers used, and the "Results" breakdowns next to
// the chart. Totals only, no customer details.

const OVERVIEW_DATA = {
  // Checks used per day (pause checks and voice checks together), for the same last 14 days as
  // CASE_INSIGHTS_DATA.daily, oldest first. The last number is today.
  checksPerDay: [46, 49, 44, 31, 28, 48, 50, 51, 53, 47, 33, 30, 52, 55],

  // The box next to the chart. Each list must add up to the number on its panel: today's 6 reports,
  // this week's 37 reports and today's 55 checks. (Flagged activity is worked out from
  // CASE_INSIGHTS_DATA, so it always matches.) Results are the five shared ones, most worrying first.
  reportResults: {
    today: { likely: 2, partial: 1, uncertain: 1, unsure: 0, real: 2 },
    week:  { likely: 8, partial: 3, uncertain: 9, unsure: 4, real: 13 }
  },
  checksByTool: [
    { label: "Check a message or call", count: 22 },
    { label: "Check a transfer", count: 13 },
    { label: "Is the bank really calling?", count: 11 },
    { label: "Is the caller a real person?", count: 9 }
  ]
};