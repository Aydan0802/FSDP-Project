"use strict";

// Feature: Freeze my accounts.
// Owner: Jose
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "freeze",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Freeze my accounts",
      "Stop all payments from your accounts straight away if you shared a code or password.",
      "customer", "Back to home"))
  });
})();
