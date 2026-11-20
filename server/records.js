"use strict";

// Saved records for three of Jose's features, so they work for real instead of only in a demo:
//   risk_cases        a High-risk transfer the risk scorer paused for a bank officer (R-4)
//   scam_reports      a "Report a scam" form
//   freeze_requests   a "Freeze my accounts" request
// Owner: Jose
//
// Why: before, cases lived in the server's memory and reports and freezes never left the browser.
// On Vercel every request can land on a fresh copy of the server, so memory is wiped all the time
// and the staff console often showed nothing. Supabase keeps them.
//
// Each table does the same two jobs:
//   add(row)     saves one row and gives it back with its new id and created_at
//   list(limit)  the newest rows first
// There are two kinds of table, just like the user store (db/user-store.js):
//   Supabase   when SUPABASE_URL and SUPABASE_SECRET_KEY are set in server/.env
//              (make the tables once with database/jose-tables.sql)
//   memory     otherwise: kept until the server stops, so the demo and the tests still work
// server.js and api/index.js pick Supabase (createRecords()). The tests use memory.

const TABLES = ["risk_cases", "scam_reports", "freeze_requests"];
const MAX_LIST = 100;

// ---------- Memory ----------

function memoryTable() {
  const rows = [];
  return {
    async add(row) {
      const saved = { ...row, id: rows.length + 1, created_at: new Date().toISOString() };
      rows.push(saved);
      return saved;
    },
    async list(limit = MAX_LIST) {
      return rows.slice().reverse().slice(0, limit);   // newest first
    }
  };
}

// ---------- Supabase ----------

// Talks to Supabase's REST address with plain fetch, the same way the sign-in store does, so it
// works with the same key. The SECRET key only ever stays on the server.
function supabaseTable({ url, key, fetchImpl = fetch, timeoutMs = 5000 }, table) {
  const address = `${url.replace(/\/+$/, "")}/rest/v1/${table}`;
  const headers = { apikey: key, "Content-Type": "application/json", Accept: "application/json" };
  if (/^eyJ/.test(key)) headers.Authorization = "Bearer " + key;   // older keys also go here

  // Sends one request and gives back the JSON, or throws an error that says what went wrong
  async function send(query, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);   // don't wait forever
    try {
      const res = await fetchImpl(address + query, { ...options, headers: { ...headers, ...options.headers }, signal: controller.signal });
      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 200);
        const hint = res.status === 404 ? " (run database/jose-tables.sql in Supabase first)" : "";
        throw new Error(`Supabase answered ${res.status} for ${table}${hint}: ${detail}`);
      }
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async add(row) {
      // "return=representation" asks Supabase to send the saved row back (with its id)
      const saved = await send("", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
      return saved[0];
    },
    async list(limit = MAX_LIST) {
      return send(`?select=*&order=created_at.desc&limit=${limit}`, { method: "GET", headers: {} });
    }
  };
}

// ---------- Picking one ----------

// { kind: "supabase" | "memory", risk_cases, scam_reports, freeze_requests }
function createRecords(env = process.env, fetchImpl = fetch) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const useSupabase = Boolean(url && key);
  const records = { kind: useSupabase ? "supabase" : "memory" };
  for (const table of TABLES) {
    records[table] = useSupabase ? supabaseTable({ url, key, fetchImpl }, table) : memoryTable();
  }
  return records;
}

function createMemoryRecords() {
  return createRecords({});
}

// A short number a senior can read out on the phone: refFor("SR", 42) is "SR-0042"
function refFor(prefix, id) {
  return `${prefix}-${String(id).padStart(4, "0")}`;
}

module.exports = { createRecords, createMemoryRecords, refFor, TABLES };
