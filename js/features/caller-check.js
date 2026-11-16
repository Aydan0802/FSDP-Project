"use strict";

// Feature: Is the caller a real person? (Senior Mahjong & Kopitiam CAPTCHA + AI Detection)
// Owner: Yan Lin

(function () {
  const data = CALLER_CHECK_DATA;
  const STEP_OF = { captcha: 1, code: 2, waiting: 3, otp: 4 };

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickScenario() {
    const list = (data && data.scenarios) || [];
    const base = list[Math.floor(Math.random() * list.length)];
    return { ...base, options: shuffle(base.options) };
  }

  function freshState() {
    return {
      phase: "captcha",
      scenario: pickScenario(),
      startedAt: Date.now(),
      pointerMoves: 0,
      wrong: false,
      botFlagged: false,
      code: "",
      sim: "human",
      log: [],
      left: (data && data.waitSeconds) || 60,
      otp: ""
    };
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

  // Track natural pointer movement to detect instant headless bot clicks
  document.addEventListener("pointermove", () => {
    if (appState.callerCheck && appState.callerCheck.phase === "captcha") {
      appState.callerCheck.pointerMoves++;
    }
  }, { passive: true });

  // ---------- Screens ----------
  function topHtml(phase) {
    const step = STEP_OF[phase];
    return `
      <div class="page-top" style="display:flex;justify-content:space-between;align-items:center;">
        ${homeLinkHtml()}
        ${phase === "captcha" ? `<button type="button" class="chip" data-cc="swap">Change puzzle</button>` : ""}
      </div>
      ${step ? `<p class="step-dots cc-steps">${[1, 2, 3, 4].map(n => `<i class="${n <= step ? "on" : ""}" aria-hidden="true"></i>`).join("")}Step ${step} of 4</p>` : ""}`;
  }

  function captchaHtml(state) {
    const sc = state.scenario;
    return `
      <section class="panel" data-read>
        <span class="rp-theme-pill">${sc.theme}</span>
        <h1 tabindex="-1">First, a quick check for you</h1>
        <p class="lead">Tap the right picture below to get a secret code. You will read it to the caller—AI voice bots cannot solve live picture puzzles.</p>
        <h2 id="cc-puzzle-title">${sc.prompt}</h2>
      </section>
      <p class="field-error" id="cc-wrong" role="alert">
        ${state.botFlagged ? "That tap was faster than humanly possible! Please tap normally." : state.wrong ? `Not that one, take your time! Look for: ${sc.prompt.replace("Tap the ", "")}.` : ""}
      </p>
      <div class="rp-grid" role="group" aria-labelledby="cc-puzzle-title">
        ${sc.options.map(opt => `
          <button type="button" class="rp-card" data-picture="${opt.id}" aria-label="${opt.title}, ${opt.hint}">
            ${opt.type === "mj"
              ? `<span class="rp-mj-tile ${opt.color}" aria-hidden="true">${opt.char}<span class="rp-mj-sub">${opt.sub}</span></span>`
              : `<span class="rp-kopi-icon" aria-hidden="true">${opt.emoji}</span>`}
            <span class="rp-cap-title">${opt.title}</span>
            <span class="rp-cap-hint">${opt.hint}</span>
          </button>`).join("")}
      </div>`;
  }

  function codeHtml(state) {
    const chars = state.code.replace("-", "").split("");
    return `
      <section class="panel" data-read>
        <p class="rp-theme-pill">Unlocked! Stamp: ${state.scenario.stamp}</p>
        <h1 tabindex="-1">Read this code to the caller</h1>
        <p class="cc-code"><span aria-hidden="true">${state.code}</span><span class="visually-hidden">${spelled(state.code)}</span></p>
        <div class="cc-say">
          <span>Say it slowly, one by one:</span>
          <div class="cc-say-pills" aria-hidden="true">
            ${chars.map(ch => `<span>${ch}</span>`).join("")}
          </div>
        </div>
        <p>Ask them to open the OCBC Verify page, type this code in, and solve their own live Mahjong or Kopi puzzle.</p>
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
        <section class="panel cc-wait-box" data-read>
          <h1 tabindex="-1">Waiting for the caller…</h1>
          <p class="lead">They have <span class="cc-timer-pill"><strong id="cc-left">${state.left}</strong>s</span> to type your code <strong>${state.code}</strong> and solve the live puzzle.</p>
          <div class="cc-wait-status">
            <span class="spin" aria-hidden="true"></span>
            <span>Analysing caller response &amp; puzzle…</span>
          </div>
        </section>
        ${callerViewHtml(state)}
      </div>`;
  }

  function otpHtml(state) {
    return `
      <div class="cc-split">
        <section class="panel" data-read>
          <h1 tabindex="-1">The caller finished the check</h1>
          <p>Ask the caller to read <strong>both</strong> their picture stamp and their 6-digit number to you:</p>
          <div class="rp-stamp-box">Stamp: ${state.scenario.stamp}</div>
          <p class="cc-code">${state.otp.slice(0, 3)} ${state.otp.slice(3)}</p>
          <h2 id="cc-match-title">Do both match what they said?</h2>
          <div class="stack answer-btns" role="group" aria-labelledby="cc-match-title">
            <button type="button" class="btn btn-secondary" data-cc="same">Yes, both match</button>
            <button type="button" class="btn btn-secondary" data-cc="different">No, it is different</button>
          </div>
        </section>
        ${callerViewHtml(state)}
      </div>`;
  }

  function matchedHtml(state) {
    return `
      <section data-read>
        <div class="verdict v-good">${icon("check")}<div><p><strong>Real person</strong></p><h1 tabindex="-1">The caller is a real person</h1></div></div>
        <div class="panel">
          <p>They solved the live visual puzzle with natural human timing and matched your <strong>${state.scenario.stamp}</strong> stamp.</p>
          <p class="cc-warning"><strong>This does not show they are from OCBC. Never share your OTP or send money.</strong></p>
        </div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="#call-match">Check if OCBC is really calling</a>
        <a class="btn btn-secondary" href="#customer">Back to home</a>
      </div>`;
  }

  function failedHtml(state) {
    const why = state.phase === "failed"
      ? "They could not see or solve the live Kopitiam/Mahjong visual puzzle in time."
      : "Their picture stamp or number did not match yours.";
    return `
      <section data-read>
        <div class="verdict v-bad">${icon("warning")}<div><p><strong>Check failed</strong></p><h1 tabindex="-1">The caller could not pass the check. Hang up.</h1></div></div>
        <div class="panel">
          <p>${why} This may be an <strong>AI voice bot</strong> or someone you should not trust.</p>
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
    if (!redrawing) appState.callerCheck = freshState();
    const state = myState();
    const body = {
      captcha: captchaHtml,
      code: codeHtml,
      waiting: waitingHtml,
      otp: otpHtml,
      matched: matchedHtml,
      mismatch: failedHtml,
      failed: failedHtml
    }[state.phase](state);
    return customerPageHtml("", `<div class="narrow cc-screen">${topHtml(state.phase)}${body}</div>`);
  }

  // ---------- Caller Simulation ----------
  function runCaller() {
    clearTimers();
    const state = myState();
    state.log = [];
    state.left = data.waitSeconds || 60;

    const script = data.callerScripts[state.sim].map(([ms, text]) => [
      ms,
      text
        .replace("{code}", state.code)
        .replace("{callerPrompt}", state.scenario.callerPrompt)
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
        state.otp = randomDigits(6);
        state.log.push(`Their screen now shows: <strong>${state.scenario.stamp}</strong> &amp; <strong>${state.otp.slice(0, 3)} ${state.otp.slice(3)}</strong>`);
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
      const picture = event.target.closest("[data-picture]");
      if (picture) {
        const elapsed = Date.now() - state.startedAt;
        // Behavioral bot check: flag instant zero-pointer-movement clicks (< 250ms)
        if (event.detail > 0 && elapsed < 250 && state.pointerMoves === 0) {
          state.botFlagged = true;
          state.startedAt = Date.now();
          document.getElementById("cc-wrong").textContent = "That tap was faster than humanly possible! Please tap normally.";
          return;
        }

        if (picture.dataset.picture === state.scenario.targetId) {
          state.phase = "code";
          state.wrong = false;
          state.botFlagged = false;
          state.code = `${state.scenario.prefix}-${randomDigits(4)}`;
          draw();
        } else {
          state.wrong = true;
          document.getElementById("cc-wrong").textContent = `Not that one, take your time! Look for: ${state.scenario.prompt.replace("Tap the ", "")}.`;
        }
        return;
      }

      const sim = event.target.closest("[data-sim]");
      if (sim) {
        state.sim = sim.dataset.sim;
        screen.querySelectorAll("[data-sim]").forEach(b => b.setAttribute("aria-pressed", String(b === sim)));
        runCaller();
        return;
      }

      const action = event.target.closest("[data-cc]")?.dataset.cc;
      if (action === "swap" || action === "again") { appState.callerCheck = freshState(); draw(); }
      if (action === "told") { state.phase = "waiting"; draw(); runCaller(); }
      if (action === "sms") showToast("Code sent by SMS (demo)");
      if (action === "same") { state.phase = "matched"; draw(); }
      if (action === "different") { state.phase = "mismatch"; draw(); }
    });
  }

  registerRoute({
    name: "caller-check",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();