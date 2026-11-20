"use strict";

// Feature: Overview (staff). #staff
// Owner: Wei Ye
// Four clickable panels: the picked one drives the chart and the breakdown box beside it.
// Re-registers the "staff" route from triage-console.js with those parts replaced, so it must load after it.
// If anything it needs is missing, the original Overview stays. Totals only, no customer details.

(function () {
  if (typeof OVERVIEW_DATA === "undefined" || typeof CASE_INSIGHTS_DATA === "undefined" ||
      typeof routes === "undefined" || !routes.staff) return;

  const base = routes.staff;   // the Overview as triage-console.js made it
  const D = CASE_INSIGHTS_DATA.daily;
  const W = CASE_INSIGHTS_DATA.weekly;
  // 12 weeks of reports: 4 earlier weeks, then the 8 from CASE_INSIGHTS_DATA
  const E = OVERVIEW_DATA.earlierReportWeeks || { labels: [], reports: [] };
  const weekLabels = E.labels.concat(W.labels);
  const weekReports = E.reports.concat(W.report);

  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }

  // The four panels. The last value in each list is today (or this week).
  const METRICS = [
    { key: "reports-day", label: "Reports today", per: "day", noun: "reports",
      title: "Reports each day, last 14 days", values: D.report, labels: D.labels, side: () => resultsSide("today") },
    { key: "reports-week", label: "Reports this week", per: "week", noun: "reports",
      title: `Reports each week, last ${weekReports.length} weeks`, values: weekReports, labels: weekLabels, side: () => resultsSide("week") },
    { key: "checks-day", label: "Checks used today", per: "day", noun: "checks",
      title: "Checks used each day, last 14 days", values: OVERVIEW_DATA.checksPerDay, labels: D.labels, side: toolsSide },
    { key: "flags-day", label: "Flagged activity today", per: "day", noun: "flagged",
      title: "Flagged activity each day, last 14 days", values: D.auto.map((_, i) => D.auto[i] + D.pause[i] + D.report[i]), labels: D.labels, side: flaggedSide }
  ].filter(m => m.values.length === m.labels.length && m.values.every(Number.isFinite));

  if (!METRICS.length) return;

  // ---------- The box next to the chart: a breakdown of the number on the picked panel ----------

  // One bar per row. "name" is the words or badge at the left.
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

  // The picked panel and chart style, kept so coming back shows the same chart
  function state() {
    if (!appState.overview) appState.overview = { metric: METRICS[0].key, style: "line" };
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

  // One series, so no legend. Hover or focus shows a number; the latest is always shown.
  function chartHtml(m) {
    const last = m.values.length - 1;
    const top = scaleTop(Math.max(...m.values));
    const days = m.per === "day";
    const line = state().style !== "bars";
    const pct = v => (v / top) * 100;
    const x = i => ((i + 0.5) / m.values.length) * 100;
    // Lines mode keeps the columns as invisible hover and keyboard spots and draws the line over them
    const overlay = line ? `<div class="ov-lines" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><polyline points="${m.values.map((v, i) => x(i).toFixed(2) + "," + (100 - pct(v)).toFixed(2)).join(" ")}"></polyline></svg>
          ${m.values.map((v, i) => `<span class="ov-pt${i === last ? " is-today" : ""}" style="left: ${x(i)}%; bottom: ${pct(v)}%"></span>`).join("")}
        </div>` : "";
    return `
      <div class="chart${line ? " ov-line-mode" : ""}">
        <div class="chart-scale" aria-hidden="true">
          ${[1, 2 / 3, 1 / 3, 0].map(f => `<span style="--y: ${1 - f}">${Math.round(top * f)}</span>`).join("")}
        </div>
        <ol class="bars">
          ${m.values.map((v, i) => `<li class="bar-col${i === last ? " is-today" : ""}">
              <span class="bar" style="--h: ${line ? 100 : pct(v)}%; --v: ${pct(v)}%" role="img" tabindex="0" aria-label="${esc(columnName(m, m.labels[i], i))}: ${v} ${m.noun}">
                ${i === last ? `<span class="bar-value" aria-hidden="true">${v}</span>` : ""}
                <span class="bar-tip" aria-hidden="true">${esc(columnName(m, m.labels[i], i))}: ${v}</span>
              </span>
            </li>`).join("")}
        </ol>
        ${overlay}
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
          <div class="ins-modes-row">
            <span id="ov-style-label" class="ins-period-label">Chart style</span>
            <div class="ins-modes" role="group" aria-labelledby="ov-style-label">
              ${[["line", "Lines"], ["bars", "Bars"]].map(([key, label]) => `<button type="button" class="chip" data-style="${key}" aria-pressed="${state().style === key}">${label}</button>`).join("")}
            </div>
          </div>
          <div id="ov-chart">${chartHtml(m)}</div>
        </section>`;
  }

  // ---------- The screen ----------

  // Swaps in the new panels, chart and box. If any can't be found, the Overview is left as it was.
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
    // Redraws the chart; an open table stays open
    function redrawChart(m) {
      const holder = document.getElementById("ov-chart");
      const tableOpen = !!holder.querySelector("details[open]");
      holder.innerHTML = chartHtml(m);
      if (tableOpen) holder.querySelector("details").open = true;
    }
    // Lines or Bars
    document.querySelector(".panel-chart").addEventListener("click", event => {
      const button = event.target.closest("[data-style]");
      if (!button) return;
      state().style = button.dataset.style;
      document.querySelectorAll(".panel-chart [data-style]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      redrawChart(current());
      document.getElementById("ov-status").textContent = `Chart style: ${state().style === "bars" ? "bars" : "lines"}.`;
    });
    // One listener for the four panels. Only the chart and the box are redrawn, so keyboard focus stays on the panel.
    panels.addEventListener("click", event => {
      const button = event.target.closest(".ov-kpi");
      if (!button) return;
      state().metric = button.dataset.metric;
      const m = current();
      panels.querySelectorAll(".ov-kpi").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      document.getElementById("chart-title").textContent = m.title;
      redrawChart(m);
      const side = m.side();
      document.getElementById("mix-title").textContent = side.title;
      document.getElementById("ov-side").innerHTML = side.html;
      document.getElementById("ov-status").textContent = `Chart now shows: ${m.title}.`;
    });
  }

  registerRoute(Object.assign({}, base, { render: overviewHtml, afterRender }));
})();