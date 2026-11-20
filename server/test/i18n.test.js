"use strict";

// Tests for the language switcher's t() (js/core/i18n.js) and for the translations. Owner: Jose.
// Run from the server folder:  npm test
// i18n.js is browser code, but like risk-scorer-logic.js it also exports itself for Node, and it
// skips the parts that need a page (there is no document or localStorage here).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const i18n = require("../../js/core/i18n.js");
const RISK_SCORER_DATA = require("../../js/data/risk-scorer.js");

const { t, setLanguage, getLanguage, addTranslations, I18N } = i18n;

// Every test starts in English, so one test's language can't leak into the next
test.beforeEach(() => setLanguage("en"));

test("t() gives English by default", () => {
  assert.equal(getLanguage(), "en");
  assert.equal(t("menu.home"), "Home");
});

test("setLanguage() switches what t() gives back", () => {
  setLanguage("zh");
  assert.equal(getLanguage(), "zh");
  assert.equal(t("menu.home"), "主页");
  setLanguage("ms");
  assert.equal(t("menu.home"), "Utama");
  setLanguage("ta");
  assert.equal(t("menu.home"), "முகப்பு");
});

test("a language we don't offer is ignored", () => {
  setLanguage("fr");
  assert.equal(getLanguage(), "en");
});

test("a key missing in Chinese falls back to English, with a console warning", ctx => {
  const warn = ctx.mock.method(console, "warn", () => {});   // catch the warning instead of printing it
  addTranslations({ en: { "test.onlyEnglish": "Only in English" } });
  setLanguage("zh");
  assert.equal(t("test.onlyEnglish"), "Only in English");
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /test\.onlyEnglish/);
});

test("a key missing everywhere shows the key itself, so it is easy to spot", ctx => {
  ctx.mock.method(console, "warn", () => {});
  assert.equal(t("no.such.key"), "no.such.key");
});

test("t() fills in the blanks", () => {
  assert.equal(t("common.callOcbcNumber", { phone: "1800 363 3333" }), "Call OCBC 1800 363 3333");
  setLanguage("zh");
  assert.equal(t("common.callOcbcNumber", { phone: "1800 363 3333" }), "打电话给 OCBC 1800 363 3333");
});

// ---------- The translations themselves ----------

// Teammates' data files are plain browser scripts with no module.exports, so we run each one in
// a small sandbox and read its ..._DATA back out. Any data file with a text block is checked,
// so a screen is covered by these tests as soon as someone translates it.
const DATA_DIR = path.join(__dirname, "..", "..", "js", "data");
function teamTexts() {
  const found = [];
  for (const file of fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".js"))) {
    const code = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    const name = (code.match(/^const (\w+_DATA)\s*=/m) || [])[1];
    if (!name) continue;
    const sandbox = { module: undefined };
    vm.runInNewContext(`${code}\n;this.__data = ${name};`, sandbox);
    if (sandbox.__data.text) found.push({ name: file, text: sandbox.__data.text, data: sandbox.__data });
  }
  return found;
}

test("the call match words match the calls matchCall() returns", () => {
  const { data } = teamTexts().find(d => d.name === "call-match-logic.js");
  for (const call of data.outboundCalls) {
    for (const field of ["team", "time", "about"]) {
      assert.equal(data.text.en[`cml.call.${call.id}.${field}`], call[field], `${call.id}.${field}`);
    }
  }
});

// The shared words plus every screen's words
const ALL = [{ name: "shared (i18n.js)", text: { en: I18N.en, zh: I18N.zh, ms: I18N.ms, ta: I18N.ta } }, ...teamTexts()];

// The blanks ({name}, {phone} ...) and the bold parts (<strong>) must survive translation, or a
// screen would show "{name}" or lose its bold warning in one language only
test("every translation keeps the same blanks and bold parts as the English", () => {
  const blanks = text => (text.match(/\{\w+\}|<\/?strong>/g) || []).sort().join(" ");
  for (const { name, text } of ALL) {
    for (const lang of ["zh", "ms", "ta"]) {
      for (const key of Object.keys(text.en)) {
        if (key.startsWith("test.") || !(key in text[lang])) continue;
        assert.equal(blanks(text[lang][key]), blanks(text.en[key]), `${name}: ${lang} "${key}"`);
      }
    }
  }
});

test("the badge words match RESULTS in helpers.js", () => {
  const helpers = fs.readFileSync(path.join(DATA_DIR, "..", "core", "helpers.js"), "utf8");
  for (const [, key, short] of helpers.matchAll(/(\w+): \{ short: "([^"]+)"/g)) {
    assert.equal(I18N.en[`result.${key}`], short, key);
  }
});

test("no two screens use the same key", () => {
  const owner = {};
  for (const { name, text } of ALL) {
    for (const key of Object.keys(text.en)) {
      assert.ok(!owner[key] || owner[key] === name, `"${key}" is in both ${owner[key]} and ${name}`);
      owner[key] = name;
    }
  }
});

test("every English word has a Chinese, a Malay and a Tamil version", () => {
  for (const { name, text } of ALL) {
    for (const lang of ["zh", "ms", "ta"]) {
      const missing = Object.keys(text.en).filter(key => !key.startsWith("test.") && !(key in text[lang]));
      assert.deepEqual(missing, [], `${name}: missing in ${lang}`);
    }
  }
});

test("the screen's English risk words match the scorer's English words exactly", () => {
  // The server and staff console use config; the customer's screen uses text.en. They must agree.
  const en = RISK_SCORER_DATA.text.en;
  for (const s of RISK_SCORER_DATA.config.signals) {
    assert.equal(en[`rs.signal.${s.id}.label`], s.label, s.id);
    assert.equal(en[`rs.signal.${s.id}.rule`], s.rule, s.id);
    assert.equal(en[`rs.signal.${s.id}.reason`], s.reason, s.id);
  }
  for (const b of RISK_SCORER_DATA.config.bands) {
    assert.equal(en[`rs.band.${b.id}.label`], b.label, b.id);
    assert.equal(en[`rs.band.${b.id}.action`], b.actionText, b.id);
  }
  for (const s of RISK_SCORER_DATA.samples) {
    assert.equal(en[`rs.sample.${s.id}.title`], s.title, s.id);
    assert.equal(en[`rs.sample.${s.id}.story`], s.story, s.id);
  }
});
