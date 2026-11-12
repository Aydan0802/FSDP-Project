"use strict";

// Feature: Family passphrase.
// Owner: Jiliana
// STUB: only a placeholder screen for now. Build the real screens here on your own branch.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  registerRoute({
    name: "passphrase",
    role: "customer",
    render: () => customerPageHtml("", stubHtml(
      "Family passphrase",
      "Set up a secret word your family can use to test callers, and look at it later.",
      "customer", "Back to home"))
  });
})();
