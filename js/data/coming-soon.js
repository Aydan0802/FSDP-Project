"use strict";

// Made-up data for: Coming soon.
// Owner: Aydan
// The menu items that aren't part of this prototype. js/features/coming-soon.js makes one
// "Coming soon" screen for each. role says who may open it (see js/core/access.js).

const COMING_SOON_DATA = [
  { route: "my-reports", role: "customer", title: "My reports", text: "See the scams you have reported and what the bank did about them." },
  { route: "help", role: "customer", title: "Help", text: "Answers to common questions, and how to reach the bank." },
  { route: "staff-trends", role: "staff", title: "Trends", text: "How scam reports change over weeks and months." },
  { route: "staff-scam-types", role: "staff", title: "Scam types", text: "The kinds of scams being reported, and how often." },
  { route: "staff-settings", role: "staff", title: "Settings", text: "Your staff account and alert settings." }
];
