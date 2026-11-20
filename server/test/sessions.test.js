"use strict";

// Tests for signed session cookies (server/auth.js). Owner: Jose.
// Run from the server folder:  npm test
// On Vercel, one request can be answered by one copy of the server and the next by another.
// These tests start two separate servers with the same secret to check a sign-in survives that.

const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../app.js");
const { createMemoryUserStore } = require("../db/user-store.js");

async function startServer(sessionSecret) {
  const server = createApp({ userStore: createMemoryUserStore(), authOptions: { sessionSecret } }).listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function signIn(base, role, userId, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, userId, password })
  });
  assert.equal(res.status, 200);
  return res.headers.get("set-cookie").split(";")[0];   // "vtc_session=..."
}

const me = (base, cookie) => fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });

test("a sign-in made on one copy of the server works on another copy with the same secret", async t => {
  const a = await startServer("same-secret");
  const b = await startServer("same-secret");
  const other = await startServer("a-different-secret");
  t.after(() => { a.server.close(); b.server.close(); other.server.close(); });

  const cookie = await signIn(a.base, "staff", "staff01", "Demo#Staff01");
  const res = await me(b.base, cookie);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { signedIn: true, role: "staff", userId: "staff01" });

  // Staff-only lists work on the other copy too
  assert.equal((await fetch(`${b.base}/api/reports`, { headers: { Cookie: cookie } })).status, 200);

  // A server with another secret can't check the signature, so it doesn't trust the cookie
  assert.equal((await me(other.base, cookie)).status, 401);
});

test("a cookie someone edited (customer changed to staff) is refused", async t => {
  const a = await startServer("secret");
  t.after(() => a.server.close());

  const cookie = await signIn(a.base, "customer", "customer01", "Demo#Cust01");
  const [words, signature] = cookie.slice("vtc_session=".length).split(".");
  const session = JSON.parse(Buffer.from(words, "base64url").toString("utf8"));
  assert.equal(session.role, "customer");

  session.role = "staff";   // pretend to be staff, keeping the old signature
  const edited = `vtc_session=${Buffer.from(JSON.stringify(session)).toString("base64url")}.${signature}`;
  assert.equal((await me(a.base, edited)).status, 401);
  assert.equal((await fetch(`${a.base}/api/reports`, { headers: { Cookie: edited } })).status, 401);
});

test("a session that has run out is refused", async t => {
  const a = await startServer("secret");
  t.after(() => a.server.close());
  const cookie = await signIn(a.base, "customer", "customer01", "Demo#Cust01");
  const realNow = Date.now;
  Date.now = () => realNow() + 9 * 3600 * 1000;   // 9 hours later (sessions last 8)
  try {
    assert.equal((await me(a.base, cookie)).status, 401);
  } finally {
    Date.now = realNow;
  }
});
