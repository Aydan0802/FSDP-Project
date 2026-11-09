"use strict";

// Feature: Report a scam.
// Owner: Jose
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "report",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Report a scam",
      "Tell the bank what happened, in a few steps.",
      "customer", "Back to home"))
  });
})();
