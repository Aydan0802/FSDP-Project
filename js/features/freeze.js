"use strict";

// Feature: Freeze my accounts. #freeze
// Owner: Jose. Built on frontend-update from the senior flow preview (it was a stub).
// One big button stops all payments (in the demo, nothing really happens), then the customer
// is told to call OCBC and press 8. A "Call OCBC" bar stays at the bottom of the screen.
//
// What it remembers (appState.freeze, cleared by #reset):
//   frozen     true once the customer has pressed the button. It stays frozen for this visit.
//   frozenAt   the time it was frozen, e.g. "14:05"
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = FREEZE_DATA;

  function myState() {
    if (!appState.freeze) appState.freeze = { frozen: false, frozenAt: "" };
    return appState.freeze;
  }

  function askHtml() {
    return `
      <section class="panel" data-read>
        <p class="calm">${icon("heart")}Stay calm. Do this first.</p>
        <h1 tabindex="-1">Freeze your accounts now.</h1>
        <p>This stops any more money from leaving. You can unfreeze them later with the bank.</p>
        <div class="stack">
          <button type="button" class="btn btn-primary" id="freeze-now">${icon("lock")}Freeze my accounts</button>
          <a class="btn btn-link" href="${OCBC_TEL}">Or call OCBC ${OCBC_PHONE} and press ${data.hotlineKey}</a>
        </div>
      </section>`;
  }

  function frozenHtml() {
    const state = myState();
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("lock")}</div>
        <h1 tabindex="-1">Your accounts are frozen.</h1>
        <p>No more money can leave your accounts. Now call OCBC on ${OCBC_PHONE} and press ${data.hotlineKey}. Tell them what happened.</p>
        <ul class="reasons">
          ${data.frozenItems.map(item => `<li>${icon("lock")}<span>${item}</span></li>`).join("")}
        </ul>
        <div class="stack">
          <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}Call OCBC ${OCBC_PHONE}</a>
          <a class="btn btn-secondary" href="#report/sent">Write down what happened</a>
          <a class="btn btn-link" href="#customer">Back to home</a>
        </div>
      </section>
      <p class="note">Demo only: nothing is really frozen. Frozen at ${state.frozenAt} in this demo.</p>`;
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
