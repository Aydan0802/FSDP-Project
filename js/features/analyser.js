"use strict";

// Feature: Check a message or voice clip (the analyser). #analyser, #analyser/message, #analyser/voice
// Owner: Aydan
// PLACEHOLDER: every part of this screen can be clicked through, but nothing is really checked.
// The results are the hand-written examples in js/data/analyser.js. Later, the real message
// checker and voice detector will hand back results in the same shape, and only checkMessage()
// and checkClip() below need to change.
// Nothing is saved or sent anywhere, and a chosen voice clip is never opened.
//
// What it remembers (appState.analyser, cleared by #reset):
//   tab        "message" or "voice": the tab that is open
//   text       what is in the message box
//   message    the message result on screen: { kind: "example", id } | { kind: "typed" } | { kind: "error" } | null
//   voice      { fileName, result }: the clip picked and its result key ("" while there is none)
//   voiceDemo  which of the five voice results the next clip check shows (the demo picker)
//   history    checks from this visit, newest first: { time, kind, label, level }
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = ANALYSER_DATA;
  const CHECK_MS = 900;   // how long "Checking…" shows, so people see the step happen
  const STEP_MS = 650;    // how long each voice-check step shows

  // Two icons only this screen uses, drawn in the same style as ICONS in js/core/helpers.js
  const MY_ICONS = {
    message: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/><path d="M8 9h8M8 12.5h5"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 14.5V20h15v-5.5"/>'
  };
  function myIcon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${MY_ICONS[name]}</svg>`;
  }

  // The icon that goes with each risk level (icon + words, never colour alone)
  const RISK_ICONS = { low: "check", medium: "warning", high: "warning" };

  // ---------- Small helpers ----------

  // Makes text safe to put inside HTML (the message box and file names come from the customer)
  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  // Waits a moment, so a "Checking…" step can be seen
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // "2,000" style numbers
  function count(n) {
    return n.toLocaleString("en-SG");
  }

  // The time now, e.g. "14:05", for the history list
  function timeNow() {
    return new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  // This feature's corner of appState, created the first time it's needed
  function myState() {
    if (!appState.analyser) {
      appState.analyser = {
        tab: "message", text: "", message: null,
        voice: { fileName: "", result: "" }, voiceDemo: "likely", history: []
      };
    }
    return appState.analyser;
  }

  function findExample(id) {
    return data.examples.find(ex => ex.id === id);
  }

  // ---------- The placeholder "checks" ----------
  // These stand in for the real message checker and voice detector. They only look things up.

  // A message: an example's own result if the text is exactly that example, otherwise the demo note
  function checkMessage(text) {
    const example = data.examples.find(ex => ex.text === text.trim());
    return example ? { kind: "example", id: example.id } : { kind: "typed" };
  }

  // A voice clip: whichever of the five results the demo picker is set to
  function checkClip() {
    return myState().voiceDemo;
  }

  // ---------- The screen ----------

  function tabHtml(name, iconHtml, title, text, selected) {
    return `<button type="button" class="an-tab" role="tab" id="an-tab-${name}" aria-controls="an-panel-${name}"
        aria-selected="${selected}" tabindex="${selected ? 0 : -1}" data-tab="${name}">
        <span class="an-tab-icon">${iconHtml}</span>
        <span class="an-tab-text"><strong>${title}</strong><span>${text}</span></span>
      </button>`;
  }

  function screenHtml(param) {
    const state = myState();
    if (param === "message" || param === "voice") state.tab = param;
    const onMessage = state.tab === "message";
    return customerPageHtml("", `
      <section class="an-intro" data-read>
        <p class="eyebrow">Before you reply, pay or call back</p>
        <h1 tabindex="-1">Check a message or voice clip</h1>
        <p class="an-lead">Not sure about a message or a voicemail? Check it here first. It only takes a moment.</p>
      </section>

      <div class="an-tabs" role="tablist" aria-label="What do you want to check?">
        ${tabHtml("message", myIcon("message"), "A message", "SMS, email or what a caller said", onMessage)}
        ${tabHtml("voice", icon("wave"), "A voice clip", "A voicemail or recording", !onMessage)}
      </div>
      <p class="visually-hidden" role="status" id="an-status"></p>

      <div class="an-panel" role="tabpanel" id="an-panel-message" aria-labelledby="an-tab-message"${onMessage ? "" : " hidden"}>
        ${messagePanelHtml()}
      </div>
      <div class="an-panel" role="tabpanel" id="an-panel-voice" aria-labelledby="an-tab-voice"${onMessage ? " hidden" : ""}>
        ${voicePanelHtml()}
      </div>

      <section class="panel an-history" aria-labelledby="an-history-title">
        <h2 id="an-history-title">Your checks today</h2>
        <div id="an-history">${historyInnerHtml()}</div>
      </section>

      <a class="btn btn-secondary btn-small an-back" href="#customer">Back to home</a>`);
  }

  // The grey box shown before there is a result, or while "checking"
  function emptyHtml(iconHtml, text) {
    return `<div class="an-empty">${iconHtml}<p>${text}</p></div>`;
  }
  function checkingHtml(text) {
    return `<div class="an-empty an-empty--busy"><span class="an-spinner an-spinner--big" aria-hidden="true"></span><p>${text}</p></div>`;
  }

  // ---------- Message tab ----------

  function messagePanelHtml() {
    const state = myState();
    return `
      <div class="an-grid">
        <form class="panel an-form" id="an-form" novalidate>
          <h2>Your message</h2>
          <label class="an-label" for="an-text">Paste the message, email or what the caller said</label>
          <textarea class="an-textarea" id="an-text" name="message" rows="7" spellcheck="false" autocomplete="off"
            aria-describedby="an-count an-text-error">${esc(state.text)}</textarea>
          <p class="an-count" id="an-count"></p>
          <p class="field-error" id="an-text-error" role="alert"></p>
          <button type="submit" class="btn btn-primary" id="an-check">Check this message ${icon("arrow")}</button>
          <p class="an-hint" id="an-hint">Paste a message first, or try an example below.</p>

          <h3 class="an-sub" id="an-examples-title">Or try an example</h3>
          <ul class="an-chips" aria-labelledby="an-examples-title">
            ${data.examples.map(ex => `<li><button type="button" class="an-chip" data-example="${ex.id}" lang="${ex.lang}">${esc(ex.chip)}</button></li>`).join("")}
          </ul>
          <p class="an-privacy">${icon("lock")}<span>Demo: nothing you type is checked, saved or sent.</span></p>
        </form>

        <div class="an-result-area" id="an-result">
          ${state.message ? messageResultHtml(state.message) : emptyHtml(myIcon("message"), "Your result will show here.")}
        </div>
      </div>

      <details class="an-demo">
        <summary>Demo only: show the error screens</summary>
        <div class="an-demo-row">
          <button type="button" class="btn btn-secondary btn-small" data-demo="fail">Check failed</button>
          <button type="button" class="btn btn-secondary btn-small" data-demo="long">Message too long</button>
        </div>
      </details>`;
  }

  // Three dots for low / medium / high. The words next to them say the same thing.
  function dotsHtml(level) {
    const filled = { low: 1, medium: 2, high: 3 }[level];
    return `<span class="an-dots" aria-hidden="true">${[1, 2, 3].map(n => `<span${n <= filled ? ' class="on"' : ""}></span>`).join("")}</span>`;
  }

  function messageResultHtml(msg) {
    if (msg.kind === "error") return errorHtml();
    const example = msg.kind === "example" && findExample(msg.id);
    if (!example) return typedHtml();

    const r = example.result;
    const words = data.labels[example.lang] || data.labels.en;
    const typeName = words.types[r.type] || data.labels.en.types[r.type];
    const steps = r.steps || data.nextSteps[r.type] || [];
    return `
      <section class="panel an-result an-result--${r.risk}" aria-labelledby="an-result-title">
        <div class="an-result-top">
          <span class="an-risk an-risk--${r.risk}" lang="${example.lang}">${icon(RISK_ICONS[r.risk])}${words.risk[r.risk]}</span>
          <span class="an-demo-tag">Demo result</span>
        </div>
        <div class="an-result-body" lang="${example.lang}">
          <div data-read>
            <p class="an-looks">${words.looksLike}</p>
            <h2 id="an-result-title" tabindex="-1">${esc(typeName)}</h2>
            <p class="an-summary">${esc(r.summary)}</p>
            <p class="an-sure">${words.howSure}: <strong>${words.sure[r.confidence]}</strong>${dotsHtml(r.confidence)}</p>
          </div>

          <h3>${words.flagsTitle}</h3>
          ${r.flags.length
            ? highlightedHtml(example.text, r.flags)
            : `<blockquote class="an-message">${esc(example.text)}</blockquote>
               <p class="an-none">${icon("check")}<span>${words.noFlags}</span></p>`}

          <div data-read>
            <h3>${words.stepsTitle}</h3>
            <ol class="an-steps">${steps.map(step => `<li>${esc(step)}</li>`).join("")}</ol>
          </div>
        </div>
        ${actionsHtml("message")}
        <p class="an-honesty" lang="${example.lang}">${icon("question")}<span>${words.honesty}</span></p>
      </section>`;
  }

  // The message with each warning phrase marked. A mark shows its reason when hovered, focused
  // or tapped. The numbered list underneath says the same, so nothing depends on hovering.
  function highlightedHtml(text, flags) {
    // Where each phrase starts, in reading order. Phrases not found, or overlapping the one before, are skipped.
    const sorted = flags.map(f => ({ ...f, at: text.indexOf(f.phrase) })).filter(m => m.at >= 0).sort((a, b) => a.at - b.at);
    const marks = [];
    sorted.forEach(m => {
      const last = marks[marks.length - 1];
      if (!last || m.at >= last.at + last.phrase.length) marks.push(m);
    });

    let html = "";
    let pos = 0;
    marks.forEach((m, i) => {
      const n = i + 1;
      html += esc(text.slice(pos, m.at));
      html += `<mark class="an-flag" role="button" tabindex="0" aria-expanded="false" aria-describedby="an-tip-${n}" data-n="${n}">` +
        `<span class="an-flag-n" aria-hidden="true">${n}</span>${esc(m.phrase)}` +
        `<span class="an-tip" role="tooltip" id="an-tip-${n}">${esc(m.reason)}</span></mark>`;
      pos = m.at + m.phrase.length;
    });
    html += esc(text.slice(pos));

    return `
      <blockquote class="an-message">${html}</blockquote>
      <ol class="an-reasons">
        ${marks.map((m, i) => `<li data-n="${i + 1}">
            <span class="an-flag-n" aria-hidden="true">${i + 1}</span>
            <span><strong>${esc(m.reason)}</strong><q>${esc(m.phrase)}</q></span>
          </li>`).join("")}
      </ol>`;
  }

  // The buttons under every result
  function actionsHtml(kind) {
    const other = kind === "message"
      ? `<a class="btn btn-secondary" href="#evidence">${icon("document")}Check a screenshot or document</a>`
      : `<a class="btn btn-secondary" href="#call-match">${icon("shield")}Is the bank really calling?</a>`;
    return `
      <div class="an-actions">
        <a class="btn btn-primary" href="#report">${icon("flag")}Report to the bank</a>
        ${other}
        <button type="button" class="btn btn-link" data-action="again-${kind}">${kind === "message" ? "Check another message" : "Check another clip"}</button>
      </div>`;
  }

  // For a message the customer typed: nothing is checked yet, so say so honestly
  function typedHtml() {
    const t = data.typedResult;
    return `
      <section class="panel an-result" aria-labelledby="an-result-title">
        <div class="an-result-top"><span class="an-demo-tag">Demo result</span></div>
        <div data-read>
          <h2 id="an-result-title" tabindex="-1">${t.title}</h2>
          <p class="an-summary">${t.text}</p>
          <h3>Until then, stay safe</h3>
          <ol class="an-steps">${t.steps.map(step => `<li>${step}</li>`).join("")}</ol>
        </div>
        ${actionsHtml("message")}
      </section>`;
  }

  // What the customer sees if a check fails (shown here with the demo button)
  function errorHtml() {
    return `
      <section class="panel an-result an-error" aria-labelledby="an-result-title">
        <span class="an-error-icon">${icon("warning")}</span>
        <div data-read>
          <h2 id="an-result-title" tabindex="-1">We couldn't check your message</h2>
          <p>Something went wrong on our side. Your message wasn't saved or sent. Please try again in a moment.</p>
          <p class="meta">Need help now? Call the Anti-Scam Helpline on 1799.</p>
        </div>
        <div class="an-actions">
          <button type="button" class="btn btn-primary" data-action="retry">Try again</button>
          <button type="button" class="btn btn-link" data-action="again-message">Check another message</button>
        </div>
      </section>`;
  }

  // ---------- Voice clip tab ----------

  function voicePanelHtml() {
    const state = myState();
    const clip = state.voice;
    return `
      <div class="an-grid">
        <form class="panel an-form" id="an-voice-form" novalidate>
          <h2>Your voice clip</h2>
          <label class="an-drop" id="an-drop">
            <input type="file" id="an-file" class="visually-hidden" accept="audio/*" aria-describedby="an-file-chosen">
            ${myIcon("upload")}
            <strong>Choose a voice clip</strong>
            <span>Or drag it here. A voicemail or recording (MP3, WAV, M4A).</span>
          </label>
          <p class="an-file" id="an-file-chosen"${clip.fileName ? "" : " hidden"}>
            ${icon("wave")}<span class="visually-hidden">Chosen clip: </span><span class="an-file-name">${esc(clip.fileName)}</span>
            <button type="button" class="btn btn-link" data-action="clear-clip">Remove<span class="visually-hidden"> this clip</span></button>
          </p>
          <p class="an-or"><span>or</span></p>
          <button type="button" class="btn btn-secondary" id="an-sample">${icon("speaker")}Use a sample clip</button>
          <button type="submit" class="btn btn-primary" id="an-voice-check">Check this clip ${icon("arrow")}</button>
          <p class="an-hint" id="an-voice-hint">Choose a clip first, or use the sample clip.</p>
          <p class="an-privacy">${icon("lock")}<span>Demo: the clip is never opened or uploaded. Only its name is shown.</span></p>
        </form>

        <div class="an-result-area" id="an-voice-result">
          ${clip.result ? voiceResultHtml(clip.result, clip.fileName) : emptyHtml(icon("wave"), "Your result will show here.")}
        </div>
      </div>

      <details class="an-demo">
        <summary>Demo only: pick the result the next clip check shows</summary>
        <fieldset class="an-demo-row">
          <legend class="visually-hidden">Result for the next voice check</legend>
          ${Object.keys(data.voiceResults).map(key => `<label class="an-pick">
              <input type="radio" name="an-voice-demo" value="${key}"${key === state.voiceDemo ? " checked" : ""}>${badge(key)}
            </label>`).join("")}
        </fieldset>
      </details>`;
  }

  // The three "checking" steps, with the ones already done ticked
  function voiceCheckingHtml(stepIndex) {
    return `
      <div class="panel an-checking">
        <h2>Checking your clip…</h2>
        <ol class="an-progress">
          ${data.voiceSteps.map((text, i) => {
            const stage = i < stepIndex ? "is-done" : i === stepIndex ? "is-active" : "";
            return `<li class="an-step ${stage}"><span class="an-step-dot" aria-hidden="true">${i < stepIndex ? icon("check") : ""}</span>${text}</li>`;
          }).join("")}
        </ol>
      </div>`;
  }

  function voiceResultHtml(key, fileName) {
    const v = data.voiceResults[key];
    return `
      <section class="panel an-result an-voice an-voice--${key}" aria-labelledby="an-voice-title">
        <div class="an-result-top">${badge(key)}<span class="an-demo-tag">Demo result</span></div>
        <div data-read>
          <h2 id="an-voice-title" tabindex="-1">${v.title}</h2>
          <p class="meta">Clip: ${esc(fileName || data.sampleClipName)}</p>
          ${v.chance === null
            ? `<p class="an-chance-none">No number this time: the clip didn't give a clear answer.</p>`
            : `<p class="an-chance"><span class="an-chance-num">${v.chance}%</span><span>chance the voice is AI-made</span></p>
               <div class="an-meter" aria-hidden="true"><span style="--w: ${v.chance}%"></span></div>`}
          <p class="an-sure">How sure we are: <strong>${v.sure}</strong></p>
        </div>
        ${v.timeline ? timelineHtml(v.timeline) : ""}
        <div data-read>
          <h3>Why</h3>
          <ul class="an-why">${v.reasons.map(reason => `<li>${reason}</li>`).join("")}</ul>
          <p class="an-extra">${icon("warning")}<span>${v.extra}</span></p>
        </div>
        ${actionsHtml("voice")}
        <p class="an-honesty">${icon("question")}<span>The voice check is one warning sign, not proof. A real voice can still belong to a scammer.</span></p>
      </section>`;
  }

  // The clip in 5-second pieces, with the pieces that sound AI-made marked
  function timelineHtml(parts) {
    return `
      <div class="an-timeline-box">
        <h3>Which parts sound AI-made</h3>
        <ol class="an-timeline">
          ${parts.map((ai, i) => `<li${ai ? ' class="is-ai"' : ""}>
              <span aria-hidden="true">${i * 5}s</span>
              <span class="visually-hidden">Seconds ${i * 5} to ${i * 5 + 5}: ${ai ? "sounds AI-made" : "sounds natural"}</span>
            </li>`).join("")}
        </ol>
        <p class="meta an-key"><span class="an-key-swatch" aria-hidden="true"></span>Sounds AI-made</p>
      </div>`;
  }

  // ---------- History: the checks from this visit ----------

  function levelHtml(item) {
    if (item.kind === "voice") return badge(item.level);
    if (item.level === "demo") return `<span class="an-demo-tag">Demo</span>`;
    return `<span class="an-risk an-risk--${item.level} an-risk--small">${icon(RISK_ICONS[item.level])}${data.labels.en.risk[item.level]}</span>`;
  }

  function historyInnerHtml() {
    const items = myState().history;
    if (!items.length) return `<p class="meta">Nothing checked yet. What you check during this visit shows here.</p>`;
    return `
      <ul class="an-history-list">
        ${items.map(item => `<li>
            <span class="an-history-time">${item.time}</span>
            <span class="an-history-what">${item.kind === "voice" ? icon("wave") : myIcon("message")}
              <span><strong>${item.kind === "voice" ? "Voice clip" : "Message"}</strong> ${esc(item.label)}</span></span>
            ${levelHtml(item)}
          </li>`).join("")}
      </ul>`;
  }

  function addToHistory(entry) {
    myState().history.unshift({ time: timeNow(), ...entry });
    const box = document.getElementById("an-history");
    if (box) box.innerHTML = historyInnerHtml();
  }

  // ---------- Wiring up ----------

  // Brings a new result into view and moves focus to its heading, so screen readers read it next
  function showResult(area, headingId) {
    syncReadAloud();
    // The customer may have switched tab while it was checking: then leave focus where it is
    if (area.closest("[hidden]")) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    area.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    document.getElementById(headingId).focus({ preventScroll: true });
  }

  // Read aloud (js/core/a11y.js) reads every [data-read] on the page, even inside the hidden tab,
  // so the hidden tab's parts are switched off (renamed data-read-off) while it is hidden
  function syncReadAloud() {
    document.querySelectorAll(".an-panel").forEach(panel => {
      panel.querySelectorAll("[data-read], [data-read-off]").forEach(el => {
        el.toggleAttribute("data-read", !panel.hidden);
        el.toggleAttribute("data-read-off", panel.hidden);
      });
    });
  }

  // Shows one tab and hides the other
  function showTab(name, moveFocus) {
    myState().tab = name;
    document.querySelectorAll(".an-tab").forEach(tab => {
      const on = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && moveFocus) tab.focus();
    });
    document.getElementById("an-panel-message").hidden = name !== "message";
    document.getElementById("an-panel-voice").hidden = name !== "voice";
    syncReadAloud();
    // Change the address to #analyser/message or #analyser/voice without redrawing the screen,
    // so a tab can be bookmarked and opens straight away next time
    history.replaceState(null, "", `#analyser/${name}`);
  }

  function wireTabs() {
    const tabs = [...document.querySelectorAll(".an-tab")];
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => showTab(tab.dataset.tab, false));
      // Arrow keys move between the tabs, the usual way tabs work with a keyboard
      tab.addEventListener("keydown", event => {
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        showTab(tabs[(next + tabs.length) % tabs.length].dataset.tab, true);
      });
    });
  }

  // Runs a (pretend) message check: "Checking…", then the result
  async function runMessageCheck(fail) {
    const state = myState();
    const button = document.getElementById("an-check");
    const area = document.getElementById("an-result");
    const status = document.getElementById("an-status");
    if (button.dataset.busy) return;

    button.dataset.busy = "true";
    button.disabled = true;
    button.innerHTML = `<span class="an-spinner" aria-hidden="true"></span>Checking…`;
    area.innerHTML = checkingHtml("Checking your message…");
    status.textContent = "Checking your message";
    await wait(CHECK_MS);
    if (!area.isConnected) return;   // the customer left this screen while it was checking

    state.message = fail ? { kind: "error" } : checkMessage(state.text);
    if (state.message.kind === "example") {
      const r = findExample(state.message.id).result;
      addToHistory({ kind: "message", label: data.labels.en.types[r.type], level: r.risk });
    } else if (state.message.kind === "typed") {
      addToHistory({ kind: "message", label: "Your own message", level: "demo" });
    }
    area.innerHTML = messageResultHtml(state.message);
    delete button.dataset.busy;
    button.innerHTML = `Check this message ${icon("arrow")}`;
    document.getElementById("an-text").dispatchEvent(new Event("input"));   // puts the button back to the right state
    status.textContent = "";
    showResult(area, "an-result-title");
  }

  // Moves a reason bubble sideways if it would stick out past the edge of the screen.
  // clientWidth is the page's real width (on phones, window.innerWidth grows when something sticks out).
  function keepTipOnScreen(flag) {
    const tip = flag.querySelector(".an-tip");
    tip.style.setProperty("--shift", "0px");
    const box = tip.getBoundingClientRect();
    const screenWidth = document.documentElement.clientWidth;
    const gap = 12;
    let shift = 0;
    if (box.right > screenWidth - gap) shift = screenWidth - gap - box.right;
    if (box.left + shift < gap) shift = gap - box.left;
    tip.style.setProperty("--shift", `${shift}px`);
  }

  // Marked phrases: hover or keyboard focus shows the reason, a tap or Enter keeps it open, and
  // the matching row in the numbered list lights up
  function wireFlags(area) {
    function link(flag, on) {
      const row = area.querySelector(`.an-reasons li[data-n="${flag.dataset.n}"]`);
      if (row) row.classList.toggle("is-linked", on);
      if (on) keepTipOnScreen(flag);
    }
    function closeAll(except) {
      area.querySelectorAll('.an-flag[aria-expanded="true"]').forEach(f => {
        if (f !== except) f.setAttribute("aria-expanded", "false");
      });
    }
    function toggle(flag) {
      const open = flag.getAttribute("aria-expanded") !== "true";
      closeAll(flag);
      flag.setAttribute("aria-expanded", String(open));
      if (open) keepTipOnScreen(flag);
    }

    area.addEventListener("mouseover", event => {
      const flag = event.target.closest(".an-flag");
      if (flag && !flag.contains(event.relatedTarget)) link(flag, true);
    });
    area.addEventListener("mouseout", event => {
      const flag = event.target.closest(".an-flag");
      if (flag && !flag.contains(event.relatedTarget)) link(flag, false);
    });
    area.addEventListener("focusin", event => {
      const flag = event.target.closest(".an-flag");
      if (flag) link(flag, true);
    });
    area.addEventListener("focusout", event => {
      const flag = event.target.closest(".an-flag");
      if (flag) { link(flag, false); flag.setAttribute("aria-expanded", "false"); }
    });
    area.addEventListener("click", event => {
      const flag = event.target.closest(".an-flag");
      if (flag) toggle(flag); else closeAll(null);
    });
    area.addEventListener("keydown", event => {
      const flag = event.target.closest(".an-flag");
      if (!flag) return;
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(flag); }
      if (event.key === "Escape") flag.setAttribute("aria-expanded", "false");
    });
  }

  function wireMessage() {
    const state = myState();
    const form = document.getElementById("an-form");
    const box = document.getElementById("an-text");
    const area = document.getElementById("an-result");

    // The counter, the error and the button follow what is in the box
    function update() {
      state.text = box.value;
      const n = box.value.length;
      const tooLong = n > data.maxLength;
      const empty = !box.value.trim();
      const counter = document.getElementById("an-count");
      counter.textContent = `${count(n)} / ${count(data.maxLength)} characters`;
      counter.classList.toggle("an-count--over", tooLong);
      box.setAttribute("aria-invalid", String(tooLong));
      document.getElementById("an-text-error").textContent = tooLong
        ? `This is ${count(n - data.maxLength)} characters too long. Please shorten it to ${count(data.maxLength)} characters or fewer.`
        : "";
      const button = document.getElementById("an-check");
      if (!button.dataset.busy) button.disabled = empty || tooLong;
      document.getElementById("an-hint").hidden = !empty;
    }
    box.addEventListener("input", update);
    update();

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!document.getElementById("an-check").disabled) runMessageCheck(false);
    });

    // An example fills the box and checks it straight away
    form.querySelectorAll(".an-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        box.value = findExample(chip.dataset.example).text;
        update();
        runMessageCheck(false);
      });
    });

    // Buttons inside the result. The result is redrawn, so one listener on the area catches them all.
    area.addEventListener("click", event => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "retry") runMessageCheck(false);
      if (action === "again-message") {
        box.value = "";
        update();
        state.message = null;
        area.innerHTML = emptyHtml(myIcon("message"), "Your result will show here.");
        box.focus();
      }
    });
    wireFlags(area);

    // Demo-only buttons that show the error screens
    document.querySelectorAll("[data-demo]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.dataset.demo === "fail") {
          if (!box.value.trim()) { box.value = data.examples[0].text; update(); }
          runMessageCheck(true);
        } else {
          box.value = `${data.examples[0].text} `.repeat(15);   // well over 2,000 characters
          update();
          box.focus();
        }
      });
    });
  }

  // Runs a (pretend) voice check: three steps, then the result
  async function runVoiceCheck() {
    const state = myState();
    const button = document.getElementById("an-voice-check");
    const area = document.getElementById("an-voice-result");
    const status = document.getElementById("an-status");
    if (!state.voice.fileName || button.dataset.busy) return;

    button.dataset.busy = "true";
    button.disabled = true;
    button.innerHTML = `<span class="an-spinner" aria-hidden="true"></span>Checking…`;
    status.textContent = "Checking your clip";
    for (let step = 0; step <= data.voiceSteps.length; step++) {
      area.innerHTML = voiceCheckingHtml(step);
      await wait(STEP_MS);
      if (!area.isConnected) return;   // the customer left this screen while it was checking
    }

    state.voice.result = checkClip();
    addToHistory({ kind: "voice", label: state.voice.fileName, level: state.voice.result });
    area.innerHTML = voiceResultHtml(state.voice.result, state.voice.fileName);
    delete button.dataset.busy;
    button.innerHTML = `Check this clip ${icon("arrow")}`;
    button.disabled = !state.voice.fileName;
    status.textContent = "";
    showResult(area, "an-voice-title");
  }

  function wireVoice() {
    const state = myState();
    const form = document.getElementById("an-voice-form");
    const input = document.getElementById("an-file");
    const drop = document.getElementById("an-drop");
    const area = document.getElementById("an-voice-result");

    // Shows the chosen clip's name (or hides it) and turns the Check button on or off
    function setClip(name) {
      state.voice.fileName = name;
      const chosen = document.getElementById("an-file-chosen");
      chosen.hidden = !name;
      chosen.querySelector(".an-file-name").textContent = name;
      const button = document.getElementById("an-voice-check");
      if (!button.dataset.busy) button.disabled = !name;
      document.getElementById("an-voice-hint").hidden = Boolean(name);
    }
    setClip(state.voice.fileName);

    // Only the file's name is used. The file itself is never opened, read or uploaded.
    input.addEventListener("change", () => {
      if (input.files.length) setClip(input.files[0].name);
      input.value = "";   // so picking the same file again still counts
    });

    // Dragging a clip onto the box works the same way (again, only its name is used)
    ["dragenter", "dragover"].forEach(type => drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.add("is-dragover");
    }));
    ["dragleave", "drop"].forEach(type => drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.remove("is-dragover");
    }));
    drop.addEventListener("drop", event => {
      const file = event.dataTransfer.files[0];
      if (file) setClip(file.name);
    });

    document.getElementById("an-sample").addEventListener("click", () => {
      setClip(data.sampleClipName);
      runVoiceCheck();
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      runVoiceCheck();
    });
    form.addEventListener("click", event => {
      if (event.target.closest('[data-action="clear-clip"]')) {
        // Removing the clip also clears its result, so no result is left for a clip that's gone
        setClip("");
        state.voice.result = "";
        area.innerHTML = emptyHtml(icon("wave"), "Your result will show here.");
        input.focus();
      }
    });

    area.addEventListener("click", event => {
      if (event.target.closest('[data-action="again-voice"]')) {
        setClip("");
        state.voice.result = "";
        area.innerHTML = emptyHtml(icon("wave"), "Your result will show here.");
        input.focus();
      }
    });

    // Demo picker: which of the five results the next check shows. If a result is already on
    // screen, it switches straight away.
    document.querySelectorAll('input[name="an-voice-demo"]').forEach(radio => {
      radio.addEventListener("change", () => {
        state.voiceDemo = radio.value;
        if (state.voice.result) {
          state.voice.result = radio.value;
          area.innerHTML = voiceResultHtml(state.voice.result, state.voice.fileName);
        }
      });
    });
  }

  registerRoute({
    name: "analyser",
    role: "customer",
    render: screenHtml,
    afterRender: () => {
      wireTabs();
      wireMessage();
      wireVoice();
      syncReadAloud();
    }
  });
})();
