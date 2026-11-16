"use strict";

// Feature: Is the bank really calling? (the screen). #call-match
// Owner: Yan Lin. Built on frontend-update from the senior flow preview (it was a stub).
// The customer types the number that called them (or taps a sample). Jose's matchCall()
// (js/features/call-match-logic.js) checks it against the calls OCBC really made.
//
// What it remembers (appState.callMatch, cleared by #reset):
//   phase    "input" or "result"
//   number   what is in the number box
//   error    the box's error, if any
//   result   what matchCall() returned: { matched, call }
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const esc = escapeHtml;
  addTranslations(CALL_MATCH_DATA.text);   // this screen's English, Chinese and Malay words

  function freshState() {
    return { phase: "input", number: "", error: "", result: null };
  }
  function myState() {
    if (!appState.callMatch) appState.callMatch = freshState();
    return appState.callMatch;
  }

  let redrawing = false;
  function draw() {
    redrawing = true;
    try { redrawScreen(); } finally { redrawing = false; }
  }

  function inputHtml(state) {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("cm.title")}</h1>
        <p class="lead">${t("cm.lead")}</p>
      </section>
      <form class="panel" id="cm-form" novalidate>
        <div class="field">
          <label for="cm-number">${t("cm.numberLabel")}</label>
          <input type="tel" id="cm-number" inputmode="tel" autocomplete="off" value="${esc(state.number)}"
            placeholder="${t("cm.placeholder")}" aria-describedby="cm-error"${state.error ? ' aria-invalid="true"' : ""}>
        </div>
        <p class="field-error" id="cm-error" role="alert">${esc(state.error)}</p>
        <div class="chips"><span class="chips-label">${t("cm.try")}</span>
          ${CALL_MATCH_DATA.sampleNumbers.map(n => `<button type="button" class="chip" data-number="${n}">${n}</button>`).join("")}
        </div>
        <div class="stack"><button type="submit" class="btn btn-primary">${t("cm.check")}</button></div>
      </form>`;
  }

  // The call's team, time and about come from Jose's matchCall() data in English; their
  // translations are looked up by the call's id (js/data/call-match-logic.js)
  function matchedHtml(call) {
    return `
      <section data-read>
        <div class="verdict v-good">${icon("check")}<div><p><strong>${t("cm.yes.tag")}</strong></p><h1 tabindex="-1">${t("cm.yes.title")}</h1></div></div>
        <div class="panel">
          <div class="summary-row"><span>${t("cm.officer")}</span><span>${esc(call.officer)}</span></div>
          <div class="summary-row"><span>${t("cm.team")}</span><span>${esc(t(`cml.call.${call.id}.team`))}</span></div>
          <div class="summary-row"><span>${t("cm.when")}</span><span>${esc(t(`cml.call.${call.id}.time`))}</span></div>
          <div class="summary-row"><span>${t("cm.about")}</span><span>${esc(t(`cml.call.${call.id}.about`))}</span></div>
          <p class="cm-warning">${t("cm.yes.warning")}</p>
        </div>
      </section>
      <div class="stack"><button type="button" class="btn btn-secondary" data-cm="again">${t("cm.again")}</button></div>`;
  }

  function noMatchHtml() {
    return `
      <section data-read>
        <div class="verdict v-bad">${icon("warning")}<div><p><strong>${t("cm.no.tag")}</strong></p><h1 tabindex="-1">${t("cm.no.title")}</h1></div></div>
        <div class="panel"><p>${t("cm.no.text")}</p></div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}${t("common.callOcbcNumber", { phone: OCBC_PHONE })}</a>
        <a class="btn btn-secondary" href="#caller-check">${t("cm.no.callerCheck")}</a>
        <a class="btn btn-secondary" href="#report/call">${t("cm.no.report")}</a>
        <button type="button" class="btn btn-link" data-cm="again">${t("cm.again")}</button>
      </div>`;
  }

  function screenHtml() {
    if (!redrawing) appState.callMatch = freshState();   // coming here from another screen starts again
    const state = myState();
    const body = state.phase === "input" ? inputHtml(state)
      : state.result.matched ? matchedHtml(state.result.call) : noMatchHtml();
    return customerPageHtml("", `<div class="narrow call-match">${homeLinkHtml()}${body}</div>`);
  }

  function afterRender() {
    const state = myState();
    const screen = document.querySelector(".call-match");
    screen.addEventListener("click", event => {
      if (event.target.closest('[data-cm="again"]')) {
        appState.callMatch = freshState();
        draw();
      }
    });

    const form = document.getElementById("cm-form");
    if (!form) return;
    const box = document.getElementById("cm-number");
    box.addEventListener("input", () => { state.number = box.value; });
    form.querySelectorAll("[data-number]").forEach(chip => {
      chip.addEventListener("click", () => {
        box.value = state.number = chip.dataset.number;
        box.focus();
      });
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (box.value.replace(/\D/g, "").length < 8) {
        state.error = t("cm.err.number");
        box.setAttribute("aria-invalid", "true");
        document.getElementById("cm-error").textContent = state.error;
        box.focus();
        return;
      }
      state.result = matchCall(box.value, "");
      state.phase = "result";
      state.error = "";
      draw();
    });
  }

  registerRoute({
    name: "call-match",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
