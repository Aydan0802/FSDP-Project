"use strict";

// Reads the downloaded datasets (see download.js) into one list of messages:
//   { source, label, text, key, split }
//   source  "uci" | "mendeley"
//   label   "ham"      a normal message
//           "spam"     unwanted adverts and "you've won" messages (some are scams, many are just ads)
//           "smishing" SMS phishing: scams that try to steal details or money (Mendeley only)
//   key     the text in lower case with spaces tidied, used to spot the same message twice
//   split   "dev" or "test". We may look at "dev" messages while writing rules. "test" messages
//           are only scored, never read, so the test numbers show how the rules do on new messages.

const fs = require("fs");
const path = require("path");
const { DOWNLOADS, findFile } = require("./download.js");

// A small CSV reader: handles "quoted, fields" and "" inside quotes
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function keyOf(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// FNV-1a: a simple, well-known hash. The same text always lands in the same split,
// so a message that appears in both datasets can't be in "dev" once and "test" once.
function splitOf(key) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 2 === 0 ? "dev" : "test";
}

function need(folder, fileName) {
  const file = findFile(path.join(DOWNLOADS, folder), fileName);
  if (!file) throw new Error(`${fileName} not found. Run "node data_prep/download.js" first.`);
  return file;
}

// UCI: one message per line, "label<TAB>text"
function loadUci() {
  const lines = fs.readFileSync(need("uci_sms_spam", "SMSSpamCollection"), "utf8").split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    out.push({ source: "uci", label: line.slice(0, tab).trim().toLowerCase(), text: line.slice(tab + 1) });
  }
  return out;
}

// Mendeley: CSV with a header row LABEL,TEXT,URL,EMAIL,PHONE
function loadMendeley() {
  const rows = parseCsv(fs.readFileSync(need("mendeley_smishing", "Dataset_5971.csv"), "utf8"));
  const header = rows.shift().map(h => h.trim().toUpperCase());
  const labelAt = header.indexOf("LABEL"), textAt = header.indexOf("TEXT");
  return rows
    .filter(r => r.length > textAt && r[textAt].trim())
    .map(r => ({ source: "mendeley", label: r[labelAt].trim().toLowerCase(), text: r[textAt] }));
}

function loadAll() {
  return [...loadUci(), ...loadMendeley()].map(m => {
    const key = keyOf(m.text);
    return { ...m, key, split: splitOf(key) };
  });
}

module.exports = { loadAll, loadUci, loadMendeley, parseCsv, keyOf, splitOf };
