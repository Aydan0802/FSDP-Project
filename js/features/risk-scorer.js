"use strict";

// Feature: Check a transfer (the screen). #risk-scorer
// Owner: Jose. Jira FSDP-131 to FSDP-134.
// The customer picks one of the sample transfers and sees its risk score, band, top reasons
// and what happens next. This file is the screen only: the scoring itself is in
// js/features/risk-scorer-logic.js, and the weights and samples are in js/data/risk-scorer.js.
//
// It asks the server first (POST /api/risk/score). If the server isn't running (for example
// the site was opened with "python -m http.server"), it scores on this device instead, with
// the very same code, so the result is the same either way.
//
// What it remembers (appState.riskScorer, cleared by #reset):
//   selectedId  the sample picked last
//   lastResult  the last result, for Jiliana's Pause-and-Verify screen:
//               { sampleId, score, band, bandLabel, action, actionText, reasons, signals, caseRef, source }
//   cases       High-risk cases for Wei Ye's staff console: { ref, createdAt, payeeName, amount, score, band, reasons }
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = RISK_SCORER_DATA;
  const API_TIMEOUT_MS = 2000;   // R-5: the API must answer within 2 seconds

  // The icon that goes with each band's words (icon + words, never colour alone)
  const BAND_ICONS = { low: "check", medium: "warning", high: "lock" };

  // ---------- Small helpers ----------

  // Makes text safe to put inside HTML
  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

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

  // This feature's corner of appState, created the first time it's needed
  function myState() {
    if (!appState.riskScorer) appState.riskScorer = { selectedId: "", lastResult: null, cases: [] };
    return appState.riskScorer;
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

  // ---------- The screen ----------

  function sampleCardHtml(sample, checked) {
    const t = sample.transfer;
    return `<li>
        <label class="rs-sample">
          <input type="radio" name="rs-sample" value="${esc(sample.id)}"${checked ? " checked" : ""}>
          <span class="rs-sample-text">
            <strong>${esc(sample.title)}</strong>
            <span class="rs-sample-sum">${money(t.amount)} to ${esc(t.payeeName)}, at ${hourText(t.hour)}</span>
            <span class="rs-sample-story">${esc(sample.story)}</span>
          </span>
        </label>
      </li>`;
  }

  function screenHtml() {
    const selected = myState().selectedId || data.samples[0].id;
    return customerPageHtml("", `
      <section class="rs-intro" data-read>
        <p class="eyebrow">Before you send money</p>
        <h1 tabindex="-1">Check a transfer</h1>
        <p>Pick a transfer to see how risky it looks, and why. Scammers often rush people into sending money, so we check every transfer before it leaves your account.</p>
      </section>

      <div class="rs-layout">
        <form class="rs-form" id="rs-form" novalidate>
          <fieldset class="rs-samples">
            <legend><h2>Pick a transfer</h2></legend>
            <ul>${data.samples.map(s => sampleCardHtml(s, s.id === selected)).join("")}</ul>
          </fieldset>
          <button type="submit" class="btn btn-primary" id="rs-check">Check this transfer ${icon("arrow")}</button>
        </form>

        <div class="rs-result-area" id="rs-result" aria-live="polite">
          ${myState().lastResult ? "" : `<div class="panel rs-empty"><p>${icon("transfer")}<span>Your result will show here.</span></p></div>`}
        </div>
      </div>

      <a class="btn btn-secondary btn-small rs-back" href="#customer">Back to home</a>`);
  }

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

  // What the customer can do next, for each action
  function nextStepHtml(result, caseRef) {
    if (result.action === "proceed") {
      return `<p class="rs-next">${icon("check")}<span>In the real app, the transfer would now go ahead.</span></p>`;
    }
    return `
      ${caseRef ? `<p class="rs-next">${icon("briefcase")}<span>We sent this to the bank's fraud team as case <strong>${esc(caseRef)}</strong>. Your money stays in your account until it is checked.</span></p>` : ""}
      <a class="btn btn-primary" href="#pause-verify">Pause and check the caller ${icon("arrow")}</a>`;
  }

  function resultHtml(sample, result, source, caseRef) {
    const t = sample.transfer;
    return `
      <section class="panel rs-result rs-result--${esc(result.band)}" aria-labelledby="rs-result-title">
        <h2 id="rs-result-title" tabindex="-1">Result: ${esc(sample.title)}</h2>

        <div data-read>
          <div class="rs-score-row">
            <p class="rs-score"><span class="rs-score-num">${result.score}</span><span class="rs-score-max"> out of ${data.config.maxScore}</span></p>
            <span class="rs-band rs-band--${esc(result.band)}">${icon(BAND_ICONS[result.band] || "question")}${esc(result.bandLabel)}</span>
          </div>
          <div class="rs-meter" aria-hidden="true">
            <span class="rs-meter-fill" style="--w: ${result.score}%"></span>
            ${data.config.bands.slice(0, -1).map(b => `<span class="rs-meter-tick" style="--at: ${b.below}%"></span>`).join("")}
          </div>
          <p class="rs-action"><strong>What happens next:</strong> ${esc(result.actionText)}</p>

          <h3>Why we gave this score</h3>
          ${result.reasons.length
            ? `<ol class="rs-reasons">${result.reasons.map(r => `<li>${icon("warning")}<span>${esc(r)}</span></li>`).join("")}</ol>`
            : `<p class="rs-none">${icon("check")}<span>We found no warning signs in this transfer.</span></p>`}
        </div>

        ${nextStepHtml(result, caseRef)}

        <h3 class="rs-details-title">The transfer</h3>
        ${transferDetailsHtml(t)}
        ${allChecksHtml(result)}

        <p class="meta rs-source">${source === "server"
          ? "Scored by the bank's server."
          : "Scored on this device, because the server isn't running. The result is the same."}</p>
      </section>`;
  }

  // ---------- Wiring up ----------

  function afterRender() {
    const form = document.getElementById("rs-form");
    const button = document.getElementById("rs-check");
    const area = document.getElementById("rs-result");

    form.addEventListener("change", event => {
      if (event.target.name === "rs-sample") myState().selectedId = event.target.value;
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const sample = data.samples.find(s => s.id === form.elements["rs-sample"].value);
      if (!sample) return;

      button.disabled = true;
      area.setAttribute("aria-busy", "true");
      const { result, source } = await score(sample.transfer);
      const caseRef = result.action === "pause-and-case" ? openCase(result, sample.transfer) : "";

      const state = myState();
      state.selectedId = sample.id;
      state.lastResult = { sampleId: sample.id, ...result, caseRef, source };

      area.innerHTML = resultHtml(sample, result, source, caseRef);
      area.removeAttribute("aria-busy");
      button.disabled = false;
      document.getElementById("rs-result-title").focus();
    });

    // Coming back to this screen: show the last result again (without opening another case)
    const last = myState().lastResult;
    if (last) {
      const sample = data.samples.find(s => s.id === last.sampleId);
      if (sample) area.innerHTML = resultHtml(sample, last, last.source, last.caseRef);
    }
  }

  registerRoute({
    name: "risk-scorer",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
