"use strict";

// Feature: Is the bank really calling? (the screen)
// Owner: Yan Lin
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Use matchCall() from js/features/call-match-logic.js (Jose) to do the checking.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "call-match",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Is the bank really calling?",
      "Type the caller's number or the officer's name to see if the bank really called you.",
      "customer", "Back to home"))
  });
})();