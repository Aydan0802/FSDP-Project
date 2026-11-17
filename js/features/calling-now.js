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
// Every word comes from t() (js/core/i18n.js); the words are in js/data/calling-now.js.

(function () {
  addTranslations(CALLING_NOW_DATA.text);   // this screen's English, Chinese and Malay words

  function myState() {
    if (!appState.callingNow) appState.callingNow = { step: "1", answer: "" };
    return appState.callingNow;
  }

  // "Leave" on the left, "Step N of 2" on the right. The words say the same as the dots.
  function flowTopHtml(step) {
    return `<div class="flow-top">
        <a class="btn btn-link" href="#customer">${t("cn.leave")}</a>
        <p class="step-dots"><i class="on" aria-hidden="true"></i><i class="${step >= 2 ? "on" : ""}" aria-hidden="true"></i>${t("cn.stepOf", { step })}</p>
      </div>`;
  }

  function stepOneHtml() {
    return `${flowTopHtml(1)}
      <section class="panel" data-read>
        <p class="calm">${icon("heart")}${t("cn.calm")}</p>
        <h1 tabindex="-1">${t("cn.hangUp.title")}</h1>
        <p>${t("cn.hangUp.text")}</p>
        <ul class="rules">
          <li>${icon("cross")}<span>${t("cn.rule.code")}</span></li>
          <li>${icon("cross")}<span>${t("cn.rule.money")}</span></li>
        </ul>
        <div class="stack">
          <a class="btn btn-primary" href="#calling-now/2">${t("cn.hungUp")}</a>
          <a class="btn btn-link" href="#caller-check">${t("cn.checkFirst")}</a>
        </div>
      </section>`;
  }

  function stepTwoHtml() {
    const answer = myState().answer;
    const choice = (value, label) =>
      `<button type="button" class="btn btn-secondary" data-answer="${value}" aria-pressed="${answer === value}">${label}</button>`;
    return `${flowTopHtml(2)}
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("cn.q.title")}</h1>
        <p>${t("cn.q.text")}</p>
        <div class="stack answer-btns" role="group" aria-label="${t("cn.q.title")}">
          ${choice("no", t("cn.q.no"))}
          ${choice("yes", t("cn.q.yes"))}
          ${choice("unsure", t("cn.q.unsure"))}
        </div>
      </section>
      <a class="btn btn-link" href="#calling-now">${t("cn.back")}</a>`;
  }

  function safeHtml() {
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("check")}</div>
        <h1 tabindex="-1">${t("cn.safe.title")}</h1>
        <ul class="points">
          <li>${t("cn.safe.1")}</li>
          <li>${t("cn.safe.2")}</li>
          <li>${t("cn.safe.3")}</li>
        </ul>
        <div class="stack">
          <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}${t("common.callOcbcNumber", { phone: OCBC_PHONE })}</a>
          <a class="btn btn-secondary" href="#report/call">${t("cn.safe.tell")}</a>
          <a class="btn btn-link" href="#customer">${t("common.backHome")}</a>
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
    role: "public",   // open to everyone: no sign-in needed (website-refresh)
    render: screenHtml,
    afterRender
  });
})();
