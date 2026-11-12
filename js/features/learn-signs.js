"use strict";

// Feature: Learn the signs.
// Owner: Jiliana
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "learn-signs",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Learn the signs",
      "A short guide to spotting AI scam calls and messages.",
      "customer", "Back to home"))
  });
})();
