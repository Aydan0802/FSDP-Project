"use strict";

// Score the evaluation set and report, by condition and by source, how often an AI label was
// still found, and how often a picture without one was flagged (false alarms).
// Run from inside "image detector prototype/" (after eval/build_eval_set.py):
//   node eval/run_eval.js
// Reads data/eval/manifest.csv; writes results/eval/scores.csv and results/eval/summary.md.
// Runs in Node, so content credentials are read but their signature is not checked
// (the browser does that); this only changes confidence, not whether a label is found.

const fs = require("fs");
const path = require("path");
const { checkImage } = require("../detector/checker.js");

const HERE = path.join(__dirname, "..");
const OUT = path.join(HERE, "results", "eval");

// "Flagged" = the checker said the picture was made or changed with AI
const flagged = (r) => r.result === "likely" || r.result === "partial";

function readManifest() {
  const [header, ...lines] = fs.readFileSync(path.join(HERE, "data", "eval", "manifest.csv"), "utf8").trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.map(line => Object.fromEntries(line.split(",").map((v, i) => [cols[i], v])));
}

// "3/12 (25%)"
function rate(rows, test) {
  if (!rows.length) return "–";
  const n = rows.filter(test).length;
  return `${n}/${rows.length} (${Math.round((100 * n) / rows.length)}%)`;
}

function main() {
  const rows = readManifest().map(row => {
    const r = checkImage(fs.readFileSync(path.join(HERE, row.path)), { fileName: path.basename(row.path) });
    return { ...row, band: r.band, result: r.result, confidence: r.confidence, reasons: r.reasons.map(x => x.key).join(" ") };
  });
  fs.mkdirSync(OUT, { recursive: true });
  const cols = ["path", "file", "source", "label", "condition", "band", "result", "confidence", "reasons"];
  fs.writeFileSync(path.join(OUT, "scores.csv"), [cols.join(","), ...rows.map(r => cols.map(c => r[c]).join(","))].join("\n"));

  const conditions = [...new Set(rows.map(r => r.condition))];
  const sources = [...new Set(rows.map(r => r.source))];
  const lines = [];

  lines.push("### By condition", "",
    "| Condition | AI label found (made with AI) | AI label found (changed with AI) | False alarms (no label) | \"Be careful\" on no-label pictures |",
    "|---|---|---|---|---|");
  for (const c of conditions) {
    const here = rows.filter(r => r.condition === c);
    lines.push(`| ${c} | ${rate(here.filter(r => r.label === "ai"), flagged)} | ${rate(here.filter(r => r.label === "ai_edit"), flagged)} | ` +
      `${rate(here.filter(r => r.label === "none"), flagged)} | ${rate(here.filter(r => r.label === "none"), r => r.result === "uncertain")} |`);
  }

  // Two tables by source: pictures that carry a label (was it still found?), and pictures that
  // don't (were they wrongly flagged?). Sources with none of that kind are left out.
  const bySource = (title, keep) => {
    lines.push("", title, "", `| Source | ${conditions.join(" | ")} |`, `|---|${conditions.map(() => "---").join("|")}|`);
    for (const s of sources) {
      if (!rows.some(r => r.source === s && keep(r))) continue;
      const cells = conditions.map(c => rate(rows.filter(r => r.source === s && r.condition === c && keep(r)), flagged));
      lines.push(`| ${s} | ${cells.join(" | ")} |`);
    }
  };
  bySource("### By source: pictures WITH an AI label (how often it was still found)", r => r.label !== "none");
  bySource("### By source: pictures WITHOUT one (false alarms)", r => r.label === "none");

  lines.push("", "### Originals (document condition), one line each", "", "| File | Label | Result | Confidence |", "|---|---|---|---|");
  for (const r of rows.filter(r => r.condition === "document")) lines.push(`| ${r.file} | ${r.label} | ${r.result} | ${r.confidence} |`);

  const summary = lines.join("\n");
  fs.writeFileSync(path.join(OUT, "summary.md"), summary + "\n");
  console.log(summary);
  console.log(`\nScored ${rows.length} files. Wrote ${path.relative(HERE, OUT)}/scores.csv and summary.md`);
}

main();
