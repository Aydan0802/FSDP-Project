"use strict";

// Feature: AI helper chat API. POST /api/chat
// Owner: Jose
// A senior types (or says) what is happening, in their own words and language. The reply tells
// them what to do, plus the buttons to do it ("Freeze my accounts", "Call OCBC" ...).
//
//   POST /api/chat   { lang: "en", messages: [{ role: "user", text: "Someone says he is from OCBC" }] }
//   reply            { reply: "...", actions: ["calling-now", "call-match"], urgent: false,
//                      hidSecret: false, source: "demo" }
//
// How one request is answered:
//   1. check the request, and hide any OTP, card number or NRIC (before the AI sees anything)
//   2. ask the AI (server/ai.js, Ollama), if one is set up
//   3. check the AI's answer: only our buttons, no links, no made-up phone numbers. If anything is
//      wrong, or the AI is off, slow or broken, use the scripted demo reply instead
//   4. the safety rules again: money already sent always gets Freeze + Call OCBC
// The safety rules are plain code on purpose: they work the same every time, whatever the AI says.

const express = require("express");
const { createAi } = require("./ai.js");

const LANGS = ["en", "zh", "ms", "ta"];
const MAX_MESSAGES = 12;       // only the latest messages are kept, so a long chat stays small
const MAX_TEXT = 500;          // characters per message

// The only buttons a reply can have. The chat screen turns each one into a translated button
// (a screen of the app, or dialling OCBC), so a reply can never invent a link or a phone number.
const ACTIONS = ["calling-now", "call-match", "caller-check", "analyser", "freeze", "report", "learn-signs", "call-ocbc"];

// ---------- 1. Checking the request ----------

// Returns { lang, messages } if the body is fine, or throws an Error with a short reason.
function cleanRequest(body) {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error("messages must be a list with at least one message.");
  }
  const lang = LANGS.includes(body.lang) ? body.lang : "en";   // unknown language: English
  const messages = body.messages.slice(-MAX_MESSAGES).map(m => {
    if (!m || (m.role !== "user" && m.role !== "bot") || typeof m.text !== "string") {
      throw new Error('Each message needs a role ("user" or "bot") and a text.');
    }
    return { role: m.role, text: m.text.trim().slice(0, MAX_TEXT) };
  });
  const last = messages[messages.length - 1];
  if (last.role !== "user" || !last.text) throw new Error("The last message must be the user's, and not empty.");
  return { lang, messages };
}

// ---------- 2. Hiding secrets ----------

// Seniors are often told by scammers to "just read me the code". If one types an OTP, a card
// number or an NRIC into the chat, we hide it BEFORE it goes anywhere (the AI included), and the
// reply reminds them never to share it. Phone numbers (8 digits) are left alone: the senior may
// need to ask about the number that called them.
const SECRETS = [
  /\b\d(?:[ -]?\d){12,18}\b/g,   // a card number: 13 to 19 digits, maybe with spaces or dashes
  /\b[STFGM]\d{7}[A-Z]\b/gi,      // an NRIC or FIN, like S1234567D
  /\b\d{6}\b/g                    // a 6-digit OTP
];

function hideSecrets(text) {
  let hidden = text;
  for (const pattern of SECRETS) hidden = hidden.replace(pattern, "[hidden]");
  return { text: hidden, hidSecret: hidden !== text };
}

// ---------- 3. What the senior is talking about ----------

// Words in all four languages. "money" is checked first: someone who has already sent money or
// given a code needs to freeze their accounts now, whatever else they said.
// It looks for something the senior DID ("I sent", "我给了", "sudah hantar", "அனுப்பிவிட்டேன்"),
// so "he asked me to send money" is a call to check, not an emergency.
const TOPICS = [
  { id: "money", patterns: [
    /\b(i|we)\b.{0,15}\b(sent|transferred|paid|gave|given|shared|told (him|her|them)|read out)\b.{0,30}(money|otp|code|pin|password|\$)/i,
    /(转了|转账了|汇了|付了|给了|告诉了).{0,8}(钱|验证码|密码|OTP|PIN)/i,
    /(把|将).{0,8}(钱|验证码|密码|OTP|PIN).{0,8}(转|汇|付|给|告诉)了/i,   // 我把验证码告诉了他
    /\b(sudah|dah|telah)\b.{0,15}\b(hantar|pindah|transfer|bayar|beri|bagi|kongsi)\b.{0,20}\b(wang|duit|otp|kod|pin|kata laluan)/i,
    /(பணம்|பணத்தை|OTP|PIN|குறியீ|கடவுச்சொல்).{0,30}(அனுப்பி|கொடுத்|சொன்ன|சொல்லி|பகிர்ந்|செலுத்தி|மாற்றி)\S*ேன்/i   // "...ேன்" = I did it
  ] },
  { id: "calling", patterns: [
    /\b(call|calls|called|calling|caller|phone|rang|voice|on the line)\b/i,
    /(电话|打来|来电|打给我)/,
    /\b(telefon|panggilan|call|menelefon|pemanggil)\b/i,
    /(அழை|தொலைபேசி|போன்|கைபேசியில் பேச)/
  ] },
  { id: "message", patterns: [
    /\b(sms|message|text|link|whatsapp|telegram|email|letter|screenshot|qr)\b/i,
    /(短信|信息|讯息|链接|邮件|信件|截图)/,
    /\b(sms|mesej|pautan|whatsapp|telegram|surat|e-mel|emel)\b/i,
    /(செய்தி|குறுஞ்செய்தி|இணைப்பு|வாட்ஸ்அப்|மின்னஞ்சல்|கடிதம்)/
  ] }
];

// "money", "calling", "message" or "general"
function findTopic(text) {
  const topic = TOPICS.find(t => t.patterns.some(p => p.test(text)));
  return topic ? topic.id : "general";
}

// ---------- 4. The scripted replies (demo mode) ----------

// Used when there is no AI key, the AI is busy, or it fails, so the OCBC demo never breaks.
// The AI-drafted Chinese, Malay and Tamil need a native speaker to check them.
const DEMO = {
  money: {
    actions: ["freeze", "call-ocbc", "report"],
    urgent: true,
    text: {
      en: "Please stay calm, this is not your fault. Freeze your accounts now so no more money can leave. Then call OCBC and tell them what happened.",
      zh: "请保持冷静，这不是您的错。现在就冻结您的户口，阻止更多钱被转走。然后打电话给 OCBC，告诉他们发生了什么事。",
      ms: "Bertenang, ini bukan salah anda. Bekukan akaun anda sekarang supaya tiada lagi wang boleh keluar. Kemudian telefon OCBC dan beritahu apa yang berlaku.",
      ta: "அமைதியாக இருங்கள், இது உங்கள் தவறு அல்ல. மேலும் பணம் போகாமல் இருக்க இப்போதே உங்கள் கணக்குகளை முடக்குங்கள். பிறகு OCBC-ஐ அழைத்து என்ன நடந்தது என்று சொல்லுங்கள்."
    }
  },
  calling: {
    actions: ["calling-now", "call-match", "caller-check"],
    urgent: false,
    text: {
      en: "If the caller asks for money, a code, or tells you to keep it a secret, hang up. A real bank will not mind. Then check if OCBC really called you.",
      zh: "如果打电话的人要钱、要验证码，或叫您保密，请马上挂断。真正的银行不会介意。然后查一查 OCBC 是否真的打给您。",
      ms: "Jika pemanggil minta wang, kod, atau suruh anda rahsiakan, letak telefon. Bank sebenar tidak kisah. Kemudian semak sama ada OCBC betul-betul menelefon anda.",
      ta: "அழைப்பவர் பணம், குறியீடு கேட்டால் அல்லது ரகசியமாக வைக்கச் சொன்னால், அழைப்பைத் துண்டியுங்கள். உண்மையான வங்கி வருத்தப்படாது. பிறகு OCBC உண்மையில் அழைத்ததா என்று சரிபாருங்கள்."
    }
  },
  message: {
    actions: ["analyser", "report"],
    urgent: false,
    text: {
      en: "Don't tap any link or reply yet. Show me the message and I'll check it for scam signs.",
      zh: "先不要点击任何链接，也不要回复。把信息给我看，我帮您检查有没有诈骗迹象。",
      ms: "Jangan tekan sebarang pautan atau balas dahulu. Tunjukkan mesej itu dan saya akan semak tanda-tanda penipuan.",
      ta: "இப்போதைக்கு எந்த இணைப்பையும் தொடவோ பதில் அனுப்பவோ வேண்டாம். செய்தியைக் காட்டுங்கள், மோசடி அறிகுறிகள் உள்ளதா என்று சரிபார்க்கிறேன்."
    }
  },
  general: {
    actions: ["analyser", "calling-now", "learn-signs"],
    urgent: false,
    text: {
      en: "I'm here to help you stay safe from scams. Tell me what happened, in your own words.",
      zh: "我在这里帮您防范诈骗。请用您自己的话告诉我发生了什么事。",
      ms: "Saya di sini untuk membantu anda selamat daripada penipuan. Ceritakan apa yang berlaku, dengan kata-kata anda sendiri.",
      ta: "மோசடிகளிலிருந்து பாதுகாப்பாக இருக்க உங்களுக்கு உதவ நான் இருக்கிறேன். என்ன நடந்தது என்று உங்கள் சொந்த வார்த்தைகளில் சொல்லுங்கள்."
    }
  }
};

// Put in front of the reply when we hid a code, card number or NRIC
const SECRET_WARNING = {
  en: "I hid a code or number you typed. Never share your OTP, PIN or card number with anyone, not even me or the bank.",
  zh: "我把您输入的验证码或号码隐藏了。千万不要把 OTP、PIN 或卡号告诉任何人，包括我和银行。",
  ms: "Saya sembunyikan kod atau nombor yang anda taip. Jangan sekali-kali kongsi OTP, PIN atau nombor kad dengan sesiapa, termasuk saya atau bank.",
  ta: "நீங்கள் தட்டச்சு செய்த குறியீடு அல்லது எண்ணை மறைத்துவிட்டேன். உங்கள் OTP, PIN அல்லது அட்டை எண்ணை யாரிடமும், என்னிடமும் வங்கியிடமும்கூட, பகிர வேண்டாம்."
};

// ---------- 5. Checking the AI's answer ----------

// The only phone numbers a reply may contain (OCBC, police). 1799 is too short to be caught below.
const ALLOWED_NUMBERS = ["63633333", "18003633333", "18002550000"];
const MAX_REPLY = 600;

// Gives back a clean { reply, actions, urgent }, or null if the AI's answer can't be trusted
function checkAiReply(raw) {
  if (!raw || typeof raw.reply !== "string") return null;
  const reply = raw.reply.trim();
  if (!reply || reply.length > MAX_REPLY) return null;
  if (/https?:|www\.|\.(com|sg|net|org|ly)\b/i.test(reply)) return null;   // a link: never from us
  const numbers = (reply.match(/\+?\d[\d\s-]{6,}\d/g) || []).map(n => n.replace(/\D/g, "").replace(/^65(?=\d{8}$)/, ""));
  if (numbers.some(n => !ALLOWED_NUMBERS.includes(n))) return null;           // a made-up number
  const actions = [...new Set(Array.isArray(raw.actions) ? raw.actions : [])].filter(a => ACTIONS.includes(a)).slice(0, 3);
  return { reply, actions, urgent: raw.urgent === true };
}

// ---------- Putting it together ----------

// The whole answer for one request. ai is the function from ai.js, or null (demo replies only).
async function answer({ lang, messages }, ai = null) {
  // 1. Hide secrets in EVERY message the senior sent, not just the last one
  const safeMessages = messages.map(m => (m.role === "user" ? { ...m, text: hideSecrets(m.text).text } : m));
  const hidSecret = hideSecrets(messages[messages.length - 1].text).hidSecret;
  const topic = findTopic(safeMessages[safeMessages.length - 1].text);

  // 2 and 3. The AI's answer if it is good, otherwise the demo reply
  let result = null;
  if (ai) {
    try {
      result = checkAiReply(await ai(safeMessages, lang));
      if (!result) console.error("The AI's answer was not safe to show, so the demo reply was used.");
    } catch (err) {
      console.error(`The AI could not answer (${err.name === "AbortError" ? "too slow" : err.message}), so the demo reply was used.`);
    }
  }
  const source = result ? "ai" : "demo";
  if (!result) {
    const demo = DEMO[topic];
    result = { reply: demo.text[lang], actions: demo.actions.slice(), urgent: demo.urgent };
  }

  // 4. Money already sent or a code already given: always urgent, Freeze and Call OCBC first
  if (topic === "money") {
    result.urgent = true;
    result.actions = ["freeze", "call-ocbc", ...result.actions.filter(a => a !== "freeze" && a !== "call-ocbc")].slice(0, 3);
  }
  const reply = (hidSecret ? SECRET_WARNING[lang] + " " : "") + result.reply;
  return { reply, actions: result.actions, urgent: result.urgent, hidSecret, source };
}

// options.ai: for the tests. Normally the AI comes from server/.env (ai.js)
function chatRoutes(options = {}) {
  const ai = "ai" in options ? options.ai : createAi();
  const router = express.Router();
  router.post("/", async (req, res) => {
    let request;
    try {
      request = cleanRequest(req.body);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(await answer(request, ai));
  });
  return router;
}

module.exports = { chatRoutes, cleanRequest, hideSecrets, findTopic, checkAiReply, answer, ACTIONS, DEMO, SECRET_WARNING, LANGS };
