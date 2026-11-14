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
        <h1 tabindex="-1">Is the bank really calling?</h1>
        <p class="lead">Type the number that called you. We check it against the calls OCBC really made to you.</p>
      </section>
      <form class="panel" id="cm-form" novalidate>
        <div class="field">
          <label for="cm-number">Number that called you</label>
          <input type="tel" id="cm-number" inputmode="tel" autocomplete="off" value="${esc(state.number)}"
            placeholder="For example: 6363 3333" aria-describedby="cm-error"${state.error ? ' aria-invalid="true"' : ""}>
        </div>
        <p class="field-error" id="cm-error" role="alert">${esc(state.error)}</p>
        <div class="chips"><span class="chips-label">Try:</span>
          ${CALL_MATCH_DATA.sampleNumbers.map(n => `<button type="button" class="chip" data-number="${n}">${n}</button>`).join("")}
        </div>
        <div class="stack"><button type="submit" class="btn btn-primary">Check this number</button></div>
      </form>`;
  }

  function matchedHtml(call) {
    return `
      <section data-read>
        <div class="verdict v-good">${icon("check")}<div><p><strong>OCBC called you</strong></p><h1 tabindex="-1">Yes, this was a real OCBC call</h1></div></div>
        <div class="panel">
          <div class="summary-row"><span>Officer</span><span>${esc(call.officer)}</span></div>
          <div class="summary-row"><span>Team</span><span>${esc(call.team)}</span></div>
          <div class="summary-row"><span>When</span><span>${esc(call.time)}</span></div>
          <div class="summary-row"><span>About</span><span>${esc(call.about)}</span></div>
          <p class="cm-warning">Even so, OCBC will never ask for your OTP or ask you to move money. If they do, hang up.</p>
        </div>
      </section>
      <div class="stack"><button type="button" class="btn btn-secondary" data-cm="again">Check another number</button></div>`;
  }

  function noMatchHtml() {
    return `
      <section data-read>
        <div class="verdict v-bad">${icon("warning")}<div><p><strong>No record</strong></p><h1 tabindex="-1">OCBC did not call you from this number</h1></div></div>
        <div class="panel"><p>Scammers can make any number show on your phone. Hang up and call OCBC yourself.</p></div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}Call OCBC ${OCBC_PHONE}</a>
        <a class="btn btn-secondary" href="#caller-check">Check if the caller is even a real person</a>
        <a class="btn btn-secondary" href="#report/call">Report this number</a>
        <button type="button" class="btn btn-link" data-cm="again">Check another number</button>
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
        state.error = "Please type the 8-digit number that called you.";
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
