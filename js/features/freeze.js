"use strict";

// Feature: Freeze my accounts. #freeze
// Owner: Jose. Built on frontend-update from the senior flow preview (it was a stub).
// One big button stops all payments (in the demo, nothing really happens), then the customer
// is told to call OCBC and press 8. A "Call OCBC" bar stays at the bottom of the screen.
// Every word comes from t() (js/core/i18n.js), so it follows the language the customer picked.
//
// What it remembers (appState.freeze, cleared by #reset):
//   frozen     true once the customer has pressed the button. It stays frozen for this visit.
//   frozenAt   the time it was frozen, e.g. "14:05"
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = FREEZE_DATA;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words

  function myState() {
    if (!appState.freeze) appState.freeze = { frozen: false, frozenAt: "" };
    return appState.freeze;
  }

  function askHtml() {
    return `
      <section class="panel" data-read>
        <p class="calm">${icon("heart")}${t("fr.calm")}</p>
        <h1 tabindex="-1">${t("fr.title")}</h1>
        <p>${t("fr.why")}</p>
        <div class="stack">
          <button type="button" class="btn btn-primary" id="freeze-now">${icon("lock")}${t("fr.button")}</button>
          <a class="btn btn-link" href="${OCBC_TEL}">${t("fr.orCall", { phone: OCBC_PHONE, key: data.hotlineKey })}</a>
        </div>
      </section>`;
  }

  function frozenHtml() {
    const state = myState();
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("lock")}</div>
        <h1 tabindex="-1">${t("fr.done.title")}</h1>
        <p>${t("fr.done.text", { phone: OCBC_PHONE, key: data.hotlineKey })}</p>
        <ul class="reasons">
          ${data.frozenItems.map(key => `<li>${icon("lock")}<span>${t(key)}</span></li>`).join("")}
        </ul>
        <div class="stack">
          <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}${t("common.callOcbcNumber", { phone: OCBC_PHONE })}</a>
          <a class="btn btn-secondary" href="#report/sent">${t("fr.writeDown")}</a>
          <a class="btn btn-link" href="#customer">${t("common.backHome")}</a>
        </div>
      </section>
      <p class="note">${t("fr.demo", { time: state.frozenAt })}</p>`;
  }

  function screenHtml() {
    return customerPageHtml("", `<div class="narrow freeze">${myState().frozen ? frozenHtml() : askHtml()}</div>${callBarHtml()}`);
  }

  function afterRender() {
    const button = document.getElementById("freeze-now");
    if (!button) return;
    button.addEventListener("click", () => {
      const state = myState();
      state.frozen = true;
      state.frozenAt = new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: false });
      redrawScreen();   // the "frozen" screen, with focus on its heading
    });
  }

  registerRoute({
    name: "freeze",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
