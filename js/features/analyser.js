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
//   message     (pasted text, an example, or a .txt file)  checkMessage() in this file:
//               an example's hand-written result if it is exactly an example, otherwise a real
//               scan for scam phrases (scanMessage(), patterns in js/data/analyser.js)
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

// Languages: the screen's words come from t() (js/core/i18n.js), with the words in
// ANALYSER_DATA.text. A Chinese or Malay example still gets its result in its own language
// (see exampleResultHtml). "label" and the history's "when" are saved already translated,
// because the home screen shows them as they are.

(function () {
  const data = ANALYSER_DATA;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words
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

  // A real scan of any typed or pasted message: every scam phrase pattern it contains is one
  // warning sign. 2 or more is high risk, 1 is medium, none is low.
  // flags are { phrase, reason } with the exact words found, so they can be marked in the message.
  function scanMessage(text) {
    const flags = [];
    data.phrases.forEach(({ pattern, reason }) => {
      const found = text.match(pattern);
      if (found) flags.push({ phrase: found[0], reason });
    });
    const risk = flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "low";
    return { risk, flags };
  }

  // A message: an example's own hand-written result if the text is exactly that example,
  // otherwise the phrase scan
  function checkMessage(text) {
    const example = data.examples.find(ex => ex.text === text.trim());
    if (example) return { kind: "message", exampleId: example.id };
    return { kind: "message", text: text.trim(), scan: scanMessage(text) };
  }

  // A voice clip. PLACEHOLDER: whichever of the five results the demo picker is set to.
  function checkClip() {
    return { kind: "voice", result: myState().voiceDemo };
  }

  // Runs the right check for the kind, and returns the outcome kept in appState.analyser.outcome
  function check(state, fail) {
    if (fail) return { kind: "error" };
    if (state.kind === "message") return checkMessage(state.text);
    if (state.kind === "voice") return checkClip();
    return { kind: state.kind, evidence: EVIDENCE_CHECKER.check(state.kind, state.fileName) };
  }

  // Adds a finished check to this visit's history, for the home screen's "My recent checks"
  function addToHistory(state) {
    const o = state.outcome;
    if (o.kind === "error") return;
    const entry = { kind: o.kind, what: state.fileName || state.label, when: t("an.today", { time: timeNow() }) };
    if (o.kind === "message") entry.risk = o.exampleId ? findExample(o.exampleId).result.risk : o.scan.risk;
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
    const voice = `<button type="button" class="chip" data-sample="voice">${icon("wave")}${t("an.sample.voice")}</button>`;
    const message = `<button type="button" class="chip" data-sample="message">${icon("chat")}${t("an.sample.sms")}</button>`;
    const evidence = EVIDENCE_CHECKER.samples.map((s, i) =>
      `<button type="button" class="chip" data-sample="evidence" data-i="${i}">${icon(EVIDENCE_CHECKER.kind(s.kind).icon)}${esc(t(s.label))}</button>`).join("");
    return message + voice + evidence;
  }

  function inputHtml() {
    const state = myState();
    return `
      <section class="panel">
        <div data-read>
          <h1 tabindex="-1">${t("an.title")}</h1>
          <p class="lead">${t("an.lead")}</p>
        </div>
        <label class="an-drop" id="an-drop">
          ${icon("upload")}
          <strong>${t("an.drop.title")}</strong>
          <span>${t("an.drop.sub")}</span>
          <input type="file" id="an-file" class="visually-hidden" accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt">
        </label>
        <p class="an-or"><span>${t("an.or")}</span></p>
        <form id="an-form" novalidate>
          <div class="field">
            <label for="an-text">${t("an.textLabel")}</label>
            <textarea id="an-text" name="message" rows="5" spellcheck="false" autocomplete="off"
              placeholder="${t("an.placeholder")}"
              aria-describedby="an-count an-text-error"${state.error ? ' aria-invalid="true"' : ""}>${esc(state.text)}</textarea>
          </div>
          <p class="an-count" id="an-count"></p>
          <p class="field-error" id="an-text-error" role="alert">${esc(state.error)}</p>
          <button type="submit" class="btn btn-primary">${t("an.checkMessage")} ${icon("arrow")}</button>
        </form>
        <p class="an-privacy">${icon("lock")}<span>${t("an.privacy")}</span></p>
      </section>

      <section class="panel" aria-labelledby="an-samples-title">
        <h2 id="an-samples-title">${t("an.samplesTitle")}</h2>
        <div class="chips">${sampleButtonsHtml()}</div>
        <details class="an-demo">
          <summary>${t("an.moreExamples")}</summary>
          <ul class="an-chips">
            ${data.examples.map(ex => `<li><button type="button" class="chip" data-example="${ex.id}" lang="${exampleLang(ex)}">${esc(exampleChip(ex))}</button></li>`).join("")}
          </ul>
        </details>
      </section>

      <details class="an-demo">
        <summary>${t("an.demoVoice")}</summary>
        <fieldset class="an-demo-row">
          <legend class="visually-hidden">${t("an.demoVoiceLegend")}</legend>
          ${Object.keys(data.voiceResults).map(key => `<label class="an-pick">
              <input type="radio" name="an-voice-demo" value="${key}"${key === state.voiceDemo ? " checked" : ""}>${badge(key)}
            </label>`).join("")}
        </fieldset>
      </details>
      <details class="an-demo">
        <summary>${t("an.demoErrors")}</summary>
        <div class="an-demo-row">
          <button type="button" class="btn btn-secondary btn-small" data-demo="fail">${t("an.demo.fail")}</button>
          <button type="button" class="btn btn-secondary btn-small" data-demo="long">${t("an.demo.long")}</button>
        </div>
      </details>`;
  }

  // ---------- Phase 2: "We found: ..." and the three checking steps ----------

  function detectedHtml() {
    const state = myState();
    const info = kindInfo(state.kind);
    const what = state.fileName || state.label;
    return `<div class="an-detected">${icon(info.icon)}<span><strong>${t("an.found", { kind: t(info.label) })}</strong><small>${esc(what)}</small></span></div>`;
  }

  // steps are translation keys (from data.kinds here, or from Yan Lin's evidence checker)
  function progressItemsHtml(steps, at) {
    return steps.map((text, i) => {
      const stage = i < at ? "done" : i === at ? "now" : "";
      const mark = i < at ? icon("check") : i === at ? '<span class="spin" aria-hidden="true"></span>' : '<span class="dot" aria-hidden="true"></span>';
      return `<li class="${stage}">${mark}<span>${t(text)}${i < at ? `<span class="visually-hidden">${t("an.done")}</span>` : ""}</span></li>`;
    }).join("");
  }

  function analysingHtml() {
    const state = myState();
    return `
      <section class="panel" data-read>
        ${detectedHtml()}
        <h1 tabindex="-1">${t("an.checking")}</h1>
        <p>${t("an.fewSeconds")}</p>
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
          <a class="btn btn-primary" href="${report}">${icon("flag")}${t("an.report")}</a>
          <a class="btn btn-secondary" href="#freeze">${icon("lock")}${t("an.sentMoney")}</a>` : ""}
        ${kind === "voice" ? `
          <a class="btn btn-secondary" href="#caller-check">${icon("user")}${t("an.callerCheck")}</a>
          <a class="btn btn-secondary" href="#call-match">${icon("shield")}${t("an.callMatch")}</a>` : ""}
        <button type="button" class="btn btn-link" data-action="again">${t("an.again")}</button>
      </div>`;
  }

  // steps here are words already (callers put keys through t() first)
  function stepsListHtml(steps) {
    return `<ol class="an-steps">${steps.map(step => `<li>${esc(step)}</li>`).join("")}</ol>`;
  }

  // ---------- Which language an example's result is in ----------
  // A Chinese or Malay example is a sample message in that language, so its result stays in
  // that language (data.labels.zh / .ms and its own words). An English example's result follows
  // the language the customer picked: its words are translation keys, looked up with t().
  function exampleLang(example) {
    return example.lang === "en" ? getLocale() : example.lang;
  }
  function exampleSay(example) {
    return example.lang === "en" ? t : words => words;
  }
  function exampleChip(example) {
    return exampleSay(example)(example.chip);
  }

  // A message that matched one of the examples: its hand-written result (see exampleSay above)
  function exampleResultHtml(example) {
    const r = example.result;
    const say = exampleSay(example);
    const lang = exampleLang(example);
    const words = data.labels[example.lang] || data.labels.en;
    const typeName = words.types[r.type] ? say(words.types[r.type]) : t(data.labels.en.types[r.type]);
    const steps = r.steps || (data.nextSteps[r.type] || []).map(key => t(key));
    const flags = r.flags.map(f => ({ ...f, reason: say(f.reason) }));
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RISK_BOX[r.risk]}" lang="${lang}">
          ${icon(RISK_ICONS[r.risk])}
          <div><p><strong>${say(words.risk[r.risk])}</strong> · ${say(words.looksLike)}</p><h1 tabindex="-1">${esc(typeName)}</h1></div>
        </div>
      </section>
      <section class="panel an-result" aria-labelledby="an-why-title" lang="${lang}">
        <div class="an-result-top"><h2 id="an-why-title">${say(words.flagsTitle)}</h2><span class="an-demo-tag" lang="${getLocale()}">${t("an.demoTag")}</span></div>
        <div data-read>
          <p class="an-summary">${esc(say(r.summary))}</p>
          <p class="an-sure">${say(words.howSure)}: <strong>${say(words.sure[r.confidence])}</strong>${dotsHtml(r.confidence)}</p>
        </div>
        ${flags.length
          ? highlightedHtml(example.text, flags)
          : `<blockquote class="an-message">${esc(example.text)}</blockquote>
             <p class="an-none">${icon("check")}<span>${say(words.noFlags)}</span></p>`}
      </section>
      <section class="panel" aria-labelledby="an-todo-title" lang="${lang}">
        <div data-read>
          <h2 id="an-todo-title">${say(words.stepsTitle)}</h2>
          ${stepsListHtml(steps)}
        </div>
        <div lang="${getLocale()}">${actionsHtml("message", r.risk !== "low")}</div>
        <p class="an-honesty">${icon("question")}<span>${say(words.honesty)}</span></p>
      </section>`;
  }

  // A typed or pasted message: the result of the real phrase scan
  function scanResultHtml(outcome) {
    const { risk } = outcome.scan;
    const flags = outcome.scan.flags.map(f => ({ ...f, reason: t(f.reason) }));
    const words = data.labels.en;
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RISK_BOX[risk]}">
          ${icon(RISK_ICONS[risk])}
          <div><p><strong>${t(words.risk[risk])}</strong></p><h1 tabindex="-1">${t(data.scan.titles[risk])}</h1></div>
        </div>
      </section>
      <section class="panel an-result" aria-labelledby="an-why-title">
        <h2 id="an-why-title">${t("an.why")}</h2>
        ${flags.length
          ? highlightedHtml(outcome.text, flags)
          : `<blockquote class="an-message">${esc(outcome.text)}</blockquote>
             <ul class="reasons" data-read>${data.scan.noSigns.map(x => `<li>${icon("check")}<span>${t(x)}</span></li>`).join("")}</ul>`}
      </section>
      <section class="panel" aria-labelledby="an-todo-title">
        <div data-read>
          <h2 id="an-todo-title">${t("an.stepsTitle")}</h2>
          ${stepsListHtml(data.scan.steps[risk].map(key => t(key)))}
        </div>
        ${actionsHtml("message", risk !== "low")}
        <p class="an-honesty">${icon("question")}<span>${t(words.honesty)}</span></p>
      </section>`;
  }

  // The clip in 5-second pieces, with the pieces that sound AI-made marked
  function timelineHtml(parts) {
    return `
      <div class="an-timeline-box">
        <h3>${t("an.timeline.title")}</h3>
        <ol class="an-timeline">
          ${parts.map((ai, i) => `<li${ai ? ' class="is-ai"' : ""}>
              <span aria-hidden="true">${i * 5}s</span>
              <span class="visually-hidden">${t("an.timeline.part", { from: i * 5, to: i * 5 + 5, what: ai ? t("an.timeline.ai") : t("an.timeline.natural") })}</span>
            </li>`).join("")}
        </ol>
        <p class="meta an-key"><span class="an-key-swatch" aria-hidden="true"></span>${t("an.timeline.key")}</p>
      </div>`;
  }

  function voiceResultHtml(key) {
    const v = data.voiceResults[key];
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RESULT_BOX[key]}">
          <div>${badge(key)}<h1 tabindex="-1">${t(v.title)}</h1></div>
        </div>
      </section>
      <section class="panel an-result an-voice an-voice--${key}" aria-labelledby="an-why-title">
        <div class="an-result-top"><h2 id="an-why-title">${t("an.why")}</h2><span class="an-demo-tag">${t("an.demoTag")}</span></div>
        <div data-read>
          ${v.chance === null
            ? `<p class="an-chance-none">${t("an.chanceNone")}</p>`
            : `<p class="an-chance"><span class="an-chance-num">${v.chance}%</span><span>${t("an.chance")}</span></p>
               <div class="an-meter" aria-hidden="true"><span style="--w: ${v.chance}%"></span></div>`}
          <p class="an-sure">${t("an.howSure")}: <strong>${t(v.sure)}</strong></p>
        </div>
        ${v.timeline ? timelineHtml(v.timeline) : ""}
        <ul class="reasons" data-read>${v.reasons.map(reason => `<li>${icon(key === "real" ? "check" : "flag")}<span>${t(reason)}</span></li>`).join("")}</ul>
      </section>
      <section class="panel" aria-labelledby="an-todo-title">
        <div data-read>
          <h2 id="an-todo-title">${t("an.stepsTitle")}</h2>
          <p class="an-extra">${icon("warning")}<span>${t(v.extra)}</span></p>
        </div>
        ${actionsHtml("voice", key !== "real")}
        <p class="an-honesty">${icon("question")}<span>${t("an.voiceHonesty")}</span></p>
      </section>`;
  }

  // A screenshot or document: Yan Lin's evidence checker result (its words are translation keys)
  function evidenceResultHtml(r) {
    return `
      <section data-read>
        ${detectedHtml()}
        <div class="verdict ${RESULT_BOX[r.result]}">
          <div>${badge(r.result)}<h1 tabindex="-1">${esc(t(r.title))}</h1></div>
        </div>
      </section>
      <section class="panel" aria-labelledby="an-why-title">
        <div class="an-result-top"><h2 id="an-why-title">${t("an.why")}</h2><span class="an-demo-tag">${t("an.demoTag")}</span></div>
        <ul class="reasons" data-read>${r.reasons.map(x => `<li>${icon("flag")}<span>${esc(t(x))}</span></li>`).join("")}</ul>
      </section>
      <section class="panel" aria-labelledby="an-todo-title">
        <div data-read>
          <h2 id="an-todo-title">${t("an.stepsTitle")}</h2>
          ${stepsListHtml(r.steps.map(key => t(key)))}
        </div>
        ${actionsHtml(myState().kind, r.result !== "real")}
        <p class="an-honesty">${icon("question")}<span>${t("an.evidenceHonesty")}</span></p>
      </section>`;
  }

  // What the customer sees if a check fails (shown here with the demo button)
  function errorHtml() {
    return `
      <section class="panel" data-read>
        <span class="an-error-icon">${icon("warning")}</span>
        <h1 tabindex="-1">${t("an.error.title")}</h1>
        <p>${t("an.error.text")}</p>
        <p class="meta">${t("an.error.help")}</p>
      </section>
      <div class="stack">
        <button type="button" class="btn btn-primary" data-action="retry">${t("an.retry")}</button>
        <button type="button" class="btn btn-link" data-action="again">${t("an.again")}</button>
      </div>`;
  }

  function resultHtml() {
    const o = myState().outcome;
    if (o.kind === "error") return errorHtml();
    if (o.kind === "message") return o.exampleId ? exampleResultHtml(findExample(o.exampleId)) : scanResultHtml(o);
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
      startCheck({ kind, label: t(kindInfo(kind).label), fileName: file.name });
      return;
    }
    let text = "";
    try {
      text = await file.text();
    } catch (e) {
      showTextError(t("an.err.read"));
      return;
    }
    if (!text.trim()) { showTextError(t("an.err.empty")); return; }
    if (text.length > data.maxLength) {
      showTextError(t("an.err.fileLong", { max: count(data.maxLength) }));
      return;
    }
    startCheck({ kind: "message", label: t("an.kind.message"), fileName: file.name, text });
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
      counter.textContent = t("an.count", { n: count(n), max: count(data.maxLength) });
      counter.classList.toggle("an-count--over", tooLong);
      if (tooLong) {
        showTextError(t("an.err.tooLong", { over: count(n - data.maxLength), max: count(data.maxLength) }));
        box.focus();
      } else if (state.error && box.value.trim()) {
        showTextError("");
      }
    }
    box.addEventListener("input", update);
    update();

    document.getElementById("an-form").addEventListener("submit", event => {
      event.preventDefault();
      if (!box.value.trim()) { showTextError(t("an.err.nothing")); return; }
      if (box.value.length > data.maxLength) { update(); return; }
      startCheck({ kind: "message", label: t("an.label.pasted"), text: box.value });
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
          startCheck({ kind: "message", label: t("an.sample.sms"), text: example.text });
        } else if (which === "voice") {
          startCheck({ kind: "voice", label: t("an.sample.voice"), fileName: data.sampleClipName });
        } else {
          const s = EVIDENCE_CHECKER.samples[Number(button.dataset.i)];
          startCheck({ kind: s.kind, label: t(s.label), fileName: s.name });
        }
      });
    });
    document.querySelectorAll("[data-example]").forEach(chip => {
      chip.addEventListener("click", () => {
        const example = findExample(chip.dataset.example);
        startCheck({ kind: "message", label: t("an.label.example", { chip: exampleChip(example) }), text: example.text });
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
          startCheck({ kind: "message", label: t("an.label.pasted"), text, fail: true });
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
      if (phase === "analysing") document.getElementById("an-status").textContent = t("an.status");
    }
  });
})();
