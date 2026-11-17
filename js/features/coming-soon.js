"use strict";

// Feature: Coming soon (one shared screen for menu items outside this prototype).
// Owner: Aydan
// Makes one "Coming soon" screen for each item in COMING_SOON_DATA.pages (js/data/coming-soon.js):
// My reports, Help, Trends, Scam types and Settings.
// Every word comes from t() (js/core/i18n.js); the words are in COMING_SOON_DATA.text.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  addTranslations(COMING_SOON_DATA.text);   // this screen's English, Chinese and Malay words

  // Builds the screen for one item. Customers get the customer frame and a way back home;
  // staff get the staff frame and a way back to the overview. The item's route is passed as
  // the "current" menu item, so it is highlighted in the menu.
  // t() is called here, when the screen is drawn, so the words follow the language picked.
  function comingSoonHtml(page) {
    const text = t("soon.withText", { text: t(page.text) });
    if (page.role === "staff") {
      return staffPageHtml(page.route, stubHtml(t(page.title), text, "staff", t("soon.backOverview")));
    }
    return customerPageHtml(page.route, stubHtml(t(page.title), text, "customer", t("common.backHome")));
  }

  COMING_SOON_DATA.pages.forEach(page => {
    registerRoute({
      name: page.route,
      role: page.role,
      render: () => comingSoonHtml(page)
    });
  });
})();
