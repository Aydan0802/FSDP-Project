"use strict";

// Tests for the AI helper chat API (server/chat.js). Owner: Jose.
// Run from the server folder:  npm test
// These test the safety rules and the demo replies, so they need no AI key and no internet.

const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanRequest, hideSecrets, findTopic, checkAiReply, answer, ACTIONS, DEMO, SECRET_WARNING, LANGS } = require("../chat.js");
const { createAi, systemPrompt, BUTTONS } = require("../ai.js");
const { createApp } = require("../app.js");

// ai: a pretend AI for the tests (null = demo replies only)
const ask = (text, lang = "en", ai = null) => answer({ lang, messages: [{ role: "user", text }] }, ai);

// ---------- Checking the request ----------

test("a request needs a list of messages ending with the user's", () => {
  assert.throws(() => cleanRequest({}), /messages/);
  assert.throws(() => cleanRequest({ messages: [] }), /messages/);
  assert.throws(() => cleanRequest({ messages: [{ role: "user", text: "   " }] }), /last message/);
  assert.throws(() => cleanRequest({ messages: [{ role: "bot", text: "Hi" }] }), /last message/);
  assert.throws(() => cleanRequest({ messages: [{ role: "admin", text: "Hi" }] }), /role/);
});

test("an unknown language becomes English, and long chats and messages are cut down", () => {
  const long = { role: "user", text: "a".repeat(2000) };
  const many = Array.from({ length: 30 }, () => long);
  const { lang, messages } = cleanRequest({ lang: "fr", messages: many });
  assert.equal(lang, "en");
  assert.equal(messages.length, 12);
  assert.equal(messages[0].text.length, 500);
});

// ---------- Hiding secrets ----------

test("OTPs, card numbers and NRICs are hidden; phone numbers are not", () => {
  assert.deepEqual(hideSecrets("My OTP is 482915"), { text: "My OTP is [hidden]", hidSecret: true });
  assert.equal(hideSecrets("card 4111 1111 1111 1111 ok").text, "card [hidden] ok");
  assert.equal(hideSecrets("my IC is S1234567D").text, "my IC is [hidden]");
  assert.equal(hideSecrets("验证码是123456").text, "验证码是[hidden]");
  assert.deepEqual(hideSecrets("6363 3333 called me"), { text: "6363 3333 called me", hidSecret: false });
});

test("a secret the phone already hid still gets the reminder", async () => {
  const result = await ask("He wants the OTP [hidden]");
  assert.equal(result.hidSecret, true);
  assert.ok(result.reply.startsWith(SECRET_WARNING.en));
});

test("a hidden secret puts a warning in front of the reply, in the senior's language", async () => {
  for (const lang of LANGS) {
    const result = await ask("He wants the code 482915", lang);
    assert.equal(result.hidSecret, true);
    assert.ok(result.reply.startsWith(SECRET_WARNING[lang]), lang);
    assert.ok(!result.reply.includes("482915"));
  }
});

// ---------- What the senior is talking about ----------

test("money already sent, or a code already given, is urgent in all four languages", async () => {
  for (const text of [
    "I already sent money to him",
    "I gave them the OTP just now",
    "我已经转了钱给他",
    "我给了他验证码",
    "我把验证码告诉了他",
    "Saya sudah hantar wang kepada dia",
    "நான் பணம் அனுப்பிவிட்டேன்",
    "OTP கொடுத்துவிட்டேன்"
  ]) {
    assert.equal(findTopic(text), "money", text);
  }
  const result = await ask("I already sent money to him");
  assert.equal(result.urgent, true);
  assert.deepEqual(result.actions.slice(0, 2), ["freeze", "call-ocbc"]);
});

test("being asked for money is a call to check, not an emergency", () => {
  assert.equal(findTopic("Someone called and asked me to send money"), "calling");
  assert.equal(findTopic("அவர் பணம் அனுப்பச் சொன்னார், தொலைபேசியில்"), "calling");
});

test("calls, messages and anything else get the right topic", () => {
  assert.equal(findTopic("A man called saying he is from OCBC"), "calling");
  assert.equal(findTopic("有人打电话说是警察"), "calling");
  assert.equal(findTopic("I got an SMS with a link"), "message");
  assert.equal(findTopic("Saya dapat mesej WhatsApp pelik"), "message");
  assert.equal(findTopic("எனக்கு ஒரு விசித்திரமான குறுஞ்செய்தி வந்தது"), "message");
  assert.equal(findTopic("Hello"), "general");
});

// ---------- The replies ----------

test("every demo reply has words in all four languages and only allowed buttons", () => {
  for (const [topic, demo] of Object.entries(DEMO)) {
    for (const lang of LANGS) assert.ok(demo.text[lang] && demo.text[lang].length > 10, `${topic} ${lang}`);
    for (const action of demo.actions) assert.ok(ACTIONS.includes(action), `${topic}: ${action}`);
  }
  for (const lang of LANGS) assert.ok(SECRET_WARNING[lang], lang);
});

test("the reply follows the language picked", async () => {
  assert.equal((await ask("Hello", "zh")).reply, DEMO.general.text.zh);
  assert.equal((await ask("Hello", "ta")).reply, DEMO.general.text.ta);
});

// ---------- The AI (server/ai.js), with a pretend AI so no Ollama is needed ----------

test("a good AI answer is used, with only our buttons", async () => {
  const ai = async () => ({ reply: "Please hang up and call OCBC on 6363 3333.", actions: ["calling-now", "hack-the-bank", "call-ocbc", "calling-now"], urgent: false });
  const result = await ask("A man says he is from OCBC", "en", ai);
  assert.equal(result.source, "ai");
  assert.equal(result.reply, "Please hang up and call OCBC on 6363 3333.");
  assert.deepEqual(result.actions, ["calling-now", "call-ocbc"]);
});

test("an AI answer with a link or a made-up phone number is thrown away", () => {
  assert.equal(checkAiReply({ reply: "Go to ocbc-help.com now", actions: [], urgent: false }), null);
  assert.equal(checkAiReply({ reply: "Visit https://x.y", actions: [], urgent: false }), null);
  assert.equal(checkAiReply({ reply: "Call our officer on 8123 4567", actions: [], urgent: false }), null);
  assert.ok(checkAiReply({ reply: "Call 1800 363 3333, or +65 6363 3333, or ScamShield 1799.", actions: [], urgent: false }));
  assert.equal(checkAiReply({ reply: "", actions: [], urgent: false }), null);
  assert.equal(checkAiReply("not an object"), null);
});

test("if the AI is broken, slow or unsafe, the demo reply is used instead", async () => {
  const broken = async () => { throw new Error("connection refused"); };
  const unsafe = async () => ({ reply: "Visit www.claim-refund.com", actions: [], urgent: false });
  for (const ai of [broken, unsafe]) {
    const result = await ask("I got an SMS with a link", "ms", ai);
    assert.equal(result.source, "demo");
    assert.equal(result.reply, DEMO.message.text.ms);
  }
});

test("money already sent stays urgent with Freeze and Call OCBC, whatever the AI says", async () => {
  const relaxed = async () => ({ reply: "That sounds fine.", actions: ["learn-signs"], urgent: false });
  const result = await ask("I already transferred the money", "en", relaxed);
  assert.equal(result.urgent, true);
  assert.deepEqual(result.actions, ["freeze", "call-ocbc", "learn-signs"]);
});

test("the AI never sees a code the senior typed, in any message", async () => {
  let seen = null;
  const spy = async messages => { seen = messages; return { reply: "Never share your OTP.", actions: [], urgent: false }; };
  await answer({ lang: "en", messages: [
    { role: "user", text: "My card is 4111 1111 1111 1111" },
    { role: "bot", text: "Please don't share that." },
    { role: "user", text: "He wants the OTP 482915" }
  ] }, spy);
  assert.ok(!JSON.stringify(seen).includes("482915"));
  assert.ok(!JSON.stringify(seen).includes("4111"));
});

test("createAi is off with no Gemini key and no OLLAMA_MODEL, and asks Ollama for our reply shape when it is set", async () => {
  assert.equal(createAi({}), null);
  let sent = null;
  const fakeOllama = async (url, options) => {
    sent = { url, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ message: { content: '{"reply":"Hang up.","actions":["calling-now"],"urgent":false}' } }) };
  };
  const ai = createAi({ OLLAMA_MODEL: "gemma3:4b" }, fakeOllama);
  const answerFromAi = await ai([{ role: "user", text: "Hi" }, { role: "bot", text: "Hello" }, { role: "user", text: "Help" }], "ta");
  assert.deepEqual(answerFromAi, { reply: "Hang up.", actions: ["calling-now"], urgent: false });
  assert.equal(sent.url, "http://localhost:11434/api/chat");
  assert.equal(sent.body.model, "gemma3:4b");
  assert.equal(sent.body.stream, false);
  assert.deepEqual(sent.body.format.required, ["reply", "actions", "urgent"]);
  assert.equal(sent.body.messages[0].role, "system");
  assert.match(sent.body.messages[0].content, /Reply ONLY in Tamil/);
  assert.deepEqual(sent.body.messages.slice(1).map(m => m.role), ["user", "assistant", "user"]);
});

test("with OLLAMA_API_KEY it calls Ollama Cloud with the key, and reads JSON even inside ```json", async () => {
  const { readJson } = require("../ai.js");
  let sent = null;
  const fakeCloud = async (url, options) => {
    sent = { url, headers: options.headers, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ message: { content: 'Sure!\n```json\n{"reply":"Hang up now.","actions":["calling-now"],"urgent":false}\n```' } }) };
  };
  const ai = createAi({ OLLAMA_MODEL: "gpt-oss:20b", OLLAMA_API_KEY: "test-key" }, fakeCloud);
  assert.deepEqual(await ai([{ role: "user", text: "Help" }], "en"), { reply: "Hang up now.", actions: ["calling-now"], urgent: false });
  assert.equal(sent.url, "https://ollama.com/api/chat");
  assert.equal(sent.headers.Authorization, "Bearer test-key");
  assert.equal(sent.body.format, undefined);   // Ollama Cloud doesn't support structured outputs
  assert.throws(() => readJson("no json here"), /JSON/);
});

test("with GEMINI_API_KEY it uses Gemini first, with the key in a header and our reply shape", async () => {
  let sent = null;
  const fakeGemini = async (url, options) => {
    sent = { url, headers: options.headers, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [
      { text: "Let me think...", thought: true },
      { text: '{"reply":"Hang up now.","actions":["calling-now"],"urgent":false}' }
    ] } }] }) };
  };
  const ai = createAi({ GEMINI_API_KEY: "test-key", OLLAMA_MODEL: "gemma3:4b" }, fakeGemini);
  const answerFromAi = await ai([{ role: "user", text: "Hi" }, { role: "bot", text: "Hello" }, { role: "user", text: "Help" }], "zh");
  assert.deepEqual(answerFromAi, { reply: "Hang up now.", actions: ["calling-now"], urgent: false });
  assert.equal(sent.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
  assert.equal(sent.headers["x-goog-api-key"], "test-key");
  assert.ok(!sent.url.includes("test-key"));   // the key is never in the link
  assert.match(sent.body.systemInstruction.parts[0].text, /Reply ONLY in Simplified Chinese/);
  assert.deepEqual(sent.body.contents.map(c => c.role), ["user", "model", "user"]);
  assert.equal(sent.body.generationConfig.responseMimeType, "application/json");
  assert.deepEqual(sent.body.generationConfig.responseJsonSchema.required, ["reply", "actions", "urgent"]);
});

test("GEMINI_MODEL picks the model, and a Gemini error or blocked answer becomes an error", async () => {
  let url = null;
  const busy = createAi({ GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-3.8-flash" }, async u => { url = u; return { ok: false, status: 429 }; });
  await assert.rejects(() => busy([{ role: "user", text: "Help" }], "en"), /Gemini answered 429/);
  assert.match(url, /\/gemini-3\.8-flash:generateContent$/);
  const blocked = createAi({ GEMINI_API_KEY: "k" }, async () => ({ ok: true, json: async () => ({ promptFeedback: { blockReason: "SAFETY" } }) }));
  await assert.rejects(() => blocked([{ role: "user", text: "Help" }], "en"), /JSON/);
});

test("the AI's buttons and chat.js's buttons are the same list", () => {
  assert.deepEqual(Object.keys(BUTTONS).sort(), ACTIONS.slice().sort());
  for (const lang of LANGS) assert.ok(systemPrompt(lang).length > 200);
});

// ---------- The API ----------

async function withServer(run) {
  delete process.env.OLLAMA_MODEL;   // the API test uses the demo replies, even on a computer with an AI set up
  delete process.env.GEMINI_API_KEY;
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
}

const post = (base, body) => fetch(`${base}/api/chat`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
});

test("POST /api/chat answers, and refuses a bad request with 400", async () => {
  await withServer(async base => {
    const res = await post(base, { lang: "ms", messages: [{ role: "user", text: "Ada orang telefon kata dari bank" }] });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.source, "demo");
    assert.equal(body.reply, DEMO.calling.text.ms);
    assert.deepEqual(body.actions, DEMO.calling.actions);

    const bad = await post(base, { messages: "hello" });
    assert.equal(bad.status, 400);
    assert.match((await bad.json()).error, /messages/);
  });
});
