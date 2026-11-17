"use strict";

// Tests for sign-in: the password rules (auth.js), the six demo accounts, the Supabase store
// (against a pretend Supabase) and the SQL setup script.
// Owner: Wei Ye
// Run from the server folder:  npm test
// These need no internet and no real Supabase.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { createApp } = require("../app.js");
const { createMemoryUserStore, createSupabaseUserStore, createUserStore } = require("../db/user-store.js");
const { DEMO_USERS } = require("../db/demo-users.js");
const { hashPassword, verifyPassword } = require("../db/password.js");
const { createAuthService, MAX_FAILED_TRIES } = require("../auth.js");

const PASSWORDS = {
  customer01: "Demo#Cust01", customer02: "Demo#Cust02", customer03: "Demo#Cust03",
  staff01: "Demo#Staff01", staff02: "Demo#Staff02", staff03: "Demo#Staff03"
};

// Starts the real app on a free port with the given store, and gives back a tiny helper for calling it
async function startServer(t, store = createMemoryUserStore(), authOptions) {
  const app = createApp({ userStore: store, authOptions });
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)); });
  t.after(() => server.close());
  const base = `http://localhost:${server.address().port}`;
  async function post(url, body, cookie) {
    const res = await fetch(base + url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body)
    });
    return { res, data: await res.json().catch(() => ({})) };
  }
  return { base, post, store };
}

// A pretend Supabase: answers the same way Supabase's REST address would for customer_users and
// staff_users. It remembers every request so tests can check what the server asked for.
async function startFakeSupabase(t, { secretKey = "sb_secret_test", status = 200 } = {}) {
  const seen = [];
  const tables = {
    customer_users: DEMO_USERS.filter(u => u.role === "customer"),
    staff_users: DEMO_USERS.filter(u => u.role === "staff")
  };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://fake");
    seen.push({ path: url.pathname, query: url.search, headers: req.headers, method: req.method });
    if (status !== 200) { res.writeHead(status, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ message: "nope" })); }
    if (req.headers.apikey !== secretKey) { res.writeHead(401, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ message: "Invalid API key" })); }
    const table = url.pathname.replace("/rest/v1/", "");
    if (!tables[table]) { res.writeHead(404, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ message: "no such table" })); }
    if (req.method === "POST") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      if (tables[table].some(u => u.loginId === body.user_id)) {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ code: "23505", message: "duplicate key value violates unique constraint" }));
      }
      const created = { userId: tables[table].length + 100, loginId: body.user_id, passwordHash: body.user_password };
      tables[table].push(created);
      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify([{ id: created.userId, user_id: created.loginId, user_password: created.passwordHash }]));
    }
    const wanted = (url.searchParams.get("user_id") || "").replace(/^eq\./, "");
    const rows = tables[table].filter(u => u.loginId === wanted).map(u => ({ id: u.userId, user_id: u.loginId, user_password: u.passwordHash }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows));
  });
  await new Promise(resolve => server.listen(0, resolve));
  t.after(() => server.close());
  return { url: `http://localhost:${server.address().port}`, seen, secretKey, tables };
}

// ---------- Passwords ----------

test("a password hash checks out, and a wrong password does not", async () => {
  const hash = await hashPassword("correct horse");
  assert.match(hash, /^scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(await verifyPassword("correct horse", hash), true);
  assert.equal(await verifyPassword("correct horsf", hash), false);
  assert.equal(await verifyPassword("anything", "not a hash"), false);
});

test("two hashes of the same password differ (each has its own salt)", async () => {
  assert.notEqual(await hashPassword("same"), await hashPassword("same"));
});

test("the demo passwords really match the stored hashes", async () => {
  for (const user of DEMO_USERS) assert.equal(await verifyPassword(PASSWORDS[user.loginId], user.passwordHash), true, user.loginId);
});

test("the SQL setup script holds the same six accounts and hashes as the built-in list", () => {
  const sqlText = fs.readFileSync(path.join(__dirname, "..", "..", "database", "supabase-setup.sql"), "utf8");
  const found = [...sqlText.matchAll(/\('((?:customer|staff)\d+)', '(scrypt\$[^']+)'\)/g)].map(m => ({ loginId: m[1], passwordHash: m[2] }));
  assert.equal(found.length, 6);
  assert.deepEqual(found, DEMO_USERS.map(({ loginId, passwordHash }) => ({ loginId, passwordHash })));
});

// ---------- The sign-in rules (run against the built-in store) ----------

test("all six demo accounts sign in with their own password, on their own side", async t => {
  const { post } = await startServer(t);
  for (const user of DEMO_USERS) {
    const { res, data } = await post("/api/auth/login", { role: user.role, userId: user.loginId, password: PASSWORDS[user.loginId] });
    assert.equal(res.status, 200, user.loginId);
    assert.deepEqual(data, { ok: true, role: user.role, userId: user.loginId });
    assert.match(res.headers.get("set-cookie"), /vtc_session=.+HttpOnly/i);
  }
});

test("the IDs are not case sensitive, the passwords are", async t => {
  const { post } = await startServer(t);
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "CUSTOMER01", password: "Demo#Cust01" })).res.status, 200);
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "customer01", password: "demo#cust01" })).res.status, 401);
});

test("a wrong password is refused", async t => {
  const { post } = await startServer(t);
  const { res, data } = await post("/api/auth/login", { role: "staff", userId: "staff01", password: "nope" });
  assert.equal(res.status, 401);
  assert.deepEqual(data, { ok: false, error: "invalid" });
  assert.equal(res.headers.get("set-cookie"), null);
});

test("anything typed is refused: the old 'any ID and password works' is gone", async t => {
  const { post } = await startServer(t);
  for (const body of [
    { role: "customer", userId: "demo.customer", password: "demo" },
    { role: "staff", userId: "anything", password: "anything" },
    { role: "customer", userId: "customer01", password: "x" }
  ]) {
    assert.equal((await post("/api/auth/login", body)).res.status, 401);
  }
});

test("a customer can't sign in on the staff side, or the other way round", async t => {
  const { post } = await startServer(t);
  assert.equal((await post("/api/auth/login", { role: "staff", userId: "customer01", password: "Demo#Cust01" })).res.status, 401);
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "staff01", password: "Demo#Staff01" })).res.status, 401);
});

test("'no such ID' and 'wrong password' give exactly the same answer", async t => {
  const { post } = await startServer(t);
  const wrongPassword = await post("/api/auth/login", { role: "customer", userId: "customer01", password: "bad" });
  const noSuchId = await post("/api/auth/login", { role: "customer", userId: "nobody99", password: "bad" });
  assert.equal(wrongPassword.res.status, noSuchId.res.status);
  assert.deepEqual(wrongPassword.data, noSuchId.data);
});

test("badly formed requests are refused with 400", async t => {
  const { post } = await startServer(t);
  for (const body of [
    {}, { role: "customer" }, { role: "admin", userId: "customer01", password: "Demo#Cust01" },
    { role: "customer", userId: "cust'; DROP TABLE Users;--", password: "x" },
    { role: "customer", userId: "customer01&select=*", password: "x" },
    { role: "customer", userId: "customer01", password: "" },
    { role: "customer", userId: "customer01", password: "x".repeat(201) },
    { role: "customer", userId: ["customer01"], password: "x" }
  ]) {
    assert.equal((await post("/api/auth/login", body)).res.status, 400, JSON.stringify(body).slice(0, 40));
  }
});

test("five wrong passwords lock the account, even for the right password", async t => {
  const { post } = await startServer(t);
  for (let i = 0; i < MAX_FAILED_TRIES; i++) {
    assert.equal((await post("/api/auth/login", { role: "customer", userId: "customer02", password: "wrong" + i })).res.status, 401);
  }
  const locked = await post("/api/auth/login", { role: "customer", userId: "customer02", password: "Demo#Cust02" });
  assert.equal(locked.res.status, 423);
  assert.equal(locked.data.error, "locked");
  assert.ok(locked.data.minutes >= 1);
  // Other accounts are not affected
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "customer03", password: "Demo#Cust03" })).res.status, 200);
});

test("a lock runs out, and then the right password works again", async () => {
  let clock = new Date("2026-11-16T10:00:00Z");
  const auth = createAuthService(createMemoryUserStore(), { now: () => clock });
  for (let i = 0; i < MAX_FAILED_TRIES; i++) await auth.login("staff", "staff02", "wrong");
  assert.equal((await auth.login("staff", "staff02", "Demo#Staff02")).reason, "locked");
  clock = new Date(clock.getTime() + 6 * 60000);   // six minutes later
  assert.equal((await auth.login("staff", "staff02", "Demo#Staff02")).ok, true);
});

test("a right password in between resets the count of wrong ones", async t => {
  const { post } = await startServer(t);
  for (let i = 0; i < MAX_FAILED_TRIES - 1; i++) await post("/api/auth/login", { role: "staff", userId: "staff03", password: "wrong" });
  assert.equal((await post("/api/auth/login", { role: "staff", userId: "staff03", password: "Demo#Staff03" })).res.status, 200);
  for (let i = 0; i < MAX_FAILED_TRIES - 1; i++) await post("/api/auth/login", { role: "staff", userId: "staff03", password: "wrong" });
  assert.equal((await post("/api/auth/login", { role: "staff", userId: "staff03", password: "Demo#Staff03" })).res.status, 200);
});

test("a switched-off account can't sign in", async t => {
  const store = {
    kind: "test",
    async findByLogin(role, loginId) {
      const u = await createMemoryUserStore().findByLogin(role, loginId);
      return u && u.loginId === "customer01" ? { ...u, isActive: false } : u;
    }
  };
  const { post } = await startServer(t, store);
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "customer01", password: "Demo#Cust01" })).res.status, 401);
});

test("signing in gives a session: /me knows you, and /logout forgets you", async t => {
  const { base, post } = await startServer(t);
  assert.equal((await fetch(base + "/api/auth/me")).status, 401);
  const { res } = await post("/api/auth/login", { role: "staff", userId: "staff01", password: "Demo#Staff01" });
  const cookie = res.headers.get("set-cookie").split(";")[0];
  const me = await fetch(base + "/api/auth/me", { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { signedIn: true, role: "staff", userId: "staff01" });
  assert.equal((await post("/api/auth/logout", {}, cookie)).res.status, 200);
  assert.equal((await fetch(base + "/api/auth/me", { headers: { Cookie: cookie } })).status, 401);
});

test("a made-up session cookie is not accepted", async t => {
  const { base } = await startServer(t);
  const me = await fetch(base + "/api/auth/me", { headers: { Cookie: "vtc_session=" + "a".repeat(64) } });
  assert.equal(me.status, 401);
});

test("the server runs without a user store, and then there is no sign-in address", async t => {
  const app = createApp();
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)); });
  t.after(() => server.close());
  const res = await fetch(`http://localhost:${server.address().port}/api/auth/me`);
  assert.equal(res.status, 404);
});

// ---------- The Supabase store (against the pretend Supabase) ----------

test("Supabase: all six accounts sign in through the store, and a wrong password is refused", async t => {
  const fake = await startFakeSupabase(t);
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url, secretKey: fake.secretKey }));
  for (const user of DEMO_USERS) {
    const { res, data } = await post("/api/auth/login", { role: user.role, userId: user.loginId, password: PASSWORDS[user.loginId] });
    assert.equal(res.status, 200, user.loginId);
    assert.equal(data.role, user.role);
  }
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "customer01", password: "wrong" })).res.status, 401);
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "nobody99", password: "wrong" })).res.status, 401);
});

test("Supabase: the customer side only reads customer_users, the staff side only staff_users", async t => {
  const fake = await startFakeSupabase(t);
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url, secretKey: fake.secretKey }));
  await post("/api/auth/login", { role: "customer", userId: "customer01", password: "Demo#Cust01" });
  await post("/api/auth/login", { role: "staff", userId: "staff01", password: "Demo#Staff01" });
  assert.deepEqual(fake.seen.map(r => r.path), ["/rest/v1/customer_users", "/rest/v1/staff_users"]);
  // A customer ID typed on the staff side is looked up in staff_users, where it doesn't exist
  const wrongSide = await post("/api/auth/login", { role: "staff", userId: "customer01", password: "Demo#Cust01" });
  assert.equal(wrongSide.res.status, 401);
  assert.equal(fake.seen[2].path, "/rest/v1/staff_users");
});

test("Supabase: the request asks for one lowercase ID and sends the secret key as apikey", async t => {
  const fake = await startFakeSupabase(t);
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url + "/", secretKey: fake.secretKey }));
  await post("/api/auth/login", { role: "customer", userId: "CUSTOMER01", password: "Demo#Cust01" });
  const request = fake.seen[0];
  assert.match(request.query, /user_id=eq\.customer01/);
  assert.match(request.query, /limit=1/);
  assert.equal(request.headers.apikey, "sb_secret_test");
  assert.equal(request.headers.authorization, undefined);   // the new sb_secret_ keys aren't sent as a Bearer token
});

test("Supabase: an older JWT-style service_role key is also sent as a Bearer token", async t => {
  const jwtLike = "eyJhbGciOi.fake.key";
  const fake = await startFakeSupabase(t, { secretKey: jwtLike });
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url, secretKey: jwtLike }));
  assert.equal((await post("/api/auth/login", { role: "staff", userId: "staff01", password: "Demo#Staff01" })).res.status, 200);
  assert.equal(fake.seen[0].headers.authorization, "Bearer " + jwtLike);
});

test("Supabase: a wrong secret key means 503, and nobody gets in", async t => {
  const fake = await startFakeSupabase(t);
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url, secretKey: "sb_secret_WRONG" }));
  const quiet = t.mock.method(console, "error", () => {});
  const { res } = await post("/api/auth/login", { role: "customer", userId: "customer01", password: "Demo#Cust01" });
  assert.equal(res.status, 503);
  assert.match(quiet.mock.calls[0].arguments.join(" "), /SUPABASE_SECRET_KEY/);
});

test("Supabase: a missing table, a server error and an unreachable Supabase all mean 503", async t => {
  const quiet = t.mock.method(console, "error", () => {});
  const down = await startFakeSupabase(t, { status: 500 });
  const a = await startServer(t, createSupabaseUserStore({ url: down.url, secretKey: down.secretKey }));
  assert.equal((await a.post("/api/auth/login", { role: "customer", userId: "customer01", password: "Demo#Cust01" })).res.status, 503);

  const gone = await startFakeSupabase(t, { status: 404 });
  const b = await startServer(t, createSupabaseUserStore({ url: gone.url, secretKey: gone.secretKey }));
  assert.equal((await b.post("/api/auth/login", { role: "customer", userId: "customer01", password: "Demo#Cust01" })).res.status, 503);

  // Nothing is listening at all
  const c = await startServer(t, createSupabaseUserStore({ url: "http://localhost:9", secretKey: "x", timeoutMs: 1500 }));
  assert.equal((await c.post("/api/auth/login", { role: "staff", userId: "staff01", password: "Demo#Staff01" })).res.status, 503);
  assert.ok(quiet.mock.callCount() >= 3);
});

test("which store is used depends on the settings", () => {
  const log = console.log, warn = console.warn;
  console.log = () => {}; console.warn = () => {};
  try {
    assert.equal(createUserStore({}).kind, "memory");
    assert.equal(createUserStore({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SECRET_KEY: "k" }).kind, "supabase");
    assert.equal(createUserStore({ SUPABASE_URL: "https://x.supabase.co" }).kind, "memory");   // half set up: falls back, with a warning
  } finally { console.log = log; console.warn = warn; }
});

// ---------- Sign up ----------

test("sign up: a new customer is made, signed in, and can sign in again later", async t => {
  const { post, base } = await startServer(t);
  const { res, data } = await post("/api/auth/signup", { userId: "Mei.Lin_88", password: "Blue-Kettle-42" });
  assert.equal(res.status, 201);
  assert.deepEqual(data, { ok: true, role: "customer", userId: "mei.lin_88" });
  const cookie = res.headers.get("set-cookie").split(";")[0];
  const me = await (await fetch(base + "/api/auth/me", { headers: { Cookie: cookie } })).json();
  assert.equal(me.role, "customer");
  const again = await post("/api/auth/login", { role: "customer", userId: "mei.lin_88", password: "Blue-Kettle-42" });
  assert.equal(again.res.status, 200);
  // and a customer account never works on the staff side
  assert.equal((await post("/api/auth/login", { role: "staff", userId: "mei.lin_88", password: "Blue-Kettle-42" })).res.status, 401);
});

test("sign up: only a hash is stored, never the password", async t => {
  const store = createMemoryUserStore();
  const { post } = await startServer(t, store);
  await post("/api/auth/signup", { userId: "hash-check", password: "Blue-Kettle-42" });
  const row = await store.findByLogin("customer", "hash-check");
  assert.match(row.passwordHash, /^scrypt\$/);
  assert.ok(!row.passwordHash.includes("Blue-Kettle-42"));
});

test("sign up: a taken ID is refused (demo accounts, earlier sign-ups, and IDs kept for the bank)", async t => {
  const { post } = await startServer(t);
  assert.equal((await post("/api/auth/signup", { userId: "customer01", password: "Blue-Kettle-42" })).res.status, 409);
  assert.equal((await post("/api/auth/signup", { userId: "CUSTOMER01", password: "Blue-Kettle-42" })).res.status, 409);
  assert.equal((await post("/api/auth/signup", { userId: "staff99", password: "Blue-Kettle-42" })).res.status, 409);
  assert.equal((await post("/api/auth/signup", { userId: "adminjoe", password: "Blue-Kettle-42" })).res.status, 409);
  assert.equal((await post("/api/auth/signup", { userId: "fresh-one", password: "Blue-Kettle-42" })).res.status, 201);
  assert.equal((await post("/api/auth/signup", { userId: "fresh-one", password: "Other-Kettle-77" })).res.status, 409);
  // the original account still has its original password
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "customer01", password: "Demo#Cust01" })).res.status, 200);
});

test("sign up: bad IDs and weak passwords are refused with the reason", async t => {
  const { post } = await startServer(t);
  const cases = [
    [{ userId: "abc", password: "Blue-Kettle-42" }, "id"],
    [{ userId: "has space", password: "Blue-Kettle-42" }, "id"],
    [{ userId: "-leading", password: "Blue-Kettle-42" }, "id"],
    [{ userId: "x".repeat(31), password: "Blue-Kettle-42" }, "id"],
    [{ userId: "okay-id", password: "short" }, "short"],
    [{ userId: "okay-id", password: "xx-okay-id-xx" }, "same-as-id"],
    [{ userId: "okay-id", password: "password1" }, "common"],
    [{ userId: "okay-id", password: "12345678" }, "common"]
  ];
  for (const [body, problem] of cases) {
    const { res, data } = await post("/api/auth/signup", body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(data.problem, problem, JSON.stringify(body));
  }
  assert.equal((await post("/api/auth/signup", {})).res.status, 400);
  assert.equal((await post("/api/auth/signup", { userId: 5, password: {} })).res.status, 400);
});

test("sign up: one computer can only make a few accounts an hour", async t => {
  const { post } = await startServer(t, createMemoryUserStore(), { maxSignupsPerHour: 3 });
  for (let i = 1; i <= 3; i++) assert.equal((await post("/api/auth/signup", { userId: "bulk-user-" + i, password: "Blue-Kettle-42" })).res.status, 201);
  assert.equal((await post("/api/auth/signup", { userId: "bulk-user-4", password: "Blue-Kettle-42" })).res.status, 429);
});

test("sign up (memory store): a sign-up never changes the shared demo list", async () => {
  const before = DEMO_USERS.length;
  const store = createMemoryUserStore();
  await store.createUser("customer", "newcomer", "scrypt$x");
  assert.equal(DEMO_USERS.length, before);
  assert.equal((await createMemoryUserStore().findByLogin("customer", "newcomer")), null);
});

test("Supabase: sign up adds a row to customer_users only, with a lowercase ID and a hash", async t => {
  const fake = await startFakeSupabase(t);
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url, secretKey: fake.secretKey }));
  const { res } = await post("/api/auth/signup", { userId: "Sam.Tan", password: "Blue-Kettle-42" });
  assert.equal(res.status, 201);
  const inserts = fake.seen.filter(r => r.method === "POST");
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].path, "/rest/v1/customer_users");
  assert.equal(fake.tables.customer_users.at(-1).loginId, "sam.tan");
  assert.match(fake.tables.customer_users.at(-1).passwordHash, /^scrypt\$/);
  assert.equal(fake.tables.staff_users.length, 3);
  assert.equal((await post("/api/auth/login", { role: "customer", userId: "sam.tan", password: "Blue-Kettle-42" })).res.status, 200);
});

test("Supabase: if the database says the ID is a duplicate (a race), the answer is 'taken', not an error", async t => {
  const fake = await startFakeSupabase(t);
  const store = createSupabaseUserStore({ url: fake.url, secretKey: fake.secretKey });
  // Skip the "does it exist?" look-up, as if two people pressed Create at the same moment
  store.findByLogin = async () => null;
  const { post } = await startServer(t, store);
  assert.equal((await post("/api/auth/signup", { userId: "customer01", password: "Blue-Kettle-42" })).res.status, 409);
});

test("Supabase: sign up with a wrong key means 503", async t => {
  const quiet = t.mock.method(console, "error", () => {});
  const fake = await startFakeSupabase(t);
  const { post } = await startServer(t, createSupabaseUserStore({ url: fake.url, secretKey: "wrong-key" }));
  assert.equal((await post("/api/auth/signup", { userId: "someone-new", password: "Blue-Kettle-42" })).res.status, 503);
  assert.ok(quiet.mock.callCount() >= 1);
});
