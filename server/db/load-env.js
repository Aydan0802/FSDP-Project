"use strict";

// Verify the Caller: reads server/.env.
// Owner: Wei Ye
// A .env file holds settings that are different on every computer (like the database password).
// It is NOT committed to Git, so each person has their own. This reads it, if it exists, and puts
// each line (NAME=value) into process.env. A setting already set in the terminal wins over the file.
// (Newer Node can do this itself with --env-file, but this works on Node 18 too.)

const fs = require("node:fs");
const path = require("node:path");

function loadEnv(file = path.join(__dirname, "..", ".env")) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    return false;   // no .env file: that is fine
  }
  text.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) return;
    let value = match[2];
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);   // "quoted" values
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  });
  return true;
}

module.exports = { loadEnv };
