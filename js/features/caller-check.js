"use strict";

// Feature: Is the caller a real person? (Mahjong & Kopitiam picture check + AI detection)
// Owner: Yan Lin
// website-refresh: cut from 4 steps to 2, from the team's feedback that it was confusing.
// The customer no longer solves a puzzle themselves (they are not the one being checked):
//   step 1  "Read this code to the caller"  (the caller types it on the OCBC Verify page)
//   ...     a short wait while the caller solves a live picture puzzle there
//   step 2  "Did they say the same picture and number?"  Yes / No
// A real person can see and solve the picture puzzle; an AI voice bot can't, so it times out or
// reads back the wrong picture. The caller's side is simulated (demo), and its screen is folded
// away under "Demo: see the caller's screen" so it doesn't distract.
// Every word comes from t() (js/core/i18n.js); the words are in CALLER_CHECK_DATA.text.

(function () {
  const data = CALLER_CHECK_DATA;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words
  const STEP_OF = { code: 1, waiting: 2, otp: 2 };

  // A random puzzle theme. Its stamp (e.g. "Red Dragon") is the picture the caller must read back.
  function pickScenario() {
    const list = (data && data.scenarios) || [];
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomDigits(n) {
    let digits = "";
    for (let i = 0; i < n; i++) digits += Math.floor(Math.random() * 10);
    return digits;
  }

  function freshState() {
    const scenario = pickScenario();
    return {
      phase: "code",
      scenario,
      code: `${scenario.prefix}-${randomDigits(4)}`,
      sim: "human",          // demo only: is the simulated caller a real person or an AI bot?
      log: [],
      left: (data && data.waitSeconds) || 60,
      otp: randomDigits(6)   // the number shown on a real caller's screen after the puzzle
    };
  }

  function myState() {
    if (!appState.callerCheck) appState.callerCheck = freshState();
    return appState.callerCheck;
  }

  // "ZHONG-4821" read out as "Z H O N G 4 8 2 1" by screen readers
  function spelled(code) {
    return code.replace("-", "").split("").join(" ");
  }

  // ---------- Timers & Redraw Guard (matches router.js) ----------
  let timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  let redrawing = false;
  function draw() {
    redrawing = true;
    try { redrawScreen(); } finally { redrawing = false; }
  }

  // ---------- Screens ----------
  function topHtml(phase) {
    const step = STEP_OF[phase];
    return step
      ? `<p class="step-dots cc-steps">${[1, 2].map(n => `<i class="${n <= step ? "on" : ""}" aria-hidden="true"></i>`).join("")}${t("cc.stepOf", { step })}</p>`
      : "";
  }

  // Step 1: the code, big, and two short instructions
  function codeHtml(state) {
    const chars = state.code.replace("-", "").split("");
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("cc.code.title")}</h1>
        <p class="cc-code"><span aria-hidden="true">${state.code}</span><span class="visually-hidden">${spelled(state.code)}</span></p>
        <div class="cc-say">
          <span>${t("cc.code.say")}</span>
          <div class="cc-say-pills" aria-hidden="true">${chars.map(ch => `<span>${ch}</span>`).join("")}</div>
        </div>
        <ul class="points">
          <li>${t("cc.code.ask1")}</li>
          <li>${t("cc.code.ask2")}</li>
        </ul>
        <div class="stack">
          <button type="button" class="btn btn-primary" data-cc="told">${t("cc.told")}</button>
        </div>
      </section>`;
  }

  function callerLogHtml(state) {
    return state.log.length
      ? state.log.map(line => `<li>${line}</li>`).join("")
      : `<li>${t("cc.log.waiting")}</li>`;
  }

  // The simulated caller's screen, folded away: it is for showing judges how the check works
  function callerViewHtml(state) {
    return `
      <details class="cc-caller-fold">
        <summary>${t("cc.caller.show")}</summary>
        <div class="cc-caller">
          <span class="cc-tag">${t("cc.caller.tag")}</span>
          <h2>${t("cc.caller.title")}</h2>
          <ol id="cc-log" aria-live="polite">${callerLogHtml(state)}</ol>
        </div>
      </details>`;
  }

  function demoSwitchHtml(state) {
    const chip = (value, label) => `<button type="button" class="chip" data-sim="${value}" aria-pressed="${state.sim === value}">${label}</button>`;
    return `
      <div class="cc-demo" role="group" aria-labelledby="cc-demo-title">
        <strong id="cc-demo-title">${t("cc.demo.title")}</strong>
        ${chip("human", t("cc.demo.human"))}${chip("ai", t("cc.demo.ai"))}
      </div>`;
  }

  // Between the steps: waiting for the caller, with a countdown
  function waitingHtml(state) {
    const seconds = `<span class="cc-timer-pill"><strong id="cc-left">${state.left}</strong>s</span>`;
    return `
      <section class="panel cc-wait-box" data-read>
        <h1 tabindex="-1">${t("cc.wait.title")}</h1>
        <p class="lead">${t("cc.wait.lead", { seconds, code: `<strong>${state.code}</strong>` })}</p>
        <div class="cc-wait-status">
          <span class="spin" aria-hidden="true"></span>
          <span>${t("cc.wait.status")}</span>
        </div>
      </section>
      ${demoSwitchHtml(state)}
      ${callerViewHtml(state)}`;
  }

  // Step 2: what a real caller can read back, and one question
  function otpHtml(state) {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("cc.otp.title2")}</h1>
        <p>${t("cc.otp.ask2")}</p>
        <div class="rp-stamp-box">${t(state.scenario.stamp)}</div>
        <p class="cc-code">${state.otp.slice(0, 3)} ${state.otp.slice(3)}</p>
        <h2 id="cc-match-title">${t("cc.match.title")}</h2>
        <div class="stack answer-btns" role="group" aria-labelledby="cc-match-title">
          <button type="button" class="btn btn-secondary" data-cc="same">${t("cc.same")}</button>
          <button type="button" class="btn btn-secondary" data-cc="different">${t("cc.different")}</button>
        </div>
      </section>
      ${callerViewHtml(state)}`;
  }

  function matchedHtml() {
    return `
      <section data-read>
        <div class="verdict v-good">${icon("check")}<div><p><strong>${t("cc.ok.tag")}</strong></p><h1 tabindex="-1">${t("cc.ok.title")}</h1></div></div>
        <div class="panel">
          <ul class="points">
            <li>${t("cc.ok.line1")}</li>
            <li>${t("cc.ok.line2")}</li>
          </ul>
          <p class="cc-warning"><strong>${t("cc.ok.warning")}</strong></p>
        </div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="#call-match">${t("cc.ok.callMatch")}</a>
        <a class="btn btn-secondary" href="#customer">${t("common.backHome")}</a>
      </div>`;
  }

  function failedHtml(state) {
    const why = state.phase === "failed" ? t("cc.fail.timeout") : t("cc.fail.mismatch");
    return `
      <section data-read>
        <div class="verdict v-bad">${icon("warning")}<div><p><strong>${t("cc.fail.tag")}</strong></p><h1 tabindex="-1">${t("cc.fail.title")}</h1></div></div>
        <div class="panel">
          <ul class="points">
            <li>${why}</li>
            <li>${t("cc.ai.line")}</li>
            <li>${t("cc.fail.hangUp")}</li>
          </ul>
        </div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}${t("common.callOcbcNumber", { phone: OCBC_PHONE })}</a>
        <a class="btn btn-secondary" href="#report/call">${t("cc.fail.report")}</a>
        <button type="button" class="btn btn-link" data-cc="again">${t("cc.fail.again")}</button>
      </div>`;
  }

  function screenHtml() {
    clearTimers();
    if (!redrawing) appState.callerCheck = freshState();
    const state = myState();
    const body = {
      code: codeHtml,
      waiting: waitingHtml,
      otp: otpHtml,
      matched: matchedHtml,
      mismatch: failedHtml,
      failed: failedHtml
    }[state.phase](state);
    return customerPageHtml("", `<div class="narrow cc-screen">${topHtml(state.phase)}${body}</div>`);
  }

  // ---------- Caller Simulation (demo) ----------
  function runCaller() {
    clearTimers();
    const state = myState();
    state.log = [];
    state.left = data.waitSeconds || 60;

    // Each line is a translation key; t() fills in {code} and {callerPrompt}
    const script = data.callerScripts[state.sim].map(([ms, key]) => [
      ms,
      t(key, { code: state.code, callerPrompt: t(state.scenario.callerPrompt) })
    ]);

    const log = () => document.getElementById("cc-log");
    if (log()) log().innerHTML = callerLogHtml(state);
    const left = document.getElementById("cc-left");
    if (left) left.textContent = state.left;

    let i = 0;
    function step() {
      if (state.phase !== "waiting" || !log()) return;
      state.log.push(script[i][1]);
      log().innerHTML = callerLogHtml(state);
      i += 1;
      if (i < script.length) later(step, script[i][0]);
      else later(finish, 900);
    }

    function finish() {
      if (state.phase !== "waiting") return;
      if (state.sim === "human") {
        state.log.push(t("cc.log.shows", { stamp: t(state.scenario.stamp), otp: `${state.otp.slice(0, 3)} ${state.otp.slice(3)}` }));
        state.phase = "otp";
      } else {
        state.phase = "failed";
      }
      draw();
    }

    function countdown() {
      if (state.phase !== "waiting") return;
      const el = document.getElementById("cc-left");
      if (!el) return;
      state.left = Math.max(0, state.left - 1);
      el.textContent = state.left;
      if (state.left === 0) { state.phase = "failed"; draw(); return; }
      later(countdown, 1000);
    }

    later(step, script[0][0]);
    later(countdown, 1000);
  }

  // ---------- Event Binding ----------
  function afterRender() {
    const state = myState();
    const screen = document.querySelector(".cc-screen");
    if (!screen) return;

    screen.addEventListener("click", event => {
      const sim = event.target.closest("[data-sim]");
      if (sim) {
        state.sim = sim.dataset.sim;
        screen.querySelectorAll("[data-sim]").forEach(b => b.setAttribute("aria-pressed", String(b === sim)));
        runCaller();
        return;
      }

      const action = event.target.closest("[data-cc]")?.dataset.cc;
      if (action === "again") { appState.callerCheck = freshState(); draw(); }
      if (action === "told") { state.phase = "waiting"; draw(); runCaller(); }
      if (action === "same") { state.phase = "matched"; draw(); }
      if (action === "different") { state.phase = "mismatch"; draw(); }
    });
  }

  registerRoute({
    name: "caller-check",
    role: "public",   // open to everyone: no sign-in needed (website-refresh)
    render: screenHtml,
    afterRender
  });
})();
