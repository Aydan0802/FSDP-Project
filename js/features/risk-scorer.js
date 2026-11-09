"use strict";

// Feature: Check a transfer.
// Owner: Jose
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "risk-scorer",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Check a transfer",
      "Enter a transfer, or pick a scenario, to see how risky it looks before you send it.",
      "customer", "Back to home"))
  });
})();
