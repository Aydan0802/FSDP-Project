"use strict";

// Feature: Check a screenshot or document.
// Owner: Yan Lin

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
