"use strict";

// Feature: Someone is calling me now (the stress flow). #calling-now, #calling-now/2, #calling-now/safe
// Owner: added on frontend-update (from the senior flow preview). Ask the team who looks after it.
// One instruction per screen, in short sentences, for someone who may be on a scam call:
//   step 1   "Hang up the phone now."           -> I have hung up / check who is calling first
//   step 2   "Did you give a code or send money?" -> No: the safe screen. Yes or Not sure: #freeze
//   safe     "Your money is safe."
// Each step has its own address, so the browser's Back button goes back one step.
// A "Call OCBC" bar stays at the bottom of every screen here (callBarHtml() in helpers.js).
//
// What it remembers (appState.callingNow, cleared by #reset):
//   step     the last step shown: "1", "2" or "safe"
//   answer   the answer to step 2: "no", "yes" or "unsure" ("" until answered)
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  function myState() {
    if (!appState.callingNow) appState.callingNow = { step: "1", answer: "" };
    return appState.callingNow;
  }

  // "Leave" on the left, "Step N of 2" on the right. The words say the same as the dots.
  function flowTopHtml(step) {
    return `<div class="flow-top">
        <a class="btn btn-link" href="#customer">Leave</a>
        <p class="step-dots"><i class="on" aria-hidden="true"></i><i class="${step >= 2 ? "on" : ""}" aria-hidden="true"></i>Step ${step} of 2</p>
      </div>`;
  }

  function stepOneHtml() {
    return `${flowTopHtml(1)}
      <section class="panel" data-read>
        <p class="calm">${icon("heart")}You are doing the right thing</p>
        <h1 tabindex="-1">Hang up the phone now.</h1>
        <p>It is safe to hang up. A real bank officer will not mind.</p>
        <ul class="rules">
          <li>${icon("cross")}<span>Do not share any code.</span></li>
          <li>${icon("cross")}<span>Do not send any money.</span></li>
        </ul>
        <div class="stack">
          <a class="btn btn-primary" href="#calling-now/2">I have hung up</a>
          <a class="btn btn-link" href="#caller-check">I want to check who is calling first</a>
        </div>
      </section>`;
  }

  function stepTwoHtml() {
    const answer = myState().answer;
    const choice = (value, label) =>
      `<button type="button" class="btn btn-secondary" data-answer="${value}" aria-pressed="${answer === value}">${label}</button>`;
    return `${flowTopHtml(2)}
      <section class="panel" data-read>
        <h1 tabindex="-1">Did you give a code or send money?</h1>
        <p>It is okay if you did. We can still help.</p>
        <div class="stack answer-btns" role="group" aria-label="Did you give a code or send money?">
          ${choice("no", "No, I did not")}
          ${choice("yes", "Yes, I did")}
          ${choice("unsure", "I am not sure")}
        </div>
      </section>
      <a class="btn btn-link" href="#calling-now">Back</a>`;
  }

  function safeHtml() {
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("check")}</div>
        <h1 tabindex="-1">Your money is safe.</h1>
        <p>If you want to check with the bank, call OCBC yourself. Use the number on the back of your card. Never call back the number that called you.</p>
        <div class="stack">
          <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}Call OCBC ${OCBC_PHONE}</a>
          <a class="btn btn-secondary" href="#report/call">Tell the bank about this call</a>
          <a class="btn btn-link" href="#customer">Back to home</a>
        </div>
      </section>`;
  }

  function screenHtml(param) {
    const state = myState();
    state.step = param === "2" || param === "safe" ? param : "1";
    const body = state.step === "2" ? stepTwoHtml() : state.step === "safe" ? safeHtml() : stepOneHtml();
    return customerPageHtml("", `<div class="narrow calling-now">${body}</div>${callBarHtml()}`);
  }

  // Step 2's answers: "No" goes to the safe screen, "Yes" and "Not sure" go to freezing the accounts
  function afterRender() {
    document.querySelectorAll("[data-answer]").forEach(button => {
      button.addEventListener("click", () => {
        myState().answer = button.dataset.answer;
        location.hash = button.dataset.answer === "no" ? "#calling-now/safe" : "#freeze";
      });
    });
  }

  registerRoute({
    name: "calling-now",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
