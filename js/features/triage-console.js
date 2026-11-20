"use strict";

// Feature: Triage console (staff overview, case queue, case detail).
// Owner: Wei Ye
// The made-up data is in js/data/triage-console.js.

(function () {
  const data = TRIAGE_CONSOLE_DATA;

  // A single-colour bar chart (one series, so no legend: the heading names it).
  // Hover or keyboard focus shows each day's number; today's number is always shown.
  function chartHtml() {
    const top = 15;
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
      <p class="mix-total">${total} reports this week. Results are warning signs, not proof.</p>`;
  }

  // The "Check these first" table. Each case number links to that case's detail screen.
  function queueHtml() {
    return `
      <table class="data-table queue">
        <caption class="visually-hidden">Latest flagged activity, highest risk first</caption>
        <thead><tr>
          <th scope="col">Case</th><th scope="col">Received</th><th scope="col">Result</th>
          <th scope="col">What happened</th><th scope="col">Outcome</th>
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
        <p class="meta">Tuesday 3 Nov 2026. View only.</p>
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
            <h2 id="queue-title">Latest flagged activity</h2>
            <a class="btn btn-secondary btn-small" href="#staff-queue/cases">See all flagged activity</a>
          </div>
          <div class="table-wrap">${queueHtml()}</div>
        </section>
      </div>

      <p class="honesty">${icon("question")}<span>Results are warning signs drawn from the voice check, what the caller asked for and the customer's answers. They are not proof of a scam.</span></p>`);
  }

  registerRoute({ name: "staff", role: "staff", render: overviewHtml });
})();

// ======================================================================================
// Flagged activity and case detail.
// Owner: Wei Ye
// View-only: staff look, they don't act. The customer chooses to continue or cancel a paused
// transfer, and the system records it and passes serious cases to the investigators.
//   #staff-queue          Flagged activity, "Insights" tab (default): totals and trends
//   #staff-queue/cases    Flagged activity, "Cases" tab: the list, with search, filters and sorting
//   #staff-case/<ref>     one flagged case in detail
// (The address says "queue" because the router and the side menu already use that name.)
// PRIVACY: never shows customer details. The receiver is masked (hidden name, last 3 digits of the
// account) and the only thing known about it is how many times others reported it.
// All data is made up: see CASE_QUEUE_DATA in js/data/triage-console.js.
// ======================================================================================

(function () {
  const q = CASE_QUEUE_DATA;

  // Team switch: the team is still deciding whether customer reports belong on the staff side.
  // true  = show auto-flagged transfers, pause checks AND customer reports
  // false = show only the transfers the system flagged by itself (the other cases are hidden)
  const SHOW_CUSTOMER_REPORTS = true;

  // The shared side menu (helpers.js) still says "Case queue" with a count. Nothing waits for
  // staff, so rename it here instead of editing the shared file.
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

  // Hides a name: each word keeps its first character, and every letter or digit after it
  // becomes one star ("Jun Wei" becomes "J** W**", "Lawyer Ong & Co" becomes "L***** O** & C*").
  // Symbols such as "&" are not part of the name, so they stay as they are. Extra spaces are
  // squashed to one. \p{L} means "any letter" and \p{N} "any digit", in any language.
  // Anything that already has stars in it is left alone. Used for names sent by a live server.
  function maskName(name) {
    const text = String(name || "").trim();
    if (!text) return "Hidden";
    if (text.indexOf("*") !== -1) return text;
    return text.split(/\s+/).map(w => w.charAt(0) + w.slice(1).replace(/[\p{L}\p{N}]/gu, "*")).join(" ");
  }

  function amountOf(c) {
    return c.transfer ? c.transfer.amount : 0;
  }

  // ---------- What this screen remembers (appState.triageQueue) ----------

  // The search, filters, sort, daily/weekly choice, chosen panel and summary length. Coming back from a case, the list still
  // shows the same search. #reset clears it.
  function view() {
    if (!appState.triageQueue) {
      appState.triageQueue = { source: "all", level: "all", sort: "newest", search: "", period: "daily", chartMode: "line", metric: "flags", summary: "short" };
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
      why: (s.reasons || []).map(r => ({ label: "Risk signal", detail: staffReason(r) })),
      receiver: { name: payee, acct: "Hidden", reports: 0 },
      transfer: { amount: s.amount, state: "Paused. The customer is finishing the check." },
      answers: [], voice: null, evidence: [],
      timeline: [{ time: when, text: "Transfer paused by the risk scorer. Flagged." }]
    };
  }

  // The risk scorer's reasons are written to the customer ("...than you usually send"). Staff
  // should read about the customer instead, so we find which signal the reason belongs to in
  // Jose's scorer settings (RISK_SCORER_DATA) and show that signal's staff wording.
  // A reason we don't recognise is shown as it is.
  function staffReason(reason) {
    const signal = RISK_SCORER_DATA.config.signals.find(s => s.reason === reason);
    return signal ? t(`rs.signal.${signal.id}.staff`) : reason;
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

  // ---------- Screen 1a: Insights (the default tab) ----------

  // All the numbers on this tab come from CASE_INSIGHTS_DATA (totals only, no customer details)
  const I = CASE_INSIGHTS_DATA;

  // Daily shows the last 14 days, weekly the last 8 weeks. "now" and "before" are the two things
  // each number is compared with (today and yesterday, or this week and last week).
  const PERIODS = {
    daily: { label: "Daily", span: "Last 14 days", unit: "day", now: "today", before: "yesterday", series: I.daily },
    weekly: { label: "Weekly", span: "Last 8 weeks", unit: "week", now: "this week", before: "last week", series: I.weekly }
  };

  // The three stacked pieces of every bar, bottom to top. The names come from the sources in
  // the data file, so the legend, chart and table always agree.
  const STACK = ["auto", "pause", "report"];
  const SHORT = { auto: "Auto", pause: "Pause", report: "Reports" };   // short table headings for narrow screens

  // The four panels at the top. Pressing one changes the chart under it. "parts" are the lines the
  // chart draws (the sources of a flag); the other two panels draw one line from I.trend.
  // "say" is how one value reads out loud, "axis" how it is written on the scale.
  const METRICS = {
    flags: { title: "Flagged activity over time", parts: ["auto", "pause", "report"], say: n => `${n} flags`, axis: n => String(n) },
    paused: { title: "Paused transfers over time", parts: ["auto", "pause"], say: n => `${n} paused transfers`, axis: n => String(n) },
    cancelled: { title: "Cancelled by customers over time", label: "Cancelled by customers", trend: "cancelRate",
      say: n => `${n}% of paused transfers cancelled`, axis: n => n + "%" },
    sent: { title: "Money already sent over time", label: "Money already sent", trend: "sent",
      say: n => `${formatMoney(n)} already sent`, axis: n => (n >= 1000 ? "$" + n / 1000 + "k" : "$" + n) }
  };

  function currentMetric() { return METRICS[view().metric] || METRICS.flags; }

  // The lines of the chart for one panel and period: a label, a style name and a number for every day or week
  function linesOf(m, p) {
    if (m.parts) return m.parts.map(k => ({ key: k, label: q.sources[k].label, short: SHORT[k], values: p.series[k] }));
    return [{ key: "one", label: m.label, short: m.label, values: I.trend[p.unit === "day" ? "daily" : "weekly"][m.trend] }];
  }

  // A scale that ends on a round number just above the biggest value, in three even steps
  function scaleTop(max) {
    const raw = (max * 1.12) / 3;
    if (raw <= 10) return Math.max(1, Math.ceil(raw)) * 3;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10].find(n => n * pow >= raw) * pow;
    return step * 3;
  }

  function totalAt(series, i) { return series.auto[i] + series.pause[i] + series.report[i]; }
  function pausedAt(series, i) { return series.auto[i] + series.pause[i]; }
  function sumOf(obj) { return Object.keys(obj).reduce((sum, key) => sum + obj[key], 0); }
  function share(part, whole) { return whole ? Math.round((part / whole) * 100) : 0; }

  // "Up 41% on last week": an arrow and words, so it never relies on colour alone.
  // More flags is red, fewer is green, no change is plain.
  function changeHtml(now, before, p) {
    if (!before) return `New ${p.now}`;
    const change = Math.round(((now - before) / before) * 100);
    if (change === 0) return `<span class="delta delta--flat"><span aria-hidden="true">= </span>Same as ${p.before}</span>`;
    const up = change > 0;
    return `<span class="delta ${up ? "delta--bad" : "delta--good"}"><span aria-hidden="true">${up ? "\u25B2" : "\u25BC"} </span>${up ? "Up" : "Down"} ${Math.abs(change)}% on ${p.before}</span>`;
  }

  // Four numbers for the chosen period, each compared with the one before
  function insightKpisHtml(p) {
    const s = p.series;
    const last = s.labels.length - 1;
    const out = I.outcomes[p.unit === "day" ? "daily" : "weekly"];
    const cash = I.money[p.unit === "day" ? "daily" : "weekly"];
    const paused = sumOf(out.now);
    const pausedBefore = sumOf(out.before);
    const rate = share(out.now.cancelled, paused);
    const rateBefore = share(out.before.cancelled, pausedBefore);
    const items = [
      { metric: "flags", label: "Flagged activity", value: totalAt(s, last), note: changeHtml(totalAt(s, last), totalAt(s, last - 1), p) },
      { metric: "paused", label: "Paused transfers", value: pausedAt(s, last), note: changeHtml(pausedAt(s, last), pausedAt(s, last - 1), p) },
      { metric: "cancelled", label: "Cancelled by customers", value: rate + "%", note: `${formatMoney(cash.kept.now)} kept safe. ${rateBefore}% ${p.before}.` },
      { metric: "sent", label: "Money already sent", value: formatMoney(cash.sent.now.amount), alert: cash.sent.now.count > 0,
        note: `${cash.sent.now.count} ${cash.sent.now.count === 1 ? "case" : "cases"}. ${formatMoney(cash.sent.before.amount)} ${p.before}.` }
    ];
    // Each panel is a button: pressing it changes the chart below (see insightsAfterRender)
    return `<ul class="kpis ins-kpis ov-kpis" data-read>${items.map(k => `<li><button type="button" class="kpi ov-kpi${k.alert ? " kpi--alert" : ""}" data-metric="${k.metric}" aria-pressed="${view().metric === k.metric}">
        <span class="kpi-label">${k.label}</span>
        <span class="kpi-value">${k.value}</span>
        <span class="kpi-note">${k.note}</span>
      </button></li>`).join("")}</ul>`;
  }

  // The summary comes in two lengths. Short: the three things staff need to know. Detailed: every
  // sentence. The choice is remembered (view().summary) and the buttons only redraw the text.
  function summaryLines(p, detailed) {
    const s = p.series;
    const last = s.labels.length - 1;
    const key = p.unit === "day" ? "daily" : "weekly";
    const out = I.outcomes[key];
    const cash = I.money[key].sent.now;
    const now = totalAt(s, last);
    const before = totalAt(s, last - 1);
    const change = before ? Math.round(((now - before) / before) * 100) : 0;
    const direction = change === 0 ? "the same as" : (change > 0 ? "up " + change + "% on" : "down " + Math.abs(change) + "% on");
    const watch = I.receivers.filter(r => r.reports >= 3);

    if (!detailed) {
      return [
        { icon: "chart", html: `<strong>${now} flags ${p.now}</strong>, ${direction} ${p.before}.` },
        cash.count > 0
          ? { icon: "warning", html: `<strong>${formatMoney(cash.amount)} already sent</strong> in ${cash.count} ${cash.count === 1 ? "case" : "cases"}, before anything could be paused.` }
          : { icon: "check", html: `<strong>No money was sent</strong> before a pause ${p.now}.` },
        { icon: "question", html: `<strong>${watch.length} receiving accounts</strong> have each been reported 3 or more times.` }
      ];
    }
    const busy = I.timeOfDay.slice().sort((a, b) => b.count - a.count);
    const week = I.timeOfDay.reduce((sum, t) => sum + t.count, 0);
    return [
      `Flagged activity is ${direction} ${p.before} (${now} compared with ${before}).`,
      `Most flags happen between ${busy[0].label.replace(" to ", " and ")} (${share(busy[0].count, week)}%), then between ${busy[1].label.replace(" to ", " and ")} (${share(busy[1].count, week)}%).`,
      `Customers cancelled ${share(out.now.cancelled, sumOf(out.now))}% of paused transfers ${p.now}, compared with ${share(out.before.cancelled, sumOf(out.before))}% ${p.before}.`,
      `${watch.length} receiving accounts have each been reported 3 or more times. They were involved in ${watch.reduce((sum, r) => sum + r.cases, 0)} flags in the last 7 days.`
    ].map(text => ({ icon: "chart", html: esc(text) }));
  }

  function summaryBodyHtml(p) {
    const detailed = view().summary === "detailed";
    return `<ul class="ins-glance${detailed ? "" : " ins-glance--short"}">${summaryLines(p, detailed).map(l => `<li>${icon(l.icon)}<span>${l.html}</span></li>`).join("")}</ul>`;
  }

  function glanceHtml(p) {
    const v = view();
    return `
      <section class="panel" aria-labelledby="glance-title" data-read>
        <div class="ins-glance-head">
          <h2 id="glance-title">Summary</h2>
          <div class="ins-modes" role="group" aria-label="Summary length">
            ${[["short", "Short"], ["detailed", "Detailed"]].map(([key, label]) => `<button type="button" class="chip" data-summary="${key}" aria-pressed="${v.summary === key}">${label}</button>`).join("")}
          </div>
        </div>
        <div id="ins-summary-body">${summaryBodyHtml(p)}</div>
      </section>`;
  }

  function formatMoney(n) {
    return "$" + Number(n).toLocaleString("en-SG");
  }

  // "21 Oct to 3 Nov" (or, for weeks, "weeks starting 9 Sep to 28 Oct")
  function spanText(p) {
    const first = p.series.labels[0];
    const last = p.series.labels[p.series.labels.length - 1];
    return `${p.unit === "week" ? "weeks starting " : ""}${first.date} ${first.month} to ${last.date} ${last.month}`;
  }

  // The three ways to draw the same numbers. Whichever is chosen, every column still says the same
  // thing in words (its aria-label), and the table underneath has the same numbers, so the chart is
  // never the only way to read it.
  const MODES = [
    { key: "line", label: "Lines", note: "Each line is one way a flag is raised, with a point for every {unit}." },
    { key: "stacked", label: "Stacked", note: "Each bar is one {unit}, split by who raised the flag." },
    { key: "side", label: "Side by side", note: "Each group is one {unit}, with one bar for each way a flag is raised." }
  ];

  // The chart's heading area: the mode switch, then the chart itself (redrawn when the mode changes)
  function chartPanelHtml(p) {
    const v = view();
    return `
      <section class="panel" aria-labelledby="trend-title" data-read>
        <h2 id="trend-title">${currentMetric().title}</h2>
        <div class="ins-modes-row">
          <span id="ins-mode-label" class="ins-period-label">Chart style</span>
          <div class="ins-modes" role="group" aria-labelledby="ins-mode-label">
            ${MODES.map(m => `<button type="button" class="chip" data-mode="${m.key}" aria-pressed="${v.chartMode === m.key}">${m.label}</button>`).join("")}
          </div>
        </div>
        <div id="ins-chart-area">${chartAreaHtml(p)}</div>
      </section>`;
  }

  // "21 Oct to 3 Nov" (or, for weeks, "weeks starting 9 Sep to 28 Oct")
  function spanText(p) {
    const first = p.series.labels[0];
    const last = p.series.labels[p.series.labels.length - 1];
    return `${p.unit === "week" ? "weeks starting " : ""}${first.date} ${first.month} to ${last.date} ${last.month}`;
  }

  // What a screen reader hears for one column, and what a mouse hover shows
  function columnText(p, i, m, lines) {
    const l = p.series.labels[i];
    const total = lines.reduce((sum, line) => sum + line.values[i], 0);
    const parts = lines.length > 1 ? " " + lines.map(line => line.values[i] + " " + line.label.toLowerCase()).join(", ") + "." : "";
    return `${l.day} ${l.date} ${l.month}: ${m.say(total)}.${parts}`;
  }

  function chartAreaHtml(p) {
    const mode = MODES.find(m => m.key === view().chartMode) || MODES[0];
    const m = currentMetric();
    const lines = linesOf(m, p);
    const many = lines.length > 1;
    const s = p.series;
    const n = s.labels.length;
    const last = n - 1;
    const totals = s.labels.map((_, i) => lines.reduce((sum, l) => sum + l.values[i], 0));
    // Stacked bars need room for the total, the others only for the biggest single number
    const biggestOne = Math.max(...lines.map(l => Math.max(...l.values)));
    const top = scaleTop(mode.key === "stacked" ? Math.max(...totals) : biggestOne);
    const note = many ? mode.note : (mode.key === "line" ? "The line has a point for every {unit}." : "Each bar is one {unit}.");

    // The columns (one per day or week). Stacked and side by side draw bars inside them. Lines use
    // them as invisible, keyboard-friendly "hot spots" and draw the lines on top.
    const cols = s.labels.map((l, i) => {
      const text = esc(columnText(p, i, m, lines));
      let inner;
      if (mode.key === "stacked") {
        inner = `<span class="ins-total" aria-hidden="true">${esc(valueText(m, totals[i]))}</span>
          <span class="ins-stack" role="img" tabindex="0" aria-label="${text}" title="${text}">
            ${lines.map(ln => `<span class="seg seg--${ln.key}" style="flex: ${ln.values[i]} 1 0"></span>`).join("")}
          </span>`;
      } else if (mode.key === "side") {
        inner = `<span class="ins-group" role="img" tabindex="0" aria-label="${text}" title="${text}">
            ${lines.map(ln => `<span class="gbar seg--${ln.key}" style="--h: ${(ln.values[i] / top) * 100}%">${i === last ? `<span class="gval" aria-hidden="true">${esc(valueText(m, ln.values[i]))}</span>` : ""}</span>`).join("")}
          </span>`;
      } else {
        inner = `<span class="ins-hit" role="img" tabindex="0" aria-label="${text}" title="${text}"></span>`;
      }
      return `<li class="ins-col${i === last ? " is-now" : ""}" style="--h: ${(totals[i] / top) * 100}%">${inner}</li>`;
    }).join("");

    // Line mode: the lines are one SVG (stretched to fit), the round/diamond/triangle points are
    // ordinary elements placed by percentage, so they never get squashed.
    let overlay = "";
    if (mode.key === "line") {
      const x = i => ((i + 0.5) / n) * 100;
      overlay = `
        <svg class="ins-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          ${lines.map(ln => `<polyline class="ln ln--${ln.key}" points="${ln.values.map((v, i) => x(i).toFixed(2) + "," + (100 - (v / top) * 100).toFixed(2)).join(" ")}"></polyline>`).join("")}
        </svg>
        ${lines.map(ln => ln.values.map((v, i) => `<span class="pt pt--${ln.key}" aria-hidden="true" style="left: ${x(i)}%; bottom: ${(v / top) * 100}%"></span>`).join("")).join("")}
        ${lines.map(ln => `<span class="pt-val${valueText(m, ln.values[last]).length > 3 ? " pt-val--above" : ""}" aria-hidden="true" style="left: ${x(last)}%; bottom: ${(ln.values[last] / top) * 100}%">${esc(valueText(m, ln.values[last]))}</span>`).join("")}`;
    }

    const legend = mode.key === "line"
      ? lines.map(ln => `<li><span class="ins-key ins-key--${ln.key}" aria-hidden="true"><span class="pt pt--${ln.key}"></span></span>${esc(ln.label)}</li>`).join("")
      : lines.map(ln => `<li><span class="swatch seg--${ln.key}" aria-hidden="true"></span>${esc(ln.label)}</li>`).join("");

    return `
      <p class="muted">${p.span}, ${spanText(p)}. ${note.replace("{unit}", p.unit)}</p>
      <div class="ins-chart">
        <div class="ins-scale" aria-hidden="true">
          ${[1, 2 / 3, 1 / 3, 0].map(f => `<span style="--y: ${f}">${m.axis(Math.round(top * f))}</span>`).join("")}
        </div>
        <div class="ins-plot">
          <ol class="ins-cols${mode.key === "line" ? " ins-cols--line" : ""}">${cols}</ol>
          ${overlay}
        </div>
        <span></span>
        <ol class="ins-days" aria-hidden="true">
          ${s.labels.map((l, i) => `<li${i === last ? ' class="is-now"' : ""}><span class="ins-wd">${l.day}</span><span>${l.date}<span class="ins-mo"> ${l.month}</span></span></li>`).join("")}
        </ol>
      </div>
      <ul class="ins-legend">${legend}</ul>
      <details class="chart-table">
        <summary>Show as a table</summary>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th scope="col">${p.unit === "day" ? "Day" : "Week starting"}</th>${lines.map(ln => `<th scope="col"><span class="th-full">${esc(ln.label)}</span><span class="th-short">${esc(ln.short)}</span></th>`).join("")}${many ? '<th scope="col">Total</th>' : ""}</tr></thead>
            <tbody>${s.labels.map((l, i) => `<tr><th scope="row">${esc(p.unit === "day" ? l.day + " " + l.date + " " + l.month : l.date + " " + l.month)}</th>${lines.map(ln => `<td>${esc(valueText(m, ln.values[i]))}</td>`).join("")}${many ? `<td>${totals[i]}</td>` : ""}</tr>`).join("")}</tbody>
          </table>
        </div>
      </details>`;
  }

  // One value written for the chart and table: 38 flags stay "38", a rate gets "%", money gets "$"
  function valueText(m, n) {
    return m.trend === "cancelRate" ? n + "%" : (m.trend === "sent" ? formatMoney(n) : String(n));
  }

  // A list of bars: a label, a bar, and the number. One shape used by three panels.
  // "of" is what the bar is a share of; "mark" adds a word to one row (never colour alone).
  function rowsHtml(rows, whole, markLabel) {
    const most = Math.max(...rows.map(r => r.count));
    return `<ul class="ins-rows">${rows.map(r => `<li>
        <span class="ins-row-label">${esc(r.label)}${markLabel && r.count === most ? `<span class="ins-mark">${markLabel}</span>` : ""}${r.note ? `<small>${esc(r.note)}</small>` : ""}</span>
        <span class="ins-track" aria-hidden="true"><span class="ins-fill" style="--w: ${(r.count / most) * 100}%"></span></span>
        <span class="ins-row-n">${r.count} <small>(${share(r.count, whole)}%)</small></span>
      </li>`).join("")}</ul>`;
  }

  function outcomesHtml(p) {
    const o = I.outcomes[p.unit === "day" ? "daily" : "weekly"].now;
    const total = sumOf(o);
    return `
      <section class="panel" aria-labelledby="out-title" data-read>
        <h2 id="out-title">What happened to paused transfers</h2>
        <p class="muted">Of ${total} transfers paused ${p.now}. Customers decide; the system does the rest.</p>
        ${rowsHtml([
          { label: "Cancelled by the customer", note: "They read the warnings and stopped", count: o.cancelled },
          { label: "Released after the check", note: "The customer confirmed it was genuine", count: o.released },
          { label: "Still paused", note: "The customer is finishing the check", count: o.paused },
          { label: "Passed to investigators", note: "Done by the system, not by staff", count: o.investigators }
        ], total)}
      </section>`;
  }

  function timeOfDayHtml() {
    const total = I.timeOfDay.reduce((sum, t) => sum + t.count, 0);
    return `
      <section class="panel" aria-labelledby="tod-title" data-read>
        <h2 id="tod-title">When flags happen</h2>
        <p class="muted">All ${total} flags in the last 7 days, by time of day.</p>
        ${rowsHtml(I.timeOfDay, total, "Busiest")}
      </section>`;
  }

  function signsHtml() {
    return `
      <section class="panel" aria-labelledby="sign-title" data-read>
        <h2 id="sign-title">Warning signs behind paused transfers</h2>
        <p class="muted">Out of ${I.pausedTotal} paused transfers in the last 7 days. One transfer can show several signs.</p>
        ${rowsHtml(I.signs, I.pausedTotal)}
      </section>`;
  }

  function receiversHtml() {
    return `
      <section class="panel" aria-labelledby="rcv-title" data-read>
        <h2 id="rcv-title">Receivers reported most</h2>
        <p class="muted">Accounts that other people keep reporting, in the last 7 days.</p>
        <ul class="ins-receivers">
          ${I.receivers.map(r => `<li>
              <span class="rc-top"><strong>${esc(r.name)}</strong><span class="rc-acct">${esc(r.acct)}</span></span>
              <span class="rc-badge"><span class="badge ${r.reports >= 3 ? "badge--likely" : "badge--uncertain"}">${icon("warning")}Reported ${r.reports} times</span></span>
              <span class="rc-meta">${r.cases} flags. ${formatMoney(r.attempted)} attempted.</span>
            </li>`).join("")}
        </ul>
        <p class="honesty">${icon("lock")}<span>Receiver names are masked and only the last 3 digits of each account are kept.</span></p>
      </section>`;
  }

  // Everything below the day/week switch. Redrawn when the switch is pressed.
  function insightsBodyHtml() {
    const p = PERIODS[view().period] || PERIODS.daily;
    return `
      ${glanceHtml(p)}
      ${insightKpisHtml(p)}
      ${chartPanelHtml(p)}
      <div class="ins-pair">${outcomesHtml(p)}${timeOfDayHtml()}</div>
      <div class="ins-pair">${signsHtml()}${receiversHtml()}</div>`;
  }

  function insightsHtml() {
    const v = view();
    return `
      <div class="ins-toolbar">
        <span id="ins-period-label" class="ins-period-label">Show by</span>
        <div class="ins-period" role="group" aria-labelledby="ins-period-label">
          ${Object.keys(PERIODS).map(key => `<button type="button" class="chip" data-period="${key}" aria-pressed="${v.period === key}">${PERIODS[key].label}</button>`).join("")}
        </div>
        <p class="visually-hidden" id="ins-status" role="status"></p>
      </div>
      <div id="ins-body">${insightsBodyHtml()}</div>
      <p class="honesty">${icon("question")}<span>Totals only: this page never shows a customer's name or details.</span></p>`;
  }

  // ---------- Screen 1b: Cases (the second tab) ----------


  // The explainer: how does activity get here? (Cases are never created by staff.)
  function howRaisedHtml() {
    return `
      <details class="panel how-raised">
        <summary>How does activity get here?</summary>
        <ul class="how-list">
          ${sourceKeys().map(key => `<li>${sourceHtml(key)}<span>${esc(q.sources[key].how)}</span></li>`).join("")}
        </ul>
        <p class="how-note">${icon("lock")}<span>Customers stay in control: after the check they choose to continue or cancel. The system records the rest.</span></p>
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

  // The two mini tabs under the heading. They are ordinary links (#staff-queue and
  // #staff-queue/cases), so the Back button, bookmarks and keyboard all work without extra code.
  function tabsHtml(onCases) {
    return `
      <nav class="subtabs" aria-label="Flagged activity views">
        <a href="#staff-queue"${onCases ? "" : ' aria-current="page"'}>${icon("chart")}Insights</a>
        <a href="#staff-queue/cases"${onCases ? ' aria-current="page"' : ""}>${icon("list")}Cases <span class="subtab-n">${allCases().length}</span></a>
      </nav>`;
  }

  function casesHtml() {
    const list = visibleCases();
    return `
      ${howRaisedHtml()}

      <section class="panel" aria-labelledby="qlist-title">
        <h2 id="qlist-title">Individual cases</h2>
        ${controlsHtml()}
        <p class="qt-count" id="qt-count" role="status">${countText(list.length)}</p>
        <div class="table-wrap" id="qt-table" data-read>${tableHtml(list)}</div>
      </section>

      <p class="honesty">${icon("question")}<span>Risk scores are warning signs, not proof of a scam. The customer makes the final choice after the check.</span></p>`;
  }

  // param is whatever follows the slash: "cases" shows the Cases tab, anything else the Insights tab
  function queueScreenHtml(param) {
    const onCases = param === "cases";
    return staffPageHtml("staff-queue", `
      <div class="staff-title">
        <p class="eyebrow">Fraud operations</p>
        <h1 tabindex="-1">Flagged activity</h1>
        <p class="meta">Tuesday 3 Nov 2026, updated 16:50. View only.</p>
      </div>

      ${tabsHtml(onCases)}

      ${onCases ? casesHtml() : insightsHtml()}`);
  }

  // Wires up whichever tab is showing
  function queueAfterRender(param) {
    if (param === "cases") casesAfterRender();
    else insightsAfterRender();
  }

  // Insights tab: the Daily / Weekly switch. Only the part under the switch is redrawn, so the
  // buttons keep keyboard focus.
  function insightsAfterRender() {
    const v = view();
    const buttons = document.querySelectorAll(".ins-period [data-period]");
    document.querySelector(".ins-period").addEventListener("click", event => {
      const btn = event.target.closest("[data-period]");
      if (!btn) return;
      v.period = btn.dataset.period;
      buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.period === v.period)));
      const tableOpen = tableIsOpen();
      document.getElementById("ins-body").innerHTML = insightsBodyHtml();
      reopenTable(tableOpen);
      document.getElementById("ins-status").textContent = `Now showing ${PERIODS[v.period].label.toLowerCase()} totals.`;
    });

    // The chart style buttons, the panels and the summary buttons are all inside #ins-body, which
    // stays put, so one listener there catches them. Only the part that changed is redrawn, and an
    // open "Show as a table" stays open.
    document.getElementById("ins-body").addEventListener("click", event => {
      const p = PERIODS[v.period] || PERIODS.daily;
      const status = document.getElementById("ins-status");
      const mode = event.target.closest("[data-mode]");
      const panel = event.target.closest("[data-metric]");
      const summary = event.target.closest("[data-summary]");
      if (mode) {
        v.chartMode = mode.dataset.mode;
        document.querySelectorAll("#ins-body [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === v.chartMode)));
        const open = tableIsOpen();
        document.getElementById("ins-chart-area").innerHTML = chartAreaHtml(p);
        reopenTable(open);
        status.textContent = `Chart style: ${MODES.find(m => m.key === v.chartMode).label.toLowerCase()}.`;
      } else if (panel) {
        v.metric = panel.dataset.metric;
        document.querySelectorAll("#ins-body [data-metric]").forEach(b => b.setAttribute("aria-pressed", String(b === panel)));
        const open = tableIsOpen();
        document.getElementById("trend-title").textContent = currentMetric().title;
        document.getElementById("ins-chart-area").innerHTML = chartAreaHtml(p);
        reopenTable(open);
        status.textContent = `Chart now shows: ${currentMetric().title}.`;
      } else if (summary) {
        v.summary = summary.dataset.summary;
        document.querySelectorAll("#ins-body [data-summary]").forEach(b => b.setAttribute("aria-pressed", String(b === summary)));
        document.getElementById("ins-summary-body").innerHTML = summaryBodyHtml(p);
        status.textContent = `Summary: ${v.summary === "short" ? "short" : "detailed"}.`;
      }
    });
  }

  function tableIsOpen() { return !!document.querySelector("#ins-chart-area details[open]"); }
  function reopenTable(open) {
    const details = document.querySelector("#ins-chart-area details");
    if (open && details) details.open = true;
  }

  // Cases tab: search and menus. Only the table is redrawn when something changes, so the
  // search box keeps keyboard focus while you type.
  function casesAfterRender() {
    const v = view();

    function refresh() {
      const list = visibleCases();
      document.getElementById("qt-table").innerHTML = tableHtml(list);
      document.getElementById("qt-count").textContent = countText(list.length);
      document.querySelector(".subtab-n").textContent = allCases().length;
    }

    document.getElementById("qf-search").addEventListener("input", event => { v.search = event.target.value; refresh(); });
    const source = document.getElementById("qf-source");
    if (source) source.addEventListener("change", event => { v.source = event.target.value; refresh(); });
    document.getElementById("qf-level").addEventListener("change", event => { v.level = event.target.value; refresh(); });
    document.getElementById("qf-sort").addEventListener("change", event => { v.sort = event.target.value; refresh(); });

    // If a server is running, add its cases and redraw (skipped if the person has left the screen).
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
        <p class="honesty">${icon("lock")}<span>Only what a customer chooses to share is kept. No real voiceprints or face data are ever stored.</span></p>
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

  // Where the case stands. View-only, so there are no buttons.
  function standingHtml(c) {
    return `
      <section class="panel standing" aria-labelledby="stand-title" data-read>
        <h2 id="stand-title">Where this stands</h2>
        <p class="standing-outcome">${outcomeHtml(c.outcome)}</p>
        <p>${esc(OUTCOMES[c.outcome] || "")}</p>
        <p class="honesty">${icon("lock")}<span>The customer and the system handle every step.</span></p>
      </section>`;
  }

  function caseHtml(ref) {
    const c = findCase(ref);
    // Only shown if the number matches a real case, so nothing typed into the address bar
    // ends up on the page.
    if (!c) {
      return staffPageHtml("staff-queue", stubHtml("Case not found", "There is no case with that number.", "staff-queue/cases", "Back to cases"));
    }
    return staffPageHtml("staff-queue", `
      <a class="btn btn-secondary btn-small" href="#staff-queue/cases">Back to cases</a>

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
    // A live case isn't known yet if the page was opened straight on its address: ask the
    // server, and draw the screen again only if the case turns up.
    if (!findCase(ref)) {
      loadLiveCases().then(ok => { if (ok && findCase(ref) && location.hash.indexOf("#staff-case") === 0) showScreen(); });
    }
  }

  registerRoute({ name: "staff-queue", role: "staff", render: queueScreenHtml, afterRender: queueAfterRender });
  registerRoute({ name: "staff-case", role: "staff", render: caseHtml, afterRender: caseAfterRender });
})();