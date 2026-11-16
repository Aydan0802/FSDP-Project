"use strict";

// Feature: Verify a Caller (Is the caller a real person?)
// Owner: Yan Lin

(function () {
  // ---------------- Local Fallbacks (if core helpers differ) ----------------
  const RP_ICONS = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    warning: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>'
  };

  function rpIcon(name) {
    if (typeof window.icon === "function") return window.icon(name);
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RP_ICONS[name] || ""}</svg>`;
  }

  function rpDigits(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // ---------------- Senior-Friendly Mahjong & Kopitiam Scenarios ----------------
  const SCENARIOS = [
    {
      theme: "🀄 Mahjong Table Check",
      prefix: "ZHONG",
      prompt: "Tap the Red Dragon (中) tile",
      callerPrompt: "Tap the Red Dragon (中) tile",
      targetId: "zhong",
      stamp: "🀄 Red Dragon (中)",
      options: [
        { id: "zhong", type: "mj", char: "中", color: "rp-mj-red", sub: "ZHONG", title: "Red Dragon", hint: "Red middle tile" },
        { id: "fa", type: "mj", char: "發", color: "rp-mj-green", sub: "FA", title: "Green Fortune", hint: "Green prosperity tile" },
        { id: "dong", type: "mj", char: "東", color: "rp-mj-blue", sub: "DONG", title: "East Wind", hint: "Blue wind tile" },
        { id: "wan", type: "mj", char: "萬", color: "rp-mj-red", sub: "WAN", title: "Ten Thousand", hint: "Character suit" }
      ]
    },
    {
      theme: "☕ Kopitiam Breakfast Check",
      prefix: "KOPI",
      prompt: "Tap the Hot Kopi",
      callerPrompt: "Tap the Half-Boiled Eggs",
      targetId: "kopi",
      stamp: "☕ Hot Kopi",
      options: [
        { id: "kopi", type: "kopi", emoji: "☕", title: "Hot Kopi", hint: "Traditional sock coffee" },
        { id: "toast", type: "kopi", emoji: "🍞", title: "Kaya Toast", hint: "Crispy bread with butter" },
        { id: "eggs", type: "kopi", emoji: "🥚", title: "Half-Boiled Eggs", hint: "With dark soy sauce" },
        { id: "teh", type: "kopi", emoji: "🧋", title: "Teh Peng", hint: "Iced milk tea" }
      ]
    },
    {
      theme: "🀄 Mahjong Winning Tile",
      prefix: "HUAT",
      prompt: "Tap the Green Fortune (發) tile",
      callerPrompt: "Tap the East Wind (東) tile",
      targetId: "fa",
      stamp: "🀄 Green Fortune (發)",
      options: [
        { id: "fa", type: "mj", char: "發", color: "rp-mj-green", sub: "FA", title: "Green Fortune", hint: "Huat ah! Green tile" },
        { id: "zhong", type: "mj", char: "中", color: "rp-mj-red", sub: "ZHONG", title: "Red Dragon", hint: "Red middle tile" },
        { id: "bai", type: "mj", char: "白", color: "rp-mj-blue", sub: "BAI", title: "White Board", hint: "Blue frame tile" },
        { id: "nan", type: "mj", char: "南", color: "rp-mj-blue", sub: "NAN", title: "South Wind", hint: "South direction" }
      ]
    },
    {
      theme: "🥮 Afternoon Tea Check",
      prefix: "KUEH",
      prompt: "Tap the Curry Puff",
      callerPrompt: "Tap the Chinese Tea Pot",
      targetId: "puff",
      stamp: "🥟 Crispy Curry Puff",
      options: [
        { id: "puff", type: "kopi", emoji: "🥟", title: "Curry Puff", hint: "Crispy flaky pastry" },
        { id: "tea", type: "kopi", emoji: "🫖", title: "Chinese Tea", hint: "Hot Pu-erh pot" },
        { id: "pineapple", type: "kopi", emoji: "🍍", title: "Pineapple Tart", hint: "Festive sweet treat" },
        { id: "nasilemak", type: "kopi", emoji: "🍛", title: "Nasi Lemak", hint: "Fragrant coconut rice" }
      ]
    }
  ];

  function pickScenario() {
    const base = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    return { ...base, options: shuffle(base.options) };
  }

  // ---------------- Feature State & Timers ----------------
  let st = null;
  let timers = [];

  function clearRpTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function resetState() {
    clearRpTimers();
    st = {
      phase: "captcha",
      scenario: pickScenario(),
      startedAt: Date.now(),
      pointerMoves: 0,
      sim: "human",
      wrong: false,
      botFlagged: false,
      code: "",
      otp: "",
      log: [],
      left: 60
    };
  }
  resetState();

  function isOnRoute() {
    return location.hash.includes("real-person") || !!document.getElementById("rp-root");
  }

  function reRender() {
    const root = document.getElementById("rp-root");
    if (root) {
      root.innerHTML = innerHtml();
    } else if (typeof window.render === "function") {
      window.render();
    }
  }

  // Track natural pointer movement to detect headless/instant automated bot clicks
  document.addEventListener("pointermove", () => {
    if (st && st.phase === "captcha") st.pointerMoves++;
  }, { passive: true });

  // ---------------- Caller Simulation Engine ----------------
  function runCallerCheck() {
    clearRpTimers();
    st.log = [];
    st.left = 60;

    const humanScript = [
      [1200, `Caller opened OCBC Verify and entered <strong>${st.code}</strong>`],
      [1400, `Live puzzle shown: <em>"${st.scenario.callerPrompt}"</em>`],
      [2000, `Natural cursor movement detected <span class="rp-tel-badge rp-tel-ok">Human Timing: 2.0s</span>`],
      [1300, `Solved puzzle & unlocked <strong>${st.scenario.stamp}</strong>`]
    ];

    const aiScript = [
      [1100, `Voice-to-text transcribed code <strong>${st.code}</strong>`],
      [1300, `Live puzzle shown: <em>"${st.scenario.callerPrompt}"</em>`],
      [1700, `⚠️ Long audio pause (AI trying to parse image) <span class="rp-tel-badge rp-tel-bot">Bot Latency: 3.9s</span>`],
      [1700, `Blindly tapped wrong tiles twice — <strong>Blocked by AI Guard</strong>`]
    ];

    const script = st.sim === "human" ? humanScript : aiScript;
    let i = 0;

    const step = () => {
      if (!isOnRoute() || st.phase !== "waiting") return;
      if (i < script.length) {
        st.log.push(script[i][1]);
        i++;
        reRender();
        if (i < script.length) later(step, script[i][0]);
        else later(finish, 900);
      }
    };

    const finish = () => {
      if (!isOnRoute() || st.phase !== "waiting") return;
      if (st.sim === "human") {
        st.otp = rpDigits(6);
        st.log.push(`Caller screen shows: <strong>${st.scenario.stamp}</strong> & <strong>${st.otp.slice(0, 3)} ${st.otp.slice(3)}</strong>`);
        st.phase = "otp";
      } else {
        st.phase = "failed";
      }
      reRender();
    };

    const countdown = () => {
      if (!isOnRoute() || st.phase !== "waiting") return;
      st.left = Math.max(0, st.left - 1);
      const el = document.getElementById("rp-left");
      if (el) el.textContent = st.left;
      if (st.left === 0) {
        st.phase = "failed";
        reRender();
        return;
      }
      later(countdown, 1000);
    };

    later(step, script[0][0]);
    later(countdown, 1000);
  }

  // ---------------- View Renderer ----------------
  function innerHtml() {
    const steps = { captcha: 1, code: 2, waiting: 3, otp: 4 };
    const topNav = `
      <div class="page-top">
        <a class="btn btn-link" href="#customer">${rpIcon("back")}Back to home</a>
        ${st.phase === "captcha" ? `<button type="button" class="chip" data-rp-act="swap">${rpIcon("refresh")}Change puzzle</button>` : ""}
      </div>
      ${steps[st.phase] ? `<p class="step-dots" style="margin-bottom:.75rem">${[1, 2, 3, 4].map(n => `<i class="${n <= steps[st.phase] ? "on" : ""}"></i>`).join("")}&nbsp;Step ${steps[st.phase]} of 4</p>` : ""}`;

    // STEP 1: Senior Mahjong / Kopitiam CAPTCHA
    if (st.phase === "captcha") {
      const sc = st.scenario;
      return `${topNav}
        <section class="card" data-read>
          <span class="rp-theme-pill">${sc.theme}</span>
          <h1 tabindex="-1">First, a quick check for you</h1>
          <p class="lead">Tap the right picture below to get a secret code. You will read it to the caller—AI voice bots cannot solve live picture puzzles.</p>
          <h2>${sc.prompt}</h2>
          ${st.wrong ? `<p class="error" role="alert">Not that one, take your time! Look for: <strong>${sc.prompt.replace("Tap the ", "")}</strong>.</p>` : ""}
          ${st.botFlagged ? `<p class="error" role="alert">That tap was faster than humanly possible! Please tap normally.</p>` : ""}
          <div class="rp-grid">
            ${sc.options.map(opt => `
              <button type="button" class="rp-card" data-rp-act="cap" data-id="${opt.id}" aria-label="${opt.title}, ${opt.hint}">
                ${opt.type === "mj"
                  ? `<span class="rp-mj-tile ${opt.color}" aria-hidden="true">${opt.char}<span class="rp-mj-sub">${opt.sub}</span></span>`
                  : `<span class="rp-kopi-icon" aria-hidden="true">${opt.emoji}</span>`}
                <span class="rp-cap-title">${opt.title}</span>
                <span class="rp-cap-hint">${opt.hint}</span>
              </button>`).join("")}
          </div>
        </section>`;
    }

    // STEP 2: Read Code to Caller
    if (st.phase === "code") {
      return `${topNav}
        <section class="card" data-read>
          <span class="calm">${rpIcon("check")}Unlocked! Session stamp: ${st.scenario.stamp}</span>
          <h1 tabindex="-1">Read this code to the caller</h1>
          <div class="big-code" aria-label="Code ${st.code.replace("-", " ")}">${st.code}</div>
          <p class="speak-code">Say it slowly: <strong>${st.code.replace("-", " ").split("").join(" ")}</strong></p>
          <p>Ask them to open the <strong>OCBC Verify</strong> page, type this code in, and solve their own live Mahjong or Kopi puzzle.</p>
          <div class="stack">
            <button type="button" class="btn btn-primary btn-block" data-rp-act="told">I have told them the code</button>
            <button type="button" class="btn btn-secondary btn-block" data-rp-act="again">Get a new code</button>
          </div>
        </section>`;
    }

    // STEP 3 & 4: Live Detection & Mutual Match
    if (st.phase === "waiting" || st.phase === "otp") {
      const demoSwitch = `
        <div class="demo-switch" role="group" aria-label="Demo: who is calling?">
          <strong>Demo — who is on the phone?</strong>
          <button type="button" class="chip" data-rp-act="sim" data-v="human" aria-pressed="${st.sim === "human"}">👤 Real OCBC Officer</button>
          <button type="button" class="chip" data-rp-act="sim" data-v="ai" aria-pressed="${st.sim === "ai"}">🤖 AI Voice Scammer</button>
        </div>`;

      const callerPanel = `
        <aside class="caller-view" aria-label="Caller screen simulation">
          <span class="tag">Demo: Caller's Screen</span>
          <h2>OCBC Verify Page</h2>
          <ol>${st.log.map(line => `<li>${line}</li>`).join("") || "<li>Waiting for caller to open page...</li>"}</ol>
        </aside>`;

      const customerPanel = st.phase === "waiting" ? `
        <section class="card" data-read>
          <h1 tabindex="-1">Waiting for the caller...</h1>
          <p>Checking if they can solve a live visual puzzle within <strong id="rp-left">${st.left}</strong> seconds.</p>
          <ul class="progress-list">
            <li class="now"><span class="spin" aria-hidden="true"></span><span>Analysing caller response & puzzle</span></li>
          </ul>
        </section>` : `
        <section class="card" data-read>
          <h1 tabindex="-1">The caller finished the check</h1>
          <p>Ask the caller to read <strong>both</strong> their picture stamp and their 6-digit number to you:</p>
          <div class="rp-stamp-box">Stamp: ${st.scenario.stamp}</div>
          <div class="big-code">${st.otp.slice(0, 3)} ${st.otp.slice(3)}</div>
          <h2>Do both match what they said?</h2>
          <div class="stack answer-btns">
            <button type="button" class="btn btn-secondary btn-block" data-rp-act="otp" data-v="yes">Yes, both match</button>
            <button type="button" class="btn btn-secondary btn-block" data-rp-act="otp" data-v="no">No, it is different</button>
          </div>
        </section>`;

      return `${topNav}${st.phase === "waiting" ? demoSwitch : ""}<div class="split">${customerPanel}${callerPanel}</div>`;
    }

    // RESULT: Verified Human
    if (st.phase === "matched") {
      return `${topNav}
        <section data-read>
          <div class="verdict v-good">${rpIcon("check")}<div><p><strong>Real person</strong></p><h1 tabindex="-1">The caller is a real person</h1></div></div>
          <div class="card">
            <p>They solved the live visual puzzle with natural human timing and matched your <strong>${st.scenario.stamp}</strong> stamp.</p>
            <p><strong>This does not prove they are from OCBC.</strong> Never share your OTP or move money because a caller asks.</p>
            <div class="stack">
              <a class="btn btn-primary btn-block" href="#call-match">Check if OCBC is really calling</a>
              <a class="btn btn-secondary btn-block" href="#customer">Back to home</a>
            </div>
          </div>
        </section>`;
    }

    // RESULT: Failed / Likely AI Voice Bot
    return `${topNav}
      <section data-read>
        <div class="verdict v-bad">${rpIcon("warning")}<div><p><strong>AI Voice / Check Failed</strong></p><h1 tabindex="-1">The caller could not pass the check</h1></div></div>
        <div class="card">
          <p>${st.phase === "failed"
            ? "They could not see or solve the live Kopitiam/Mahjong visual puzzle in time."
            : "Their picture stamp or number did not match yours."} This may be an <strong>AI voice bot</strong> or scammer.</p>
          <p><strong>Hang up now.</strong> Do not share any code or send money.</p>
          <div class="stack">
            <a class="btn btn-primary btn-block" href="tel:18003633333">${rpIcon("phone")}Call OCBC 1800 363 3333</a>
            <a class="btn btn-secondary btn-block" href="#report">Report this call</a>
            <button type="button" class="btn btn-link" data-rp-act="again">Start the check again</button>
          </div>
        </div>
      </section>`;
  }

  // ---------------- Delegated Click Handler ----------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rp-act]");
    if (!btn) return;

    const act = btn.dataset.rpAct;
    if (act === "swap" || act === "again") {
      resetState();
      reRender();
    } else if (act === "cap") {
      const elapsed = Date.now() - st.startedAt;
      // Flag synthetic zero-delay script clicks (< 250ms with zero pointer movement)
      if (e.detail > 0 && elapsed < 250 && st.pointerMoves === 0) {
        st.botFlagged = true;
        st.startedAt = Date.now();
        reRender();
        return;
      }
      if (btn.dataset.id === st.scenario.targetId) {
        st.phase = "code";
        st.wrong = false;
        st.botFlagged = false;
        st.code = `${st.scenario.prefix}-${rpDigits(3)}`;
        reRender();
      } else {
        st.wrong = true;
        reRender();
      }
    } else if (act === "told") {
      st.phase = "waiting";
      reRender();
      runCallerCheck();
    } else if (act === "sim") {
      st.sim = btn.dataset.v;
      reRender();
      runCallerCheck();
    } else if (act === "otp") {
      st.phase = btn.dataset.v === "yes" ? "matched" : "mismatch";
      reRender();
    }
  });

  // ---------------- Register Route with Team Router ----------------
  registerRoute({
    name: "real-person",
    role: "customer",
    render: () => {
      resetState();
      const content = `<div id="rp-root">${innerHtml()}</div>`;
      return typeof customerPageHtml === "function"
        ? customerPageHtml("", content)
        : content;
    }
  });
})();