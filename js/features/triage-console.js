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
// Flagged activity and case detail (MOCK-UP, added below the overview code).
// Owner: Wei Ye
// The staff side is a VIEW-ONLY dashboard: staff look, they don't do. There are no buttons that
// change anything and no jobs for staff. What it does:
//   #staff-queue        a list of everything the system flagged, with search, filters and sorting
//   #staff-case/<ref>   one flagged case in detail: why it was flagged, the transfer, the receiver,
//                       what the customer told us, the evidence, and a timeline
// (The address still says "queue" because the router and the side menu already use that name.)
// It replaces the two stubs above: registerRoute() just keeps the LAST screen registered under
// a name, so the stubs are still here but never shown. (Delete them whenever you are ready.)
// Who does what instead of staff: the CUSTOMER chooses to continue or cancel a paused transfer,
// and the SYSTEM records everything and passes serious cases to the investigators by itself.
// PRIVACY: this screen never shows customer details (no name, age or usual amounts). The
// receiver is shown hidden (masked name, last 3 digits of the account). The only thing known
// about a receiver is how many times other people reported it, so the dashboard can warn.
// Nothing here is saved or sent anywhere. All the data is made up, see CASE_QUEUE_DATA in
// js/data/triage-console.js.
// ======================================================================================

(function () {
  const q = CASE_QUEUE_DATA;

  // Team switch: the team is still deciding whether customer reports belong on the staff side.
  // true  = show auto-flagged transfers, pause checks AND customer reports
  // false = show only the transfers the system flagged by itself (the other cases are hidden)
  const SHOW_CUSTOMER_REPORTS = true;

  // The shared side menu (helpers.js) still says "Case queue" with a count of cases waiting.
  // Nothing waits for staff any more, so rename it and drop the count. This changes the menu
  // while the page runs, so the shared file stays exactly as the team wrote it. If the team
  // prefers, change the label in helpers.js instead and delete these lines.
  const menuItem = STAFF_MENU.find(item => item.route === "staff-queue");
  if (menuItem) {
    menuItem.label = "Flagged activity";
    delete menuItem.count;
  }

  // ---------- Lookup tables ----------

  // The sort menu. Newest first is the default: this is a live feed, not a to-do list.
  const SORTS = [
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

  // What became of each case. The customer and the system decide this, never staff.
  const OUTCOMES = {
    "Paused": "The transfer is paused. The customer finishes the check in their app, then chooses to continue or cancel.",
    "Released": "The customer finished the check and confirmed the transfer, so it went through.",
    "Cancelled": "The customer read the warnings and cancelled the transfer themselves.",
    "Sent to investigators": "The system passed the evidence to the fraud investigations team by itself.",
    "Recorded": "The report and its evidence were recorded. No transfer is waiting."
  };

  // ---------- Small helpers ----------

  // Makes text safe to put inside HTML. Anything typed by a person (search) or sent by a
  // server goes through this first, so it can never become code on the page.
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

  // ---------- What this screen remembers (appState.triageQueue) ----------

  // The search, filters and sort. Created the first time it is needed, so we never have to touch
  // state.js. Coming back from a case, the list still shows the same search. #reset wipes it.
  function view() {
    if (!appState.triageQueue) {
      appState.triageQueue = { source: "all", level: "all", sort: "newest", search: "" };
    }
    return appState.triageQueue;
  }

  // ---------- The cases ----------

  let liveCases = [];   // cases fetched from the server (stays empty when there is no server)

  // Which sources the dashboard shows (see SHOW_CUSTOMER_REPORTS above)
  function sourceKeys() {
    return Object.keys(q.sources).filter(key => SHOW_CUSTOMER_REPORTS || key === "auto");
  }

  function allCases() {
    return liveCases.concat(q.cases).filter(c => sourceKeys().includes(c.source));
  }

  function findCase(ref) {
    return allCases().find(c => c.ref === ref);
  }

  // Cases after the search and filters have been applied, then sorted
  function visibleCases() {
    const v = view();
    const sort = SORTS.find(s => s.key === v.sort) || SORTS[0];
    const words = v.search.trim().toLowerCase();
    return allCases()
      .filter(c => v.source === "all" || c.source === v.source)
      .filter(c => v.level === "all" || c.level === v.level)
      .filter(c => !words || [c.ref, c.what, c.receiver ? c.receiver.name : "", c.receiver ? c.receiver.acct : ""].join(" ").toLowerCase().includes(words))
      .sort(sort.compare);
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
      level: LEVELS[s.band] ? s.band : "high", score: Number(s.score) || 0, outcome: "Paused", moneySent: false,
      what: `${money(s.amount)} transfer to ${payee} was paused automatically`,
      why: (s.reasons || []).map(r => ({ label: "Risk signal", detail: r })),
      receiver: { name: payee, acct: "Hidden", reports: 0 },
      transfer: { amount: s.amount, state: "Paused. The customer is finishing the check." },
      answers: [], voice: null, evidence: [],
      timeline: [{ time: when, text: "Transfer paused by the risk scorer. Flagged." }]
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

  // The outcome as words with a small mark in front (a mark and words, never colour alone)
  function outcomeHtml(outcome) {
    return `<span class="status status--${slug(outcome)}">${esc(outcome)}</span>`;
  }

  // ---------- Screen 1: flagged activity ----------

  // The four numbers at the top, worked out from the cases
  function kpisHtml() {
    const all = allCases();
    const items = [
      { label: "Flagged activity", value: all.length, note: "Last 7 days" },
      { label: "Money already sent", value: all.filter(c => c.moneySent).length, note: "Passed to the investigators by the system", alert: true },
      { label: "Auto-flagged transfers", value: all.filter(c => c.source === "auto").length, note: "Paused by the risk scorer" },
      { label: "Reported receivers", value: all.filter(c => c.receiver && c.receiver.reports >= 2).length, note: "Reported 2 or more times by others" }
    ];
    return items.map(k => `<li class="kpi${k.alert && k.value ? " kpi--alert" : ""}">
        <span class="kpi-label">${k.label}</span>
        <span class="kpi-value">${k.value}</span>
        <span class="kpi-note">${k.note}</span>
      </li>`).join("");
  }

  // The explainer: how does activity get here? (Cases are never created by staff.)
  function howRaisedHtml() {
    return `
      <details class="panel how-raised">
        <summary>How does activity get here?</summary>
        <ul class="how-list">
          ${sourceKeys().map(key => `<li>${sourceHtml(key)}<span>${esc(q.sources[key].how)}</span></li>`).join("")}
        </ul>
        <p class="how-note">${icon("lock")}<span>Staff only view this page, and nothing here needs an action. The customer stays in control: after the check they choose to continue or cancel.</span></p>
      </details>`;
  }

  function controlsHtml() {
    const v = view();
    return `
      <div class="qf">
        <div class="qf-row">
          <div class="field">
            <label for="qf-search">Search</label>
            <input id="qf-search" type="search" value="${esc(v.search)}" placeholder="Case number or receiver" autocomplete="off">
          </div>
          ${sourceKeys().length > 1 ? `<div class="field">
            <label for="qf-source">Raised by</label>
            <select id="qf-source">
              <option value="all"${v.source === "all" ? " selected" : ""}>Anyone</option>
              ${sourceKeys().map(key => `<option value="${key}"${v.source === key ? " selected" : ""}>${q.sources[key].label}</option>`).join("")}
            </select>
          </div>` : ""}
          <div class="field">
            <label for="qf-level">Risk</label>
            <select id="qf-level">
              <option value="all"${v.level === "all" ? " selected" : ""}>Any risk</option>
              ${Object.keys(LEVELS).map(key => `<option value="${key}"${v.level === key ? " selected" : ""}>${LEVELS[key].text}</option>`).join("")}
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
    return `Showing ${shown} of ${allCases().length}.`;
  }

  // The table itself, or a friendly message when nothing matches
  function tableHtml(list) {
    if (!list.length) {
      return `<p class="qt-empty">${icon("question")}<span>Nothing matches. Try clearing the search or the filters.</span></p>`;
    }
    return `
      <table class="data-table queue case-table">
        <caption class="visually-hidden">Flagged activity, in the order chosen under Sort by</caption>
        <thead><tr>
          <th scope="col">Case</th><th scope="col">Received</th><th scope="col">Raised by</th>
          <th scope="col">Risk</th><th scope="col">What happened</th><th scope="col">Outcome</th>
        </tr></thead>
        <tbody>
          ${list.map(c => `<tr>
              <th scope="row"><a class="case-link" href="#staff-case/${c.ref}">${esc(c.ref)}</a></th>
              <td>${esc(c.received)}</td>
              <td>${sourceHtml(c.source)}</td>
              <td>${levelBadge(c)}</td>
              <td class="queue-what">${esc(c.what)}${c.moneySent ? moneyFlag() : ""}${receiverFlag(c)}${c.live ? `<span class="live-flag">Live from the server</span>` : ""}</td>
              <td>${outcomeHtml(c.outcome)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  }

  function queueScreenHtml() {
    const list = visibleCases();
    return staffPageHtml("staff-queue", `
      <div class="staff-title">
        <p class="eyebrow">Fraud operations</p>
        <h1 tabindex="-1">Flagged activity</h1>
        <p class="meta">Tuesday 3 Nov 2026. View only. Made-up data.</p>
      </div>

      <ul class="kpis" id="qk" data-read>${kpisHtml()}</ul>

      ${howRaisedHtml()}

      <section class="panel" aria-labelledby="qlist-title">
        <h2 id="qlist-title">Everything the system flagged</h2>
        ${controlsHtml()}
        <p class="qt-count" id="qt-count" role="status">${countText(list.length)}</p>
        <div class="table-wrap" id="qt-table" data-read>${tableHtml(list)}</div>
      </section>

      <p class="honesty">${icon("question")}<span>Risk scores are warning signs, not proof of a scam. Plenty of risky-looking transfers turn out to be genuine, which is why the customer, not the system, makes the final choice.</span></p>`);
  }

  // Wires up the search and menus. Only the table and numbers are redrawn when something
  // changes, so the search box keeps keyboard focus while you type.
  function queueAfterRender() {
    const v = view();

    function refresh() {
      const list = visibleCases();
      document.getElementById("qt-table").innerHTML = tableHtml(list);
      document.getElementById("qt-count").textContent = countText(list.length);
      document.getElementById("qk").innerHTML = kpisHtml();
    }

    document.getElementById("qf-search").addEventListener("input", event => { v.search = event.target.value; refresh(); });
    const source = document.getElementById("qf-source");
    if (source) source.addEventListener("change", event => { v.source = event.target.value; refresh(); });
    document.getElementById("qf-level").addEventListener("change", event => { v.level = event.target.value; refresh(); });
    document.getElementById("qf-sort").addEventListener("change", event => { v.sort = event.target.value; refresh(); });

    // If a server is running, add its cases and redraw. If the person has already left the
    // screen by then, there is no table to draw into, so we simply stop.
    loadLiveCases().then(ok => { if (ok && document.getElementById("qt-table")) refresh(); });
  }

  // ---------- Screen 2: one flagged case ----------

  // A row of "label: value" pairs. Skips any value that is empty.
  function factsHtml(rows) {
    return `<dl class="facts">${rows.filter(r => r[1] !== "" && r[1] != null).map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join("")}</dl>`;
  }

  function whyHtml(c) {
    const total = c.why.some(w => w.points) ? `
        <p class="why-total">Risk score: <strong>${c.score} out of 100</strong></p>
        <div class="why-track" aria-hidden="true"><span class="why-fill" style="--w: ${c.score}%"></span></div>` : "";
    return `
      <section class="panel" aria-labelledby="why-title" data-read>
        <h2 id="why-title">Why this was flagged</h2>
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
  // The "scam reports" row is how the dashboard shows a receiver has been reported before.
  function transferAndReceiverHtml(c) {
    const transfer = c.transfer ? factsHtml([
      ["Amount", money(c.transfer.amount)],
      ["Transfer status", esc(c.transfer.state)]
    ]) : `<p class="muted">No transfer is involved in this case.</p>`;
    let receiver = `<p class="muted">No receiving account is involved in this case.</p>`;
    if (c.receiver) {
      const r = c.receiver;
      const reportsHtml = r.reports > 0
        ? `<span class="badge ${r.reports >= 2 ? "badge--likely" : "badge--uncertain"}">${icon("warning")}Reported ${r.reports} ${r.reports === 1 ? "time" : "times"}</span>`
        : "None on file";
      receiver = `
        ${r.reports >= 2 ? `<p class="receiver-alert" role="note">${icon("warning")}<span>Other people have reported this receiver for scams ${r.reports} times.</span></p>` : ""}
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

  // Timeline: what the system and the customer did, oldest first
  function timelineHtml(c) {
    return `
      <section class="panel" aria-labelledby="tl-title" data-read>
        <h2 id="tl-title">Timeline</h2>
        <ol class="timeline">${c.timeline.map(t => `<li><span class="tl-time">${esc(t.time)}</span><span class="tl-text">${esc(t.text)}</span></li>`).join("")}</ol>
      </section>`;
  }

  // Replaces the old "Your decision" box: it only says where the case stands, with no buttons.
  function standingHtml(c) {
    return `
      <section class="panel standing" aria-labelledby="stand-title" data-read>
        <h2 id="stand-title">Where this stands</h2>
        <p class="standing-outcome">${outcomeHtml(c.outcome)}</p>
        <p>${esc(OUTCOMES[c.outcome] || "")}</p>
        <p class="honesty">${icon("lock")}<span>View only. Nothing on this page needs a staff action.</span></p>
      </section>`;
  }

  function caseHtml(ref) {
    const c = findCase(ref);
    // Only shown if the number matches a real case, so nothing typed into the address bar
    // ends up on the page.
    if (!c) {
      return staffPageHtml("staff-queue", stubHtml("Case not found", "There is no case with that number.", "staff-queue", "Back to flagged activity"));
    }
    return staffPageHtml("staff-queue", `
      <a class="btn btn-secondary btn-small" href="#staff-queue">Back to flagged activity</a>

      <div class="staff-title case-title">
        <p class="eyebrow">Flagged activity</p>
        <h1 tabindex="-1">${esc(c.ref)}</h1>
        <p class="meta">${esc(c.what)}</p>
      </div>

      ${c.moneySent ? `<p class="case-alert" role="note">${icon("warning")}<span><strong>Money has already left this account.</strong> The system passed the evidence to the fraud investigations team by itself.</span></p>` : ""}

      <section class="panel" aria-labelledby="sum-title" data-read>
        <h2 id="sum-title">Summary</h2>
        ${factsHtml([
          ["Case number", esc(c.ref)],
          ["Time received", esc(c.received)],
          ["Raised by", sourceHtml(c.source)],
          ["Risk", levelBadge(c)],
          ["Outcome", outcomeHtml(c.outcome)]
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
          ${standingHtml(c)}
          ${timelineHtml(c)}
        </div>
      </div>`);
  }

  function caseAfterRender(ref) {
    // A live case from the server isn't known yet if the page was opened straight on its address.
    // Ask the server, and draw the screen again only if the case turns up (no loop: it stops
    // as soon as the case is found).
    if (!findCase(ref)) {
      loadLiveCases().then(ok => { if (ok && findCase(ref) && location.hash.indexOf("#staff-case") === 0) showScreen(); });
    }
  }

  // These two replace the stubs registered above.
  registerRoute({ name: "staff-queue", role: "staff", render: queueScreenHtml, afterRender: queueAfterRender });
  registerRoute({ name: "staff-case", role: "staff", render: caseHtml, afterRender: caseAfterRender });
})();