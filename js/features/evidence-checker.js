"use strict";

// Feature: Check a screenshot or document.
// Owner: Yan Lin
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "evidence",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Check a screenshot or document",
      "Upload a file or pick a sample to see if it could be faked.",
      "customer", "Back to home"))
  });
})();
