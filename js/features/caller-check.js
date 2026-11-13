"use strict";

// Feature: Is the caller a real person? (a code check that AI voice bots fail). #caller-check
// Owner: added on frontend-update (from the senior flow preview). Ask the team who looks after it.
// The customer:
//   1. taps the cup of kopi (a picture puzzle, so the customer's side is a real person too)
//   2. gets a code like KOPI-4821 to read to the caller (or send by SMS: demo only)
//   3. waits while the caller types the code on the "OCBC Verify page" and solves the same
//      kind of puzzle (60 seconds). A demo switch picks who is calling: a real person or an AI bot,
//      and a dark "caller's screen" panel plays out what the caller does.
//   4. a real person: both sides now show the same 6-digit number. "Does it match?"
//      an AI bot: it fails the puzzle, and the customer is told to hang up.
// Passing only shows the caller is a person, NOT that they are from OCBC. The success screen says so.
// DEMO: nothing is sent anywhere, and the caller's side is played by this file.
//
// What it remembers (appState.callerCheck, cleared by #reset):
//   phase   "captcha", "code", "waiting", "otp", then "matched", "mismatch" or "failed"
//   wrong   true after a wrong picture was tapped
//   code    the code to read to the caller, e.g. "KOPI-4821"
//   sim     who is calling in the demo: "human" or "ai"
//   log     what the caller has done so far, shown on the caller's screen
//   left    seconds left for the caller
//   otp     the 6-digit number both sides see when a real person passes
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = CALLER_CHECK_DATA;
  const STEP_OF = { captcha: 1, code: 2, waiting: 3, otp: 4 };

  function freshState() {
    return { phase: "captcha", wrong: false, code: "", sim: "human", log: [], left: data.waitSeconds, otp: "" };
  }
  function myState() {
    if (!appState.callerCheck) appState.callerCheck = freshState();
    return appState.callerCheck;
  }

  function randomDigits(n) {
    let digits = "";
    for (let i = 0; i < n; i++) digits += Math.floor(Math.random() * 10);
    return digits;
  }

  // "KOPI-4821" read out one letter or number at a time: "K O P I 4 8 2 1"
  function spelled(code) {
    return code.replace("-", "").split("").join(" ");
  }

  // ---------- Timers for the caller's side. All are stopped whenever the screen is drawn again. ----------

  let timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // Redraws this screen for the next step. render() knows not to start afresh.
  let redrawing = false;
  function draw() {
    redrawing = true;
    try { redrawScreen(); } finally { redrawing = false; }
  }

  // ---------- The screens ----------

  function topHtml(phase) {
    const step = STEP_OF[phase];
    return `${homeLinkHtml()}
      ${step ? `<p class="step-dots cc-steps">${[1, 2, 3, 4].map(n => `<i class="${n <= step ? "on" : ""}" aria-hidden="true"></i>`).join("")}Step ${step} of 4</p>` : ""}`;
  }

  function captchaHtml() {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">First, a quick check for you</h1>
        <p class="lead">We give you a code to read to the caller. A real person can use it. A computer voice usually cannot.</p>
        <h2 id="cc-puzzle-title">Tap the cup of kopi</h2>
      </section>
      <p class="field-error" id="cc-wrong" role="alert"></p>
      <div class="cc-captcha" role="group" aria-labelledby="cc-puzzle-title">
        ${data.pictures.map(p => `<button type="button" data-picture="${p.id}"><span class="cc-emoji" aria-hidden="true">${p.emoji}</span><span>${p.name}</span></button>`).join("")}
      </div>`;
  }

  function codeHtml(state) {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">Read this code to the caller</h1>
        <p class="cc-code"><span aria-hidden="true">${state.code}</span><span class="visually-hidden">${spelled(state.code)}</span></p>
        <p class="cc-say">Say it slowly: ${spelled(state.code)}</p>
        <p>Ask them to open the OCBC Verify page and type it in. They then solve a picture puzzle, like you did.</p>
        <div class="stack">
          <button type="button" class="btn btn-primary" data-cc="told">I have told them the code</button>
          <button type="button" class="btn btn-secondary" data-cc="sms">Send the code by SMS instead</button>
        </div>
      </section>`;
  }

  function callerLogHtml(state) {
    return state.log.length
      ? state.log.map(line => `<li>${line}</li>`).join("")
      : "<li>Waiting for the caller to open the page…</li>";
  }

  // The dark panel showing what the caller sees (demo only)
  function callerViewHtml(state) {
    return `
      <aside class="cc-caller" aria-labelledby="cc-caller-title">
        <span class="cc-tag">Demo: the caller's screen</span>
        <h2 id="cc-caller-title">OCBC Verify page</h2>
        <ol id="cc-log" aria-live="polite">${callerLogHtml(state)}</ol>
      </aside>`;
  }

  function demoSwitchHtml(state) {
    const chip = (value, label) => `<button type="button" class="chip" data-sim="${value}" aria-pressed="${state.sim === value}">${label}</button>`;
    return `
      <div class="cc-demo" role="group" aria-labelledby="cc-demo-title">
        <strong id="cc-demo-title">Demo: who is calling?</strong>
        ${chip("human", "A real person")}${chip("ai", "An AI voice bot")}
      </div>`;
  }

  function waitingHtml(state) {
    return `
      ${demoSwitchHtml(state)}
      <div class="cc-split">
        <section class="panel" data-read>
          <h1 tabindex="-1">Waiting for the caller…</h1>
          <p>They have <strong id="cc-left">${state.left}</strong> seconds to type the code and solve the puzzle.</p>
          <ul class="progress-list"><li class="now"><span class="spin" aria-hidden="true"></span><span>Waiting for the caller</span></li></ul>
        </section>
        ${callerViewHtml(state)}
      </div>`;
  }

  function otpHtml(state) {
    return `
      <div class="cc-split">
        <section class="panel" data-read>
          <h1 tabindex="-1">The caller finished the check</h1>
          <p>You and the caller now both have a 6-digit number. Ask them to read theirs to you.</p>
          <p class="cc-code">${state.otp.slice(0, 3)} ${state.otp.slice(3)}</p>
          <h2 id="cc-match-title">Does it match what they said?</h2>
          <div class="stack answer-btns" role="group" aria-labelledby="cc-match-title">
            <button type="button" class="btn btn-secondary" data-cc="same">Yes, it is the same</button>
            <button type="button" class="btn btn-secondary" data-cc="different">No, it is different</button>
          </div>
        </section>
        ${callerViewHtml(state)}
      </div>`;
  }

  function matchedHtml() {
    return `
      <section data-read>
        <div class="verdict v-good">${icon("check")}<div><p><strong>Real person</strong></p><h1 tabindex="-1">The caller is a real person</h1></div></div>
        <div class="panel">
          <p class="cc-warning"><strong>This does not show they are from OCBC. Never share your OTP or send money.</strong></p>
          <p>Scammers can be real people too.</p>
        </div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="#call-match">Check if OCBC is really calling</a>
        <a class="btn btn-secondary" href="#customer">Back to home</a>
      </div>`;
  }

  function failedHtml(state) {
    const why = state.phase === "failed" ? "They could not solve the puzzle in time." : "Their number did not match yours.";
    return `
      <section data-read>
        <div class="verdict v-bad">${icon("warning")}<div><p><strong>Check failed</strong></p><h1 tabindex="-1">The caller could not pass the check. Hang up.</h1></div></div>
        <div class="panel">
          <p>${why} This may be a computer (AI) voice, or someone you should not trust.</p>
          <p><strong>Hang up now.</strong> Do not share any code or send money.</p>
        </div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}Call OCBC ${OCBC_PHONE}</a>
        <a class="btn btn-secondary" href="#report/call">Report this call</a>
        <button type="button" class="btn btn-link" data-cc="again">Start the check again</button>
      </div>`;
  }

  function screenHtml() {
    clearTimers();
    if (!redrawing) appState.callerCheck = freshState();   // coming here from another screen starts again
    const state = myState();
    const body = {
      captcha: captchaHtml, code: codeHtml, waiting: waitingHtml, otp: otpHtml,
      matched: matchedHtml, mismatch: failedHtml, failed: failedHtml
    }[state.phase](state);
    return customerPageHtml("", `<div class="narrow cc-screen">${topHtml(state.phase)}${body}</div>`);
  }

  // ---------- The caller's side, played out in the demo ----------

  function runCaller() {
    clearTimers();
    const state = myState();
    state.log = [];
    state.left = data.waitSeconds;
    const script = data.callerScripts[state.sim].map(([ms, text]) => [ms, text.replace("{code}", state.code)]);
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
        state.otp = randomDigits(6);
        state.log.push(`Their screen now shows: ${state.otp.slice(0, 3)} ${state.otp.slice(3)}`);
        state.phase = "otp";
      } else {
        state.phase = "failed";
      }
      draw();
    }
    function countdown() {
      if (state.phase !== "waiting") return;
      const el = document.getElementById("cc-left");
      if (!el) return;   // the customer left this screen
      state.left = Math.max(0, state.left - 1);
      el.textContent = state.left;
      if (state.left === 0) { state.phase = "failed"; draw(); return; }
      later(countdown, 1000);
    }
    later(step, script[0][0]);
    later(countdown, 1000);
  }

  // ---------- Buttons ----------

  function afterRender() {
    const state = myState();
    const screen = document.querySelector(".cc-screen");

    screen.addEventListener("click", event => {
      const picture = event.target.closest("[data-picture]");
      if (picture) {
        if (picture.dataset.picture === data.answer) {
          state.phase = "code";
          state.code = `${data.codePrefix}-${randomDigits(4)}`;
          draw();
        } else {
          // Stay on the puzzle: say so, without moving focus away from the pictures
          document.getElementById("cc-wrong").textContent = "Not that one. Try again, there is no rush.";
        }
        return;
      }

      const sim = event.target.closest("[data-sim]");
      if (sim) {
        state.sim = sim.dataset.sim;
        screen.querySelectorAll("[data-sim]").forEach(b => b.setAttribute("aria-pressed", String(b === sim)));
        runCaller();   // the caller starts again with the new choice
        return;
      }

      const action = event.target.closest("[data-cc]")?.dataset.cc;
      if (action === "told") { state.phase = "waiting"; draw(); runCaller(); }
      if (action === "sms") showToast("Code sent by SMS (demo)");
      if (action === "same") { state.phase = "matched"; draw(); }
      if (action === "different") { state.phase = "mismatch"; draw(); }
      if (action === "again") { appState.callerCheck = freshState(); draw(); }
    });
  }

  registerRoute({
    name: "caller-check",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
