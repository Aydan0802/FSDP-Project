"use strict";

// Feature: Coming soon (one shared screen for menu items outside this prototype).
// Owner: Aydan
// Makes one "Coming soon" screen for each item in COMING_SOON_DATA (js/data/coming-soon.js):
// My reports, Help, Trends, Scam types and Settings.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  // Builds the screen for one item. Customers get the customer frame and a way back home;
  // staff get the staff frame and a way back to the overview. The item's route is passed as
  // the "current" menu item, so it is highlighted in the menu.
  function comingSoonHtml(page) {
    const text = `Coming soon. ${page.text}`;
    if (page.role === "staff") {
      return staffPageHtml(page.route, stubHtml(page.title, text, "staff", "Back to overview"));
    }
    return customerPageHtml(page.route, stubHtml(page.title, text, "customer", "Back to home"));
  }

  COMING_SOON_DATA.forEach(page => {
    registerRoute({
      name: page.route,
      role: page.role,
      render: () => comingSoonHtml(page)
    });
  });
})();
