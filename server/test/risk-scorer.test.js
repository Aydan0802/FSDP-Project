"use strict";

// Tests for the transfer risk scorer and its API. Owner: Jose.
// Run from the server folder:  npm test

const test = require("node:test");
const assert = require("node:assert/strict");
const RISK_SCORER_DATA = require("../../js/data/risk-scorer.js");
const RISK_SCORER = require("../../js/features/risk-scorer-logic.js");
const { createApp } = require("../app.js");

const { config, samples } = RISK_SCORER_DATA;
const sample = id => samples.find(s => s.id === id).transfer;

// ---------- R-1: the signals ----------

test("R-1: all six required signals exist, each with a weight and a reason", () => {
  const ids = config.signals.map(s => s.id).sort();
  assert.deepEqual(ids, ["amountVsUsual", "flaggedPayee", "newPayee", "oddHour", "rapidRepeat", "recentlyAddedPayee"]);
  for (const s of config.signals) {
    assert.ok(Number.isFinite(s.weight) && s.weight > 0, `${s.id} has a weight`);
    assert.ok(s.reason.length > 10, `${s.id} has a reason`);
  }
});

// ---------- R-2: the score ----------

test("R-2: every sample lands in the band it was designed for", () => {
  for (const s of samples) {
    assert.equal(RISK_SCORER.scoreTransfer(s.transfer).band, s.expect, s.id);
  }
});

test("R-2: the scam scores high and the normal transfer scores low", () => {
  assert.ok(RISK_SCORER.scoreTransfer(sample("grandma-scam")).score >= 70);
  assert.equal(RISK_SCORER.scoreTransfer(sample("allowance")).score, 0);
});

test("R-2: the same transfer always gets the same result", () => {
  for (const s of samples) {
    const first = JSON.stringify(RISK_SCORER.scoreTransfer(s.transfer));
    for (let i = 0; i < 20; i++) assert.equal(JSON.stringify(RISK_SCORER.scoreTransfer(s.transfer)), first);
  }
});

test("R-2: the score never goes above 100, even when every signal fires", () => {
  const everything = { amount: 9000, usualAmount: 100, hour: 3, isNewPayee: true,
    payeeAddedHoursAgo: 0, payeeFlagged: true, recentTransferMinutes: [1, 2] };
  const result = RISK_SCORER.scoreTransfer(everything);
  assert.equal(result.score, 100);
  assert.equal(result.signals.length, 6);
});

test("R-2: a bad transfer is refused, never quietly scored", () => {
  assert.throws(() => RISK_SCORER.scoreTransfer({ amount: "lots" }), /Invalid transfer/);
  assert.ok(RISK_SCORER.validateTransfer({ ...sample("allowance"), hour: 24 }).length > 0);
});

// ---------- R-3: the reasons ----------

test("R-3: at most 3 reasons, strongest first, in plain words", () => {
  const result = RISK_SCORER.scoreTransfer(sample("grandma-scam"));
  assert.equal(result.reasons.length, 3);
  const weights = result.signals.map(s => s.weight);
  assert.deepEqual(weights, [...weights].sort((a, b) => b - a));
  assert.equal(result.reasons[0], config.signals.find(s => s.id === "amountVsUsual").reason);
});

test("R-3: a safe transfer has no reasons", () => {
  assert.deepEqual(RISK_SCORER.scoreTransfer(sample("allowance")).reasons, []);
});

// ---------- R-4: bands come from the config ----------

test("R-4: the band edges are exactly 40 and 70", () => {
  // A config with one signal (that fires) whose weight we choose lets us hit any score exactly
  const toNewPayee = { ...sample("allowance"), isNewPayee: true };
  const band = weight => RISK_SCORER.scoreTransfer(toNewPayee, {
    ...config, signals: [{ id: "newPayee", label: "x", weight, reason: "x" }]
  }).band;
  assert.equal(band(39), "low");
  assert.equal(band(40), "medium");
  assert.equal(band(69), "medium");
  assert.equal(band(70), "high");
});

test("R-4: changing a weight in the config changes the score (nothing hard-coded)", () => {
  const changed = { ...config, signals: config.signals.map(s => (s.id === "oddHour" ? { ...s, weight: 50 } : s)) };
  assert.equal(RISK_SCORER.scoreTransfer(sample("bill-split"), changed).score, 70);
});

// ---------- R-5: the API ----------

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    server.close();
  }
}

const post = (base, body) => fetch(`${base}/api/risk/score`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
});

test("R-5: POST /api/risk/score returns score, band and reasons, in under 2 seconds", async () => {
  await withServer(async base => {
    const started = Date.now();
    const res = await post(base, sample("renovation"));
    const ms = Date.now() - started;
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.score, 40);
    assert.equal(body.band, "medium");
    assert.ok(Array.isArray(body.reasons));
    assert.ok(ms < 2000, `took ${ms} ms`);
  });
});

test("R-5: the API and the browser code give the same result", async () => {
  await withServer(async base => {
    for (const s of samples) {
      const body = await (await post(base, s.transfer)).json();
      const local = RISK_SCORER.scoreTransfer(s.transfer);
      delete body.caseRef;
      assert.deepEqual(body, local, s.id);
    }
  });
});

test("R-4 + R-5: a High result opens a staff case; Low and Medium do not", async () => {
  await withServer(async base => {
    assert.equal((await (await post(base, sample("marketplace"))).json()).caseRef, undefined);
    const high = await (await post(base, sample("grandma-scam"))).json();
    assert.equal(high.caseRef, "TR-0001");
    const cases = await (await fetch(`${base}/api/risk/cases`)).json();
    assert.equal(cases.length, 1);
    assert.equal(cases[0].ref, "TR-0001");
    assert.equal(cases[0].score, 90);
  });
});

test("R-5: bad input gets a 400 with the problems listed", async () => {
  await withServer(async base => {
    const res = await post(base, { amount: -5 });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).problems.length > 0);
    const notJson = await fetch(`${base}/api/risk/score`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops"
    });
    assert.equal(notJson.status, 400);
  });
});

test("The server does not hand out its own code", async () => {
  await withServer(async base => {
    assert.equal((await fetch(`${base}/server/app.js`)).status, 404);
  });
});
