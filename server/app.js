"use strict";

// Pause & Prove: the server (Express).
// Owner: Jose. Jira FSDP-134 (R-5).
// Serves the web app's files, plus the risk scoring API. The API uses exactly the same
// scoring code and settings as the browser (js/features/risk-scorer-logic.js and
// js/data/risk-scorer.js), so the two can never disagree.
// The full API contract is in docs/risk-scorer.md.
//
// High-risk cases, scam reports and freeze requests are saved with records.js: in Supabase when
// server.js / api/index.js pass in createRecords(), otherwise in memory (the tests).

const path = require("path");
const express = require("express");
const RISK_SCORER = require("../js/features/risk-scorer-logic.js");
const { createAuthRouter } = require("./auth.js");   // sign in (Wei Ye)
const { passphraseRoutes } = require("./passphrases.js");   // Family passphrase (Jiliana)
const { createMemoryRecords, refFor } = require("./records.js");   // saved cases, reports, freezes (Jose)
const { reportRoutes } = require("./reports.js");   // Report a scam + Freeze my accounts (Jose)
const { chatRoutes } = require("./chat.js");   // AI helper chat (Jose)

const SITE_ROOT = path.join(__dirname, "..");

// Builds a new app. server.js starts one; the tests make their own.
// options.userStore: where the accounts are (sign-in is off without one)
// options.records:   where cases, reports and freezes are saved (records.js; memory without one)
function createApp(options = {}) {
  const app = express();
  const records = options.records || createMemoryRecords();

  app.use(express.json({ limit: "10kb" }));

  // Sign in: POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout (see auth.js).
  // It needs a "user store" (db/user-store.js); server.js passes one in. Without one (as in the
  // risk scorer tests) these addresses simply don't exist.
  const auth = options.userStore ? createAuthRouter(options.userStore, options.authOptions) : null;
  if (auth) app.use("/api/auth", auth);
  // Lets only signed-in bank staff through. Without sign-in (the tests) it lets everyone through.
  const staffOnly = auth ? auth.requireRole("staff") : (req, res, next) => next();

  // POST /api/risk/score: score one transfer.
  // Body: a transfer (fields in docs/risk-scorer.md). Reply: 200 with the result, or 400 with problems.
  app.post("/api/risk/score", async (req, res) => {
    const problems = RISK_SCORER.validateTransfer(req.body);
    if (problems.length) return res.status(400).json({ error: "Invalid transfer", problems });

    const result = RISK_SCORER.scoreTransfer(req.body);

    // R-4: a High result pauses the transfer and opens a case for staff
    if (result.action === "pause-and-case") {
      try {
        const saved = await records.risk_cases.add({
          payee_name: req.body.payeeName || "",
          amount: req.body.amount,
          score: result.score,
          band: result.band,
          reasons: result.reasons
        });
        result.caseRef = refFor("TR", saved.id);
      } catch (err) {
        // The customer still gets the result (the transfer stays paused), just without a case number
        console.error(`Could not save the risk case: ${err.message}`);
      }
    }
    res.json(result);
  });

  // GET /api/risk/cases: the High-risk cases, newest first (for the staff console)
  app.get("/api/risk/cases", async (req, res) => {
    try {
      const rows = await records.risk_cases.list();
      res.json(rows.map(r => ({
        ref: refFor("TR", r.id), createdAt: r.created_at, payeeName: r.payee_name,
        amount: Number(r.amount), score: r.score, band: r.band, reasons: r.reasons
      })));
    } catch (err) {
      console.error(`Could not load the risk cases: ${err.message}`);
      res.status(503).json({ error: "Cases are not available right now." });
    }
  });

  // Report a scam (POST/GET /api/reports) and Freeze my accounts (POST/GET /api/freeze)
  app.use("/api", reportRoutes(records, { staffOnly }));

// Family passphrase: hashed safe words (server/passphrases.js)   
  app.use("/api/passphrases", passphraseRoutes());

  // AI helper chat: POST /api/chat (see chat.js)
  app.use("/api/chat", chatRoutes());

  // Unknown API addresses get JSON, not the web page
  app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

  // A body that isn't valid JSON
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "The body must be valid JSON." });
    if (err.type === "entity.too.large") return res.status(413).json({ error: "The body is too large." });
    next(err);
  });

  // The web app itself. Never serve the server's own folder (its code and node_modules).
  app.use("/server", (req, res) => res.status(404).end());
  app.use(express.static(SITE_ROOT, { dotfiles: "ignore" }));

  return app;
}

module.exports = { createApp };