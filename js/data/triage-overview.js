"use strict";

// Made-up data for: Overview additions (staff). #staff
// Owner: Wei Ye
// Feeds the "Today in context" panel (js/features/triage-overview.js).
// Totals only, no customer details. The numbers are placeholders until real figures exist.

const OVERVIEW_CONTEXT = {
  // A usual day of each name: the average number of reports over the last 12 weeks
  usualDay: {
    Mon: { name: "Monday", reports: 8.3 },
    Tue: { name: "Tuesday", reports: 7.9 },
    Wed: { name: "Wednesday", reports: 7.9 },
    Thu: { name: "Thursday", reports: 8.6 },
    Fri: { name: "Friday", reports: 8.1 },
    Sat: { name: "Saturday", reports: 5.5 },
    Sun: { name: "Sunday", reports: 4.6 }
  },
  weeks: 12,

  // How much the checks were used today, next to a usual day (average over the last 12 weeks).
  // Totals only: how many checks were run, never who ran them.
  usage: { pauseChecks: 38, voiceChecks: 17, usualChecks: 46 },

  // Flags per month for the last 12 months, oldest first (the last one is the latest full month)
  months: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  flagsPerMonth: [87, 97, 95, 124, 112, 116, 131, 137, 156, 178, 216, 277],

  // Of the paused transfers each month, the percentage the customer cancelled themselves
  // after reading the warnings. Same 12 months, oldest first.
  cancelledPct: [30, 31, 31, 33, 34, 35, 36, 37, 39, 40, 38, 41]
};