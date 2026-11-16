"use strict";

// Tests for the language switcher's t() (js/core/i18n.js) and for the translations. Owner: Jose.
// Run from the server folder:  npm test
// i18n.js is browser code, but like risk-scorer-logic.js it also exports itself for Node, and it
// skips the parts that need a page (there is no document or localStorage here).

const test = require("node:test");
const assert = require("node:assert/strict");
const i18n = require("../../js/core/i18n.js");
const RISK_SCORER_DATA = require("../../js/data/risk-scorer.js");
const REPORT_DATA = require("../../js/data/report.js");
const FREEZE_DATA = require("../../js/data/freeze.js");

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

// The shared words plus my three screens' words, the same way the browser adds them
const ALL = [
  { name: "shared (i18n.js)", text: { en: I18N.en, zh: I18N.zh, ms: I18N.ms } },
  { name: "risk scorer", text: RISK_SCORER_DATA.text },
  { name: "report", text: REPORT_DATA.text },
  { name: "freeze", text: FREEZE_DATA.text }
];

test("every English word has a Chinese and a Malay version", () => {
  for (const { name, text } of ALL) {
    for (const lang of ["zh", "ms"]) {
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
