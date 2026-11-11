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
