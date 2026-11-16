"use strict";

// Feature: Check anything (message, voice recording, screenshot or document, all on one screen).
// #analyser (old addresses #analyser/message, #analyser/voice and #evidence still open it)
// Owner: Aydan (the screen, and the message and voice checks).
//        Yan Lin owns the screenshot and document checks: EVIDENCE_CHECKER in
//        js/features/evidence-checker.js, with its data in js/data/evidence-checker.js.
// Merged on frontend-update to match the senior flow preview: the customer adds a file, pastes
// a message or taps a sample. The screen works out what kind of thing it is, shows three
// "checking" steps for that kind, then the result and what to do now.
//
// Which check runs:
//   message     (pasted text, an example, or a .txt file)  checkMessage() in this file: the real
//               text detector, TextDetector.checkMessage() in "text detector prototype/detector/"
//               (hand-written red-flag rules in English, Chinese and Malay; runs on this device)
//   voice       (audio or video file)   checkClip() in this file: PLACEHOLDER, the demo picker's result
//   screenshot  (image file)            EVIDENCE_CHECKER.check() (Yan Lin): PLACEHOLDER
//   document    (pdf, doc, anything else) EVIDENCE_CHECKER.check() (Yan Lin): PLACEHOLDER
// Only a file's name and type are used to tell what it is. Audio, pictures and documents are
// never opened. A .txt file's words are read on this device only. Nothing is uploaded.
//
// What it remembers (appState.analyser, cleared by #reset):
//   phase      "input", "analysing" or "result"
//   text       what is in the message box
//   error      the message box's error, if any
//   kind       "message", "voice", "screenshot" or "document"
//   label      what was checked, in words ("Pasted message", "Sample voice message" ...)
//   fileName   the file's name ("" for typed text)
//   step       which "checking" step is showing
//   outcome    the result on screen (see check() below)
//   voiceDemo  which of the five voice results the next voice check shows (the demo picker)
//   history    checks from this visit, newest first: { kind, what, when, result | risk }.
//              The customer home screen shows these under "My recent checks".
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = ANALYSER_DATA;
  const STEP_MS = 1000;   // how long each "checking" step shows, so people see it happen

  // The icon that goes with each risk level (icon + words, never colour alone)
  const RISK_ICONS = { low: "check", medium: "warning", high: "warning" };
  // The coloured result box (.verdict in base.css) for each risk level and each RESULTS key
  const RISK_BOX = { high: "v-bad", medium: "v-careful", low: "v-good" };
  const RESULT_BOX = { likely: "v-bad", partial: "v-bad", uncertain: "v-careful", unsure: "v-careful", real: "v-good" };

  // ---------- Small helpers ----------

  const esc = escapeHtml;

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // "2,000" style numbers
  function count(n) {
    return n.toLocaleString("en-SG");
  }

  // The time now, e.g. "14:05"
  function timeNow() {
    return new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function freshCheck() {
    return { phase: "input", text: "", error: "", kind: "", label: "", fileName: "", step: 0, outcome: null };
  }

  // This feature's corner of appState, created the first time it's needed
  function myState() {
    if (!appState.analyser) appState.analyser = { ...freshCheck(), voiceDemo: "likely", history: [] };
    return appState.analyser;
  }

  function findExample(id) {
    return data.examples.find(ex => ex.id === id);
  }

  // The label, icon and three steps for a kind: message and voice are here, the rest are Yan Lin's
  function kindInfo(kind) {
    return data.kinds[kind] || EVIDENCE_CHECKER.kind(kind);
  }

  // ---------- What kind of file is it? (from its type and name only; it is never opened) ----------

  function detectKind(file) {
    const type = file.type || "";
    const name = file.name.toLowerCase();
    if (type.startsWith("audio/") || type.startsWith("video/") || /\.(mp3|m4a|wav|ogg|aac|amr|opus|mp4|3gp)$/.test(name)) return "voice";
    if (type.startsWith("image/") || /\.(png|jpe?g|heic|webp|gif)$/.test(name)) return "screenshot";
    if (type === "text/plain" || /\.txt$/.test(name)) return "message";
    return "document";
  }

  // ---------- The checks ----------

  // A message (typed, pasted, a .txt file, or an example): the text detector checks it.
  // result: { risk, type, confidence, summary, flags: [{ phrase, reason }], lang, score }.
  // Each flag's phrase is copied exactly from the text, so it can be marked in the message.
  function checkMessage(text) {
    const clean = text.trim();
    return { kind: "message", text: clean, result: TextDetector.checkMessage(clean) };
  }

  // A voice clip. PLACEHOLDER: whichever of the five results the demo picker is set to.
  function checkClip() {
    return { kind: "voice", result: myState().voiceDemo };
  }

  // Runs the right check for the kind, and returns the outcome kept in appState.analyser.outcome
  // If a check breaks (for example a detector file didn't load), the customer sees the
  // friendly "We couldn't check this" screen instead of a stuck page.
  function check(state, fail) {
    if (fail) return { kind: "error" };
    try {
      if (state.kind === "message") return checkMessage(state.text);
      if (state.kind === "voice") return checkClip();
      return { kind: state.kind, evidence: EVIDENCE_CHECKER.check(state.kind, state.fileName) };
    } catch (e) {
      console.error("The check failed:", e);
      return { kind: "error" };
    }
  }

  // Adds a finished check to this visit's history, for the home screen's "My recent checks"
  function addToHistory(state) {
    const o = state.outcome;
    if (o.kind === "error") return;
    const entry = { kind: o.kind, what: state.fileName || state.label, when: `Today ${timeNow()}` };
    if (o.kind === "message") entry.risk = o.result.risk;
    else if (o.kind === "voice") entry.result = o.result;
    else entry.result = o.evidence.result;
    state.history.unshift(entry);
  }

  // ---------- Drawing: the screen has three phases ----------

  // Redraws this screen for the next phase. render() knows not to start afresh.
  let redrawing = false;
  function draw() {
    redrawing = true;
    try { redrawScreen(); } finally { redrawing = false; }
  }

  function screenHtml() {
    const state = myState();
    // Coming to this screen from somewhere else always starts with an empty box
    if (!redrawing && state.phase !== "input") Object.assign(state, freshCheck());
    const body = state.phase === "analysing" ? analysingHtml() : state.phase === "result" ? resultHtml() : inputHtml();
    return customerPageHtml("", `<div class="narrow an-screen">${homeLinkHtml()}${body}</div>
      <p class="visually-hidden" role="status" id="an-status"></p>`);
  }

  // ---------- Phase 1: add something ----------

  function sampleButtonsHtml() {
    const voice = `<button type="button" class="chip" data-sample="voice">${icon("wave")}Sample voice message</button>`;
    const message = `<button type="button" class="chip" data-sample="message">${icon("chat")}Sample SMS</button>`;
    const evidence = EVIDENCE_CHECKER.samples.map((s, i) =>
      `<button type="button" class="chip" data-sample="evidence" data-i="${i}">${icon(EVIDENCE_CHECKER.kind(s.kind).icon)}${esc(s.label)}</button>`).join("");
    return message + voice + evidence;
  }

  function inputHtml() {
    const state = myState();
    return `
      <section class="panel">
        <div data-read>
          <h1 tabindex="-1">Check anything you are not sure about</h1>
          <p class="lead">Add a message, a call recording, a screenshot or a letter. You do not need to pick what it is. We will work it out.</p>
        </div>
        <label class="an-drop" id="an-drop">
          ${icon("upload")}
          <strong>Tap here to add a file</strong>
          <span>or drag it into this box</span>
          <input type="file" id="an-file" class="visually-hidden" accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt">
        </label>
        <p class="an-or"><span>or</span></p>
        <form id="an-form" novalidate>
          <div class="field">
            <label for="an-text">Paste or type the message</label>
            <textarea id="an-text" name="message" rows="5" spellcheck="false" autocomplete="off"
              placeholder="For example: Your account is locked. Tap this link..."
              aria-describedby="an-count an-text-error"${state.error ? ' aria-invalid="true"' : ""}>${esc(state.text)}</textarea>
          </div>
          <p class="an-count" id="an-count"></p>
          <p class="field-error" id="an-text-error" role="alert">${esc(state.error)}</p>
          <button type="submit" class="btn btn-primary">Check this message ${icon("arrow")}</button>
        </form>
        <p class="an-privacy">${icon("lock")}<span>Your file stays on this device. Recordings, pictures and documents are never opened or uploaded.</span></p>
      </section>

      <section class="panel" aria-labelledby="an-samples-title">
        <h2 id="an-samples-title">No file? Try a sample</h2>
        <div class="chips">${sampleButtonsHtml()}</div>
        <details class="an-demo">
          <summary>More message examples</summary>
          <ul class="an-chips">
            ${data.examples.map(ex => `<li><button type="button" class="chip" data-example="${ex.id}" lang="${ex.lang}">${esc(ex.chip)}</button></li>`).join("")}
          </ul>
        </details>
      </section>

      <details class="an-demo">
        <summary>Demo only: pick the result the next voice check shows</summary>
        <fieldset class="an-demo-row">
          <legend class="visually-hidden">Result for the next voice check</legend>
          ${Object.keys(data.voiceResults).map(key => `<label class="an-pick">
              <input type="radio" name="an-voice-demo" value="${key}"${key === state.voiceDemo ? " checked" : ""}>${badge(key)}
            </label>`).join("")}
        </fieldset>
      </details>
      <details class="an-demo">
        <summary>Demo only: show the error screens</summary>
        <div class="an-demo-row">
          <button type="button" class="btn btn-secondary btn-small" data-demo="fail">Check failed</button>
          <button type="button" class="btn btn-secondary btn-small" data-demo="long">Message too long</button>
        </div>
      </details>`;
  }

  // ---------- Phase 2: "We found: ..." and the three checking steps ----------

  function detectedHtml() {
    const state = myState();
    const info = kindInfo(state.kind);
    const what = state.fileName || state.label;
    return `<div class="an-detected">${icon(info.icon)}<span><strong>We found: ${info.label}</strong><small>${esc(what)}</small></span></div>`;
  }

  function progressItemsHtml(steps, at) {
    return steps.map((text, i) => {
      const stage = i < at ? "done" : i === at ? "now" : "";
      const mark = i < at ? icon("check") : i === at ? '<span class="spin" aria-hidden="true"></span>' : '<span class="dot" aria-hidden="true"></span>';
      return `<li class="${stage}">${mark}<span>${text}${i < at ? '<span class="visually-hidden"> (done)</span>' : ""}</span></li>`;
    }).join("");
  }

  function analysingHtml() {
    const state = myState();
    return `
      <section class="panel" data-read>
        ${detectedHtml()}
        <h1 tabindex="-1">Checking it now…</h1>
        <p>This takes a few seconds.</p>
        <ul class="progress-list" id="an-progress">${progressItemsHtml(kindInfo(state.kind).steps, state.step)}</ul>
      </section>`;
  }

  // Starts a check: shows the checking steps one by one, then the result.
  //   kind, label, fileName, text: what is being checked. fail: the demo "Check failed" screen.
  async function startCheck({ kind, label, fileName = "", text = "", fail = false }) {
    const state = myState();
    Object.assign(state, { phase: "analysing", kind, label, fileName, text, error: "", step: 0, outcome: null });
    draw();
    const steps = kindInfo(kind).steps;
    for (let step = 1; step <= steps.length; step++) {
      await wait(STEP_MS);
      const list = document.getElementById("an-progress");
      if (!list || state.phase !== "analysing") return;   // the customer left this screen while it was checking
      state.step = step;
      list.innerHTML = progressItemsHtml(steps, step);
    }
    state.outcome = check(state, fail);
    addToHistory(state);
    state.phase = "result";
    draw();
  }

  // ---------- Phase 3: the result ----------

  // Three dots for low / medium / high. The words next to them say the same thing.
  function dotsHtml(level) {
    const filled = { low: 1, medium: 2, high: 3 }[level];
    return `<span class="an-dots" aria-hidden="true">${[1, 2, 3].map(n => `<span${n <= filled ? ' class="on"' : ""}></span>`).join("")}</span>`;
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

  // "What to do now" buttons. worrying: anything but a low-risk or "probably real" result.
  function actionsHtml(kind, worrying) {
    const report = kind === "voice" ? "#report/call" : "#report/message";
    return `
      <div class="stack an-actions">
        ${worrying ? `
          <a class="btn btn-primary" href="${report}">${icon("flag")}Report this to OCBC</a>
          <a class="btn btn-secondary" href="#freeze">${icon("lock")}I already sent money or a code</a>` : ""}
        ${kind === "voice" ? `
          <a class="btn btn-secondary" href="#caller-check">${icon("user")}Is the caller a real person?</a>
          <a class="btn btn-secondary" href="#call-match">${icon("shield")}Is the bank really calling?</a>` : ""}
        <button type="button" class="btn btn-link" data-action="again">Check something else</button>
      </div>`;
  }

  function stepsListHtml(steps) {
    return `<ol class="an-steps">${steps.map(step => `<li>${esc(step)}</li>`).join("")}</ol>`;
  }

  // A message: the text detector's result, in the message's own language (English, Chinese or
  // Malay). Any wording we don't have in that language falls back to English.
  function messageResultHtml(outcome) {
    const r = outcome.result;
    const lang = data.labels[r.lang] ? r.lang : "en";
    const words = { ...data.labels.en, ...data.labels[lang] };
    const typeName = (data.labels[lang].types || {})[r.type] || data.labels.en.types[r.type];
    // A low-risk message isn't called "a normal message": rules can't prove a message is safe
    const heading = r.risk === "low" ? words.lowTitle : typeName;
    const steps = lang === "en"
      ? data.nextSteps[r.type]
      : data.otherLangSteps[lang][r.risk === "low" ? "none" : "scam"];
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RISK_BOX[r.risk]}" lang="${lang}">
          ${icon(RISK_ICONS[r.risk])}
          <div><p><strong>${words.risk[r.risk]}</strong>${r.risk === "low" ? "" : ` · ${words.looksLike}`}</p><h1 tabindex="-1">${esc(heading)}</h1></div>
        </div>
      </section>
      <section class="panel an-result" aria-labelledby="an-why-title" lang="${lang}">
        <h2 id="an-why-title">${words.flagsTitle}</h2>
        <div data-read>
          <p class="an-summary">${esc(r.summary)}</p>
          <p class="an-sure">${words.howSure}: <strong>${words.sure[r.confidence]}</strong>${dotsHtml(r.confidence)}</p>
        </div>
        ${r.flags.length
          ? highlightedHtml(outcome.text, r.flags)
          : `<blockquote class="an-message">${esc(outcome.text)}</blockquote>
             <p class="an-none">${icon("check")}<span>${words.noFlags}</span></p>`}
      </section>
      <section class="panel" aria-labelledby="an-todo-title" lang="${lang}">
        <div data-read>
          <h2 id="an-todo-title">${words.stepsTitle}</h2>
          ${stepsListHtml(steps)}
        </div>
        <div lang="en">${actionsHtml("message", r.risk !== "low")}</div>
        <p class="an-honesty">${icon("question")}<span>${words.honesty}</span></p>
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

  function voiceResultHtml(key) {
    const v = data.voiceResults[key];
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RESULT_BOX[key]}">
          <div>${badge(key)}<h1 tabindex="-1">${v.title}</h1></div>
        </div>
      </section>
      <section class="panel an-result an-voice an-voice--${key}" aria-labelledby="an-why-title">
        <div class="an-result-top"><h2 id="an-why-title">Why we think so</h2><span class="an-demo-tag">Demo result</span></div>
        <div data-read>
          ${v.chance === null
            ? `<p class="an-chance-none">No number this time: the clip didn't give a clear answer.</p>`
            : `<p class="an-chance"><span class="an-chance-num">${v.chance}%</span><span>chance the voice is AI-made</span></p>
               <div class="an-meter" aria-hidden="true"><span style="--w: ${v.chance}%"></span></div>`}
          <p class="an-sure">How sure we are: <strong>${v.sure}</strong></p>
        </div>
        ${v.timeline ? timelineHtml(v.timeline) : ""}
        <ul class="reasons" data-read>${v.reasons.map(reason => `<li>${icon(key === "real" ? "check" : "flag")}<span>${reason}</span></li>`).join("")}</ul>
      </section>
      <section class="panel" aria-labelledby="an-todo-title">
        <div data-read>
          <h2 id="an-todo-title">What to do now</h2>
          <p class="an-extra">${icon("warning")}<span>${v.extra}</span></p>
        </div>
        ${actionsHtml("voice", key !== "real")}
        <p class="an-honesty">${icon("question")}<span>The voice check is one warning sign, not proof. A real voice can still belong to a scammer.</span></p>
      </section>`;
  }

  // A screenshot or document: Yan Lin's evidence checker result
  function evidenceResultHtml(r) {
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RESULT_BOX[r.result]}">
          <div>${badge(r.result)}<h1 tabindex="-1">${esc(r.title)}</h1></div>
        </div>
      </section>
      <section class="panel" aria-labelledby="an-why-title">
        <div class="an-result-top"><h2 id="an-why-title">Why we think so</h2><span class="an-demo-tag">Demo result</span></div>
        <ul class="reasons" data-read>${r.reasons.map(x => `<li>${icon("flag")}<span>${esc(x)}</span></li>`).join("")}</ul>
      </section>
      <section class="panel" aria-labelledby="an-todo-title">
        <div data-read>
          <h2 id="an-todo-title">What to do now</h2>
          ${stepsListHtml(r.steps)}
        </div>
        ${actionsHtml(myState().kind, r.result !== "real")}
        <p class="an-honesty">${icon("question")}<span>These are warning signs, not proof. If you're unsure, ask the bank.</span></p>
      </section>`;
  }

  // What the customer sees if a check fails (shown here with the demo button)
  function errorHtml() {
    return `
      <section class="panel" data-read>
        <span class="an-error-icon">${icon("warning")}</span>
        <h1 tabindex="-1">We couldn't check this</h1>
        <p>Something went wrong on our side. Nothing was saved or sent. Please try again in a moment.</p>
        <p class="meta">Need help now? Call the Anti-Scam Helpline on 1799.</p>
      </section>
      <div class="stack">
        <button type="button" class="btn btn-primary" data-action="retry">Try again</button>
        <button type="button" class="btn btn-link" data-action="again">Check something else</button>
      </div>`;
  }

  function resultHtml() {
    const o = myState().outcome;
    if (o.kind === "error") return errorHtml();
    if (o.kind === "message") return messageResultHtml(o);
    if (o.kind === "voice") return voiceResultHtml(o.result);
    return evidenceResultHtml(o.evidence);
  }

  // ---------- Wiring up ----------

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

  // Shows an error under the message box without leaving the screen, and puts the cursor there
  function showTextError(message) {
    const state = myState();
    state.error = message;
    const box = document.getElementById("an-text");
    box.setAttribute("aria-invalid", String(Boolean(message)));
    document.getElementById("an-text-error").textContent = message;
    if (message) box.focus();
  }

  // A file was added (picked or dropped). Only a .txt file is read, on this device, to scan its words.
  async function takeFile(file) {
    if (!file) return;
    const kind = detectKind(file);
    if (kind !== "message") {
      startCheck({ kind, label: kindInfo(kind).label, fileName: file.name });
      return;
    }
    let text = "";
    try {
      text = await file.text();
    } catch (e) {
      showTextError("We could not read that file. Please paste the message instead.");
      return;
    }
    if (!text.trim()) { showTextError("That file is empty. Please paste the message instead."); return; }
    if (text.length > data.maxLength) {
      showTextError(`That file is too long. Please paste up to ${count(data.maxLength)} characters instead.`);
      return;
    }
    startCheck({ kind: "message", label: "Text message", fileName: file.name, text });
  }

  function wireInput() {
    const state = myState();
    const box = document.getElementById("an-text");
    const drop = document.getElementById("an-drop");
    const input = document.getElementById("an-file");

    // The counter follows what is in the box. A message over the limit is marked straight away.
    function update() {
      state.text = box.value;
      const n = box.value.length;
      const tooLong = n > data.maxLength;
      const counter = document.getElementById("an-count");
      counter.textContent = `${count(n)} / ${count(data.maxLength)} characters`;
      counter.classList.toggle("an-count--over", tooLong);
      if (tooLong) {
        showTextError(`This is ${count(n - data.maxLength)} characters too long. Please shorten it to ${count(data.maxLength)} characters or fewer.`);
        box.focus();
      } else if (state.error && box.value.trim()) {
        showTextError("");
      }
    }
    box.addEventListener("input", update);
    update();

    document.getElementById("an-form").addEventListener("submit", event => {
      event.preventDefault();
      if (!box.value.trim()) { showTextError("Please paste a message, add a file, or try a sample."); return; }
      if (box.value.length > data.maxLength) { update(); return; }
      startCheck({ kind: "message", label: "Pasted message", text: box.value });
    });

    // Adding a file: tap to pick, or drag it onto the box
    input.addEventListener("change", () => {
      const file = input.files[0];
      input.value = "";   // so picking the same file again still counts
      takeFile(file);
    });
    ["dragenter", "dragover"].forEach(type => drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.add("is-dragover");
    }));
    ["dragleave", "drop"].forEach(type => drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.remove("is-dragover");
    }));
    drop.addEventListener("drop", event => takeFile(event.dataTransfer.files[0]));

    // The sample buttons, and the message examples
    document.querySelectorAll("[data-sample]").forEach(button => {
      button.addEventListener("click", () => {
        const which = button.dataset.sample;
        if (which === "message") {
          const example = findExample(data.sampleMessageId);
          startCheck({ kind: "message", label: "Sample SMS", text: example.text });
        } else if (which === "voice") {
          startCheck({ kind: "voice", label: "Sample voice message", fileName: data.sampleClipName });
        } else {
          const s = EVIDENCE_CHECKER.samples[Number(button.dataset.i)];
          startCheck({ kind: s.kind, label: s.label, fileName: s.name });
        }
      });
    });
    document.querySelectorAll("[data-example]").forEach(chip => {
      chip.addEventListener("click", () => {
        const example = findExample(chip.dataset.example);
        startCheck({ kind: "message", label: `Example: ${example.chip}`, text: example.text });
      });
    });

    // Demo picker: which of the five results the next voice check shows
    document.querySelectorAll('input[name="an-voice-demo"]').forEach(radio => {
      radio.addEventListener("change", () => { state.voiceDemo = radio.value; });
    });

    // Demo-only buttons that show the error screens
    document.querySelectorAll("[data-demo]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.dataset.demo === "fail") {
          const text = box.value.trim() || data.examples[0].text;
          startCheck({ kind: "message", label: "Pasted message", text, fail: true });
        } else {
          box.value = `${data.examples[0].text} `.repeat(15);   // well over 2,000 characters
          update();
        }
      });
    });
  }

  function wireResult() {
    const state = myState();
    const screen = document.querySelector(".an-screen");
    screen.addEventListener("click", event => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "again") {
        Object.assign(state, freshCheck());
        draw();
      }
      if (action === "retry") {
        startCheck({ kind: state.kind, label: state.label, fileName: state.fileName, text: state.text });
      }
    });
    const result = document.querySelector(".an-result");
    if (result) wireFlags(result);
  }

  registerRoute({
    name: "analyser",
    role: "customer",
    render: screenHtml,
    afterRender: () => {
      const phase = myState().phase;
      if (phase === "input") wireInput();
      if (phase === "result") wireResult();
      if (phase === "analysing") document.getElementById("an-status").textContent = "Checking. Please wait.";
    }
  });
})();
