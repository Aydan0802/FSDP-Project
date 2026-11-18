"use strict";

// Feature: Overview additions (staff). #staff
// Owner: Wei Ye
// Kept in its own folder and its own files so it can be committed separately from the original
// Overview in js/features/triage-console.js, which is NOT edited.
// What it adds: one panel, "Today in context", between the four numbers and the charts. The
// Overview only ever says what is happening NOW ("14 new reports today"), and a number on its own
// can't tell staff whether it is a lot. Each card compares today with the longer history, in one
// plain sentence. The history comes from js/data/overview/triage-overview.js (OVERVIEW_CONTEXT).
// It must load AFTER js/features/triage-console.js. If the data or the Overview isn't there, the
// Overview simply stays as it was.
// How it fits in without editing the Overview: registerRoute() keeps the LAST screen registered
// under a name, so this file takes the Overview that triage-console.js registered, and registers it
// again with the new panel added to its HTML. The screen's own behaviour is untouched.
// PRIVACY: totals only, like the rest of the staff side.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  if (typeof OVERVIEW_CONTEXT === "undefined" || typeof routes === "undefined" || !routes.staff) return;

  const C = OVERVIEW_CONTEXT;
  const last = C.months.length - 1;
  const base = routes.staff;   // the Overview as triage-console.js made it

  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }

  // A tiny line of the last 12 months, with a title and the first and last month written under it,
  // so it's clear what it shows. The line itself only decorates: the sentence above says the same
  // thing. "unit" is added after the latest number (for example "%").
  function sparkHtml(values, unit) {
    const low = Math.min(...values);
    const span = (Math.max(...values) - low) || 1;
    const y = v => 92 - ((v - low) / span) * 84;   // keeps the line a little inside the frame
    const points = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
    return `<span class="ov-trend">
        <span class="ov-trend-title">Last ${values.length} months</span>
        <span class="ov-spark" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><polyline points="${points}"></polyline></svg>
          <span class="ov-dot" style="top: ${y(values[values.length - 1])}%"></span>
        </span>
        <span class="ov-trend-ends"><span>${esc(C.months[0])}: ${values[0]}${unit || ""}</span><span>${esc(C.months[last])}: ${values[values.length - 1]}${unit || ""}</span></span>
      </span>`;
  }

  // Today next to a usual day of the same name (for example today's reports next to a usual
  // Tuesday), as two bars. The numbers are written beside them, so the bars are only decoration.
  function todayCard() {
    const today = TRIAGE_CONSOLE_DATA.days[TRIAGE_CONSOLE_DATA.days.length - 1];
    const row = C.usualDay[today.day];
    if (!row) return "";
    const usual = row.reports;
    const diff = Math.round(((today.count - usual) / usual) * 100);
    const same = Math.abs(diff) <= 10;
    const sentence = same
      ? `About the same as a usual ${row.name}.`
      : `<span class="delta ${diff > 0 ? "delta--bad" : "delta--good"}"><span aria-hidden="true">${diff > 0 ? "▲" : "▼"} </span>${Math.abs(diff)}% ${diff > 0 ? "busier" : "quieter"}</span> than a usual ${row.name}.`;
    const most = Math.max(today.count, usual);
    return `<li class="ov-card">
        <h3 class="ov-label">Today compared with a usual ${esc(row.name)}</h3>
        <p class="ov-value">${today.count} <span class="ov-unit">reports</span></p>
        <p class="ov-text">${sentence} A usual ${esc(row.name)} has about ${Math.round(usual)}, over the last ${C.weeks} weeks.</p>
        <span class="ov-bars">
          <span class="ov-barrow"><span class="ov-barname">Today: ${today.count}</span>
            <span class="ov-bar" aria-hidden="true"><span style="width: ${(today.count / most) * 100}%"></span></span></span>
          <span class="ov-barrow"><span class="ov-barname">Usual ${esc(today.day)}: ${Math.round(usual)}</span>
            <span class="ov-bar ov-bar--usual" aria-hidden="true"><span style="width: ${(usual / most) * 100}%"></span></span></span>
        </span>
      </li>`;
  }

  // How much the app was used today. This is the "out of how many?" behind today's report count.
  function usageCard() {
    const u = C.usage;
    if (!u) return "";
    const total = u.pauseChecks + u.voiceChecks;
    const diff = Math.round(((total - u.usualChecks) / u.usualChecks) * 100);
    const same = Math.abs(diff) <= 10;
    // More use is not "bad", so this card uses plain words and no red or green.
    const sentence = same
      ? "About the same as a usual day."
      : `<span class="delta"><span aria-hidden="true">${diff > 0 ? "▲" : "▼"} </span>${Math.abs(diff)}% ${diff > 0 ? "more" : "fewer"}</span> than a usual day (about ${u.usualChecks}).`;
    return `<li class="ov-card">
        <h3 class="ov-label">Checks used today</h3>
        <p class="ov-value">${total} <span class="ov-unit">checks</span></p>
        <p class="ov-text">${u.pauseChecks} pause checks and ${u.voiceChecks} voice checks. ${sentence}</p>
      </li>`;
  }

  // The last full month against the 12 before it
  function monthCard() {
    const totals = C.flagsPerMonth;
    const peak = Math.max(...totals);
    const change = Math.round(((totals[last] - totals[last - 1]) / totals[last - 1]) * 100);
    const lead = totals[last] === peak ? "The busiest month of the last 12" : `${totals[last]} is below the busiest month (${peak})`;
    return `<li class="ov-card">
        <h3 class="ov-label">Flagged activity in ${C.months[last]}</h3>
        <p class="ov-value">${totals[last]} <span class="ov-unit">flags</span></p>
        <p class="ov-text">${lead}. <span class="delta ${change > 0 ? "delta--bad" : "delta--good"}"><span aria-hidden="true">${change > 0 ? "▲" : "▼"} </span>${change > 0 ? "Up" : "Down"} ${Math.abs(change)}%</span> on ${C.months[last - 1]}.</p>
        ${sparkHtml(totals)}
      </li>`;
  }

  // Are customers cancelling after the pause? The best sign the moment of friction is useful.
  function cancelCard() {
    const now = C.cancelledPct[last];
    const then = C.cancelledPct[last - 1];
    const diff = now - then;
    return `<li class="ov-card">
        <h3 class="ov-label">Cancelled after the pause</h3>
        <p class="ov-value">${now}<span class="ov-unit">%</span></p>
        <p class="ov-text">Of paused transfers in ${C.months[last]}, the share customers cancelled themselves. ${diff === 0 ? `Same as ${C.months[last - 1]}.` : `<span class="delta ${diff > 0 ? "delta--good" : "delta--bad"}"><span aria-hidden="true">${diff > 0 ? "▲" : "▼"} </span>${diff > 0 ? "Up" : "Down"} ${Math.abs(diff)} points</span> on ${C.months[last - 1]}.`}</p>
        ${sparkHtml(C.cancelledPct, "%")}
      </li>`;
  }

  function contextHtml() {
    const cards = [todayCard(), usageCard(), monthCard(), cancelCard()].join("");
    return `
      <section class="panel ov-context" aria-labelledby="ov-ctx-title" data-read>
        <div class="panel-head">
          <h2 id="ov-ctx-title">Today in context</h2>
        </div>
        <p class="muted ov-sub">How today compares with the last 12 months, so a number is easier to judge.</p>
        <ul class="ov-cards">${cards}</ul>
      </section>`;
  }

  // Puts the panel just above the charts. If the Overview's layout ever changes and the marker
  // isn't found, the panel goes at the end instead of the Overview breaking.
  const MARKER = '<div class="staff-grid">';
  function withContext(html) {
    return html.includes(MARKER) ? html.replace(MARKER, contextHtml() + MARKER) : html + contextHtml();
  }

  registerRoute(Object.assign({}, base, { render: param => withContext(base.render(param)) }));
})();