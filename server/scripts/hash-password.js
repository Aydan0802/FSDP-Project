"use strict";

// Verify the Caller: makes a password hash for a new account.
// Owner: Wei Ye
// Usage (from the server folder):   node scripts/hash-password.js "the password"
// It prints a hash. Paste it into database/02-seed-users.sql (and server/db/demo-users.js).
// The password is only ever on your screen, never stored.

const { hashPassword } = require("../db/password.js");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "the password"');
  process.exit(1);
}
hashPassword(password).then(hash => console.log(hash));
