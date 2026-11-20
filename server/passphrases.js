"use strict";

// Feature: Family passphrase API (hashed). /api/passphrases
// Owner: Jiliana
// Saves a safe word for each family member WITHOUT keeping the word itself: it is turned into a
// salted scrypt hash, which cannot be turned back into the word. The app can only check whether a
// word someone types matches, never show the word.
//
//   GET    /api/passphrases            the signed-in user's list: id, name, relationship, created_at
//   POST   /api/passphrases            { name, relationship, word }  saves a new one (word is hashed)
//   POST   /api/passphrases/:id/check  { word }  replies { match: true/false, triesLeft }
//   DELETE /api/passphrases/:id        removes one
//
// Never sent back to the browser: the salt and the hash. Never logged: the word.
// Storage: Supabase table "passphrases" when SUPABASE_URL and SUPABASE_SECRET_KEY (or the older
// SUPABASE_SERVICE_ROLE_KEY) are set, otherwise memory (lost when the server stops), so the demo and
// tests work without keys.

const crypto = require("crypto");
const express = require("express");

const SCRYPT = { N: 16384, r: 8, p: 1 };    // deliberately slow, so guessing words is slow too
const KEY_LENGTH = 64;
const MAX_TRIES = 5;                          // wrong checks allowed...
const LOCK_MINUTES = 15;                      // ...per this many minutes, per family member
const MIN_WORD = 3;

// "  Ondeh  Ondeh " becomes "ondeh ondeh", so small typing differences still match
function tidy(word) {
  return String(word).normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

function scrypt(word, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(tidy(word), salt, KEY_LENGTH, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

// A word becomes a random salt + a hash. Only these two are stored.
async function hashWord(word) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(word, salt);
  return { salt: salt.toString("base64"), hash: hash.toString("base64") };
}

// True if the word matches. timingSafeEqual takes the same time either way, so timing gives nothing away.
async function checkWord(word, saltBase64, hashBase64) {
  const expected = Buffer.from(hashBase64, "base64");
  const actual = await scrypt(word, Buffer.from(saltBase64, "base64"));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// ---------- Storage ----------

const PUBLIC_COLUMNS = "id, name, relationship, created_at";

// Talks to Supabase's REST address with plain fetch, like the sign-in store (db/user-store.js), so
// it works with the same SUPABASE_SECRET_KEY (the newer sb_secret_ keys too) and needs nothing extra
// installed. Each filter is "column=eq.value", which is how Supabase's REST address says "where =".
function supabaseStore(url, key, fetchImpl = fetch) {
  const address = `${url.replace(/\/+$/, "")}/rest/v1/passphrases`;
  const headers = { apikey: key, "Content-Type": "application/json", Accept: "application/json" };
  if (/^eyJ/.test(key)) headers.Authorization = "Bearer " + key;   // older keys also go here
  const columns = PUBLIC_COLUMNS.replace(/\s/g, "");
  const is = value => encodeURIComponent(`eq.${value}`);

  async function send(query, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);   // don't wait forever
    try {
      const res = await fetchImpl(address + query, { ...options, headers: { ...headers, ...options.headers }, signal: controller.signal });
      if (!res.ok) throw new Error(`Supabase answered ${res.status} for passphrases`);   // never the word
      return res.status === 204 ? null : res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    list: async userId => send(`?select=${columns}&user_id=${is(userId)}&order=created_at`),
    add: async row => (await send(`?select=${columns}`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }))[0],
    secret: async (userId, id) => (await send(`?select=salt,hash&user_id=${is(userId)}&id=${is(id)}`))[0] || null,
    remove: async (userId, id) => { await send(`?user_id=${is(userId)}&id=${is(id)}`, { method: "DELETE" }); }
  };
}

function memoryStore() {
  const rows = [];
  const publicPart = r => ({ id: r.id, name: r.name, relationship: r.relationship, created_at: r.created_at });
  return {
    list: async userId => rows.filter(r => r.user_id === userId).map(publicPart),
    add: async row => {
      const full = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      rows.push(full);
      return publicPart(full);
    },
    secret: async (userId, id) => {
      const r = rows.find(x => x.user_id === userId && x.id === id);
      return r ? { salt: r.salt, hash: r.hash } : null;
    },
    remove: async (userId, id) => {
      const i = rows.findIndex(x => x.user_id === userId && x.id === id);
      if (i >= 0) rows.splice(i, 1);
    }
  };
}

// ---------- Who is asking ----------

// DEMO ONLY: the browser says who is signed in with the X-User-Id header. Anyone could fake this,
// so when real sign-in is in, replace this with a check of the login token, e.g. for Supabase Auth:
//   const token = (req.get("Authorization") || "").replace("Bearer ", "");
//   const { data } = await db.auth.getUser(token);  return data.user ? data.user.id : "";
async function whoIsAsking(req) {
  return String(req.get("X-User-Id") || "").trim().slice(0, 100);
}

// ---------- Routes ----------

function passphraseRoutes() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const store = url && key ? supabaseStore(url, key) : memoryStore();
  const tries = new Map();   // "user:id" -> { count, resetAt }
  const router = express.Router();

  // Every route needs someone signed in
  router.use(async (req, res, next) => {
    req.userId = await whoIsAsking(req);
    if (!req.userId) return res.status(401).json({ error: "Please sign in first." });
    next();
  });

  // Turns a thrown error into a short reply, without logging anything the customer typed
  const safely = handler => async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error("Passphrase error:", err.message);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  };

  router.get("/", safely(async (req, res) => {
    res.json(await store.list(req.userId));
  }));

  router.post("/", safely(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const relationship = String(req.body.relationship || "").trim();
    const word = String(req.body.word || "");
    const problems = [];
    if (!name || name.length > 60) problems.push("name");
    if (!relationship || relationship.length > 40) problems.push("relationship");
    if (tidy(word).length < MIN_WORD || word.length > 100) problems.push("word");
    if (problems.length) return res.status(400).json({ error: "Please check the form.", problems });

    const { salt, hash } = await hashWord(word);
    const saved = await store.add({ user_id: req.userId, name, relationship, salt, hash });
    res.status(201).json(saved);
  }));

  router.post("/:id/check", safely(async (req, res) => {
    const id = String(req.params.id).slice(0, 64);
    const slot = `${req.userId}:${id}`;
    const now = Date.now();
    let t = tries.get(slot);
    if (!t || t.resetAt < now) t = { count: 0, resetAt: now + LOCK_MINUTES * 60000 };
    if (t.count >= MAX_TRIES) {
      return res.status(429).json({ error: "Too many tries.", minutesLeft: Math.ceil((t.resetAt - now) / 60000) });
    }

    const secret = await store.secret(req.userId, id);
    if (!secret) return res.status(404).json({ error: "Not found" });

    const match = await checkWord(String(req.body.word || ""), secret.salt, secret.hash);
    if (match) {
      tries.delete(slot);
    } else {
      t.count += 1;
      tries.set(slot, t);
    }
    res.json({ match, triesLeft: match ? MAX_TRIES : MAX_TRIES - t.count });
  }));

  router.delete("/:id", safely(async (req, res) => {
    await store.remove(req.userId, String(req.params.id).slice(0, 64));
    tries.delete(`${req.userId}:${req.params.id}`);
    res.status(204).end();
  }));

  return router;
}

module.exports = { passphraseRoutes, hashWord, checkWord, tidy };