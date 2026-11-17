"use strict";

// Feature: Is the caller a real person? (Senior Mahjong & Kopitiam CAPTCHA + AI Detection)
// Owner: Yan Lin

// Every word comes from t() (js/core/i18n.js); the words are in CALLER_CHECK_DATA.text.

(function () {
  const data = CALLER_CHECK_DATA;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words
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
        ${phase === "captcha" ? `<button type="button" class="chip" data-cc="swap">${t("cc.swap")}</button>` : ""}
      </div>
      ${step ? `<p class="step-dots cc-steps">${[1, 2, 3, 4].map(n => `<i class="${n <= step ? "on" : ""}" aria-hidden="true"></i>`).join("")}${t("cc.stepOf", { step })}</p>` : ""}`;
  }

  function captchaHtml(state) {
    const sc = state.scenario;
    return `
      <section class="panel" data-read>
        <span class="rp-theme-pill">${t(sc.theme)}</span>
        <h1 tabindex="-1">${t("cc.captcha.title")}</h1>
        <p class="lead">${t("cc.captcha.lead")}</p>
        <h2 id="cc-puzzle-title">${t(sc.prompt)}</h2>
      </section>
      <p class="field-error" id="cc-wrong" role="alert">
        ${state.botFlagged ? t("cc.bot") : state.wrong ? t("cc.wrong", { what: t(sc.lookFor) }) : ""}
      </p>
      <div class="rp-grid" role="group" aria-labelledby="cc-puzzle-title">
        ${sc.options.map(opt => `
          <button type="button" class="rp-card" data-picture="${opt.id}" aria-label="${t(opt.title)}, ${t(opt.hint)}">
            ${opt.type === "mj"
              ? `<span class="rp-mj-tile ${opt.color}" aria-hidden="true">${opt.char}<span class="rp-mj-sub">${opt.sub}</span></span>`
              : `<span class="rp-kopi-icon" aria-hidden="true">${opt.emoji}</span>`}
            <span class="rp-cap-title">${t(opt.title)}</span>
            <span class="rp-cap-hint">${t(opt.hint)}</span>
          </button>`).join("")}
      </div>`;
  }

  function codeHtml(state) {
    const chars = state.code.replace("-", "").split("");
    return `
      <section class="panel" data-read>
        <p class="rp-theme-pill">${t("cc.unlocked", { stamp: t(state.scenario.stamp) })}</p>
        <h1 tabindex="-1">${t("cc.code.title")}</h1>
        <p class="cc-code"><span aria-hidden="true">${state.code}</span><span class="visually-hidden">${spelled(state.code)}</span></p>
        <div class="cc-say">
          <span>${t("cc.code.say")}</span>
          <div class="cc-say-pills" aria-hidden="true">
            ${chars.map(ch => `<span>${ch}</span>`).join("")}
          </div>
        </div>
        <p>${t("cc.code.ask")}</p>
        <div class="stack">
          <button type="button" class="btn btn-primary" data-cc="told">${t("cc.told")}</button>
          <button type="button" class="btn btn-secondary" data-cc="sms">${t("cc.sms")}</button>
        </div>
      </section>`;
  }

  function callerLogHtml(state) {
    return state.log.length
      ? state.log.map(line => `<li>${line}</li>`).join("")
      : `<li>${t("cc.log.waiting")}</li>`;
  }

  function callerViewHtml(state) {
    return `
      <aside class="cc-caller" aria-labelledby="cc-caller-title">
        <span class="cc-tag">${t("cc.caller.tag")}</span>
        <h2 id="cc-caller-title">${t("cc.caller.title")}</h2>
        <ol id="cc-log" aria-live="polite">${callerLogHtml(state)}</ol>
      </aside>`;
  }

  function demoSwitchHtml(state) {
    const chip = (value, label) => `<button type="button" class="chip" data-sim="${value}" aria-pressed="${state.sim === value}">${label}</button>`;
    return `
      <div class="cc-demo" role="group" aria-labelledby="cc-demo-title">
        <strong id="cc-demo-title">${t("cc.demo.title")}</strong>
        ${chip("human", t("cc.demo.human"))}${chip("ai", t("cc.demo.ai"))}
      </div>`;
  }

  function waitingHtml(state) {
    const seconds = `<span class="cc-timer-pill"><strong id="cc-left">${state.left}</strong>s</span>`;
    return `
      ${demoSwitchHtml(state)}
      <div class="cc-split">
        <section class="panel cc-wait-box" data-read>
          <h1 tabindex="-1">${t("cc.wait.title")}</h1>
          <p class="lead">${t("cc.wait.lead", { seconds, code: `<strong>${state.code}</strong>` })}</p>
          <div class="cc-wait-status">
            <span class="spin" aria-hidden="true"></span>
            <span>${t("cc.wait.status")}</span>
          </div>
        </section>
        ${callerViewHtml(state)}
      </div>`;
  }

  function otpHtml(state) {
    return `
      <div class="cc-split">
        <section class="panel" data-read>
          <h1 tabindex="-1">${t("cc.otp.title")}</h1>
          <p>${t("cc.otp.ask")}</p>
          <div class="rp-stamp-box">${t("cc.stamp", { stamp: t(state.scenario.stamp) })}</div>
          <p class="cc-code">${state.otp.slice(0, 3)} ${state.otp.slice(3)}</p>
          <h2 id="cc-match-title">${t("cc.match.title")}</h2>
          <div class="stack answer-btns" role="group" aria-labelledby="cc-match-title">
            <button type="button" class="btn btn-secondary" data-cc="same">${t("cc.same")}</button>
            <button type="button" class="btn btn-secondary" data-cc="different">${t("cc.different")}</button>
          </div>
        </section>
        ${callerViewHtml(state)}
      </div>`;
  }

  function matchedHtml(state) {
    return `
      <section data-read>
        <div class="verdict v-good">${icon("check")}<div><p><strong>${t("cc.ok.tag")}</strong></p><h1 tabindex="-1">${t("cc.ok.title")}</h1></div></div>
        <div class="panel">
          <p>${t("cc.ok.text", { stamp: `<strong>${t(state.scenario.stamp)}</strong>` })}</p>
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
          <p>${t("cc.fail.text", { why })}</p>
          <p>${t("cc.fail.hangUp")}</p>
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
        state.otp = randomDigits(6);
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
      const picture = event.target.closest("[data-picture]");
      if (picture) {
        const elapsed = Date.now() - state.startedAt;
        // Behavioral bot check: flag instant zero-pointer-movement clicks (< 250ms)
        if (event.detail > 0 && elapsed < 250 && state.pointerMoves === 0) {
          state.botFlagged = true;
          state.startedAt = Date.now();
          document.getElementById("cc-wrong").textContent = t("cc.bot");
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
          document.getElementById("cc-wrong").textContent = t("cc.wrong", { what: t(state.scenario.lookFor) });
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
      if (action === "sms") showToast(t("cc.smsSent"));
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