"use strict";

// Feature: Pause and check the caller.
// Owner: Jiliana
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "pause-verify",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Pause and check the caller",
      "Answer a few quick questions while you wait, then we will tell you what to do next.",
      "customer", "Back to home"))
  });
})();
