"use strict";

// Feature: Check a message or voice clip.
// Owner: Aydan
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "analyser",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Check a message or voice clip",
      "Paste a message or pick a voice clip to see if it could be made by AI.",
      "customer", "Back to home"))
  });
})();
