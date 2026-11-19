"use strict";

// Feature: Check a transfer (the screen). #risk-scorer
// Owner: Jose. Jira FSDP-131 to FSDP-134.
// The customer picks one of the sample transfers and sees its risk score, band, the points each
// warning sign added, and what happens next. This file is the screen only: the scoring itself
// is in js/features/risk-scorer-logic.js, and the weights and samples are in js/data/risk-scorer.js.
// Flow: pick -> checking -> result -> sent / cancelled.
//
// It asks the server first (POST /api/risk/score). If the server isn't running (for example
// the site was opened with "python -m http.server"), it scores on this device instead, with
// the very same code, so the result is the same either way.
//
// Languages: every word on this screen comes from t() (js/core/i18n.js), with the words in
// RISK_SCORER_DATA.text. The scorer and the server still answer in English (the staff console
// and the API use that). This screen shows a signal's reason by looking up its id,
// t("rs.signal.<id>.reason"), so the customer sees it in their own language.
//
// What it remembers (appState.riskScorer, cleared by #reset):
//   selectedId  the sample picked last
//   phase       "pick", "scoring", "result" or "done"
//   done        "sent" or "cancelled" once the customer decides
//   lastResult  the last result, for Jiliana's Pause-and-Verify screen:
//               { sampleId, score, band, bandLabel, action, actionText, reasons, signals, caseRef, source }
//   cases       High-risk cases for Wei Ye's staff console: { ref, createdAt, payeeName, amount, score, band, reasons }

(function () {
  const data = RISK_SCORER_DATA;
  addTranslations(data.text);
  const API_TIMEOUT_MS = 2000;   // R-5: the API must answer within 2 seconds
  const MIN_CHECK_MS = 900;      // show "Checking..." at least this long, so people see it happen

  // The icon that goes with each band's words (icon + words, never colour alone)
  const BAND_ICONS = { low: "check", medium: "warning", high: "lock" };
  // The coloured result box (.verdict in base.css) for each band
  const BAND_BOX = { low: "v-good", medium: "v-careful", high: "v-bad" };

  // ---------- Small helpers ----------

  const esc = escapeHtml;

  // Money stays in the Singapore style ($5,000) in every language: it is what seniors see on
  // their bank statements, and it reads the same in English, Chinese and Malay.
  function money(amount) {
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
  }

  // 1 becomes "1 am" / "凌晨1点" / "1 pagi". We pick the part of the day ourselves instead of
  // letting the browser format it, because the browser gives "上午1时" and "1 PG", which
  // seniors don't say. The words for each part of the day are in the data file.
  function hourText(hour) {
    const h = hour % 12 || 12;   // 0 and 12 both say "12"
    const part = hour === 0 ? "midnight" : hour < 6 ? "night" : hour < 12 ? "morning"
      : hour === 12 ? "noon" : hour < 18 ? "afternoon" : "evening";
    return t(`rs.hour.${part}`, { h });
  }

  // How long ago the payee was added, in words. Intl.RelativeTimeFormat is built into the
  // browser and already knows "12 minutes ago" / "12分钟前" / "12 minit lalu".
  function agoText(hours) {
    const ago = new Intl.RelativeTimeFormat(getLocale(), { numeric: "always" });
    if (hours < 1) return ago.format(-Math.round(hours * 60), "minute");
    if (hours < 48) return ago.format(-Math.round(hours), "hour");
    if (hours < 24 * 365) return ago.format(-Math.round(hours / 24), "day");
    return t("rs.overYear");
  }

  // "Others: 14 and 6 minutes ago". Intl.ListFormat puts "and" / "和" / "dan" between the numbers.
  function recentText(minutes) {
    if (!minutes.length) return t("rs.none");
    return t("rs.recentList", { list: new Intl.ListFormat(getLocale()).format(minutes.map(String)) });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // This feature's corner of appState, created the first time it's needed
  function myState() {
    if (!appState.riskScorer) appState.riskScorer = { selectedId: "", lastResult: null, cases: [], phase: "pick", done: "" };
    return appState.riskScorer;
  }

  function findSample(id) {
    return data.samples.find(s => s.id === id);
  }

  // ---------- Scoring: the server first, this device if the server can't be reached ----------

  async function scoreOnServer(transfer) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const res = await fetch("/api/risk/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Server answered ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function score(transfer) {
    try {
      return { result: await scoreOnServer(transfer), source: "server" };
    } catch (e) {
      return { result: RISK_SCORER.scoreTransfer(transfer), source: "device" };
    }
  }

  // R-4: a High result opens a case for staff. The server gives the case number; on this
  // device we number it ourselves.
  function openCase(result, transfer) {
    const state = myState();
    const staffCase = {
      ref: result.caseRef || `TR-${String(state.cases.length + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      payeeName: transfer.payeeName,
      amount: transfer.amount,
      score: result.score,
      band: result.band,
      reasons: result.reasons
    };
    state.cases.push(staffCase);
    return staffCase.ref;
  }

  // ---------- Phase 1: pick a transfer ----------

  function pickedHtml(sample) {
    if (!sample) return "";
    const transfer = sample.transfer;
    return `
      <p class="rs-story">${t(`rs.sample.${sample.id}.story`)}</p>
      <div class="summary-row"><span>${t("rs.to")}</span><span>${esc(transfer.payeeName)}</span></div>
      <div class="summary-row"><span>${t("rs.amount")}</span><span>${money(transfer.amount)}</span></div>
      <div class="summary-row"><span>${t("rs.time")}</span><span>${hourText(transfer.hour)}</span></div>
      <div class="stack"><button type="button" class="btn btn-primary" data-rs="score">${t("rs.checkRisk")} ${icon("arrow")}</button></div>`;
  }

  function pickHtml() {
    const selected = findSample(myState().selectedId);
    return `
      <section class="panel" data-read>
        <p class="eyebrow">${t("rs.eyebrow")}</p>
        <h1 tabindex="-1">${t("rs.title")}</h1>
        <p class="lead">${t("rs.lead")}</p>
      </section>
      <section class="panel" aria-labelledby="rs-pick-title">
        <h2 id="rs-pick-title">${t("rs.pickTitle")}</h2>
        <div class="chips" role="group" aria-labelledby="rs-pick-title">
          ${data.samples.map(s => `<button type="button" class="chip" data-pick="${esc(s.id)}" aria-pressed="${s.id === myState().selectedId}">${t(`rs.sample.${s.id}.title`)}</button>`).join("")}
        </div>
        <div id="rs-picked" class="rs-picked">${pickedHtml(selected)}</div>
      </section>`;
  }

  // ---------- Phase 2: checking ----------

  function scoringHtml() {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("rs.checking")}</h1>
        <ul class="progress-list"><li class="now"><span class="spin" aria-hidden="true"></span><span>${t("rs.comparing")}</span></li></ul>
      </section>`;
  }

  // ---------- Phase 3: the result ----------

  function transferDetailsHtml(transfer) {
    return `
      <dl class="rs-details">
        <div><dt>${t("rs.to")}</dt><dd>${esc(transfer.payeeName)}</dd></div>
        <div><dt>${t("rs.amount")}</dt><dd>${money(transfer.amount)}</dd></div>
        <div><dt>${t("rs.usual")}</dt><dd>${transfer.usualAmount > 0 ? money(transfer.usualAmount) : t("rs.noHistory")}</dd></div>
        <div><dt>${t("rs.time")}</dt><dd>${hourText(transfer.hour)}</dd></div>
        <div><dt>${t("rs.payeeAdded")}</dt><dd>${agoText(transfer.payeeAddedHoursAgo)}</dd></div>
        <div><dt>${t("rs.paidBefore")}</dt><dd>${transfer.isNewPayee ? t("rs.firstTime") : t("rs.yes")}</dd></div>
        <div><dt>${t("rs.reported")}</dt><dd>${transfer.payeeFlagged ? t("rs.yes") : t("rs.no")}</dd></div>
        <div><dt>${t("rs.recent")}</dt><dd>${recentText(transfer.recentTransferMinutes)}</dd></div>
      </dl>`;
  }

  // Every signal, whether it fired, and the points it added: so nothing is a black box
  function allChecksHtml(result) {
    const fired = new Map(result.signals.map(s => [s.id, s]));
    return `
      <details class="rs-all">
        <summary>${t("rs.seeAll")}</summary>
        <div class="table-wrap">
          <table class="data-table">
            <caption class="visually-hidden">${t("rs.tableCaption")}</caption>
            <thead><tr><th scope="col">${t("rs.colCheck")}</th><th scope="col">${t("rs.colFound")}</th><th scope="col">${t("rs.colPoints")}</th></tr></thead>
            <tbody>
              ${data.config.signals.map(s => `<tr>
                  <th scope="row">${t(`rs.signal.${s.id}.label`)}<span class="rs-rule">${t(`rs.signal.${s.id}.rule`)}</span></th>
                  <td>${fired.has(s.id) ? t("rs.yes") : t("rs.no")}</td>
                  <td>${fired.has(s.id) ? `+${s.weight}` : "0"}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <p class="meta">${t("rs.pointsCap", { max: data.config.maxScore })}</p>
      </details>`;
  }

  // The score's 0-100 bar, with the band edges from the settings and a marker at the score.
  // Decoration only: the number and the band words say the same thing.
  function meterHtml(score) {
    const [low, medium] = data.config.bands;
    return `
      <div class="rs-meter" aria-hidden="true" style="--b1: ${low.below}%; --b2: ${medium.below}%">
        <i style="left: ${score}%"></i>
      </div>
      <div class="rs-scale" aria-hidden="true"><span>${t("rs.scale.low")}</span><span>${t("rs.scale.medium")}</span><span>${t("rs.scale.high")}</span></div>`;
  }

  // The top reasons (R-3) with the points each one added
  function pointsHtml(result) {
    if (!result.signals.length) {
      return `<ul class="reasons"><li>${icon("check")}<span>${t("rs.noSigns")}</span></li></ul>`;
    }
    const top = result.signals.slice(0, data.config.topReasons);
    const more = result.signals.length - top.length;
    return `
      <ul class="reasons">
        ${top.map(s => `<li>${icon("flag")}<span>${t(`rs.signal.${s.id}.reason`)}</span><span class="pts">+${s.weight}</span></li>`).join("")}
      </ul>
      ${more > 0 ? `<p class="meta">${t("rs.andMore", { count: more })}</p>` : ""}`;
  }

  // What the customer can do next. Medium and High both pause the transfer for a kopi break
  // (Jiliana's #pause-verify); High also sends it to the fraud team.
  function nextStepHtml(result, caseRef, transfer) {
    if (result.action === "proceed") {
      return `
        <p>${t("rs.usualLooks")}</p>
        <div class="stack"><button type="button" class="btn btn-primary" data-rs="send">${t("rs.send", { amount: money(transfer.amount) })}</button></div>`;
    }
    return `
      <p><strong>${t("rs.paused")}</strong> ${t("rs.notLeft")}</p>
      ${result.action === "pause-verify" ? `<p>${t("rs.checkTrusted")}</p>` : ""}
      ${caseRef ? `<p class="rs-next">${icon("briefcase")}<span>${t("rs.caseSent", { ref: `<strong>${esc(caseRef)}</strong>` })}</span></p>` : ""}
      <div class="stack">
        <a class="btn btn-primary" href="#pause-verify">${t("rs.kopi")} ${icon("arrow")}</a>
        <button type="button" class="btn btn-secondary" data-rs="cancel">${t("rs.cancel")}</button>
      </div>`;
  }

  function resultHtml() {
    const last = myState().lastResult;
    const sample = findSample(last.sampleId);
    const transfer = sample.transfer;
    return `
      <section data-read>
        <div class="verdict ${BAND_BOX[last.band] || "v-careful"}">
          ${icon(BAND_ICONS[last.band] || "question")}
          <div><p><strong>${t(`rs.band.${last.band}.label`)}</strong></p><h1 tabindex="-1">${t("rs.headline", { amount: money(transfer.amount), payee: esc(transfer.payeeName) })}</h1></div>
        </div>
        <div class="panel">
          <p class="rs-score"><span class="rs-score-num">${last.score}</span><span class="rs-score-max"> ${t("rs.outOf", { max: data.config.maxScore })}</span></p>
          ${meterHtml(last.score)}
          <p class="rs-action"><strong>${t("rs.nextLabel")}</strong> ${t(`rs.band.${last.band}.action`)}</p>
          <h2>${t("rs.madeScore")}</h2>
          ${pointsHtml(last)}
        </div>
      </section>
      <section class="panel" aria-label="${t("rs.whatToDo")}">
        ${nextStepHtml(last, last.caseRef, transfer)}
        <button type="button" class="btn btn-link" data-rs="again">${t("rs.again")}</button>
      </section>
      <section class="panel" aria-labelledby="rs-details-title">
        <h2 id="rs-details-title">${t("rs.transfer")}</h2>
        ${transferDetailsHtml(transfer)}
        ${allChecksHtml(last)}
        <p class="meta rs-source">${last.source === "server" ? t("rs.source.server") : t("rs.source.device")}</p>
      </section>`;
  }

  // ---------- Phase 4: sent or cancelled ----------

  function doneHtml() {
    const sent = myState().done === "sent";
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("check")}</div>
        <h1 tabindex="-1">${sent ? t("rs.done.sent") : t("rs.done.cancelled")}</h1>
        <p>${sent ? t("rs.done.sentNote") : t("rs.done.cancelledNote")}</p>
        <div class="stack">
          <a class="btn btn-primary" href="#customer">${t("common.backHome")}</a>
          ${sent ? "" : `<a class="btn btn-secondary" href="#report">${t("rs.reportScam")}</a>`}
          <button type="button" class="btn btn-link" data-rs="again">${t("rs.again")}</button>
        </div>
      </section>`;
  }

  function screenHtml() {
    const state = myState();
    // Coming from another screen starts at the picker (the last result is kept for #pause-verify).
    // If this screen is already showing, it is only being redrawn (next phase, or a language change),
    // so it stays on the same phase. The old screen is still on the page here, because the router
    // swaps it only after render() returns.
    const alreadyHere = document.querySelector(".rs-screen") !== null;
    if (!alreadyHere) { state.phase = "pick"; state.done = ""; }
    if (state.phase === "result" && !state.lastResult) state.phase = "pick";
    const body = { pick: pickHtml, scoring: scoringHtml, result: resultHtml, done: doneHtml }[state.phase]();
    return customerPageHtml("", `<div class="narrow rs-screen">${body}</div>`);
  }

  // ---------- Wiring up ----------

  async function checkRisk() {
    const state = myState();
    const sample = findSample(state.selectedId);
    if (!sample) return;
    state.phase = "scoring";
    redrawScreen();
    const [{ result, source }] = await Promise.all([score(sample.transfer), wait(MIN_CHECK_MS)]);
    const caseRef = result.action === "pause-and-case" ? openCase(result, sample.transfer) : "";
    state.lastResult = { sampleId: sample.id, ...result, caseRef, source };
        if (state.phase !== "scoring" || !document.querySelector(".rs-screen")) return;   // the customer left

    // Risky enough? Go straight to the kopi break (Jiliana's #pause-verify), no button to skip it
    if (result.score >= data.config.autoKopiFrom) {
      appState.pauseVerify = null;        // start a new kopi break for this transfer
      state.phase = "result";             // the result screen is still there if they come back
      location.hash = "#pause-verify";
      return;
    }

    state.phase = "result";
    redrawScreen();
  }

  function afterRender() {
    const state = myState();
    const screen = document.querySelector(".rs-screen");
    screen.addEventListener("click", event => {
      const pick = event.target.closest("[data-pick]");
      if (pick) {
        // Picking a transfer shows its details underneath, without leaving the button
        state.selectedId = pick.dataset.pick;
        screen.querySelectorAll("[data-pick]").forEach(b => b.setAttribute("aria-pressed", String(b === pick)));
        document.getElementById("rs-picked").innerHTML = pickedHtml(findSample(state.selectedId));
        return;
      }
      const action = event.target.closest("[data-rs]")?.dataset.rs;
      if (action === "score") checkRisk();
      if (action === "send") { state.done = "sent"; state.phase = "done"; redrawScreen(); }
      if (action === "cancel") { state.done = "cancelled"; state.phase = "done"; redrawScreen(); }
      if (action === "again") { state.phase = "pick"; state.done = ""; redrawScreen(); }
    });
  }

  registerRoute({
    name: "risk-scorer",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();