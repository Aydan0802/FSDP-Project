"use strict";

// Tests for the AI helper chat API (server/chat.js). Owner: Jose.
// Run from the server folder:  npm test
// These test the safety rules and the demo replies, so they need no AI key and no internet.

const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanRequest, hideSecrets, findTopic, answer, ACTIONS, DEMO, SECRET_WARNING, LANGS } = require("../chat.js");
const { createApp } = require("../app.js");

const ask = (text, lang = "en") => answer({ lang, messages: [{ role: "user", text }] });

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

test("a hidden secret puts a warning in front of the reply, in the senior's language", () => {
  for (const lang of LANGS) {
    const result = ask("He wants the code 482915", lang);
    assert.equal(result.hidSecret, true);
    assert.ok(result.reply.startsWith(SECRET_WARNING[lang]), lang);
    assert.ok(!result.reply.includes("482915"));
  }
});

// ---------- What the senior is talking about ----------

test("money already sent, or a code already given, is urgent in all four languages", () => {
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
  const result = ask("I already sent money to him");
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

test("the reply follows the language picked", () => {
  assert.equal(ask("Hello", "zh").reply, DEMO.general.text.zh);
  assert.equal(ask("Hello", "ta").reply, DEMO.general.text.ta);
});

// ---------- The API ----------

async function withServer(run) {
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
