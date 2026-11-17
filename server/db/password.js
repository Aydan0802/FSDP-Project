"use strict";

// Verify the Caller: password hashing.
// Owner: Wei Ye
// We never store a password, only a "hash" of it: a scrambled version that can't be turned back
// into the password. To check a sign-in, we scramble what was typed the same way and compare.
// Each password gets its own random "salt", so two people with the same password still end up
// with different hashes.
// A hash looks like:  scrypt$16384$8$1$<salt in hex>$<hash in hex>
// scrypt is slow on purpose, which makes guessing passwords by brute force very expensive.
// It comes with Node, so there is nothing extra to install.

const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);

const COST = 16384;     // how much work one check takes (N)
const BLOCK = 8;        // r
const PARALLEL = 1;     // p
const KEY_LENGTH = 64;  // bytes in the finished hash

// Turns a password into a hash string. Pass your own saltHex only if you need the same result twice.
async function hashPassword(password, saltHex = crypto.randomBytes(16).toString("hex")) {
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH, { N: COST, r: BLOCK, p: PARALLEL });
  return `scrypt$${COST}$${BLOCK}$${PARALLEL}$${saltHex}$${key.toString("hex")}`;
}

// True only if the password matches the stored hash. Never throws for a badly formed hash.
async function verifyPassword(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, cost, block, parallel, saltHex, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  if (!expected.length) return false;
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, { N: Number(cost), r: Number(block), p: Number(parallel) });
  // timingSafeEqual takes the same time however many characters match, so the time can't leak hints
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
