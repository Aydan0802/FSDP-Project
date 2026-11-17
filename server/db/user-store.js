"use strict";

// Verify the Caller: where the user accounts are kept.
// Owner: Wei Ye
// The sign-in code (auth.js) never talks to a database directly. It asks a "user store" one question:
//   findByLogin(role, loginId)               the account, or null if there is no such account for that side
//   createUser(role, loginId, passwordHash)  adds an account (used by sign up). Throws an error with
//                                            code "USER_EXISTS" if that ID is already taken.
// An account looks like:  { userId, role, loginId, passwordHash, isActive }
// There are two stores:
//   Supabase     used when SUPABASE_URL and SUPABASE_SECRET_KEY are set in server/.env
//                (customers are in the table customer_users, staff in staff_users)
//   built-in     the six demo accounts kept in memory, so the team can sign in without Supabase
// Both give the same answers for the same six accounts, and the tests check the sign-in rules
// against both (the Supabase one against a pretend Supabase).

const { DEMO_USERS } = require("./demo-users.js");

// ---------- Built-in store (no database) ----------

// New sign-ups are kept in memory too, so they disappear when the server restarts.
function createMemoryUserStore(users = DEMO_USERS) {
  const accounts = users.slice();   // a copy, so sign-ups never change the shared demo list
  return {
    kind: "memory",

    async findByLogin(role, loginId) {
      const found = accounts.find(u => u.role === role && u.loginId === String(loginId).toLowerCase());
      return found ? { userId: found.userId, role: found.role, loginId: found.loginId, passwordHash: found.passwordHash, isActive: true } : null;
    },

    async createUser(role, loginId, passwordHash) {
      const id = String(loginId).toLowerCase();
      if (accounts.some(u => u.role === role && u.loginId === id)) throw userExists();
      const created = { userId: accounts.reduce((max, u) => Math.max(max, u.userId), 0) + 1, role, loginId: id, passwordHash };
      accounts.push(created);
      return { userId: created.userId };
    }
  };
}

// The error the stores throw when an ID is already taken (auth.js turns it into "that ID is taken")
function userExists() {
  const error = new Error("That ID is already taken.");
  error.code = "USER_EXISTS";
  return error;
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

  // Sends one request to Supabase and gives back the response, or throws a helpful error.
  // `expected` is the list of status codes that mean "it worked".
  async function send(table, query, init, expected) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);   // don't wait forever
    let response;
    try {
      response = await fetchImpl(`${base}/${table}${query}`, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (expected.includes(response.status)) return response;
    const detail = (await response.text().catch(() => "")).slice(0, 200);
    if (response.status === 409 && /23505/.test(detail)) throw userExists();   // "duplicate key": the ID is taken
    let hint = "";
    if (response.status === 401 || response.status === 403) hint = " (check SUPABASE_SECRET_KEY in server/.env)";
    if (response.status === 404) hint = ` (is the table ${table} there, and is the public schema exposed in Supabase's Data API settings?)`;
    throw new Error(`Supabase answered ${response.status} for ${table}${hint}: ${detail}`);
  }

  return {
    kind: "supabase",

    async findByLogin(role, loginId) {
      const table = TABLES[role];
      if (!table) return null;
      // IDs are stored in lowercase (the database enforces it), so we ask for the lowercase version.
      // The ID was already checked to be only letters, numbers and . _ - by auth.js.
      const query = `?select=id,user_id,user_password&user_id=eq.${encodeURIComponent(String(loginId).toLowerCase())}&limit=1`;
      const rows = await (await send(table, query, { headers }, [200])).json();
      if (!Array.isArray(rows) || !rows.length) return null;
      const row = rows[0];
      return { userId: row.id, role, loginId: row.user_id, passwordHash: row.user_password, isActive: true };
    },

    // Adds one row. The unique index from database/supabase-setup.sql is what really stops two
    // people taking the same ID at the same moment: the second insert is refused (409, code 23505).
    async createUser(role, loginId, passwordHash) {
      const table = TABLES[role];
      if (!table) throw new Error("Unknown side: " + role);
      if (await this.findByLogin(role, loginId)) throw userExists();
      const response = await send(table, "", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ user_id: String(loginId).toLowerCase(), user_password: passwordHash })
      }, [201]);
      const rows = await response.json();
      return { userId: Array.isArray(rows) && rows[0] ? rows[0].id : null };
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
