"use strict";

// Verify the Caller: the six demo accounts.
// Owner: Wei Ye
// Used when the server runs WITHOUT SQL Server, so everyone on the team can still sign in. They are
// the same six accounts as in database/02-seed-users.sql (a test checks the two lists match).
// Only hashes are kept here, never the passwords themselves. The demo passwords are in
// database/README.md, and "Fill in demo details" on the sign-in screen types the first one for you.
// To add or change an account: run  node scripts/hash-password.js "the password"  and paste the result.

const DEMO_USERS = [
  { userId: 1, role: "customer", loginId: "customer01", passwordHash: "scrypt$16384$8$1$29a96387a24eed0ce8ea2a976878dfa2$6aa48225d25673ae62f1776f7da392cce4b5abaa7d890a3394d18ceb565b1b0d745f1a124519b2499e0a1dc9ca5084c2ef4480d00602a9bfe4aed68bb3dfe438" },
  { userId: 2, role: "customer", loginId: "customer02", passwordHash: "scrypt$16384$8$1$85fb1ad9c333c95bdf8f62cc27f3b6db$823cee9981171c2f1ca08234cd9b655a60a108bc95b2a165ae3a8bb27b7952c4f8064224d0cbb835e1a502d8dc6240f93272278fea47bea947c2ad7ec8f5625e" },
  { userId: 3, role: "customer", loginId: "customer03", passwordHash: "scrypt$16384$8$1$587837dac0a3f05eb084e45e3e7526fc$92eb827a91a464938e7c4c065337f20c4e2080fb73b30a3b15973de4e3d4ebb3ca214b4701f8dd599f576acae760a2e8b2188864d1390c1521c78ed23f845a7c" },
  { userId: 4, role: "staff", loginId: "staff01", passwordHash: "scrypt$16384$8$1$0fb545f33d54366c533971b5010a69e4$0614d4c7db28e68c149b0ccfe24936425da119dfbb2f7e98d39e62e0f49ebda96d4b45d24d4ace908c79ccfe819237258483fba54f9de7e2e2cd222334bdee48" },
  { userId: 5, role: "staff", loginId: "staff02", passwordHash: "scrypt$16384$8$1$e575ac019649fe012b5708fb1a352baf$8fe452a3e7eafe1f3fea307ddddb3eeefb0b75947eaf8c20a71728de4769c9037ed7ff1915d03d7c64f7e25322b97a0fbb42877590c4443f6ccdbdc3a6ae5c08" },
  { userId: 6, role: "staff", loginId: "staff03", passwordHash: "scrypt$16384$8$1$4207815ef18837cd4d3ffe354fafc52a$8322a9e677c3b1a6d477bdba2a2d351bbc5d3f274278678b953ad1b591b6923f68b0afc6eb54c212eb954aada1ee2afca66c0ca05c543d8420c0eeabfbbb3938" }
];

module.exports = { DEMO_USERS };
