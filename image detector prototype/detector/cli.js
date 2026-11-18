"use strict";

// Check image files from the command line (run from inside "image detector prototype/"):
//   node detector/cli.js path/to/image.jpg [more images ...]
// Prints the verdict, band, confidence and reasons for each file.
// Here the content credentials' signature is NOT checked (that needs the browser's c2pa.js),
// so credentials count like an ordinary label and confidence is one level lower than on the website.

const fs = require("fs");
const path = require("path");
const { checkImage } = require("./checker.js");

const files = process.argv.slice(2);
if (!files.length) {
  console.log("Usage: node detector/cli.js path/to/image.jpg [more images ...]");
  process.exit(1);
}

for (const file of files) {
  const result = checkImage(fs.readFileSync(file), { fileName: path.basename(file) });
  const found = result.details.blocks.map(b => b.kind).join(", ") || "none";
  console.log(`\n${file}`);
  console.log(`  ${result.verdict}`);
  console.log(`  band ${result.band}  (website: ${result.result})  confidence ${result.confidence}`);
  console.log(`  file type ${result.details.format}; details blocks: ${found}`);
  for (const line of result.text) console.log(`  - ${line}`);
}
