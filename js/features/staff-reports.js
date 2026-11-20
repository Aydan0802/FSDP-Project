"use strict";

// Feature: Reports & freezes (staff). #staff-reports
// Owner: Jose
// Shows bank staff what customers sent from "Freeze my accounts" and "Report a scam", newest
// first, from the server (GET /api/freeze and GET /api/reports, server/reports.js). Freeze
// requests come first: they are the most urgent, the customer may still be losing money.
// Staff screens are English only, like the rest of the staff console.
// Everything a customer typed goes through escapeHtml(), so it can never run as code here.

(function () {
  const WHAT = { call: "Phone call", message: "Message", sent: "Sent money", other: "Something else" };
  const LOST = { yes: "Yes", no: "No", unsure: "Not sure" };

  // What the screen shows while it loads, and after: { freezes, reports } or { problem }
  let loaded = null;

  function when(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("en-SG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function money(amount) {
    return amount === null || amount === undefined ? "" : `S$${Number(amount).toLocaleString("en-SG")}`;
  }

  // Gets one list. Throws "signin" if the server says staff must sign in again.
  async function getList(path) {
    const res = await fetch(path);
    if (res.status === 401 || res.status === 403) throw new Error("signin");
    if (!res.ok) throw new Error("server");
    return res.json();
  }

  async function load() {
    try {
      const [freezes, reports] = await Promise.all([getList("/api/freeze"), getList("/api/reports")]);
      loaded = { freezes, reports };
    } catch (err) {
      loaded = { problem: err.message === "signin" ? "Please sign in again as bank staff to see these." : "Reports and freezes are not available. Is the server running?" };
    }
    if (location.hash.startsWith("#staff-reports")) redrawScreen();
  }

  function freezeTable(rows) {
    if (!rows.length) return `<p class="meta">No freeze requests yet.</p>`;
    return `<div class="table-wrap"><table class="data-table">
        <thead><tr><th scope="col">Request</th><th scope="col">When</th><th scope="col">Mobile</th><th scope="col">Customer ID</th></tr></thead>
        <tbody>${rows.map(r => `<tr>
          <td style="white-space: nowrap"><strong>${escapeHtml(r.ref)}</strong></td><td>${when(r.frozenAt)}</td>
          <td>${escapeHtml(r.mobile || "-")}</td><td>${escapeHtml(r.customerId || "-")}</td></tr>`).join("")}</tbody>
      </table></div>`;
  }

  function reportTable(rows) {
    if (!rows.length) return `<p class="meta">No scam reports yet.</p>`;
    return `<div class="table-wrap"><table class="data-table">
        <thead><tr><th scope="col">Report</th><th scope="col">When</th><th scope="col">What happened</th><th scope="col">Lost money?</th><th scope="col">Their number or link</th><th scope="col">Anything else</th></tr></thead>
        <tbody>${rows.map(r => `<tr>
          <td style="white-space: nowrap"><strong>${escapeHtml(r.ref)}</strong></td><td>${when(r.createdAt)}</td>
          <td>${WHAT[r.what] || escapeHtml(r.what)}</td>
          <td>${LOST[r.lost] || escapeHtml(r.lost)}${r.amount ? ` (${money(r.amount)})` : ""}</td>
          <td>${escapeHtml(r.contact || "-")}</td><td>${escapeHtml(r.more || "-")}</td></tr>`).join("")}</tbody>
      </table></div>`;
  }

  function screenHtml() {
    let body;
    if (!loaded) body = `<p class="meta" role="status">Loading…</p>`;
    else if (loaded.problem) body = `<p class="field-error" role="alert">${loaded.problem}</p>`;
    else body = `
      <section class="panel" aria-labelledby="sr-freeze-title">
        <h2 id="sr-freeze-title">Freeze requests (${loaded.freezes.length})</h2>
        ${freezeTable(loaded.freezes)}
      </section>
      <section class="panel" aria-labelledby="sr-report-title">
        <h2 id="sr-report-title">Scam reports (${loaded.reports.length})</h2>
        ${reportTable(loaded.reports)}
      </section>`;
    return staffPageHtml("staff-reports", `
      <section class="panel">
        <h1 tabindex="-1">Reports &amp; freezes</h1>
        <p>What customers sent from Freeze my accounts and Report a scam, newest first.</p>
        <button type="button" class="btn btn-secondary btn-small" id="sr-refresh">Refresh</button>
      </section>
      ${body}`);
  }

  function afterRender() {
    if (!loaded) load();   // the first time this screen opens
    document.getElementById("sr-refresh").addEventListener("click", () => {
      loaded = null;
      redrawScreen();
    });
  }

  registerRoute({
    name: "staff-reports",
    role: "staff",
    render: screenHtml,
    afterRender
  });
})();
