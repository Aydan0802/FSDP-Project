"use strict";

// Feature: Check a transfer (the screen). #risk-scorer
// Owner: Jose. Jira FSDP-131 to FSDP-134.
// The customer picks one of the sample transfers and sees its risk score, band, the points each
// warning sign added, and what happens next. This file is the screen only: the scoring itself
// is in js/features/risk-scorer-logic.js, and the weights and samples are in js/data/risk-scorer.js.
// Look and flow updated on frontend-update to match the senior flow preview
// (pick -> checking -> result -> sent / cancelled). The scoring, the API and the cases are unchanged.
//
// It asks the server first (POST /api/risk/score). If the server isn't running (for example
// the site was opened with "python -m http.server"), it scores on this device instead, with
// the very same code, so the result is the same either way.
//
// What it remembers (appState.riskScorer, cleared by #reset):
//   selectedId  the sample picked last
//   phase       "pick", "scoring", "result" or "done"
//   done        "sent" or "cancelled" once the customer decides
//   lastResult  the last result, for Jiliana's Pause-and-Verify screen:
//               { sampleId, score, band, bandLabel, action, actionText, reasons, signals, caseRef, source }
//   cases       High-risk cases for Wei Ye's staff console: { ref, createdAt, payeeName, amount, score, band, reasons }
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = RISK_SCORER_DATA;
  const API_TIMEOUT_MS = 2000;   // R-5: the API must answer within 2 seconds
  const MIN_CHECK_MS = 900;      // show "Checking..." at least this long, so people see it happen

  // The icon that goes with each band's words (icon + words, never colour alone)
  const BAND_ICONS = { low: "check", medium: "warning", high: "lock" };
  // The coloured result box (.verdict in base.css) for each band
  const BAND_BOX = { low: "v-good", medium: "v-careful", high: "v-bad" };

  // ---------- Small helpers ----------

  const esc = escapeHtml;

  function money(amount) {
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
  }

  // 1 becomes "1 am", 19 becomes "7 pm"
  function hourText(hour) {
    if (hour === 0) return "12 midnight";
    if (hour === 12) return "12 noon";
    return hour < 12 ? `${hour} am` : `${hour - 12} pm`;
  }

  // How long ago the payee was added, in words
  function agoText(hours) {
    if (hours < 1) return `${Math.round(hours * 60)} minutes ago`;
    if (hours < 48) return `${Math.round(hours)} hours ago`;
    if (hours < 24 * 365) return `${Math.round(hours / 24)} days ago`;
    return "over a year ago";
  }

  function recentText(minutes) {
    if (!minutes.length) return "None";
    return `${minutes.length} other${minutes.length > 1 ? "s" : ""}: ${minutes.map(m => `${m}`).join(" and ")} minutes ago`;
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

  // ---------- Drawing ----------

  let redrawing = false;
  function draw() {
    redrawing = true;
    try { redrawScreen(); } finally { redrawing = false; }
  }

  // ---------- Phase 1: pick a transfer ----------

  function pickedHtml(sample) {
    if (!sample) return "";
    const t = sample.transfer;
    return `
      <p class="rs-story">${esc(sample.story)}</p>
      <div class="summary-row"><span>To</span><span>${esc(t.payeeName)}</span></div>
      <div class="summary-row"><span>Amount</span><span>${money(t.amount)}</span></div>
      <div class="summary-row"><span>Time</span><span>${hourText(t.hour)}</span></div>
      <div class="stack"><button type="button" class="btn btn-primary" data-rs="score">Check the risk ${icon("arrow")}</button></div>`;
  }

  function pickHtml() {
    const selected = findSample(myState().selectedId);
    return `
      <section class="panel" data-read>
        <p class="eyebrow">Before you send money</p>
        <h1 tabindex="-1">Check a transfer before you send it</h1>
        <p class="lead">Pick a transfer to see how risky it looks. Scammers often rush people into sending money.</p>
      </section>
      <section class="panel" aria-labelledby="rs-pick-title">
        <h2 id="rs-pick-title">Pick a transfer</h2>
        <div class="chips" role="group" aria-labelledby="rs-pick-title">
          ${data.samples.map(s => `<button type="button" class="chip" data-pick="${esc(s.id)}" aria-pressed="${s.id === myState().selectedId}">${esc(s.title)}</button>`).join("")}
        </div>
        <div id="rs-picked" class="rs-picked">${pickedHtml(selected)}</div>
      </section>`;
  }

  // ---------- Phase 2: checking ----------

  function scoringHtml() {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">Checking this transfer…</h1>
        <ul class="progress-list"><li class="now"><span class="spin" aria-hidden="true"></span><span>Comparing with how you usually send money</span></li></ul>
      </section>`;
  }

  // ---------- Phase 3: the result ----------

  function transferDetailsHtml(t) {
    return `
      <dl class="rs-details">
        <div><dt>To</dt><dd>${esc(t.payeeName)}</dd></div>
        <div><dt>Amount</dt><dd>${money(t.amount)}</dd></div>
        <div><dt>You usually send</dt><dd>${t.usualAmount > 0 ? money(t.usualAmount) : "No history yet"}</dd></div>
        <div><dt>Time</dt><dd>${hourText(t.hour)}</dd></div>
        <div><dt>Payee added</dt><dd>${agoText(t.payeeAddedHoursAgo)}</dd></div>
        <div><dt>Paid them before?</dt><dd>${t.isNewPayee ? "No, first time" : "Yes"}</dd></div>
        <div><dt>Reported for scams?</dt><dd>${t.payeeFlagged ? "Yes" : "No"}</dd></div>
        <div><dt>Recent transfers</dt><dd>${recentText(t.recentTransferMinutes)}</dd></div>
      </dl>`;
  }

  // Every signal, whether it fired, and the points it added: so nothing is a black box
  function allChecksHtml(result) {
    const fired = new Map(result.signals.map(s => [s.id, s]));
    return `
      <details class="rs-all">
        <summary>See every check we made</summary>
        <div class="table-wrap">
          <table class="data-table">
            <caption class="visually-hidden">Every risk check and the points it added</caption>
            <thead><tr><th scope="col">Check</th><th scope="col">Found?</th><th scope="col">Points</th></tr></thead>
            <tbody>
              ${data.config.signals.map(s => `<tr>
                  <th scope="row">${esc(s.label)}<span class="rs-rule">${esc(s.rule)}</span></th>
                  <td>${fired.has(s.id) ? "Yes" : "No"}</td>
                  <td>${fired.has(s.id) ? `+${s.weight}` : "0"}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <p class="meta">Points add up to the score, which stops at ${data.config.maxScore}.</p>
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
      <div class="rs-scale" aria-hidden="true"><span>Low</span><span>Medium</span><span>High</span></div>`;
  }

  // The top reasons (R-3) with the points each one added
  function pointsHtml(result) {
    if (!result.signals.length) {
      return `<ul class="reasons"><li>${icon("check")}<span>We found no warning signs in this transfer.</span></li></ul>`;
    }
    const top = result.signals.slice(0, data.config.topReasons);
    const more = result.signals.length - top.length;
    return `
      <ul class="reasons">
        ${top.map(s => `<li>${icon("flag")}<span>${esc(s.reason)}</span><span class="pts">+${s.weight}</span></li>`).join("")}
      </ul>
      ${more > 0 ? `<p class="meta">And ${more} more. See every check we made, below.</p>` : ""}`;
  }

  // What the customer can do next. Medium and High both pause the transfer for a kopi break
  // (Jiliana's #pause-verify); High also sends it to the fraud team.
  function nextStepHtml(result, caseRef, t) {
    if (result.action === "proceed") {
      return `
        <p>This looks like your usual transfers.</p>
        <div class="stack"><button type="button" class="btn btn-primary" data-rs="send">Send ${money(t.amount)}</button></div>`;
    }
    return `
      <p><strong>We paused this transfer.</strong> Your money has not left your account.</p>
      ${result.action === "pause-verify" ? `<p>Check with someone you trust before you send. A new person asking for a big amount is a common scam.</p>` : ""}
      ${caseRef ? `<p class="rs-next">${icon("briefcase")}<span>We sent this to the bank's fraud team as case <strong>${esc(caseRef)}</strong>.</span></p>` : ""}
      <div class="stack">
        <a class="btn btn-primary" href="#pause-verify">Take a kopi break and check ${icon("arrow")}</a>
        <button type="button" class="btn btn-secondary" data-rs="cancel">Cancel this transfer</button>
      </div>`;
  }

  function resultHtml() {
    const last = myState().lastResult;
    const sample = findSample(last.sampleId);
    const t = sample.transfer;
    return `
      <section data-read>
        <div class="verdict ${BAND_BOX[last.band] || "v-careful"}">
          ${icon(BAND_ICONS[last.band] || "question")}
          <div><p><strong>${esc(last.bandLabel)}</strong></p><h1 tabindex="-1">${money(t.amount)} to ${esc(t.payeeName)}</h1></div>
        </div>
        <div class="panel">
          <p class="rs-score"><span class="rs-score-num">${last.score}</span><span class="rs-score-max"> out of ${data.config.maxScore}</span></p>
          ${meterHtml(last.score)}
          <p class="rs-action"><strong>What happens next:</strong> ${esc(last.actionText)}</p>
          <h2>What made the score</h2>
          ${pointsHtml(last)}
        </div>
      </section>
      <section class="panel" aria-label="What to do now">
        ${nextStepHtml(last, last.caseRef, t)}
        <button type="button" class="btn btn-link" data-rs="again">Try another transfer</button>
      </section>
      <section class="panel" aria-labelledby="rs-details-title">
        <h2 id="rs-details-title">The transfer</h2>
        ${transferDetailsHtml(t)}
        ${allChecksHtml(last)}
        <p class="meta rs-source">${last.source === "server"
          ? "Scored by the bank's server."
          : "Scored on this device, because the server isn't running. The result is the same."}</p>
      </section>`;
  }

  // ---------- Phase 4: sent or cancelled ----------

  function doneHtml() {
    const sent = myState().done === "sent";
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("check")}</div>
        <h1 tabindex="-1">${sent ? "Your transfer is on its way" : "Your transfer is cancelled"}</h1>
        <p>${sent ? "This is a demo, so no real money was sent." : "No money has left your account."}</p>
        <div class="stack">
          <a class="btn btn-primary" href="#customer">Back to home</a>
          ${sent ? "" : `<a class="btn btn-secondary" href="#report">Report a scam</a>`}
          <button type="button" class="btn btn-link" data-rs="again">Try another transfer</button>
        </div>
      </section>`;
  }

  function screenHtml() {
    const state = myState();
    // Coming here from another screen starts at the picker. The last result is kept for #pause-verify.
    if (!redrawing) { state.phase = "pick"; state.done = ""; }
    if (state.phase === "result" && !state.lastResult) state.phase = "pick";
    const body = { pick: pickHtml, scoring: scoringHtml, result: resultHtml, done: doneHtml }[state.phase]();
    return customerPageHtml("", `<div class="narrow rs-screen">${homeLinkHtml()}${body}</div>`);
  }

  // ---------- Wiring up ----------

  async function checkRisk() {
    const state = myState();
    const sample = findSample(state.selectedId);
    if (!sample) return;
    state.phase = "scoring";
    draw();
    const [{ result, source }] = await Promise.all([score(sample.transfer), wait(MIN_CHECK_MS)]);
    const caseRef = result.action === "pause-and-case" ? openCase(result, sample.transfer) : "";
    state.lastResult = { sampleId: sample.id, ...result, caseRef, source };
    if (state.phase !== "scoring" || !document.querySelector(".rs-screen")) return;   // the customer left
    state.phase = "result";
    draw();
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
      if (action === "send") { state.done = "sent"; state.phase = "done"; draw(); }
      if (action === "cancel") { state.done = "cancelled"; state.phase = "done"; draw(); }
      if (action === "again") { state.phase = "pick"; state.done = ""; draw(); }
    });
  }

  registerRoute({
    name: "risk-scorer",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
