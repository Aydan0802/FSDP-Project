"use strict";

// Feature: Is the bank really calling? (the screen)
// Owner: Yan Lin

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