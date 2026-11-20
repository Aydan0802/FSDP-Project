"use strict";

// Verify the Caller: sign in (the server side).
// Owner: Wei Ye
// POST /api/auth/login    body { role, userId, password }  checks the account and password
// POST /api/auth/signup   body { userId, password }        makes a CUSTOMER account and signs it in
// GET  /api/auth/me       who is signed in on this browser
// POST /api/auth/logout   forgets this sign-in
// The sign-in screen (js/features/login.js) calls these. A correct ID and password for the picked
// side (customer or staff) gives a session cookie. Anything else is refused.
// Only customers can sign up. Staff accounts are made by the bank (see database/README.md), because
// if anyone could make a staff account, the staff pages would be open to everyone.
// The accounts live in a "user store" (db/user-store.js): Supabase, or the built-in demo accounts.
// Who is signed in is kept in a SIGNED cookie (see "Sessions" below), not in the server's memory,
// so it keeps working on Vercel, where every request can land on a fresh copy of the server.
// How many wrong passwords each account has had is still kept in memory, so on Vercel the lock
// can reset early. (A real bank would keep that in a database.)

const crypto = require("node:crypto");
const express = require("express");
const { hashPassword, verifyPassword } = require("./db/password.js");

const MAX_FAILED_TRIES = 5;     // wrong passwords in a row before the account is locked
const LOCK_MINUTES = 5;         // how long the lock lasts
const SESSION_HOURS = 8;        // how long a sign-in stays valid
const COOKIE_NAME = "vtc_session";

const ROLES = ["customer", "staff"];

// Rules for a new account
const NEW_ID = /^[a-z0-9][a-z0-9._-]{3,29}$/;   // 4 to 30 characters: lowercase letters, numbers and . _ -
const RESERVED_PREFIXES = ["admin", "staff", "root", "ocbc", "bank", "demo", "system"];   // kept for the bank
const MIN_PASSWORD = 8;
const COMMON_PASSWORDS = ["password", "password1", "passw0rd", "12345678", "123456789", "1234567890", "qwerty123", "qwertyui", "11111111", "iloveyou", "letmein1", "welcome1", "abc12345", "admin123"];
const MAX_SIGNUPS_PER_HOUR = 10;   // per computer, so nobody can fill the database with junk accounts

// ---------- The sign-in rules (no web code in here, so they are easy to test) ----------

function createAuthService(store, { now = () => new Date() } = {}) {
  const failures = new Map();   // "staff:staff01" -> { count, lockedUntil }

  // A hash to compare against when the ID doesn't exist, so "no such ID" takes as long as "wrong
  // password" and the speed of the answer doesn't tell anyone which IDs are real.
  let dummyHash = null;
  async function burnTime(password) {
    if (!dummyHash) dummyHash = await hashPassword("not-a-real-password");
    await verifyPassword(password, dummyHash);
  }

  // Returns { ok: true, user } or { ok: false, reason: "invalid" | "locked", minutes? }
  // "invalid" covers every other failure (no such ID, wrong password, wrong side, switched-off
  // account) on purpose: the answer is the same, so it reveals nothing about which IDs exist.
  async function login(role, loginId, password) {
    const user = await store.findByLogin(role, loginId);

    if (!user || user.isActive === false || user.role !== role) {
      await burnTime(password);
      return { ok: false, reason: "invalid" };
    }

    const key = `${role}:${user.loginId}`;
    const state = failures.get(key);
    if (state && state.lockedUntil) {
      if (state.lockedUntil > now()) {
        return { ok: false, reason: "locked", minutes: Math.max(1, Math.ceil((state.lockedUntil - now()) / 60000)) };
      }
      failures.delete(key);   // the lock ran out: start fresh
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const count = ((failures.get(key) || {}).count || 0) + 1;
      failures.set(key, { count, lockedUntil: count >= MAX_FAILED_TRIES ? new Date(now().getTime() + LOCK_MINUTES * 60000) : null });
      return { ok: false, reason: "invalid" };
    }

    failures.delete(key);   // a right password forgets the wrong ones
    return { ok: true, user: { userId: user.userId, role: user.role, loginId: user.loginId } };
  }

  // Makes a customer account. Returns { ok: true, user }, or { ok: false, reason, problem? } where
  // reason is "invalid" (problem: "id", "short", "same-as-id" or "common") or "taken".
  async function signup(loginId, password) {
    const id = String(loginId).trim().toLowerCase();
    if (!NEW_ID.test(id)) return { ok: false, reason: "invalid", problem: "id" };
    if (password.length < MIN_PASSWORD) return { ok: false, reason: "invalid", problem: "short" };
    if (password.toLowerCase().includes(id)) return { ok: false, reason: "invalid", problem: "same-as-id" };
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) return { ok: false, reason: "invalid", problem: "common" };
    if (RESERVED_PREFIXES.some(prefix => id.startsWith(prefix))) return { ok: false, reason: "taken" };

    const passwordHash = await hashPassword(password);   // only the hash is ever stored
    try {
      const created = await store.createUser("customer", id, passwordHash);
      return { ok: true, user: { userId: created.userId, role: "customer", loginId: id } };
    } catch (error) {
      if (error.code === "USER_EXISTS") return { ok: false, reason: "taken" };
      throw error;
    }
  }

  return { login, signup };
}

// ---------- The web part ----------

// Reads one cookie from the request (we don't need a whole cookie library for one cookie)
function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index > -1 && part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return "";
}

// ---------- Sessions: signed cookies ----------
// The cookie itself says who you are and until when, plus a signature: an HMAC-SHA256 of those
// words made with a secret only the server knows. Any copy of the server can check it, and a
// cookie someone made up or changed (say, "role":"staff") fails the check.
// The secret: SESSION_SECRET if it is set; otherwise one worked out from SUPABASE_SECRET_KEY
// (already set on Vercel, so every copy of the server gets the same one, and the key itself can't
// be worked back out from it); otherwise a random one, which is fine for one server on a laptop.
function sessionSecret(options) {
  if (options.sessionSecret) return options.sessionSecret;
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.SUPABASE_SECRET_KEY) {
    return crypto.createHash("sha256").update("pause-and-prove sessions:" + process.env.SUPABASE_SECRET_KEY).digest();
  }
  return crypto.randomBytes(32);
}

function createAuthRouter(store, options = {}) {
  const router = express.Router();
  const auth = createAuthService(store, options);
  const secret = sessionSecret(options);
  const signedOut = new Map();   // session id -> expires: sessions signed out on THIS copy of the server
  const signups = new Map();    // computer address -> times of its recent sign-ups
  const maxSignups = options.maxSignupsPerHour || MAX_SIGNUPS_PER_HOUR;

  // True if this computer may make another account right now. Counts one each time it says yes.
  function allowSignup(address) {
    const hourAgo = Date.now() - 3600 * 1000;
    const recent = (signups.get(address) || []).filter(time => time > hourAgo);
    if (recent.length >= maxSignups) { signups.set(address, recent); return false; }
    recent.push(Date.now());
    signups.set(address, recent);
    return true;
  }

  const sign = text => crypto.createHmac("sha256", secret).update(text).digest("base64url");

  // The session in the cookie, or null if there is none, it was changed, it ran out or it was signed out
  function sessionFor(req) {
    const [words, signature] = readCookie(req, COOKIE_NAME).split(".");
    if (!words || !signature) return null;
    const expected = Buffer.from(sign(words));
    const given = Buffer.from(signature);
    // timingSafeEqual takes the same time however much matches, so timing gives nothing away
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    let s;
    try {
      s = JSON.parse(Buffer.from(words, "base64url").toString("utf8"));
    } catch (error) {
      return null;
    }
    if (!s || typeof s.expires !== "number" || s.expires < Date.now() || signedOut.has(s.id)) return null;
    return s;   // { id, userId, role, loginId, expires }
  }

  function startSession(res, user) {
    const session = {
      id: crypto.randomBytes(16).toString("hex"),   // so one session can be signed out
      userId: user.userId,
      role: user.role,
      loginId: user.loginId,
      expires: Date.now() + SESSION_HOURS * 3600 * 1000
    };
    const words = Buffer.from(JSON.stringify(session)).toString("base64url");
    res.cookie(COOKIE_NAME, `${words}.${sign(words)}`, {
      httpOnly: true,            // page scripts can't read it
      sameSite: "strict",        // other websites can't use it
      path: "/",
      maxAge: SESSION_HOURS * 3600 * 1000
    });
  }

  router.post("/login", async (req, res) => {
    const { role, userId, password } = req.body || {};
    const clean = typeof role === "string" && ROLES.includes(role)
      && typeof userId === "string" && /^[A-Za-z0-9._-]{1,30}$/.test(userId)
      && typeof password === "string" && password.length >= 1 && password.length <= 200;
    if (!clean) return res.status(400).json({ ok: false, error: "invalid" });

    let result;
    try {
      result = await auth.login(role, userId, password);
    } catch (error) {
      console.error("Sign-in failed because of a server or database problem:", error.message);
      return res.status(503).json({ ok: false, error: "unavailable" });
    }

    if (result.ok) {
      startSession(res, result.user);
      return res.json({ ok: true, role: result.user.role, userId: result.user.loginId });
    }
    if (result.reason === "locked") return res.status(423).json({ ok: false, error: "locked", minutes: result.minutes });
    return res.status(401).json({ ok: false, error: "invalid" });
  });

  router.post("/signup", async (req, res) => {
    const { userId, password } = req.body || {};
    if (typeof userId !== "string" || userId.length > 60 || typeof password !== "string" || password.length < 1 || password.length > 200) {
      return res.status(400).json({ ok: false, error: "invalid", problem: "id" });
    }
    if (!allowSignup(req.ip)) return res.status(429).json({ ok: false, error: "too-many" });

    let result;
    try {
      result = await auth.signup(userId, password);
    } catch (error) {
      console.error("Sign up failed because of a server or database problem:", error.message);
      return res.status(503).json({ ok: false, error: "unavailable" });
    }

    if (result.ok) {
      startSession(res, result.user);   // a new customer is signed in straight away
      return res.status(201).json({ ok: true, role: result.user.role, userId: result.user.loginId });
    }
    if (result.reason === "taken") return res.status(409).json({ ok: false, error: "taken" });
    return res.status(400).json({ ok: false, error: "invalid", problem: result.problem });
  });

  router.get("/me", (req, res) => {
    const session = sessionFor(req);
    if (!session) return res.status(401).json({ signedIn: false });
    res.json({ signedIn: true, role: session.role, userId: session.loginId });
  });

  // Signing out deletes the cookie from the browser. This copy of the server also remembers the
  // session as signed out until it would have run out, in case the old cookie is sent again.
  router.post("/logout", (req, res) => {
    const session = sessionFor(req);
    for (const [id, expires] of signedOut) if (expires < Date.now()) signedOut.delete(id);   // tidy up old ones
    if (session) signedOut.set(session.id, session.expires);
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.json({ ok: true });
  });

  // For later: protect any other route, for example  app.get("/api/risk/cases", router.requireRole("staff"), ...)
  router.requireRole = role => (req, res, next) => {
    const session = sessionFor(req);
    if (!session) return res.status(401).json({ error: "Please sign in." });
    if (session.role !== role) return res.status(403).json({ error: "Not allowed." });
    req.session = session;
    next();
  };

  return router;
}

module.exports = { createAuthService, createAuthRouter, MAX_FAILED_TRIES, LOCK_MINUTES };
