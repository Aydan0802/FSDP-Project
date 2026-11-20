"use strict";

// Feature: the APIs behind "Report a scam" and "Freeze my accounts".
// Owner: Jose
//   POST /api/reports   { what, lost, amount, contact, more }   saves a report, replies { ref, createdAt }
//   GET  /api/reports   the newest reports first (bank staff only)
//   POST /api/freeze    { mobile }                              saves a freeze request, replies { ref, frozenAt }
//   GET  /api/freeze    the newest freeze requests first (bank staff only)
// They are saved with records.js (Supabase, or memory without it).
// The two lists hold customers' mobile numbers and stories, so only signed-in bank staff may read
// them (staffOnly, from auth.js). Anyone can send a report or a freeze, without signing in.
//
// Who sent it: like the family passphrase API, the browser says who is signed in with the
// X-User-Id header. DEMO ONLY: anyone could fake it. Sign-in sessions are kept in memory today
// (auth.js), so they can't be trusted on Vercel yet; when they are saved properly, use the session.
//
// Nothing a customer typed is ever written to the server's log.

const express = require("express");
const REPORT_DATA = require("../js/data/report.js");
const { refFor } = require("./records.js");

const WHAT = REPORT_DATA.what.map(w => w.id);   // "call", "message", "sent", "other"
const LOST = REPORT_DATA.lost.map(l => l.id);   // "yes", "no", "unsure"
const MAX_CONTACT = 200;
const MAX_MORE = 1000;
const MAX_AMOUNT = 10000000;
const MOBILE = /^[89]\d{7}$/;   // a Singapore mobile number: 8 digits starting with 8 or 9

// "S$1,200.50" -> 1200.5. Gives back null for "", and NaN for anything that isn't a number.
function readAmount(value) {
  const text = String(value == null ? "" : value).replace(/[$,\s]/g, "").replace(/^S/i, "");
  return text === "" ? null : Number(text);
}

// Turns a report form into the row to save, or gives back a list of problems.
// The rules match the form's own checks in js/features/report.js.
function checkReport(body) {
  const b = body || {};
  const problems = [];
  if (!WHAT.includes(b.what)) problems.push(`what must be one of: ${WHAT.join(", ")}`);
  if (!LOST.includes(b.lost)) problems.push(`lost must be one of: ${LOST.join(", ")}`);
  const amount = b.lost === "yes" ? readAmount(b.amount) : null;
  if (amount !== null && !(amount > 0 && amount <= MAX_AMOUNT)) problems.push("amount must be a number above 0");
  const contact = String(b.contact || "").trim();
  const more = String(b.more || "").trim();
  if (contact.length > MAX_CONTACT) problems.push(`contact can be at most ${MAX_CONTACT} characters`);
  if (more.length > MAX_MORE) problems.push(`more can be at most ${MAX_MORE} characters`);
  if (problems.length) return { problems };
  return { row: { what: b.what, lost: b.lost, amount, contact, more } };
}

// The person sending it: their user ID from the header, kept short
function whoIsAsking(req) {
  return String(req.get("X-User-Id") || "").trim().slice(0, 100);
}

// Express 4 doesn't catch errors thrown inside async handlers, so we catch them here.
// The reply never includes the error itself (it could mention the database).
const safely = handler => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(`${req.method} ${req.originalUrl} failed: ${err.message}`);
    res.status(503).json({ error: "We couldn't save this right now. Please try again, or call OCBC." });
  }
};

// staffOnly: the check that lets only signed-in bank staff through (auth.js's requireRole("staff"))
function reportRoutes(records, { staffOnly }) {
  const router = express.Router();

  router.post("/reports", safely(async (req, res) => {
    const { row, problems } = checkReport(req.body);
    if (problems) return res.status(400).json({ error: "Invalid report", problems });
    const saved = await records.scam_reports.add({ ...row, customer_id: whoIsAsking(req) });
    res.status(201).json({ ref: refFor("SR", saved.id), createdAt: saved.created_at });
  }));

  router.get("/reports", staffOnly, safely(async (req, res) => {
    const rows = await records.scam_reports.list();
    res.json(rows.map(r => ({
      ref: refFor("SR", r.id), createdAt: r.created_at, customerId: r.customer_id,
      what: r.what, lost: r.lost, amount: r.amount === null ? null : Number(r.amount), contact: r.contact, more: r.more
    })));
  }));

  router.post("/freeze", safely(async (req, res) => {
    const customerId = whoIsAsking(req);
    const mobile = String((req.body && req.body.mobile) || "").replace(/\D/g, "");
    // A guest types their mobile number; a signed-in customer is known by their user ID
    if (mobile && !MOBILE.test(mobile)) return res.status(400).json({ error: "mobile must be 8 digits starting with 8 or 9" });
    if (!mobile && !customerId) return res.status(400).json({ error: "Please give a mobile number or sign in." });
    const saved = await records.freeze_requests.add({ mobile, customer_id: customerId });
    res.status(201).json({ ref: refFor("FR", saved.id), frozenAt: saved.created_at });
  }));

  router.get("/freeze", staffOnly, safely(async (req, res) => {
    const rows = await records.freeze_requests.list();
    res.json(rows.map(r => ({ ref: refFor("FR", r.id), frozenAt: r.created_at, mobile: r.mobile, customerId: r.customer_id })));
  }));

  return router;
}

module.exports = { reportRoutes, checkReport, readAmount };
