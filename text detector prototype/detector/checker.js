"use strict";

// The message checker: looks for red flags in a message and returns a result for the
// "Check a message" screen.  Owner: Aydan.
//
//   checkMessage(text, { lang }) -> { risk, type, confidence, summary, flags, steps, lang, score }
//     (lang is optional: the language to write the summary, reasons and steps in, for example
//      the language the customer picked on the website; without it, the message's own language)
//     risk        "low" | "medium" | "high"
//     type        "impersonation" | "phishing" | "parcel" | "job" | "investment" | "love" | "none"
//     confidence  "low" | "medium" | "high"   (how sure we are)
//     summary     one or two plain sentences
//     flags       [{ phrase, reason }]: each phrase is copied exactly from the message
//     steps       "what to do now", matched to the flags (from KakiGuard)
//     lang        "en" | "zh" | "ms" | "ta": the language we think the message is in (extra, for the screen)
//     score       the risk points added up (extra, for testing and the evaluation)
//
// How it works, in four steps:
//   1. Find every red flag: the phrase patterns in rules.js, plus any links.
//   2. If two flagged phrases overlap, keep the stronger one, so each part of the message
//      is highlighted once.
//   3. Add up the points (each rule counts once, however often it appears). Many points AND
//      something risky asked of you (tap, pay, reply, share a code) = high risk.
//   4. The rules that were found vote for the kind of scam; the most votes wins.
// It is a set of hand-written warning signs, not proof: new wording can slip past it.
//
// Works in the browser (load rules.js, words.js, then this file; it adds window.TextDetector)
// and in Node (require("./checker.js")).

(function () {
  const inNode = typeof module === "object" && module.exports;
  const { RULES, LINK_RULES } = inNode ? require("./rules.js") : globalThis.TEXT_DETECTOR_RULES;
  const WORDS = inNode ? require("./words.js") : globalThis.TEXT_DETECTOR_WORDS;

  // ---------- Settings (chosen on the "dev" half of the English data; see docs/evaluation.md) ----------
  const HIGH_AT = 4;        // points for "high" (the message must also ask you to do something risky)
  const MEDIUM_AT = 2;      // points for "medium"
  const VERY_SURE_AT = 7;   // points for "very sure" about a high-risk result
  const MAX_FLAGS = 8;      // the most flags we list, so a long message doesn't flood the screen
  // When two kinds of scam get the same votes, the one earlier in this list wins
  const TYPES = ["impersonation", "phishing", "parcel", "job", "investment", "love"];

  // Each pattern is turned into a "global" regular expression once, so it can find every match
  const COMPILED = [];
  for (const rule of RULES) {
    for (const lang of Object.keys(rule.patterns)) {
      for (const pattern of rule.patterns[lang]) {
        const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
        COMPILED.push({ rule, regex: new RegExp(pattern.source, flags) });
      }
    }
  }

  // Languages that have at least one pattern. Messages in other languages get a "not sure" result.
  const SUPPORTED = new Set();
  for (const rule of RULES) {
    for (const [lang, list] of Object.entries(rule.patterns)) if (list.length) SUPPORTED.add(lang);
  }

  // ---------- Language ----------
  // Chinese if it has Chinese characters; Malay if it has two or more common Malay words; else English.
  // Short words that are also English names ("Dan", "Ada") are left out on purpose.
  const MALAY_WORDS = /\b(?:anda|kami|saya|sila|untuk|dengan|akaun|tidak|sekarang|segera|bayar|wang|kerja|dapat|jika|akan|telah|sudah|daripada|kepada|sahaja|hari|ini|itu|jangan|esok|pukul|kerana|boleh|bulan|malam|terima|kasih|juga|ialah|adalah|mahu)\b/gi;
  function detectLanguage(text) {
    const chinese = (text.match(/[一-鿿]/g) || []).length;
    if (chinese >= 2) return "zh";
    const malay = new Set((text.match(MALAY_WORDS) || []).map(w => w.toLowerCase()));
    if (malay.size >= 2) return "ms";
    // Tamil script. There are no Tamil rules yet, so this makes the result say it is a rough guess
    // instead of quietly checking a Tamil message with the English rules.
    const tamil = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
    if (tamil >= 4) return "ta";
    return "en";
  }

  // ---------- "Never share your OTP" is advice, not a scam ----------
  // True when a "not" word comes just before the match (in the same sentence), but not
  // "if you don't ...", which is a threat ("If you don't reply with the OTP, ...").
  const NOT_WORDS = /\b(?:never|not|don'?t|won'?t|cannot|can'?t|nobody|no one)\b[^.!?\n]{0,12}$/i;
  const IF_NOT = /\b(?:if|unless)\s+(?:you\s+)?(?:do not|don'?t|fail to)\s*$/i;
  const CHINESE_NOT = /(?:不要|请勿|切勿|勿|不会|绝不|从不|不可)[^。！？\n]{0,6}$/;
  const MALAY_NOT = /\b(?:jangan|tidak akan|tidak pernah|tak akan)\b[^.!?\n]{0,12}$/i;
  function isNegated(text, start) {
    const before = text.slice(Math.max(0, start - 30), start);
    if (IF_NOT.test(before)) return false;
    return NOT_WORDS.test(before) || CHINESE_NOT.test(before) || MALAY_NOT.test(before);
  }

  // ---------- Links ----------
  // A web address: starts with http(s):// or www., or looks like name.com / name.sg / bit.ly etc.
  // Bare addresses only count with endings that are rarely words, so "home.me" in a chat isn't a link.
  const LINK_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|xyz|top|club|online|site|live|shop|vip|icu|click|buzz|link|io|sg|cn|uk|app|page|example|ly|gl|gd)\b(?:\/[^\s<>"']*)?/gi;

  // Sorts a link into one of four kinds (the official list and brand check come from KakiGuard):
  //   "official"   on a real organisation's website (ocbc.com, anything.gov.sg): not flagged
  //   "lookalike"  uses a brand's name but isn't its website (dbs-sg-secure.com): a strong sign
  //   "suspicious" shortened, a bare number address, a cheap ending, digits or words like "verify"
  //   "plain"      any other link: a small sign
  function linkKind(link) {
    const host = link.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase().replace(/^www\./, "");
    const ending = host.split(".").pop();
    if (LINK_RULES.official.some(d => host === d || host.endsWith("." + d))) return "official";
    if (LINK_RULES.shorteners.some(s => host === s || host.endsWith("." + s))) return "suspicious";   // hides where it goes
    if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(host)) return "suspicious";                         // a bare number address
    const parts = host.split(/[.-]/);
    if (LINK_RULES.brands.some(b => parts.includes(b))) return "lookalike";                         // a copied brand name
    if (LINK_RULES.riskyEndings.includes(ending)) return "suspicious";                                 // a cheap ending
    if (/\d{3,}/.test(host)) return "suspicious";                                                     // like www.0778148.com
    return LINK_RULES.riskyWords.test(host) ? "suspicious" : "plain";                                 // "verify", "secure" ...
  }

  function findLinks(text) {
    const found = [];
    for (const m of text.matchAll(LINK_PATTERN)) {
      if (m.index > 0 && text[m.index - 1] === "@") continue;      // part of an email address
      const phrase = m[0].replace(/[.,!?;:)\]'"]+$/, "");          // drop a full stop after the link
      const kind = linkKind(phrase);
      if (kind === "official") continue;                           // a real organisation's website
      const rule = LINK_RULES[kind];
      found.push({ rule, start: m.index, end: m.index + phrase.length, phrase });
    }
    return found;
  }

  // ---------- Step 1: find every red flag ----------
  function findMatches(text) {
    const found = [];
    for (const { rule, regex } of COMPILED) {
      for (const m of text.matchAll(regex)) {
        if (!m[0].trim()) continue;
        if (rule.skipIfNegated && isNegated(text, m.index)) continue;
        found.push({ rule, start: m.index, end: m.index + m[0].length, phrase: m[0] });
      }
    }
    return found.concat(findLinks(text));
  }

  // ---------- Step 2: overlapping phrases -> keep the stronger one ----------
  function pickFlags(matches) {
    // Strongest first; for equal points, the longer phrase; then reading order
    const sorted = [...matches].sort((a, b) =>
      b.rule.points - a.rule.points || (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    const kept = [];
    for (const m of sorted) {
      const overlaps = kept.some(k => m.start < k.end && k.start < m.end);
      if (!overlaps) kept.push(m);
    }
    return kept.sort((a, b) => a.start - b.start);   // back into reading order
  }

  // ---------- "What to do now": steps that match the red flags found ----------
  // Idea and wording from KakiGuard (a teammate's project, reused with permission). The steps
  // are in words.js; this list says which red flags bring each one. At most 3 of these, then
  // "ask your family" and "call 1799" for any medium or high result.
  const STEPS_FOR = {
    noClick: ["has_link", "suspicious_link", "lookalike_link", "tap_link"],
    noCode: ["asks_code", "asks_details"],
    noPay: ["send_money", "pay_fee", "safe_account", "gift_card"],
    noInstall: ["install_app"],
    checkOldNumber: ["new_number"],
    verifyOfficial: ["claims_bank", "claims_government", "claims_courier", "account_problem"],
    stopReplying: ["secrecy", "threat"]
  };
  function pickSteps(rules, risk, stepWords) {
    if (risk === "low") return [stepWords.stillCareful];   // stay calm: one gentle reminder
    const found = new Set(rules.map(rule => rule.id));
    const steps = Object.keys(STEPS_FOR).filter(step => STEPS_FOR[step].some(id => found.has(id))).slice(0, 3);
    steps.push("askFamily", "call1799");
    return steps.map(step => stepWords[step]);
  }

  // ---------- Steps 3 and 4: points, risk, kind of scam, how sure ----------
  // options.lang ("en" | "zh" | "ms" | "ta"): the language to write the summary, reasons and steps in,
  // for example the language the customer picked on the website. Without it, they are written in
  // the message's own language. It never changes what is detected, only the words.
  function checkMessage(input, options = {}) {
    const text = typeof input === "string" ? input : String(input == null ? "" : input);
    const lang = detectLanguage(text);
    const outLang = WORDS[options.lang] ? options.lang : lang;
    const words = WORDS[outLang] || WORDS.en;
    const say = key => (words[key] !== undefined ? words[key] : WORDS.en[key]);

    if (!text.trim()) {
      return { risk: "low", type: "none", confidence: "low", summary: say("empty"), flags: [], steps: [], lang, score: 0 };
    }

    const kept = pickFlags(findMatches(text));

    // Each rule counts once, however many times it appears
    const rules = [...new Set(kept.map(k => k.rule))];
    const score = rules.reduce((sum, rule) => sum + rule.points, 0);
    const asksSomething = rules.some(rule => rule.ask);

    let risk = "low";
    if (score >= HIGH_AT && asksSomething) risk = "high";
    else if (score >= MEDIUM_AT) risk = "medium";

    // Kind of scam: add up the votes of the rules found
    let type = "none";
    if (risk !== "low") {
      const votes = {};
      for (const rule of rules) {
        for (const [kind, n] of Object.entries(rule.votes)) votes[kind] = (votes[kind] || 0) + n;
      }
      let best = 0;
      type = "phishing";   // if nothing voted, "a message made to steal your details" is the safest guess
      for (const kind of TYPES) {
        if ((votes[kind] || 0) > best) { best = votes[kind]; type = kind; }
      }
    }

    // How sure we are. Rules can never be fully sure a message is safe (new tricks slip past),
    // so a message with no warning signs gets "fairly sure", not "very sure".
    let confidence;
    if (risk === "high") confidence = score >= VERY_SURE_AT ? "high" : "medium";
    else if (risk === "medium") confidence = score >= 4 ? "medium" : "low";
    else confidence = score === 0 ? "medium" : "low";
    const tooShort = lang !== "zh" && text.trim().split(/\s+/).length < 4;
    if (tooShort || !SUPPORTED.has(lang)) confidence = "low";

    // Summary
    let summary;
    if (risk === "low") summary = kept.length ? say("lowWithFlags") : say("lowNoFlags");
    else {
      const typeNames = say("typeNames");
      const tips = say("tips");
      summary = say(risk)
        .replace("{type}", typeNames[type] || WORDS.en.typeNames[type])
        .replace("{tip}", tips[type] || WORDS.en.tips[type]);
    }
    if (!SUPPORTED.has(lang)) summary = say("notSupported") + " " + summary;

    // "rule" is extra: the screen only needs phrase and reason; the evaluation counts rules
    const flags = kept.slice(0, MAX_FLAGS).map(k => ({
      phrase: k.phrase,
      reason: k.rule.reason[outLang] || k.rule.reason.en,
      rule: k.rule.id
    }));

    const steps = pickSteps(rules, risk, { ...WORDS.en.steps, ...say("steps") });

    return { risk, type, confidence, summary, flags, steps, lang, score };
  }

  const api = {
    checkMessage, detectLanguage, findLinks, isNegated,
    settings: { HIGH_AT, MEDIUM_AT, VERY_SURE_AT, MAX_FLAGS, TYPES }
  };
  if (inNode) module.exports = api;
  else globalThis.TextDetector = api;
})();
