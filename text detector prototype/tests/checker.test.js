"use strict";

// Tests for the message checker. Run from inside "text detector prototype/":   npm test
// (or: node --test tests/). Uses Node's built-in test runner, so nothing needs installing.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { checkMessage, detectLanguage, findLinks } = require("../detector/checker.js");
const { RULES, LINK_RULES } = require("../detector/rules.js");
const WORDS = require("../detector/words.js");

const RISKS = ["low", "medium", "high"];
const TYPES = ["impersonation", "phishing", "parcel", "job", "investment", "love", "none"];

// Checks the result has the shape the analyser screen expects
function assertShape(text, r) {
  assert.ok(RISKS.includes(r.risk), `risk ${r.risk}`);
  assert.ok(TYPES.includes(r.type), `type ${r.type}`);
  assert.ok(RISKS.includes(r.confidence), `confidence ${r.confidence}`);
  assert.equal(typeof r.summary, "string");
  assert.ok(r.summary.length > 0);
  assert.ok(Array.isArray(r.flags));
  if (r.risk === "low") assert.equal(r.type, "none");
  let lastEnd = -1;
  for (const f of r.flags) {
    assert.equal(typeof f.phrase, "string");
    assert.equal(typeof f.reason, "string");
    // The screen finds each phrase with text.indexOf(), so it must be copied exactly
    const at = text.indexOf(f.phrase, lastEnd < 0 ? 0 : lastEnd);
    assert.ok(at >= 0, `phrase "${f.phrase}" is not in the message (in reading order, without overlaps)`);
    lastEnd = at + f.phrase.length;
  }
}

// The examples from the analyser screen (js/data/analyser.js on aydan/analyser-screens)
const SCREEN_EXAMPLES = [
  { type: "impersonation", text: "Bank Security Team: we detected an unusual login on your account. Reply with the 6-digit OTP we sent you within 10 minutes, or your account will be frozen." },
  { type: "phishing", text: "Your card has been suspended. Tap here to verify your details now: card-verify-secure.example/login" },
  { type: "parcel", text: "Your parcel could not be delivered. Pay a $1.99 redelivery fee within 24 hours: parcel-redeliver.example" },
  { type: "job", text: "Part-time job! Earn $300 a day just by liking videos. No experience needed. Pay a $50 registration fee to start. WhatsApp us now." },
  { type: "investment", text: "Join our VIP crypto group. Guaranteed 30% returns every week! Limited slots, transfer today to secure your place." },
  { type: "love", text: "My dear, I miss you so much. I'm stuck at the airport and need $2,000 for customs. Please don't tell your family, I'll pay you back next week." },
  { type: "impersonation", lang: "zh", text: "【银行通知】您的账户出现异常登录。请在10分钟内点击链接验证，否则账户将被冻结：bank-verify.example" },
  { type: "job", lang: "ms", text: "Kerja sambilan dari rumah! Dapat $300 sehari hanya dengan 'like' video. Bayar yuran pendaftaran $50 dahulu. WhatsApp kami sekarang!" }
];

test("the screen's scam examples are flagged as the right kind of scam", () => {
  for (const ex of SCREEN_EXAMPLES) {
    const r = checkMessage(ex.text);
    assertShape(ex.text, r);
    assert.equal(r.risk, "high", ex.text);
    assert.equal(r.type, ex.type, ex.text);
    assert.equal(r.lang, ex.lang || "en", ex.text);
    assert.ok(r.flags.length >= 2, ex.text);
  }
});

test("the screen's normal example is low risk with no flags", () => {
  const text = "Hi Auntie, the family dinner is moved to Saturday 7pm at the usual restaurant. See you there!";
  const r = checkMessage(text);
  assertShape(text, r);
  assert.equal(r.risk, "low");
  assert.equal(r.type, "none");
  assert.deepEqual(r.flags, []);
});

test("the whole phrase is highlighted, e.g. a fee with a decimal amount", () => {
  const r = checkMessage("Your parcel could not be delivered. Pay a $1.99 redelivery fee within 24 hours: parcel-redeliver.example");
  assert.ok(r.flags.some(f => f.phrase === "Pay a $1.99 redelivery fee"));
  assert.ok(r.flags.some(f => f.phrase === "parcel-redeliver.example"));
});

test("a real bank's advice is not mistaken for a scam", () => {
  const advice = [
    "Your OTP is 123456. Never share it with anyone. We will never ask for your OTP or PIN.",
    "Do not share your password with anyone, including our staff.",
    "【测试银行】您的验证码是123456，请勿向任何人透露。",
    "Kod OTP anda ialah 123456. Jangan kongsi kod OTP ini dengan sesiapa."
  ];
  for (const text of advice) {
    const r = checkMessage(text);
    assertShape(text, r);
    assert.equal(r.risk, "low", text);
  }
});

test('"if you don\'t ..." is still read as a threat, not as advice', () => {
  const r = checkMessage("If you don't reply with the OTP in 5 minutes, your account will be blocked.");
  assert.notEqual(r.risk, "low");
  assert.ok(r.flags.some(f => /OTP/.test(f.phrase)));
});

test('"you won\'t" is not read as "you won a prize"', () => {
  const r = checkMessage("Lol you won't feel bad when I take you out to dinner");
  assert.equal(r.risk, "low");
  assert.deepEqual(r.flags, []);
});

test("a message can only be high risk if it asks you to do something", () => {
  // Lots of pressure, but no link, number, code, payment or reply asked for
  const text = "URGENT! Your account has been suspended. Legal action will follow. Final notice.";
  const r = checkMessage(text);
  assertShape(text, r);
  assert.notEqual(r.risk, "high");
});

test("empty and odd input give a calm, low result instead of crashing", () => {
  for (const input of ["", "   ", null, undefined, 12345]) {
    const r = checkMessage(input);
    assert.equal(r.risk, "low");
    assert.equal(r.type, "none");
    assert.equal(r.confidence, "low");
  }
});

test("short messages get low confidence", () => {
  assert.equal(checkMessage("ok see you").confidence, "low");
});

test("language is detected", () => {
  assert.equal(detectLanguage("See you at dinner tonight"), "en");
  assert.equal(detectLanguage("今晚七点回家吃饭"), "zh");
  assert.equal(detectLanguage("Saya balik rumah pukul 7 malam ini"), "ms");
  assert.equal(detectLanguage("Hi Dan, Ada is coming too"), "en");   // names that are also Malay words
  assert.equal(detectLanguage("உங்கள் கணக்கு முடக்கப்படும்"), "ta");   // Tamil: no rules yet, so marked as a rough guess
});

test("summaries and reasons come in the message's language", () => {
  const zh = checkMessage(SCREEN_EXAMPLES[6].text);
  assert.match(zh.summary, /[一-鿿]/);
  assert.ok(zh.flags.every(f => /[一-鿿]/.test(f.reason)));
  const ms = checkMessage(SCREEN_EXAMPLES[7].text);
  assert.match(ms.summary, /Mesej ini/);
});

test("links: emails, chat words and full stops are handled", () => {
  assert.deepEqual(findLinks("email me at amy@mail.com"), []);
  assert.deepEqual(findLinks("i'm going home.me too"), []);
  const [link] = findLinks("Check www.shop.example/track.");
  assert.equal(link.phrase, "www.shop.example/track");
  assert.equal(link.rule.id, "has_link");
  assert.equal(findLinks("Go to bit.ly/abc123 now")[0].rule.id, "suspicious_link");
  assert.equal(findLinks("http://192.168.0.1/login")[0].rule.id, "suspicious_link");
});

test("long or tricky messages are checked quickly (no runaway patterns)", () => {
  const tricky = [
    "a".repeat(2000),
    "call " + "1 ".repeat(1000),
    "dear " + "x ".repeat(1000),
    "pay " + "$1.".repeat(600) + " fee",
    "银行".repeat(1000),
    "www." + "a.".repeat(900) + "com"
  ];
  for (const text of tricky) {
    const start = Date.now();
    assertShape(text, checkMessage(text));
    assert.ok(Date.now() - start < 500, `too slow on: ${text.slice(0, 30)}...`);
  }
});

test("no more than 8 flags are listed", () => {
  const text = SCREEN_EXAMPLES.map(e => e.text).join(" ");
  assert.ok(checkMessage(text).flags.length <= 8);
});

// ---------- Added with the parts reused from KakiGuard (a teammate's project) ----------

test('the "Hi Mum, this is my new number" scam is caught, but a friend\'s new number alone is not', () => {
  const scam = checkMessage("Hi Mum, I lost my phone. This is my new number. Can you PayNow me $600 urgently? Don't tell Dad.");
  assert.equal(scam.risk, "high");
  assert.equal(scam.type, "impersonation");
  assert.equal(checkMessage("Not tonight mate. This is my new number by the way.").risk, "low");
});

test("a payment receipt is not read as a request for money", () => {
  assert.equal(checkMessage("Your DBS PayLah! transfer of $25.00 to ETHAN TAN was successful on 01 Oct.").risk, "low");
});

test("links: official websites are not flagged, brand lookalikes are", () => {
  assert.deepEqual(findLinks("See www.ocbc.com or go.gov.sg/scams"), []);
  assert.equal(findLinks("Verify at dbs-sg-secure.com/verify")[0].rule.id, "lookalike_link");
  assert.equal(findLinks("Claim at shopee-luckydraw.vip")[0].rule.id, "lookalike_link");
  assert.equal(findLinks("Menu at unicasa.com")[0].rule.id, "has_link");   // "ica" inside a word is not the brand ICA
  assert.equal(findLinks("visit www.07781482378.com")[0].rule.id, "suspicious_link");
});

test("steps: matched to the flags, in the message's language, calm for low risk", () => {
  const high = checkMessage(SCREEN_EXAMPLES[0].text);
  assert.ok(high.steps.includes(WORDS.en.steps.noCode));
  assert.equal(high.steps[high.steps.length - 1], WORDS.en.steps.call1799);
  assert.ok(high.steps.length <= 5);
  assert.deepEqual(checkMessage("Hi Auntie, dinner is at 7pm on Saturday. See you!").steps, [WORDS.en.steps.stillCareful]);
  const zh = checkMessage(SCREEN_EXAMPLES[6].text);
  assert.ok(zh.steps.every(s => /[一-鿿]/.test(s)));
  const ms = checkMessage(SCREEN_EXAMPLES[7].text);
  assert.ok(ms.steps.includes(WORDS.ms.steps.noPay));
});

test("every rule has a reason in English, Chinese and Malay", () => {
  for (const rule of [...RULES, LINK_RULES.plain, LINK_RULES.suspicious, LINK_RULES.lookalike]) {
    for (const lang of ["en", "zh", "ms"]) {
      assert.ok(rule.reason[lang], `${rule.id} has no ${lang} reason`);
    }
  }
});

test("every language has all the summary words", () => {
  for (const lang of ["en", "zh", "ms"]) {
    for (const key of ["high", "medium", "lowWithFlags", "lowNoFlags", "empty"]) {
      assert.ok(WORDS[lang][key], `${lang} is missing "${key}"`);
    }
    for (const type of TYPES.filter(t => t !== "none")) {
      assert.ok(WORDS[lang].typeNames[type], `${lang} has no name for ${type}`);
      assert.ok(WORDS[lang].tips[type], `${lang} has no tip for ${type}`);
    }
    for (const step of Object.keys(WORDS.en.steps)) {
      assert.ok(WORDS[lang].steps[step], `${lang} has no "${step}" step`);
    }
  }
});

test("works in a browser the same way (files loaded as plain scripts)", () => {
  // A sandbox with no "module" or "require", like a web page
  const sandbox = vm.createContext({});
  for (const file of ["rules_zh.js", "rules_ms.js", "rules.js", "words.js", "checker.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "detector", file), "utf8"), sandbox, { filename: file });
  }
  const text = SCREEN_EXAMPLES[0].text;
  const fromBrowser = vm.runInContext(`TextDetector.checkMessage(${JSON.stringify(text)})`, sandbox);
  assert.deepEqual(JSON.parse(JSON.stringify(fromBrowser)), JSON.parse(JSON.stringify(checkMessage(text))));
});

test("options.lang writes the words in the customer's language, without changing the result", () => {
  const text = "Your card has been suspended. Tap here to verify your details: card-verify.example";
  const plain = checkMessage(text);
  for (const lang of ["zh", "ms"]) {
    const r = checkMessage(text, { lang });
    // Same detection: risk, kind, sureness, points, phrases and the message's own language
    assert.equal(r.risk, plain.risk);
    assert.equal(r.type, plain.type);
    assert.equal(r.confidence, plain.confidence);
    assert.equal(r.score, plain.score);
    assert.equal(r.lang, "en");
    assert.deepEqual(r.flags.map(f => f.phrase), plain.flags.map(f => f.phrase));
    assert.equal(r.steps.length, plain.steps.length);
    // Different words: the summary and the steps are in the chosen language
    assert.notEqual(r.summary, plain.summary);
    assert.notEqual(r.steps[0], plain.steps[0]);
  }
  // A language we don't have falls back to the message's own language
  assert.equal(checkMessage(text, { lang: "fr" }).summary, plain.summary);
});
