"use strict";

// Feature: Triage console (staff overview, case queue, case detail).
// Owner: Wei Ye
// The overview was moved out of the theme samples (shared/samples.js). The case queue and
// case detail are STUBS for now: build them here on your own branch.
// The made-up data is in js/data/triage-console.js.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  const data = TRIAGE_CONSOLE_DATA;

  // A single-colour bar chart (one series, so no legend: the heading names it).
  // Hover or keyboard focus shows each day's number; today's number is always shown.
  function chartHtml() {
    const top = 15;   // the top of the scale
    const today = data.days.length - 1;
    return `
      <div class="chart">
        <div class="chart-scale" aria-hidden="true">
          ${[15, 10, 5, 0].map((n, i) => `<span style="--y: ${i / 3}">${n}</span>`).join("")}
        </div>
        <ol class="bars">
          ${data.days.map((d, i) => `<li class="bar-col${i === today ? " is-today" : ""}">
              <span class="bar" style="--h: ${(d.count / top) * 100}%" role="img" tabindex="0" aria-label="${d.day} ${d.date}: ${d.count} reports">
                ${i === today ? `<span class="bar-value" aria-hidden="true">${d.count}</span>` : ""}
                <span class="bar-tip" aria-hidden="true">${d.date}: ${d.count} reports</span>
              </span>
            </li>`).join("")}
        </ol>
        <span></span>
        <ol class="bar-days" aria-hidden="true">
          ${data.days.map((d, i) => `<li${i === today ? ' class="is-today"' : ""}>${i === today ? "Today" : d.day}</li>`).join("")}
        </ol>
      </div>
      <details class="chart-table">
        <summary>Show as a table</summary>
        <table class="data-table">
          <thead><tr><th scope="col">Day</th><th scope="col">Reports</th></tr></thead>
          <tbody>${data.days.map(d => `<tr><td>${d.day} ${d.date}</td><td>${d.count}</td></tr>`).join("")}</tbody>
        </table>
      </details>`;
  }

  // One bar per result. The badge (icon and words) says which result it is, so the bars
  // can all be one colour.
  function mixHtml() {
    const most = Math.max(...data.mix.map(m => m.count));
    const total = data.mix.reduce((sum, m) => sum + m.count, 0);
    return `
      <ul class="mix">
        ${data.mix.map(m => `<li>
            <span class="mix-label">${badge(m.result)}</span>
            <span class="mix-track" aria-hidden="true"><span class="mix-fill" style="--w: ${(m.count / most) * 100}%"></span></span>
            <span class="mix-n">${m.count}</span>
          </li>`).join("")}
      </ul>
      <p class="mix-total">${total} reports this week. A person checks every "Not sure" result.</p>`;
  }

  // The "Check these first" table. Each case number links to that case's detail screen.
  function queueHtml() {
    return `
      <table class="data-table queue">
        <caption class="visually-hidden">Reports to check first, highest risk first</caption>
        <thead><tr>
          <th scope="col">Case</th><th scope="col">Received</th><th scope="col">Result</th>
          <th scope="col">What happened</th><th scope="col">Status</th>
        </tr></thead>
        <tbody>
          ${data.queue.map(c => `<tr>
              <th scope="row"><a class="case-link" href="#staff-case/${c.ref}">${c.ref}</a></th>
              <td>${c.received}</td>
              <td>${badge(c.result)}</td>
              <td class="queue-what">${c.what}</td>
              <td><span class="status status--${slug(c.status)}">${c.status}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  }

  // Screen 1: the staff overview
  function overviewHtml() {
    return staffPageHtml("staff", `
      <div class="staff-title">
        <p class="eyebrow">Fraud operations</p>
        <h1 tabindex="-1">Overview</h1>
        <p class="meta">Tuesday 3 Nov 2026. Made-up data.</p>
      </div>

      <ul class="kpis">
        ${data.kpis.map(k => `<li class="kpi${k.alert ? " kpi--alert" : ""}">
            <span class="kpi-label">${k.label}</span>
            <span class="kpi-value">${k.value}</span>
            <span class="kpi-note">${k.note}</span>
          </li>`).join("")}
      </ul>

      <div class="staff-grid">
        <section class="panel panel-chart" aria-labelledby="chart-title">
          <h2 id="chart-title">Reports received, last 7 days</h2>
          ${chartHtml()}
        </section>
        <section class="panel panel-mix" aria-labelledby="mix-title">
          <h2 id="mix-title">Results this week</h2>
          ${mixHtml()}
        </section>
        <section class="panel panel-queue" aria-labelledby="queue-title">
          <div class="panel-head">
            <h2 id="queue-title">Check these first</h2>
            <a class="btn btn-secondary btn-small" href="#staff-queue">Open the case queue</a>
          </div>
          <div class="table-wrap">${queueHtml()}</div>
        </section>
      </div>

      <p class="honesty">${icon("question")}<span>Results are warning signs drawn from the voice check, what the caller asked for and the customer's answers. They are not proof of a scam.</span></p>`);
  }

  // Screen 2 (STUB): the case queue
  function queueScreenHtml() {
    return staffPageHtml("staff-queue", stubHtml(
      "Case queue",
      "Every report waiting for review, with filters and sorting.",
      "staff", "Back to overview"));
  }

  // Screen 3 (STUB): one case. ref comes from the address, e.g. #staff-case/VC-2611-0103.
  // It is only shown if it matches a real case in the data, so nothing typed into the address
  // bar ends up on the page.
  function caseHtml(ref) {
    const found = data.queue.find(c => c.ref === ref);
    return staffPageHtml("staff-queue", stubHtml(
      found ? `Case ${found.ref}` : "Case not found",
      found ? "The timeline, AI results and actions for this case." : "There is no case with that number.",
      "staff-queue", "Back to the case queue"));
  }

  registerRoute({ name: "staff", role: "staff", render: overviewHtml });
  registerRoute({ name: "staff-queue", role: "staff", render: queueScreenHtml });
  registerRoute({ name: "staff-case", role: "staff", render: caseHtml });
})();

// ======================================================================================
// Case queue and case detail (MOCK-UP, added below the overview code).
// Owner: Wei Ye
// What this part does:
//   #staff-queue        a list of every case, with tabs, search, filters and sorting
//   #staff-case/<ref>   one case in detail: why it was raised, the transfer, what the
//                       customer said, the evidence, a timeline, and the staff decision
// It replaces the two stubs above: registerRoute() just keeps the LAST screen registered under
// a name, so the stubs are still here but never shown. (Delete them whenever you are ready.)
// Nothing here is saved or sent anywhere. Decisions live in appState.triageQueue, so #reset
// wipes them. All the data is made up, see CASE_QUEUE_DATA in js/data/triage-console.js.
// PRIVACY: this screen never shows customer details (no name, age or usual amounts). The
// receiver is shown hidden (masked name, last 3 digits of the account). The only thing known
// about a receiver is how many times other people reported it, so staff are warned.
// ======================================================================================

(function () {
  const q = CASE_QUEUE_DATA;
  const STAFF_NAME = "R. Tan";   // the same name the staff header shows (staffPageHtml in helpers.js)

  // ---------- Lookup tables ----------

  // The tabs above the table. statuses: null means "every status"
  const TABS = [
    { key: "needs-review", label: "Needs review", statuses: ["New", "In review"] },
    { key: "active", label: "On hold or escalated", statuses: ["On hold", "Escalated"] },
    { key: "cleared", label: "Cleared", statuses: ["Cleared"] },
    { key: "all", label: "All", statuses: null }
  ];

  // The sort menu. "Most urgent" is the default: money already sent first (the overview says
  // "call these customers first"), then the highest score, then the newest.
  const SORTS = [
    { key: "urgent", label: "Most urgent first", compare: (a, b) => (Number(b.moneySent) - Number(a.moneySent)) || (b.score - a.score) || (a.ageMin - b.ageMin) },
    { key: "newest", label: "Newest first", compare: (a, b) => a.ageMin - b.ageMin },
    { key: "oldest", label: "Oldest first", compare: (a, b) => b.ageMin - a.ageMin },
    { key: "risk", label: "Highest risk score", compare: (a, b) => (b.score - a.score) || (a.ageMin - b.ageMin) },
    { key: "amount", label: "Biggest amount", compare: (a, b) => amountOf(b) - amountOf(a) }
  ];

  // Risk levels reuse the look of the result badges (icon + words, never colour alone)
  const LEVELS = {
    high: { cls: "badge--likely", icon: "warning", text: "High risk" },
    medium: { cls: "badge--uncertain", icon: "question", text: "Medium risk" },
    low: { cls: "badge--real", icon: "check", text: "Low risk" }
  };

  // What a staff member can decide. A person ALWAYS makes the call: nothing here is automatic.
  const ACTIONS = {
    approve: { label: "Approve", status: "Cleared", done: "Case approved and cleared. It is recorded in the timeline." },
    hold: { label: "Hold", status: "On hold", done: "Case put on hold. It is recorded in the timeline." },
    escalate: { label: "Escalate", status: "Escalated", done: "Case escalated to the fraud investigations team. It is recorded in the timeline." },
    reopen: { label: "Reopen", status: "In review", done: "Case reopened for review. It is recorded in the timeline." }
  };

  // ---------- Small helpers ----------

  // Makes text safe to put inside HTML. Anything typed by a person (search, reasons) or sent
  // by a server goes through this first, so it can never become code on the page.
  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }

  function money(n) {
    return "$" + Number(n).toLocaleString("en-SG");
  }

  // Hides a name: first letter of each word, then stars ("Jun Wei" becomes "J** W**").
  // Anything that already has stars in it is left alone. Used for names sent by a live server.
  function maskName(name) {
    const text = String(name || "").trim();
    if (!text) return "Hidden";
    if (text.indexOf("*") !== -1) return text;
    return text.split(/\s+/).map(w => w.charAt(0) + "*".repeat(Math.max(2, w.length - 1))).join(" ");
  }

  function amountOf(c) {
    return c.transfer ? c.transfer.amount : 0;
  }

  // The clock time for new timeline entries, e.g. "Today 16:52"
  function nowLabel() {
    return "Today " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  // ---------- What this screen remembers (appState.triageQueue) ----------

  // The tab, filters and decisions. Created the first time it is needed, so we never have to
  // touch state.js. Coming back from a case, the queue still shows the same tab and search.
  function view() {
    if (!appState.triageQueue) {
      appState.triageQueue = { status: "needs-review", source: "all", sort: "urgent", search: "", decisions: {}, flash: "", flashKind: "" };
    }
    return appState.triageQueue;
  }

  // ---------- The cases ----------

  let liveCases = [];   // cases fetched from the server (stays empty when there is no server)

  // A case as it looks right now: the data, plus any decision made in this session
  function withDecision(c) {
    const d = view().decisions[c.ref];
    const log = (c.log || []).concat(d ? d.log : []);
    return Object.assign({}, c, { status: d ? d.status : c.status, log });
  }

  function allCases() {
    return liveCases.concat(q.cases).map(withDecision);
  }

  function findCase(ref) {
    return allCases().find(c => c.ref === ref);
  }

  // Cases after the tab, source and search have been applied, then sorted
  function visibleCases() {
    const v = view();
    const tab = TABS.find(t => t.key === v.status) || TABS[0];
    const sort = SORTS.find(s => s.key === v.sort) || SORTS[0];
    const words = v.search.trim().toLowerCase();
    return allCases()
      .filter(c => !tab.statuses || tab.statuses.includes(c.status))
      .filter(c => v.source === "all" || c.source === v.source)
      .filter(c => !words || [c.ref, c.what, c.receiver ? c.receiver.name : "", c.receiver ? c.receiver.acct : ""].join(" ").toLowerCase().includes(words))
      .sort(sort.compare);
  }

  function countFor(tabKey) {
    const tab = TABS.find(t => t.key === tabKey);
    return allCases().filter(c => !tab.statuses || tab.statuses.includes(c.status)).length;
  }

  // ---------- Live cases from the server (optional) ----------

  // If the Express server from /server is running, Jose's risk scorer keeps a list of the
  // High-risk transfers it paused. We ask for it and show those cases too. With the plain
  // python server, or no server, the request fails quietly and we only show the made-up cases.
  function fromServer(s) {
    const made = new Date(s.createdAt);
    const when = isNaN(made) ? "Just now" : "Live " + made.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const age = isNaN(made) ? 0 : Math.max(0, Math.round((Date.now() - made.getTime()) / 60000));
    const payee = maskName(s.payeeName);   // never keep the full name, even from the server
    return {
      ref: s.ref, received: when, ageMin: age, source: "auto", live: true,
      level: LEVELS[s.band] ? s.band : "high", score: Number(s.score) || 0, status: "New", moneySent: false,
      what: `${money(s.amount)} transfer to ${payee} was paused automatically`,
      why: (s.reasons || []).map(r => ({ label: "Risk signal", detail: r })),
      receiver: { name: payee, acct: "Hidden", reports: 0 },
      transfer: { amount: s.amount, state: "Paused. Waiting for a bank officer." },
      answers: [], voice: null, evidence: [],
      timeline: [{ time: when, text: "Transfer paused by the risk scorer. Case opened." }],
      next: "Contact the customer through the bank's official channel before any money leaves."
    };
  }

  // Resolves to true if the server answered, false if not. Never throws.
  function loadLiveCases() {
    if (typeof fetch !== "function") return Promise.resolve(false);
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 2000) : 0;   // don't wait forever
    return fetch("/api/risk/cases", controller ? { signal: controller.signal } : {})
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("no cases api"))))
      .then(list => {
        if (!Array.isArray(list)) return false;
        liveCases = list.map(fromServer);
        return true;
      })
      .catch(() => false)
      .then(ok => { clearTimeout(timer); return ok; });
  }

  // ---------- Small pieces of screen ----------

  function levelBadge(c) {
    const l = LEVELS[c.level];
    return `<span class="badge ${l.cls}">${icon(l.icon)}${l.text}</span><span class="risk-score">${c.score}/100</span>`;
  }

  function sourceHtml(key) {
    const s = q.sources[key];
    return `<span class="source">${icon(s.icon)}${s.label}</span>`;
  }

  function moneyFlag() {
    return `<span class="money-flag">${icon("warning")}Money already sent</span>`;
  }

  // Shown when the receiving account has been reported by other people more than once
  function receiverFlag(c) {
    return c.receiver && c.receiver.reports >= 2
      ? `<span class="money-flag">${icon("warning")}Receiver reported ${c.receiver.reports} times</span>` : "";
  }

  function statusHtml(status) {
    return `<span class="status status--${slug(status)}">${esc(status)}</span>`;
  }

  // ---------- Screen 1: the case queue ----------

  // The four numbers at the top, worked out from the cases (so they move when a decision is made)
  function kpisHtml() {
    const open = allCases().filter(c => c.status === "New" || c.status === "In review");
    const items = [
      { label: "Needs review", value: open.length, note: "New or in review" },
      { label: "Money already sent", value: open.filter(c => c.moneySent).length, note: "Call these customers first", alert: true },
      { label: "Auto-flagged transfers", value: open.filter(c => c.source === "auto").length, note: "Paused by the risk scorer" },
      { label: "Raised by customers", value: open.filter(c => c.source !== "auto").length, note: "Reports and pause checks" }
    ];
    return items.map(k => `<li class="kpi${k.alert && k.value ? " kpi--alert" : ""}">
        <span class="kpi-label">${k.label}</span>
        <span class="kpi-value">${k.value}</span>
        <span class="kpi-note">${k.note}</span>
      </li>`).join("");
  }

  // The explainer: how do cases get here? (Answers "are cases raised by customers too?": yes.)
  function howRaisedHtml() {
    return `
      <details class="panel how-raised">
        <summary>How do cases get here?</summary>
        <ul class="how-list">
          ${Object.keys(q.sources).map(key => `<li>${sourceHtml(key)}<span>${esc(q.sources[key].how)}</span></li>`).join("")}
        </ul>
        <p class="how-note">${icon("lock")}<span>Every case is raised by a customer or by the risk scorer, never by staff. A person reviews each one. Nothing is blocked or released without a staff decision.</span></p>
      </details>`;
  }

  function controlsHtml() {
    const v = view();
    return `
      <div class="qf">
        <div class="qf-tabs" role="group" aria-label="Show cases that are">
          ${TABS.map(t => `<button type="button" class="chip" data-status="${t.key}" aria-pressed="${v.status === t.key}">${t.label} <span class="chip-n">${countFor(t.key)}</span></button>`).join("")}
        </div>
        <div class="qf-row">
          <div class="field">
            <label for="qf-search">Search</label>
            <input id="qf-search" type="search" value="${esc(v.search)}" placeholder="Case number or receiver" autocomplete="off">
          </div>
          <div class="field">
            <label for="qf-source">Raised by</label>
            <select id="qf-source">
              <option value="all"${v.source === "all" ? " selected" : ""}>Anyone</option>
              ${Object.keys(q.sources).map(key => `<option value="${key}"${v.source === key ? " selected" : ""}>${q.sources[key].label}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="qf-sort">Sort by</label>
            <select id="qf-sort">
              ${SORTS.map(s => `<option value="${s.key}"${v.sort === s.key ? " selected" : ""}>${s.label}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>`;
  }

  function countText(shown) {
    return `Showing ${shown} of ${allCases().length} cases.`;
  }

  // The table itself, or a friendly message when nothing matches
  function tableHtml(list) {
    if (!list.length) {
      return `<p class="qt-empty">${icon("question")}<span>No cases match. Try another tab, or clear the search.</span></p>`;
    }
    return `
      <table class="data-table queue case-table">
        <caption class="visually-hidden">Cases, in the order chosen under Sort by</caption>
        <thead><tr>
          <th scope="col">Case</th><th scope="col">Received</th><th scope="col">Raised by</th>
          <th scope="col">Risk</th><th scope="col">What happened</th><th scope="col">Status</th>
        </tr></thead>
        <tbody>
          ${list.map(c => `<tr>
              <th scope="row"><a class="case-link" href="#staff-case/${c.ref}">${esc(c.ref)}</a></th>
              <td>${esc(c.received)}</td>
              <td>${sourceHtml(c.source)}</td>
              <td>${levelBadge(c)}</td>
              <td class="queue-what">${esc(c.what)}${c.moneySent ? moneyFlag() : ""}${receiverFlag(c)}${c.live ? `<span class="live-flag">Live from the server</span>` : ""}</td>
              <td>${statusHtml(c.status)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  }

  function queueScreenHtml() {
    const list = visibleCases();
    return staffPageHtml("staff-queue", `
      <div class="staff-title">
        <p class="eyebrow">Fraud operations</p>
        <h1 tabindex="-1">Case queue</h1>
        <p class="meta">Tuesday 3 Nov 2026. Made-up data.</p>
      </div>

      <ul class="kpis" id="qk" data-read>${kpisHtml()}</ul>

      ${howRaisedHtml()}

      <section class="panel" aria-labelledby="qlist-title">
        <h2 id="qlist-title">Reports and flagged transfers</h2>
        ${controlsHtml()}
        <p class="qt-count" id="qt-count" role="status">${countText(list.length)}</p>
        <div class="table-wrap" id="qt-table" data-read>${tableHtml(list)}</div>
      </section>

      <p class="honesty">${icon("question")}<span>Risk scores are warning signs, not proof of a scam. Plenty of risky-looking transfers turn out to be genuine, so a person always checks before anything is held.</span></p>`);
  }

  // Wires up the tabs, search and menus. Only the table and numbers are redrawn when something
  // changes, so the search box keeps keyboard focus while you type.
  function queueAfterRender() {
    const v = view();

    function refresh() {
      const list = visibleCases();
      document.getElementById("qt-table").innerHTML = tableHtml(list);
      document.getElementById("qt-count").textContent = countText(list.length);
      document.getElementById("qk").innerHTML = kpisHtml();
      document.querySelectorAll(".qf-tabs .chip").forEach(btn => {
        btn.setAttribute("aria-pressed", String(btn.dataset.status === v.status));
        btn.querySelector(".chip-n").textContent = countFor(btn.dataset.status);
      });
    }

    document.querySelector(".qf-tabs").addEventListener("click", event => {
      const btn = event.target.closest("[data-status]");
      if (!btn) return;
      v.status = btn.dataset.status;
      refresh();
    });
    document.getElementById("qf-search").addEventListener("input", event => { v.search = event.target.value; refresh(); });
    document.getElementById("qf-source").addEventListener("change", event => { v.source = event.target.value; refresh(); });
    document.getElementById("qf-sort").addEventListener("change", event => { v.sort = event.target.value; refresh(); });

    // If a server is running, add its cases and redraw. If the person has already left the
    // screen by then, there is no table to draw into, so we simply stop.
    loadLiveCases().then(ok => { if (ok && document.getElementById("qt-table")) refresh(); });
  }

  // ---------- Screen 2: one case ----------

  // A row of "label: value" pairs. Skips any value that is empty.
  function factsHtml(rows) {
    return `<dl class="facts">${rows.filter(r => r[1] !== "" && r[1] != null).map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join("")}</dl>`;
  }

  // What the transfer is doing now. A staff decision changes it (unless the money is already gone).
  function transferState(c) {
    if (c.moneySent) return esc(c.transfer.state);
    if (c.status === "Cleared" && c.log.length) return "Released after staff review.";
    if (c.status === "On hold") return "Held by staff.";
    if (c.status === "Escalated") return "Held and escalated to the fraud investigations team.";
    return esc(c.transfer.state);
  }

  function whyHtml(c) {
    const total = c.why.some(w => w.points) ? `
        <p class="why-total">Risk score: <strong>${c.score} out of 100</strong></p>
        <div class="why-track" aria-hidden="true"><span class="why-fill" style="--w: ${c.score}%"></span></div>` : "";
    return `
      <section class="panel" aria-labelledby="why-title" data-read>
        <h2 id="why-title">Why this case was raised</h2>
        <p class="why-source">${sourceHtml(c.source)}<span>${esc(q.sources[c.source].how)}</span></p>
        <ul class="why-list">
          ${c.why.map(w => `<li>
              <span class="why-pts">${w.points ? "+" + w.points : icon("flag")}</span>
              <span><strong>${esc(w.label)}</strong><br>${esc(w.detail)}</span>
            </li>`).join("")}
        </ul>
        ${total}
      </section>`;
  }

  // The transfer and the receiver. The receiver is always hidden (masked name, last 3 digits).
  // The "scam reports" row is how staff learn a receiver has been reported before.
  function transferAndReceiverHtml(c) {
    const transfer = c.transfer ? factsHtml([
      ["Amount", money(c.transfer.amount)],
      ["Transfer status", transferState(c)]
    ]) : `<p class="muted">No transfer is involved in this case.</p>`;
    let receiver = `<p class="muted">No receiving account is involved in this case.</p>`;
    if (c.receiver) {
      const r = c.receiver;
      const reportsHtml = r.reports > 0
        ? `<span class="badge ${r.reports >= 2 ? "badge--likely" : "badge--uncertain"}">${icon("warning")}Reported ${r.reports} ${r.reports === 1 ? "time" : "times"}</span>`
        : "None on file";
      receiver = `
        ${r.reports >= 2 ? `<p class="receiver-alert" role="note">${icon("warning")}<span>Other people have reported this receiver for scams ${r.reports} times. Treat the customer's transfer with extra care.</span></p>` : ""}
        ${factsHtml([
          ["Receiver", esc(r.name)],
          ["Account", esc(r.acct)],
          ["Scam reports", reportsHtml],
          ["Paid by others today", r.senders ? `${r.senders} different people` : ""]
        ])}
        <p class="honesty">${icon("lock")}<span>The receiver's details are hidden to protect them and the customer. Only the number of reports is known.</span></p>`;
    }
    return `
      <div class="case-pair">
        <section class="panel" aria-labelledby="tr-title" data-read><h2 id="tr-title">The transfer</h2>${transfer}</section>
        <section class="panel" aria-labelledby="rc-title" data-read><h2 id="rc-title">The receiver</h2>${receiver}</section>
      </div>`;
  }

  function answersHtml(c) {
    if (!c.answers.length && !c.voice) return "";
    return `
      <section class="panel" aria-labelledby="ans-title" data-read>
        <h2 id="ans-title">What the customer told us</h2>
        ${c.answers.length ? `<dl class="qa">${c.answers.map(a => `<div><dt>${esc(a.q)}</dt><dd>${esc(a.a)}</dd></div>`).join("")}</dl>` : ""}
        ${c.voice ? `<p class="voice-line">${badge(c.voice.result)}<span>${esc(c.voice.note)}</span></p>
        <p class="honesty">${icon("question")}<span>The voice check gives warning signs, not proof. It only looks at a clip the customer chose to share.</span></p>` : ""}
      </section>`;
  }

  function evidenceHtml(c) {
    return `
      <section class="panel" aria-labelledby="ev-title" data-read>
        <h2 id="ev-title">Evidence on file</h2>
        ${c.evidence.length ? `<ul class="evidence">${c.evidence.map(e => `<li>${icon("document")}<span><strong>${esc(e.label)}</strong><br>${esc(e.note)}</span></li>`).join("")}</ul>` : `<p class="muted">Nothing attached yet.</p>`}
        <p class="honesty">${icon("lock")}<span>Made-up samples only. Only what a customer chooses to share is kept, and no real voiceprints or face data are ever stored.</span></p>
      </section>`;
  }

  // Timeline: what the system saw, then every staff decision (this IS the audit log)
  function timelineHtml(c) {
    const events = c.timeline.map(t => ({ time: t.time, text: esc(t.text) }))
      .concat(c.log.map(l => ({ time: l.time, text: `<strong>${esc(l.who)}: ${esc(l.action)}.</strong> ${esc(l.reason)}` })));
    return `
      <section class="panel" aria-labelledby="tl-title" data-read>
        <h2 id="tl-title">Timeline and audit log</h2>
        <ol class="timeline">${events.map(e => `<li><span class="tl-time">${esc(e.time)}</span><span class="tl-text">${e.text}</span></li>`).join("")}</ol>
      </section>`;
  }

  // The decision panel. Choosing an action opens a short confirm box that asks for a reason.
  function decisionHtml(c) {
    const closed = c.status === "Cleared";
    const paused = c.transfer && !c.moneySent;
    const buttons = closed ? `
        <button type="button" class="btn btn-secondary" data-decide="reopen">${icon("list")}Reopen for review</button>` : `
        <button type="button" class="btn btn-secondary" data-decide="approve">${icon("check")}Approve<small>${paused ? "Let the transfer go ahead" : "Close the case: it looks genuine"}</small></button>
        <button type="button" class="btn btn-secondary" data-decide="hold">${icon("lock")}Hold<small>${paused ? "Keep the transfer paused" : "Keep the case open and watch it"}</small></button>
        <button type="button" class="btn btn-secondary" data-decide="escalate">${icon("flag")}Escalate<small>Send to the fraud investigations team</small></button>`;
    return `
      <section class="panel decision" aria-labelledby="dec-title">
        <h2 id="dec-title">Your decision</h2>
        <p class="next-step" data-read><strong>Suggested next step</strong><br>${esc(c.next)}</p>
        <div class="decide-buttons">${buttons}</div>
        <div class="confirm" id="decide-confirm" hidden>
          <h3 id="decide-title" tabindex="-1"></h3>
          <div class="field">
            <label for="decide-reason">Why? A short reason goes in the audit log.</label>
            <textarea id="decide-reason" rows="3" maxlength="300"></textarea>
          </div>
          <p class="field-error" id="decide-error" role="alert"></p>
          <div class="confirm-buttons">
            <button type="button" class="btn btn-primary btn-small" id="decide-ok">Confirm</button>
            <button type="button" class="btn btn-secondary btn-small" id="decide-cancel">Cancel</button>
          </div>
        </div>
        <p class="honesty">${icon("lock")}<span>A person makes every decision. Nothing is blocked or released by itself.</span></p>
      </section>`;
  }

  function caseHtml(ref) {
    const c = findCase(ref);
    // Only shown if the number matches a real case, so nothing typed into the address bar
    // ends up on the page.
    if (!c) {
      return staffPageHtml("staff-queue", stubHtml("Case not found", "There is no case with that number.", "staff-queue", "Back to the case queue"));
    }
    const v = view();
    return staffPageHtml("staff-queue", `
      <a class="btn btn-secondary btn-small" href="#staff-queue">Back to the case queue</a>

      <div class="staff-title case-title">
        <p class="eyebrow">Case</p>
        <h1 tabindex="-1">${esc(c.ref)}</h1>
        <p class="meta">${esc(c.what)}</p>
      </div>

      ${v.flash ? `<p class="flash flash--${v.flashKind === "reopen" ? "reopen" : "done"}" role="status">${icon(v.flashKind === "reopen" ? "warning" : "check")}<span>${esc(v.flash)}</span></p>` : ""}
      ${c.moneySent ? `<p class="case-alert" role="note">${icon("warning")}<span><strong>Money has already left this account.</strong> Contact the customer first through the bank's official channel, never through a number or link from the report.</span></p>` : ""}

      <section class="panel" aria-labelledby="sum-title" data-read>
        <h2 id="sum-title">Summary</h2>
        ${factsHtml([
          ["Case number", esc(c.ref)],
          ["Time received", esc(c.received)],
          ["Raised by", sourceHtml(c.source)],
          ["Risk", levelBadge(c)],
          ["Status", statusHtml(c.status)]
        ])}
      </section>

      <div class="case-grid">
        <div class="case-main">
          ${whyHtml(c)}
          ${transferAndReceiverHtml(c)}
          ${answersHtml(c)}
          ${evidenceHtml(c)}
        </div>
        <div class="case-side">
          ${decisionHtml(c)}
          ${timelineHtml(c)}
        </div>
      </div>`);
  }

  function caseAfterRender(ref) {
    const v = view();
    const c = findCase(ref);
    v.flash = "";   // the message is shown once, then forgotten
    v.flashKind = "";

    // A live case from the server isn't known yet if the page was opened straight on its address.
    // Ask the server, and draw the screen again only if the case turns up (no loop: it stops
    // as soon as the case is found).
    if (!c) {
      loadLiveCases().then(ok => { if (ok && findCase(ref) && location.hash.indexOf("#staff-case") === 0) showScreen(); });
      return;
    }

    const confirmBox = document.getElementById("decide-confirm");
    const title = document.getElementById("decide-title");
    const reason = document.getElementById("decide-reason");
    const error = document.getElementById("decide-error");
    let choice = "";
    let opener = null;

    document.querySelectorAll("[data-decide]").forEach(btn => btn.addEventListener("click", () => {
      choice = btn.dataset.decide;
      opener = btn;
      title.textContent = `You chose: ${ACTIONS[choice].label}`;
      reason.value = "";
      reason.removeAttribute("aria-invalid");
      error.textContent = "";
      confirmBox.hidden = false;
      reason.focus();
    }));

    document.getElementById("decide-cancel").addEventListener("click", () => {
      confirmBox.hidden = true;
      if (opener) opener.focus();
    });

    document.getElementById("decide-ok").addEventListener("click", () => {
      const text = reason.value.trim();
      if (!text) {
        error.textContent = "Please write a short reason. It goes in the audit log.";
        reason.setAttribute("aria-invalid", "true");
        reason.focus();
        return;
      }
      const decisions = view().decisions;
      const before = decisions[c.ref] ? decisions[c.ref].log : [];
      decisions[c.ref] = {
        status: ACTIONS[choice].status,
        log: before.concat({ time: nowLabel(), who: STAFF_NAME, action: ACTIONS[choice].label, reason: text })
      };
      view().flash = ACTIONS[choice].done;
      view().flashKind = choice;   // decides the colour of the message: green, or orange for "reopen"
      showScreen();   // draw the case again with its new status and timeline
    });
  }

  // These two replace the stubs registered above.
  registerRoute({ name: "staff-queue", role: "staff", render: queueScreenHtml, afterRender: queueAfterRender });
  registerRoute({ name: "staff-case", role: "staff", render: caseHtml, afterRender: caseAfterRender });
})();