"use strict";

// Scores the small hand-written test set (eval/synthetic_messages.json) by language.
// Run from inside "text detector prototype/":   node eval/run_synthetic.js
// The same team wrote these lines and the rules, so treat this as a smoke test that the
// Chinese and Malay rules work at all, NOT as real-world accuracy. Saves results/report_synthetic.md.

const fs = require("fs");
const path = require("path");
const { checkMessage } = require("../detector/checker.js");

const { messages } = JSON.parse(fs.readFileSync(path.join(__dirname, "synthetic_messages.json"), "utf8"));
const out = [];
const print = line => { out.push(line); console.log(line); };

print("# Hand-written test lines, by language (smoke test only)");
print("| Language | Scam lines | Caught (medium or high) | Caught as high | Right kind of scam | Normal lines | False alarms (medium or high) | Language detected right |");
print("|---|---:|---:|---:|---:|---:|---:|---:|");
const details = [];
for (const lang of ["en", "zh", "ms"]) {
  const lines = messages.filter(m => m.lang === lang).map(m => ({ ...m, r: checkMessage(m.text) }));
  const scams = lines.filter(m => m.label === "scam");
  const normal = lines.filter(m => m.label === "normal");
  const caught = scams.filter(m => m.r.risk !== "low");
  const high = scams.filter(m => m.r.risk === "high");
  const rightKind = caught.filter(m => m.r.type === m.type);
  const falseAlarms = normal.filter(m => m.r.risk !== "low");
  const langRight = lines.filter(m => m.r.lang === lang);
  print(`| ${lang} | ${scams.length} | ${caught.length}/${scams.length} | ${high.length}/${scams.length} | ${rightKind.length}/${caught.length} | ${normal.length} | ${falseAlarms.length}/${normal.length} | ${langRight.length}/${lines.length} |`);
  details.push(...lines);
}
print("");

// The teammate's Singapore-style lines from KakiGuard (eval/teammate_messages.json)
const team = JSON.parse(fs.readFileSync(path.join(__dirname, "teammate_messages.json"), "utf8")).messages
  .map(m => ({ ...m, lang: "en", r: checkMessage(m.text) }));
const tScams = team.filter(m => m.label === "scam"), tNormal = team.filter(m => m.label === "normal");
const tCaught = tScams.filter(m => m.r.risk !== "low");
const tTyped = tCaught.filter(m => m.type);   // only her community reports say the kind of scam
print("# Teammate's lines (KakiGuard), English, Singapore-style");
print("| Scam lines | Caught (medium or high) | Caught as high | Right kind of scam | Normal lines | False alarms |");
print("|---:|---:|---:|---:|---:|---:|");
print(`| ${tScams.length} | ${tCaught.length}/${tScams.length} | ${tScams.filter(m => m.r.risk === "high").length}/${tScams.length} | ${tTyped.filter(m => m.r.type === m.type).length}/${tTyped.length} | ${tNormal.length} | ${tNormal.filter(m => m.r.risk !== "low").length}/${tNormal.length} |`);
print("");
details.push(...team.map(m => ({ ...m, lang: "en-teammate" })));

print("## Every line");
for (const m of details) {
  const mark = (m.label === "scam") === (m.r.risk !== "low") ? "ok  " : "MISS";
  print(`- ${mark} [${m.lang} ${m.label}${m.label === "scam" ? "/" + m.type : ""}] -> ${m.r.risk} ${m.r.type} (${m.r.score} pts, lang ${m.r.lang}): ${m.text}`);
}

fs.mkdirSync(path.join(__dirname, "..", "results"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "..", "results", "report_synthetic.md"), out.join("\n"), "utf8");
