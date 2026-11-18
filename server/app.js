"use strict";

// Verify the Caller: the server (Express).
// Owner: Jose. Jira FSDP-134 (R-5).
// Serves the web app's files, plus the risk scoring API. The API uses exactly the same
// scoring code and settings as the browser (js/features/risk-scorer-logic.js and
// js/data/risk-scorer.js), so the two can never disagree.
// The full API contract is in docs/risk-scorer.md.
//
// This is a prototype: cases are kept in memory and are lost when the server stops.

const path = require("path");
const express = require("express");
const RISK_SCORER = require("../js/features/risk-scorer-logic.js");
const { createAuthRouter } = require("./auth.js");   // sign in (Wei Ye)
const { passphraseRoutes } = require("./passphrases.js");   // Family passphrase (Jiliana)

const SITE_ROOT = path.join(__dirname, "..");

// Builds a new app with its own empty case list. server.js starts one; the tests make their own.
function createApp(options = {}) {
  const app = express();
  const cases = [];   // High-risk transfers waiting for a bank officer (R-4)

  app.use(express.json({ limit: "10kb" }));

  // Sign in: POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout (see auth.js).
  // It needs a "user store" (db/user-store.js); server.js passes one in. Without one (as in the
  // risk scorer tests) these addresses simply don't exist.
  if (options.userStore) app.use("/api/auth", createAuthRouter(options.userStore, options.authOptions));

  // POST /api/risk/score: score one transfer.
  // Body: a transfer (fields in docs/risk-scorer.md). Reply: 200 with the result, or 400 with problems.
  app.post("/api/risk/score", (req, res) => {
    const problems = RISK_SCORER.validateTransfer(req.body);
    if (problems.length) return res.status(400).json({ error: "Invalid transfer", problems });

    const result = RISK_SCORER.scoreTransfer(req.body);

    // R-4: a High result pauses the transfer and opens a case for staff
    if (result.action === "pause-and-case") {
      const staffCase = {
        ref: `TR-${String(cases.length + 1).padStart(4, "0")}`,
        createdAt: new Date().toISOString(),
        payeeName: req.body.payeeName || "",
        amount: req.body.amount,
        score: result.score,
        band: result.band,
        reasons: result.reasons
      };
      cases.push(staffCase);
      result.caseRef = staffCase.ref;
    }
    res.json(result);
  });

  // GET /api/risk/cases: the High-risk cases created so far, newest first (for the staff console)
  app.get("/api/risk/cases", (req, res) => {
    res.json([...cases].reverse());
  });

// Family passphrase: hashed safe words (server/passphrases.js)   
  app.use("/api/passphrases", passphraseRoutes());  

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
