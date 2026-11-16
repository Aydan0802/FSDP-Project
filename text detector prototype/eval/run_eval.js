"use strict";

// Scores the public English SMS datasets with the message checker and prints the results
// by source and by label, so we never quote only the best number.
// Run from inside "text detector prototype/":
//   node eval/run_eval.js                  the "dev" half (the half we may look at while writing rules)
//   node eval/run_eval.js --examples 15    also print 15 missed scams and 15 false alarms (dev only)
//   node eval/run_eval.js --split test     the untouched "test" half: run once, at the end
// Saves results/eval_<split>.csv (one row per message) and results/summary_<split>.json.

const fs = require("fs");
const path = require("path");
const { checkMessage } = require("../detector/checker.js");
const { loadAll } = require("../data_prep/load_datasets.js");

const RESULTS = path.join(__dirname, "..", "results");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const split = arg("--split", "dev");
const examples = Number(arg("--examples", 0));
if (!["dev", "test", "all"].includes(split)) throw new Error("--split must be dev, test or all");
if (examples && split !== "dev") {
  console.error("Examples are only printed for the dev half, so nobody tunes the rules on the test half.");
  process.exit(1);
}

// 95% Wilson interval: the range the true rate probably lies in, given how many messages we had
function wilson(k, n) {
  if (!n) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + z * z / n;
  const centre = (p + z * z / (2 * n)) / d;
  const half = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}
const pct = x => (100 * x).toFixed(1) + "%";
function rate(k, n) {
  if (!n) return "n/a";
  const [lo, hi] = wilson(k, n);
  return `${pct(k / n)} (${pct(lo)} to ${pct(hi)})`;
}
const isFlagged = r => r.risk !== "low";   // "medium" or "high"

// ---------- Score every message ----------
const all = loadAll();
const messages = split === "all" ? all : all.filter(m => m.split === split);
const rows = messages.map(m => {
  const r = checkMessage(m.text);
  return { ...m, risk: r.risk, type: r.type, score: r.score, confidence: r.confidence, lang: r.lang,
           rules: [...new Set(r.flags.map(f => f.rule))] };
});

// Mendeley reused some UCI messages, so the two sources overlap a little. Say how much.
const uciKeys = new Set(all.filter(m => m.source === "uci").map(m => m.key));
const overlap = all.filter(m => m.source === "mendeley" && uciKeys.has(m.key)).length;

// "mendeley_new" = the Mendeley messages that are NOT copies of UCI messages. They are the most
// independent check we have, and the most recent scams (UCI's spam is from around 2012).
const SOURCES = ["uci", "mendeley", "mendeley_new"];
const inSource = (r, source) => source === "mendeley_new"
  ? r.source === "mendeley" && !uciKeys.has(r.key)
  : r.source === source;
const LABELS = ["ham", "spam", "smishing"];
const out = [];
const print = line => { out.push(line); console.log(line); };

print(`# Message checker evaluation: ${split} half`);
print(`${rows.length} messages. ${overlap} Mendeley messages also appear in UCI (each source is reported on its own).`);
print("");

// ---------- Table 1: what the checker said, for each source and label ----------
print("## Results by source and label");
print("| Source | Label | Messages | Low | Medium | High | Medium or high |");
print("|---|---|---:|---:|---:|---:|---:|");
const byGroup = {};
for (const source of SOURCES) {
  for (const label of LABELS) {
    const g = rows.filter(r => inSource(r, source) && r.label === label);
    if (!g.length) continue;
    const count = risk => g.filter(r => r.risk === risk).length;
    byGroup[`${source}/${label}`] = { n: g.length, low: count("low"), medium: count("medium"), high: count("high") };
    print(`| ${source} | ${label} | ${g.length} | ${pct(count("low") / g.length)} | ${pct(count("medium") / g.length)} | ${pct(count("high") / g.length)} | ${rate(g.filter(isFlagged).length, g.length)} |`);
  }
}
print("");

// ---------- Table 2: scams caught and false alarms ----------
// "Caught" = scored medium or high. "False alarm" = a normal (ham) message scored medium or high.
// Precision depends on how many scams are in the mix, which in real life is far lower than here.
print("## Scams caught and false alarms (95% range in brackets)");
print("| Source | Scam label | Caught (medium or high) | Caught as high | Normal messages flagged (false alarms) | Flagged as high | Precision (medium or high) |");
print("|---|---|---:|---:|---:|---:|---:|");
const metrics = {};
for (const source of SOURCES) {
  const ham = rows.filter(r => inSource(r, source) && r.label === "ham");
  const falseAlarms = ham.filter(isFlagged).length;
  const falseHigh = ham.filter(r => r.risk === "high").length;
  for (const label of ["smishing", "spam"]) {
    const scams = rows.filter(r => inSource(r, source) && r.label === label);
    if (!scams.length) continue;
    const caught = scams.filter(isFlagged).length;
    const caughtHigh = scams.filter(r => r.risk === "high").length;
    const precision = caught + falseAlarms ? caught / (caught + falseAlarms) : 0;
    metrics[`${source}/${label}`] = { scams: scams.length, caught, caughtHigh, ham: ham.length, falseAlarms, falseHigh, precision };
    print(`| ${source} | ${label} | ${rate(caught, scams.length)} | ${rate(caughtHigh, scams.length)} | ${rate(falseAlarms, ham.length)} | ${rate(falseHigh, ham.length)} | ${pct(precision)} |`);
  }
}
print("");

// ---------- Table 3: which rules fire, on normal messages vs scams ----------
print("## How often each rule fires");
print("| Rule | On normal (ham) | On smishing | On spam |");
print("|---|---:|---:|---:|");
const ruleIds = [...new Set(rows.flatMap(r => r.rules))].sort();
const ruleCounts = {};
for (const id of ruleIds) {
  const share = label => {
    const g = rows.filter(r => r.label === label);
    return g.length ? g.filter(r => r.rules.includes(id)).length / g.length : 0;
  };
  ruleCounts[id] = { ham: share("ham"), smishing: share("smishing"), spam: share("spam") };
  print(`| ${id} | ${pct(share("ham"))} | ${pct(share("smishing"))} | ${pct(share("spam"))} |`);
}
print("");

// ---------- What kind of scam the flagged smishing messages were called ----------
// The datasets don't say the kind of scam, so this only shows what the checker guessed.
const flaggedSmishing = rows.filter(r => r.label === "smishing" && isFlagged(r));
const kinds = {};
for (const r of flaggedSmishing) kinds[r.type] = (kinds[r.type] || 0) + 1;
print("## Kinds the checker gave to flagged smishing messages (not checked: the data has no kind labels)");
print(Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ") || "none");
const langs = {};
for (const r of rows) langs[r.lang] = (langs[r.lang] || 0) + 1;
print(`Language the checker detected: ${Object.entries(langs).map(([k, n]) => `${k} ${n}`).join(", ")} (all messages are English)`);
print("");

// ---------- Examples to learn from (dev half only) ----------
if (examples) {
  const show = (title, list) => {
    console.log(`## ${title}`);
    for (const r of list.slice(0, examples)) console.log(`- [${r.source}/${r.label} ${r.risk} ${r.score}] ${r.text.slice(0, 160)}`);
    console.log("");
  };
  show("Missed smishing (scored low)", rows.filter(r => r.label === "smishing" && r.risk === "low"));
  show("Missed UCI spam (scored low)", rows.filter(r => r.source === "uci" && r.label === "spam" && r.risk === "low"));
  show("False alarms (normal messages scored medium or high)", rows.filter(r => r.label === "ham" && isFlagged(r)));
}

// ---------- Save ----------
fs.mkdirSync(RESULTS, { recursive: true });
const csvCell = v => `"${String(v).replace(/"/g, '""')}"`;
const csv = ["source,label,split,lang,risk,type,score,confidence,rules,text"]
  .concat(rows.map(r => [r.source, r.label, r.split, r.lang, r.risk, r.type, r.score, r.confidence, r.rules.join("|"), r.text].map(csvCell).join(",")));
fs.writeFileSync(path.join(RESULTS, `eval_${split}.csv`), csv.join("\n"), "utf8");
fs.writeFileSync(path.join(RESULTS, `summary_${split}.json`),
  JSON.stringify({ split, messages: rows.length, overlap, byGroup, metrics, ruleCounts, kinds, langs }, null, 2), "utf8");
fs.writeFileSync(path.join(RESULTS, `report_${split}.md`), out.join("\n"), "utf8");
console.log(`Saved results/eval_${split}.csv, results/summary_${split}.json and results/report_${split}.md`);
