"use strict";

// Downloads the two public English SMS datasets used to test the message checker.
// Run from inside "text detector prototype/":   node data_prep/download.js
//
// Both datasets are small (under 1 MB together) and licensed CC BY 4.0 (see CITATIONS.md).
// They are saved to downloads/ which git ignores: we never commit datasets.
// Each dataset gets its own empty folder, and we only read the text files inside.
// Nothing downloaded is ever run.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DOWNLOADS = path.join(__dirname, "..", "downloads");

const DATASETS = [
  {
    name: "uci_sms_spam",
    // UCI SMS Spam Collection (Almeida & Gomez Hidalgo, 2011)
    url: "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip",
    expectFile: "SMSSpamCollection"
  },
  {
    name: "mendeley_smishing",
    // SMS Phishing Dataset for Machine Learning and Pattern Recognition (Mishra & Soni, 2022)
    url: "https://data.mendeley.com/public-files/datasets/f45bkkt8pr/files/edb361de-918d-469f-9106-e84823830665/file_downloaded",
    expectFile: "Dataset_5971.csv"
  }
];

// Finds a file by name anywhere under a folder (zips sometimes have a folder inside)
function findFile(folder, fileName) {
  if (!fs.existsSync(folder)) return null;
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(full, fileName);
      if (found) return found;
    } else if (entry.name === fileName) {
      return full;
    }
  }
  return null;
}

async function downloadOne(ds) {
  const folder = path.join(DOWNLOADS, ds.name);
  if (findFile(folder, ds.expectFile)) {
    console.log(`${ds.name}: already downloaded`);
    return;
  }
  fs.mkdirSync(folder, { recursive: true });

  console.log(`${ds.name}: downloading ${ds.url}`);
  const response = await fetch(ds.url);   // fetch follows redirects by itself
  if (!response.ok) throw new Error(`${ds.name}: download failed (HTTP ${response.status})`);
  const zipPath = path.join(folder, "download.zip");
  fs.writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));

  // The "tar" built into Windows 10+ and macOS can open zip files. It refuses paths that try
  // to escape the folder (like ../), so a bad zip cannot write outside downloads/.
  // On Windows we name System32's tar.exe, because Git Bash's own tar cannot open zips.
  const tar = process.platform === "win32"
    ? path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe")
    : "tar";
  try {
    execFileSync(tar, ["-xf", "download.zip"], { cwd: folder });
  } catch (err) {
    throw new Error(`${ds.name}: could not unzip ${zipPath}. Unzip it into ${folder} by hand, then run this again.`);
  }

  const found = findFile(folder, ds.expectFile);
  if (!found) throw new Error(`${ds.name}: unzipped, but ${ds.expectFile} was not inside`);
  console.log(`${ds.name}: ready (${path.relative(DOWNLOADS, found)})`);
}

async function main() {
  for (const ds of DATASETS) await downloadOne(ds);
}

if (require.main === module) {
  main().catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { DATASETS, DOWNLOADS, findFile };
