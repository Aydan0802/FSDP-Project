"use strict";

// Tests for saved cases, reports and freezes (server/records.js and server/reports.js). Owner: Jose.
// Run from the server folder:  npm test
// The Supabase table is tested against a pretend Supabase (a fake fetch), so no key or internet
// is needed and the real database is never touched.

const test = require("node:test");
const assert = require("node:assert/strict");
const { createRecords, createMemoryRecords, refFor, TABLES } = require("../records.js");
const { checkReport, readAmount } = require("../reports.js");
const { createApp } = require("../app.js");
const RISK_SCORER_DATA = require("../../js/data/risk-scorer.js");

// ---------- records.js ----------

test("refFor makes short numbers a senior can read out", () => {
  assert.equal(refFor("SR", 7), "SR-0007");
  assert.equal(refFor("TR", 12345), "TR-12345");
});

test("without Supabase settings, records are kept in memory, newest first", async () => {
  const records = createRecords({});
  assert.equal(records.kind, "memory");
  for (const table of TABLES) assert.ok(records[table], table);
  const first = await records.scam_reports.add({ what: "call" });
  const second = await records.scam_reports.add({ what: "message" });
  assert.equal(first.id, 1);
  assert.equal(second.id, 2);
  assert.ok(first.created_at);
  assert.deepEqual((await records.scam_reports.list()).map(r => r.what), ["message", "call"]);
});

test("with Supabase settings, rows go to Supabase's REST address with the secret key", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    const body = options.method === "POST" ? [{ id: 5, created_at: "2026-11-20T13:00:00Z", ...JSON.parse(options.body) }] : [];
    return { ok: true, status: 200, json: async () => body, text: async () => "" };
  };
  const records = createRecords({ SUPABASE_URL: "https://demo.supabase.co/", SUPABASE_SECRET_KEY: "sb_secret_x" }, fakeFetch);
  assert.equal(records.kind, "supabase");

  const saved = await records.freeze_requests.add({ mobile: "91234567" });
  assert.equal(saved.id, 5);
  assert.equal(calls[0].url, "https://demo.supabase.co/rest/v1/freeze_requests");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.apikey, "sb_secret_x");
  assert.equal(calls[0].options.headers.Prefer, "return=representation");
  assert.equal(calls[0].options.headers.Authorization, undefined);   // new-style keys don't go here

  await records.freeze_requests.list();
  assert.equal(calls[1].url, "https://demo.supabase.co/rest/v1/freeze_requests?select=*&order=created_at.desc&limit=100");
});

test("a Supabase error says which table and what to do", async () => {
  const fakeFetch = async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => "relation does not exist" });
  const records = createRecords({ SUPABASE_URL: "https://demo.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_x" }, fakeFetch);
  await assert.rejects(records.scam_reports.add({}), /404 for scam_reports \(run database\/jose-tables\.sql/);
});

// ---------- Checking a report ----------

test("a report needs what happened and whether money was lost", () => {
  assert.deepEqual(checkReport({ what: "call", lost: "no" }).row, { what: "call", lost: "no", amount: null, contact: "", more: "" });
  assert.equal(checkReport({}).problems.length, 2);
  assert.equal(checkReport({ what: "phone", lost: "no" }).problems.length, 1);
});

test("the amount is only kept when money was lost, and must be a number above 0", () => {
  assert.equal(readAmount("S$1,200.50"), 1200.5);
  assert.equal(readAmount(""), null);
  assert.equal(checkReport({ what: "sent", lost: "yes", amount: "S$500" }).row.amount, 500);
  assert.equal(checkReport({ what: "sent", lost: "no", amount: "500" }).row.amount, null);
  assert.equal(checkReport({ what: "sent", lost: "yes", amount: "lots" }).problems.length, 1);
  assert.equal(checkReport({ what: "sent", lost: "yes", amount: "-5" }).problems.length, 1);
});

test("very long boxes are refused", () => {
  assert.equal(checkReport({ what: "other", lost: "no", more: "a".repeat(1001) }).problems.length, 1);
  assert.equal(checkReport({ what: "other", lost: "no", contact: "a".repeat(201) }).problems.length, 1);
});

// ---------- The API ----------

async function withServer(options, run) {
  const server = createApp(options).listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
}

const send = (base, path, body, headers = {}) => fetch(`${base}${path}`, {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body)
});

test("POST /api/reports saves a report and gives back its number; staff can list it", async () => {
  await withServer({}, async base => {
    const res = await send(base, "/api/reports", { what: "sent", lost: "yes", amount: "S$8,000", contact: "8123 4567", more: "Said he was my grandson" }, { "X-User-Id": "customer01" });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.ref, "SR-0001");
    assert.ok(body.createdAt);

    const list = await (await fetch(`${base}/api/reports`)).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].ref, "SR-0001");
    assert.equal(list[0].amount, 8000);
    assert.equal(list[0].customerId, "customer01");

    const bad = await send(base, "/api/reports", { what: "sent" });
    assert.equal(bad.status, 400);
    assert.ok((await bad.json()).problems.length > 0);
  });
});

test("POST /api/freeze needs a real-looking mobile number or a signed-in customer", async () => {
  await withServer({}, async base => {
    const guest = await send(base, "/api/freeze", { mobile: "9123 4567" });
    assert.equal(guest.status, 201);
    assert.equal((await guest.json()).ref, "FR-0001");

    const signedIn = await send(base, "/api/freeze", {}, { "X-User-Id": "customer02" });
    assert.equal(signedIn.status, 201);

    assert.equal((await send(base, "/api/freeze", { mobile: "1234" })).status, 400);
    assert.equal((await send(base, "/api/freeze", {})).status, 400);

    const list = await (await fetch(`${base}/api/freeze`)).json();
    assert.deepEqual(list.map(f => f.ref), ["FR-0002", "FR-0001"]);
    assert.equal(list[1].mobile, "91234567");
  });
});

test("the lists are for bank staff only when sign-in is on", async () => {
  const { createMemoryUserStore } = require("../db/user-store.js");
  await withServer({ userStore: createMemoryUserStore() }, async base => {
    assert.equal((await fetch(`${base}/api/reports`)).status, 401);
    assert.equal((await fetch(`${base}/api/freeze`)).status, 401);
    // Sending a report still works for anyone
    assert.equal((await send(base, "/api/reports", { what: "call", lost: "no" })).status, 201);
  });
});

test("if saving fails, the customer gets a calm error, not the database's message", async () => {
  const broken = { add: async () => { throw new Error("secret database detail"); }, list: async () => { throw new Error("secret"); } };
  const records = { ...createMemoryRecords(), scam_reports: broken, risk_cases: broken };
  await withServer({ records }, async base => {
    const res = await send(base, "/api/reports", { what: "call", lost: "no" });
    assert.equal(res.status, 503);
    assert.doesNotMatch(JSON.stringify(await res.json()), /secret/);

    // A High transfer still gets its result (the transfer stays paused), just without a case number
    const grandma = RISK_SCORER_DATA.samples.find(s => s.id === "grandma-scam").transfer;
    const scored = await send(base, "/api/risk/score", grandma);
    assert.equal(scored.status, 200);
    const result = await scored.json();
    assert.equal(result.band, "high");
    assert.equal(result.caseRef, undefined);
  });
});
