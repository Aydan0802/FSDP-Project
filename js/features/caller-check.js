"use strict";

// Feature: Is the caller a real person? (Two-Way Senior Verification + Live Caller Progress Box)
// Owner: Yan Lin

(function () {
  const data = CALLER_CHECK_DATA;
  const scenarios = data.scenarios;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words

  function randomDigits(count) {
    let result = "";
    for (let i = 0; i < count; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function freshState() {
    return {
      view: "home", // home | gen-code | gen-check | recv-enter | recv-captcha | recv-done | result-ok | result-bad
      scenarioIndex: 0,
      options: shuffle(scenarios[0].options),
      inviteCode: "ZHONG-4821",
      matchDigits: "394 812",
      enteredCode: "",
      error: "",
      startedAt: Date.now(),
      pointerMoves: 0,
      // Caller progress simulation state for Step 2
      sim: "human",
      log: [],
      left: data.waitSeconds || 60,
      callerDone: false
    };
  }

  function myState() {
    if (!appState.callerCheck) appState.callerCheck = freshState();
    return appState.callerCheck;
  }

  function currentScenario(state) {
    return scenarios[state.scenarioIndex];
  }

  function setScenario(state, index) {
    state.scenarioIndex = index % scenarios.length;
    state.options = shuffle(scenarios[state.scenarioIndex].options);
    state.startedAt = Date.now();
    state.pointerMoves = 0;
    state.error = "";
  }

  // Timers for live caller progress & countdown
  let timers = [];
  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  // Redraw guard so router.js redrawScreen() preserves current step
  let redrawing = false;
  function draw() {
    redrawing = true;
    try {
      redrawScreen();
    } finally {
      redrawing = false;
    }
  }

  // Track natural cursor movement for human-vs-bot timing protection
  document.addEventListener("pointermove", function () {
    if (appState.callerCheck) {
      appState.callerCheck.pointerMoves++;
    }
  }, { passive: true });

  function renderCardGrid(options, actionName) {
    return `
      <div class="rp-grid">
        ${options.map(opt => `
          <button type="button" class="rp-card" data-cc="${actionName}" data-id="${opt.id}" aria-label="${t(opt.title)}, ${t(opt.hint)}">
            ${opt.type === "mj"
              ? `<span class="rp-mj-tile ${opt.color}" aria-hidden="true">${opt.char}<span class="rp-mj-sub">${opt.sub}</span></span>`
              : `<span class="rp-kopi-icon" aria-hidden="true">${icon(opt.icon)}</span>`}
            <span class="rp-cap-title">${t(opt.title)}</span>
            <span class="rp-cap-hint">${t(opt.hint)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  // The picture the caller has to name, as a small icon next to its name.
  // Food pictures use their own icon; mahjong tiles use the plain tile icon.
  function stampIcon(sc) {
    const target = sc.options.find(opt => opt.id === sc.callerTarget);
    return icon((target && target.icon) || "tile");
  }

  function callerLogHtml(state) {
    return state.log.length
      ? state.log.map(line => `<li>${line}</li>`).join("")
      : `<li>${t("cc.log.waiting")}</li>`;
  }

  function callerProgressBoxHtml(state) {
    const chip = (val, label) =>
      `<button type="button" class="chip" data-sim="${val}" aria-pressed="${state.sim === val}">${label}</button>`;

    return `
      <div class="cc-progress-wrap">
        <div class="cc-demo" role="group" aria-labelledby="cc-demo-title">
          <strong id="cc-demo-title">${t("cc.demo.title")}</strong>
          <div class="cc-demo-chips">
            ${chip("human", t("cc.demo.human"))}
            ${chip("ai", t("cc.demo.ai"))}
          </div>
        </div>

        <aside class="cc-caller" aria-labelledby="cc-caller-title">
          <div class="cc-caller-head">
            <span class="cc-tag">${t("cc.progress.tag")}</span>
            <span class="cc-timer-pill">${t("cc.progress.timeLeft", { seconds: `<strong id="cc-left">${state.left}</strong>` })}</span>
          </div>
          <h2 id="cc-caller-title">${t("cc.progress.title")}</h2>
          <ol id="cc-log" aria-live="polite">${callerLogHtml(state)}</ol>
        </aside>
      </div>
    `;
  }

  function runCallerProgress() {
    clearTimers();
    const state = myState();
    const sc = currentScenario(state);
    state.log = [];
    state.left = data.waitSeconds || 60;
    state.callerDone = false;

    const script = data.callerScripts[state.sim].map(([ms, key]) => [
      ms,
      t(key, { code: state.inviteCode, prompt: t(sc.callerPrompt) })
    ]);

    const logEl = () => document.getElementById("cc-log");
    const leftEl = () => document.getElementById("cc-left");

    if (logEl()) logEl().innerHTML = callerLogHtml(state);
    if (leftEl()) leftEl().textContent = state.left;

    let i = 0;
    function step() {
      if (state.view !== "gen-check" || !logEl()) return;
      state.log.push(script[i][1]);
      logEl().innerHTML = callerLogHtml(state);
      i += 1;
      if (i < script.length) {
        later(step, script[i][0]);
      } else {
        later(finish, 800);
      }
    }

    function finish() {
      if (state.view !== "gen-check" || !logEl()) return;
      state.callerDone = true;
      if (state.sim === "human") {
        state.log.push(t("cc.log.done", { stamp: t(sc.stamp), digits: state.matchDigits }));
      } else {
        state.log.push(t("cc.log.failed"));
      }
      logEl().innerHTML = callerLogHtml(state);
    }

    function countdown() {
      if (state.view !== "gen-check") return;
      const el = leftEl();
      if (!el) return;
      if (state.callerDone) return;
      state.left = Math.max(0, state.left - 1);
      el.textContent = state.left;
      if (state.left === 0) {
        state.log.push(t("cc.log.timedOut", { seconds: data.waitSeconds || 60 }));
        if (logEl()) logEl().innerHTML = callerLogHtml(state);
        return;
      }
      later(countdown, 1000);
    }

    later(step, script[0][0]);
    later(countdown, 1000);
  }

  function bodyHtml(state) {
    const sc = currentScenario(state);

    // 1. HOME ENTRY
    if (state.view === "home") {
      return `
        <section class="panel" data-read>
          <h1 tabindex="-1">${t("cc.title")}</h1>
          <p class="lead">${t("cc.choose")}</p>
          <div class="role-grid">
            <button type="button" class="role-card primary-role" data-cc="start-gen">
              <span class="role-icon" aria-hidden="true">${icon("code")}</span>
              <span>
                <strong>${t("cc.gen.title")}</strong>
                <span class="sub">${t("cc.gen.sub")}</span>
              </span>
            </button>

            <button type="button" class="role-card" data-cc="start-recv">
              <span class="role-icon" aria-hidden="true">${icon("keypad")}</span>
              <span>
                <strong>${t("cc.recv.title")}</strong>
                <span class="sub">${t("cc.recv.sub")}</span>
              </span>
            </button>
          </div>

          <div class="how-box">
            <p class="how-title">${t("cc.how.title")}</p>
            <ol>
              <li>${t("cc.how.1", { button: t("cc.gen.title") })}</li>
              <li>${t("cc.how.2")}</li>
              <li>${t("cc.how.3")}</li>
            </ol>
          </div>
        </section>
      `;
    }

    // 2A. GENERATOR STEP 1 (Read the code out)
    if (state.view === "gen-code") {
      const chars = state.inviteCode.split("");
      return `
        <div class="cc-page-top">
          <button type="button" class="btn btn-link" data-cc="home">← ${t("cc.back")}</button>
        </div>
        <section class="panel" data-read>
          <div class="pill-row">
            <span class="step-pill">${t("cc.step1of2")}</span>
            <span class="theme-pill">${icon(sc.icon)}${t(sc.theme)}</span>
          </div>
          <h1 tabindex="-1">${t("cc.code.title")}</h1>
          <div class="cc-code">${state.inviteCode}</div>
          <p class="cc-say-label">${t("cc.code.say")}</p>
          <div class="cc-say-pills" aria-hidden="true">
            ${chars.map(ch => ch === "-" ? `<span class="pill-dash">${t("cc.code.dash")}</span>` : `<span>${ch}</span>`).join("")}
          </div>
          <p class="lead">${t("cc.code.ask", { button: t("cc.recv.title") })}</p>
          <button type="button" class="btn btn-primary" data-cc="said-code">${t("cc.code.said")}</button>
        </section>
      `;
    }

    // 2B. GENERATOR STEP 2 (Check what the caller reads back + Live Caller Progress Box)
    if (state.view === "gen-check") {
      return `
        <div class="cc-page-top">
          <button type="button" class="btn btn-link" data-cc="back-code">← ${t("cc.backToCode")}</button>
        </div>
        <section class="panel" data-read>
          <div class="pill-row">
            <span class="step-pill">${t("cc.step2of2")}</span>
            <span class="theme-pill">${icon(sc.icon)}${t(sc.theme)}</span>
          </div>
          <h1 tabindex="-1">${t("cc.check.title")}</h1>
          <p class="lead">${t("cc.check.lead")}</p>

          <div class="verify-box">
            <p class="cc-expected-label">${t("cc.check.expected")}</p>
            <div class="stamp-box">${stampIcon(sc)}${t(sc.stamp)} &nbsp;|&nbsp; ${state.matchDigits}</div>
            <div class="stack">
              <button type="button" class="btn btn-primary" data-cc="verify-yes">${t("cc.check.yes")}</button>
              <button type="button" class="btn btn-secondary" data-cc="verify-no">${t("cc.check.no")}</button>
            </div>
          </div>

          ${callerProgressBoxHtml(state)}
        </section>
      `;
    }

    // 3A. RECEIVER / CALLER STEP 1 (Enter Code)
    if (state.view === "recv-enter") {
      return `
        <div class="cc-page-top">
          <button type="button" class="btn btn-link" data-cc="home">← ${t("cc.back")}</button>
        </div>
        <section class="panel" data-read>
          <div class="pill-row">
            <span class="step-pill">${t("cc.recvStep1")}</span>
          </div>
          <h1 tabindex="-1">${t("cc.enter.title")}</h1>
          <p class="lead">${t("cc.enter.lead")}</p>

          <label for="cc-code-in" class="visually-hidden">${t("cc.enter.label")}</label>
          <input type="text" id="cc-code-in" class="code-input" value="${escapeHtml(state.enteredCode)}" placeholder="${escapeHtml(t("cc.enter.placeholder", { code: "ZHONG-4821" }))}" maxlength="10" autocomplete="off">
          ${state.error ? `<p class="cc-error" role="alert">${t(state.error)}</p>` : ""}

          <div class="quick-fill">
            <span><strong>${t("cc.enter.demo")}</strong></span>
            <button type="button" class="chip" data-cc="fill-code">${t("cc.enter.useCode", { code: state.inviteCode })}</button>
          </div>

          <button type="button" class="btn btn-primary" data-cc="submit-code">${t("cc.next")}</button>
        </section>
      `;
    }

    // 3B. RECEIVER / CALLER STEP 2 (Live Picture Challenge)
    if (state.view === "recv-captcha") {
      return `
        <div class="cc-page-top">
          <button type="button" class="btn btn-link" data-cc="start-recv">← ${t("cc.back")}</button>
        </div>
        <section class="panel" data-read>
          <div class="pill-row">
            <span class="step-pill">${t("cc.recvStep2")}</span>
            <span class="theme-pill">${icon(sc.icon)}${t(sc.theme)}</span>
          </div>
          <h1 tabindex="-1">${t(sc.callerPrompt)}</h1>
          <p class="lead">${t("cc.pick.lead")}</p>
          ${state.error ? `<p class="cc-error" role="alert">${t(state.error)}</p>` : ""}
          ${renderCardGrid(state.options, "pick-recv")}
        </section>
      `;
    }

    // 3C. RECEIVER / CALLER STEP 3 (Read Stamp & 6 Digits Back)
    if (state.view === "recv-done") {
      return `
        <div class="cc-page-top">
          <button type="button" class="btn btn-link" data-cc="home">← ${t("cc.done")}</button>
        </div>
        <section class="panel" data-read>
          <div class="pill-row">
            <span class="step-pill">${t("cc.recvStep3")}</span>
            <span class="theme-pill">${icon(sc.icon)}${t(sc.theme)}</span>
          </div>
          <h1 tabindex="-1">${t("cc.finish.title")}</h1>
          <p class="lead">${t("cc.finish.lead")}</p>
          <div class="stamp-box">${t("cc.finish.picture")} ${stampIcon(sc)}${t(sc.stamp)}</div>
          <div class="cc-code">${state.matchDigits}</div>
          <button type="button" class="btn btn-secondary" data-cc="home">${t("cc.backToStart")}</button>
        </section>
      `;
    }

    // 4A. OUTCOME — REAL PERSON VERIFIED
    if (state.view === "result-ok") {
      return `
        <section data-read>
          <div class="verdict v-good">${icon("check")}<div><p><strong>${t("cc.ok.tag")}</strong></p><h1 tabindex="-1">${t("cc.ok.title")}</h1></div></div>
          <div class="panel">
            <p class="cc-warning"><strong>${t("cc.ok.warn")}</strong></p>
            <p>${t("cc.ok.note")}</p>
          </div>
        </section>
        <div class="stack">
          <a class="btn btn-primary" href="#call-match">${t("cc.ok.callMatch")}</a>
          <button type="button" class="btn btn-secondary" data-cc="home">${t("cc.done")}</button>
        </div>
      `;
    }

    // 4B. OUTCOME — CHECK FAILED / HANG UP WARNING
    return `
      <section data-read>
        <div class="verdict v-bad">${icon("warning")}<div><p><strong>${t("cc.bad.tag")}</strong></p><h1 tabindex="-1">${t("cc.bad.title")}</h1></div></div>
        <div class="panel">
          <p>${t("cc.bad.text")}</p>
          <p>${t("cc.bad.hang")}</p>
        </div>
      </section>
      <div class="stack">
        <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}${t("common.callOcbcNumber", { phone: OCBC_PHONE })}</a>
        <a class="btn btn-secondary" href="#report/call">${t("cc.bad.report")}</a>
        <button type="button" class="btn btn-link" data-cc="home">${t("cc.tryAgain")}</button>
      </div>
    `;
  }

  function screenHtml() {
    clearTimers();
    if (!redrawing) appState.callerCheck = freshState();
    const state = myState();
    return customerPageHtml("", `<div class="narrow cc-screen">${bodyHtml(state)}</div>`);
  }

  function afterRender() {
    const state = myState();
    const screen = document.querySelector(".cc-screen");
    if (!screen) return;

    screen.addEventListener("click", function (event) {
      // Demo toggle between Real Person and AI Voice Bot
      const simBtn = event.target.closest("[data-sim]");
      if (simBtn) {
        state.sim = simBtn.dataset.sim;
        screen.querySelectorAll("[data-sim]").forEach(b => b.setAttribute("aria-pressed", String(b === simBtn)));
        runCallerProgress();
        return;
      }

      const actionBtn = event.target.closest("[data-cc]");
      if (!actionBtn) return;

      const act = actionBtn.dataset.cc;

      if (act === "home") {
        clearTimers();
        state.view = "home";
        state.error = "";
        draw();
      } else if (act === "start-gen") {
        const idx = Math.floor(Math.random() * scenarios.length);
        setScenario(state, idx);
        const sc = currentScenario(state);
        state.inviteCode = `${sc.prefix}-${randomDigits(4)}`;
        state.matchDigits = `${randomDigits(3)} ${randomDigits(3)}`;
        state.view = "gen-code";
        draw();
      } else if (act === "said-code") {
        state.view = "gen-check";
        draw();
        runCallerProgress();
      } else if (act === "back-code") {
        clearTimers();
        state.view = "gen-code";
        draw();
      } else if (act === "verify-yes") {
        clearTimers();
        state.view = "result-ok";
        draw();
      } else if (act === "verify-no") {
        clearTimers();
        state.view = "result-bad";
        draw();
      } else if (act === "start-recv") {
        clearTimers();
        state.enteredCode = "";
        state.error = "";
        state.view = "recv-enter";
        draw();
      } else if (act === "fill-code") {
        state.enteredCode = state.inviteCode;
        state.error = "";
        draw();
      } else if (act === "submit-code") {
        const input = document.getElementById("cc-code-in");
        const val = (input ? input.value : state.enteredCode).trim().toUpperCase();
        if (!val || val.length < 4) {
          state.error = "cc.err.noCode";
          draw();
          return;
        }
        state.enteredCode = val;
        const matchedIdx = scenarios.findIndex(s => val.startsWith(s.prefix));
        if (matchedIdx !== -1) {
          setScenario(state, matchedIdx);
        } else {
          state.options = shuffle(currentScenario(state).options);
          state.startedAt = Date.now();
          state.pointerMoves = 0;
        }
        state.error = "";
        state.view = "recv-captcha";
        draw();
      } else if (act === "pick-recv") {
        const elapsed = Date.now() - state.startedAt;
        if (event.detail > 0 && elapsed < 250 && state.pointerMoves === 0) {
          state.error = "cc.err.tooFast";
          draw();
          return;
        }
        const sc = currentScenario(state);
        if (actionBtn.dataset.id === sc.callerTarget) {
          state.error = "";
          state.view = "recv-done";
        } else {
          state.error = "cc.err.wrong";
        }
        draw();
      }
    });

    screen.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && event.target && event.target.id === "cc-code-in") {
        event.preventDefault();
        const nextBtn = screen.querySelector('[data-cc="submit-code"]');
        if (nextBtn) nextBtn.click();
      }
    });
  }

  registerRoute({
    name: "caller-check",
    role: "public",
    render: screenHtml,
    afterRender
  });
})();