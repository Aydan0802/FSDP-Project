"use strict";

// Feature: Overview (staff). #staff
// Owner: Wei Ye
// Four panels at the top, each with a header, today's number and the average in small grey text.
// Clicking a panel switches the chart under it, and the breakdown box beside it, to that panel's numbers.
// registerRoute() keeps the last screen registered under a name, so this file takes the Overview
// that triage-console.js registered and registers it again with the panels, chart and breakdown box replaced.
// It must load after triage-console.js. If anything it needs is missing, the Overview stays as it was.
// Totals only, like the rest of the staff side.

(function () {
  if (typeof OVERVIEW_DATA === "undefined" || typeof CASE_INSIGHTS_DATA === "undefined" ||
      typeof routes === "undefined" || !routes.staff) return;

  const base = routes.staff;   // the Overview as triage-console.js made it
  const D = CASE_INSIGHTS_DATA.daily;
  const W = CASE_INSIGHTS_DATA.weekly;

  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }

  // The four panels. The last number in each list is today (or this week).
  // Change "label", or point "values" at other numbers, to change a panel.
  const METRICS = [
    { key: "reports-day", label: "Reports today", per: "day", noun: "reports",
      title: "Reports each day, last 14 days", values: D.report, labels: D.labels, side: () => resultsSide("today") },
    { key: "reports-week", label: "Reports this week", per: "week", noun: "reports",
      title: "Reports each week, last 8 weeks", values: W.report, labels: W.labels, side: () => resultsSide("week") },
    { key: "checks-day", label: "Checks used today", per: "day", noun: "checks",
      title: "Checks used each day, last 14 days", values: OVERVIEW_DATA.checksPerDay, labels: D.labels, side: toolsSide },
    { key: "flags-day", label: "Flagged activity today", per: "day", noun: "flagged",
      title: "Flagged activity each day, last 14 days", values: D.auto.map((_, i) => D.auto[i] + D.pause[i] + D.report[i]), labels: D.labels, side: flaggedSide }
  ].filter(m => m.values.length === m.labels.length && m.values.every(Number.isFinite));

  if (!METRICS.length) return;

  // ---------- The box next to the chart: a breakdown of the number on the picked panel ----------

  // One bar per row. "name" is the words or badge at the left; the bars are all one colour, so the
  // name says what each row is.
  function rowsHtml(rows, note) {
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const most = Math.max(...rows.map(r => r.count), 1);
    return `<ul class="mix">
        ${rows.map(r => `<li>
            <span class="mix-label">${r.name}</span>
            <span class="mix-track" aria-hidden="true"><span class="mix-fill" style="--w: ${(r.count / most) * 100}%"></span></span>
            <span class="mix-n">${r.count}</span>
          </li>`).join("")}
      </ul>
      <p class="mix-total">${total} ${note}</p>`;
  }

  // How the reports were rated (badges say which result each bar is)
  function resultsSide(when) {
    const r = OVERVIEW_DATA.reportResults[when];
    const rows = Object.keys(r).map(key => ({ name: badge(key), count: r[key] }));
    return { title: when === "today" ? "Results today" : "Results this week",
      html: rowsHtml(rows, `reports ${when === "today" ? "today" : "this week"}. Results are warning signs, not proof.`) };
  }

  function toolsSide() {
    return { title: "Checks used today, by tool",
      html: rowsHtml(OVERVIEW_DATA.checksByTool.map(t => ({ name: esc(t.label), count: t.count })), "checks today.") };
  }

  // The three ways something gets flagged. Customer reports are one of them, which is why this
  // number is bigger than "Reports today".
  function flaggedSide() {
    const labels = (typeof CASE_QUEUE_DATA !== "undefined" && CASE_QUEUE_DATA.sources) || {};
    const rows = ["auto", "pause", "report"].map(k => ({ name: esc((labels[k] && labels[k].label) || k), count: D[k][D[k].length - 1] }));
    return { title: "Flagged today, by how it was raised",
      html: rowsHtml(rows, "flagged today. A customer report is one of the three ways something gets flagged.") };
  }

  function sideSectionHtml(m) {
    const side = m.side();
    return `<section class="panel panel-mix" aria-labelledby="mix-title">
          <h2 id="mix-title">${esc(side.title)}</h2>
          <div id="ov-side">${side.html}</div>
        </section>`;
  }

  // The panel that is showing, kept for this visit so coming back from a case shows the same chart
  function state() {
    if (!appState.overview) appState.overview = { metric: METRICS[0].key };
    return appState.overview;
  }
  function current() { return METRICS.find(m => m.key === state().metric) || METRICS[0]; }

  // The average of the days (or weeks) before the last one
  function average(m) {
    const before = m.values.slice(0, -1);
    const avg = before.reduce((a, b) => a + b, 0) / before.length;
    return avg < 10 ? Math.round(avg * 10) / 10 : Math.round(avg);
  }

  // ---------- The four panels ----------

  function panelsHtml() {
    const now = current();
    return `<ul class="kpis ov-kpis">
        ${METRICS.map(m => `<li>
            <button type="button" class="kpi ov-kpi" data-metric="${m.key}" aria-pressed="${m === now}">
              <span class="kpi-label">${esc(m.label)}</span>
              <span class="kpi-value">${m.values[m.values.length - 1]}</span>
              <span class="kpi-note">Average: ${average(m)}</span>
            </button>
          </li>`).join("")}
      </ul>`;
  }

  // ---------- The chart ----------

  // A scale with three equal steps that leaves room above the tallest bar
  function scaleTop(max) {
    const steps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300, 500, 1000];
    const need = (Math.max(max, 1) * 1.15) / 3;
    return (steps.find(s => s >= need) || Math.ceil(need)) * 3;
  }

  function columnName(m, l, i) {
    const isLast = i === m.values.length - 1;
    if (m.per === "week") return isLast ? "This week" : `Week of ${l.date} ${l.month}`;
    return `${l.day} ${l.date} ${l.month}${isLast ? " (today)" : ""}`;
  }

  // One colour of bars (one series, so no legend: the heading names it).
  // Hover or keyboard focus shows a bar's number; the latest number is always shown.
  function chartHtml(m) {
    const last = m.values.length - 1;
    const top = scaleTop(Math.max(...m.values));
    const days = m.per === "day";
    return `
      <div class="chart">
        <div class="chart-scale" aria-hidden="true">
          ${[1, 2 / 3, 1 / 3, 0].map(f => `<span style="--y: ${1 - f}">${Math.round(top * f)}</span>`).join("")}
        </div>
        <ol class="bars">
          ${m.values.map((v, i) => `<li class="bar-col${i === last ? " is-today" : ""}">
              <span class="bar" style="--h: ${(v / top) * 100}%" role="img" tabindex="0" aria-label="${esc(columnName(m, m.labels[i], i))}: ${v} ${m.noun}">
                ${i === last ? `<span class="bar-value" aria-hidden="true">${v}</span>` : ""}
                <span class="bar-tip" aria-hidden="true">${esc(columnName(m, m.labels[i], i))}: ${v}</span>
              </span>
            </li>`).join("")}
        </ol>
        <span></span>
        <ol class="bar-days ov-days" aria-hidden="true">
          ${m.labels.map((l, i) => `<li${i === last ? ' class="is-today"' : ""}>${
            i === last && !days ? "This week"
              : days ? `<span class="ov-long">${esc(l.day)}</span><span class="ov-short">${esc(l.day.charAt(0))}</span><span>${esc(l.date)}</span>`
              : `<span>${esc(l.date)}</span><span>${esc(l.month)}</span>`}</li>`).join("")}
        </ol>
      </div>
      <details class="chart-table">
        <summary>Show as a table</summary>
        <table class="data-table">
          <thead><tr><th scope="col">${days ? "Day" : "Week"}</th><th scope="col">${esc(m.label.replace(/ (today|this week)$/, ""))}</th></tr></thead>
          <tbody>${m.values.map((v, i) => `<tr><td>${esc(columnName(m, m.labels[i], i))}</td><td>${v}</td></tr>`).join("")}</tbody>
        </table>
      </details>`;
  }

  function chartSectionHtml() {
    const m = current();
    return `<section class="panel panel-chart" aria-labelledby="chart-title">
          <h2 id="chart-title">${esc(m.title)}</h2>
          <p class="visually-hidden" id="ov-status" role="status"></p>
          <div id="ov-chart">${chartHtml(m)}</div>
        </section>`;
  }

  // ---------- The screen ----------

  // Swap the panels and the chart in the Overview triage-console.js made. If either one can't be
  // found (the original was changed), leave the Overview exactly as it was.
  function overviewHtml(param) {
    const html = base.render(param);
    const kpis = /<ul class="kpis">[\s\S]*?<\/ul>/;
    const chart = /<section class="panel panel-chart"[\s\S]*?<\/section>/;
    const mix = /<section class="panel panel-mix"[\s\S]*?<\/section>/;
    if (!kpis.test(html) || !chart.test(html) || !mix.test(html)) return html;
    return html.replace(kpis, () => panelsHtml()).replace(chart, () => chartSectionHtml()).replace(mix, () => sideSectionHtml(current()));
  }

  function afterRender(param) {
    if (base.afterRender) base.afterRender(param);
    const panels = document.querySelector(".ov-kpis");
    if (!panels) return;
    // One listener for the four panels. Only the chart and the box are redrawn, so keyboard focus stays on the panel.
    panels.addEventListener("click", event => {
      const button = event.target.closest(".ov-kpi");
      if (!button) return;
      state().metric = button.dataset.metric;
      const m = current();
      panels.querySelectorAll(".ov-kpi").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      document.getElementById("chart-title").textContent = m.title;
      const holder = document.getElementById("ov-chart");
      const tableOpen = !!holder.querySelector("details[open]");   // keep "Show as a table" open when swapping panels
      holder.innerHTML = chartHtml(m);
      if (tableOpen) holder.querySelector("details").open = true;
      const side = m.side();
      document.getElementById("mix-title").textContent = side.title;
      document.getElementById("ov-side").innerHTML = side.html;
      document.getElementById("ov-status").textContent = `Chart now shows: ${m.title}.`;
    });
  }

  registerRoute(Object.assign({}, base, { render: overviewHtml, afterRender }));
})();