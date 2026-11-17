"use strict";

// Verify the Caller: where the user accounts are kept.
// Owner: Wei Ye
// The sign-in code (auth.js) never talks to a database directly. It asks a "user store" one question:
//   findByLogin(role, loginId)   the account, or null if there is no such account for that side
// An account looks like:  { userId, role, loginId, passwordHash, isActive }
// There are two stores:
//   Supabase     used when SUPABASE_URL and SUPABASE_SECRET_KEY are set in server/.env
//                (customers are in the table customer_users, staff in staff_users)
//   built-in     the six demo accounts kept in memory, so the team can sign in without Supabase
// Both give the same answers for the same six accounts, and the tests check the sign-in rules
// against both (the Supabase one against a pretend Supabase).

const { DEMO_USERS } = require("./demo-users.js");

// ---------- Built-in store (no database) ----------

function createMemoryUserStore(users = DEMO_USERS) {
  return {
    kind: "memory",
    async findByLogin(role, loginId) {
      const found = users.find(u => u.role === role && u.loginId === String(loginId).toLowerCase());
      return found ? { userId: found.userId, role: found.role, loginId: found.loginId, passwordHash: found.passwordHash, isActive: true } : null;
    }
  };
}

// ---------- Supabase store ----------

// Which table holds which side. The sign-in screen's "A customer / Bank staff" choice picks the
// table, so a customer's ID is never even looked up among the staff.
const TABLES = { customer: "customer_users", staff: "staff_users" };

// Talks to Supabase's REST address (PostgREST) with plain fetch, so there is nothing extra to install.
// The SECRET key is only ever used here, on the server. It must never reach the browser.
function createSupabaseUserStore({ url, secretKey, fetchImpl = fetch, timeoutMs = 5000 }) {
  const base = url.replace(/\/+$/, "") + "/rest/v1";
  const headers = { apikey: secretKey, Accept: "application/json" };
  // The older "service_role" keys are JWTs and also go in Authorization. The newer "sb_secret_..." keys don't.
  if (/^eyJ/.test(secretKey)) headers.Authorization = "Bearer " + secretKey;

  return {
    kind: "supabase",

    async findByLogin(role, loginId) {
      const table = TABLES[role];
      if (!table) return null;
      // IDs are stored in lowercase (the database enforces it), so we ask for the lowercase version.
      // The ID was already checked to be only letters, numbers and . _ - by auth.js.
      const query = `select=id,user_id,user_password&user_id=eq.${encodeURIComponent(String(loginId).toLowerCase())}&limit=1`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);   // don't wait forever
      let response;
      try {
        response = await fetchImpl(`${base}/${table}?${query}`, { headers, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 200);
        let hint = "";
        if (response.status === 401 || response.status === 403) hint = " (check SUPABASE_SECRET_KEY in server/.env)";
        if (response.status === 404) hint = ` (is the table ${table} there, and is the public schema exposed in Supabase's Data API settings?)`;
        throw new Error(`Supabase answered ${response.status} for ${table}${hint}: ${detail}`);
      }
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.length) return null;
      const row = rows[0];
      return { userId: row.id, role, loginId: row.user_id, passwordHash: row.user_password, isActive: true };
    }
  };
}

// Picks the store: Supabase if it is set up in server/.env, otherwise the built-in demo accounts
function createUserStore(env = process.env) {
  if (env.SUPABASE_URL && env.SUPABASE_SECRET_KEY) {
    console.log(`Sign-in uses Supabase (${env.SUPABASE_URL}).`);
    return createSupabaseUserStore({ url: env.SUPABASE_URL, secretKey: env.SUPABASE_SECRET_KEY });
  }
  if (env.SUPABASE_URL || env.SUPABASE_SECRET_KEY) {
    console.warn("Supabase is only half set up: server/.env needs BOTH SUPABASE_URL and SUPABASE_SECRET_KEY. Using the built-in demo accounts for now.");
  } else {
    console.log("Sign-in uses the built-in demo accounts (no database). To use Supabase, fill in server/.env (see database/README.md).");
  }
  return createMemoryUserStore();
}

module.exports = { createUserStore, createMemoryUserStore, createSupabaseUserStore, TABLES };
