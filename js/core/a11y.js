"use strict";

// Verify the Caller: accessibility helpers.
// Owner: SHARED (whole team). Talk to the team before changing this file.
// Text size (A / A+ / A++), read aloud, moving focus to the new screen's heading, and the
// skip link. Copied and adapted from the theme samples (shared/samples.js).

// ---------- Text size ----------

// [size name, button label]. The words a screen reader says come from i18n.js ("textSize.large").
const TEXT_SIZES = [["normal", "A"], ["large", "A+"], ["larger", "A++"]];

// The size in use right now, read from <html data-size="...">
function currentTextSize() {
  return document.documentElement.dataset.size || "normal";
}

// The three text size buttons. aria-pressed tells screen readers which one is switched on.
function textSizeHtml() {
  return `<div class="text-size" role="group" aria-label="${t("header.textSize")}">
      <span class="text-size-label" aria-hidden="true">${t("header.textSize")}</span>
      ${TEXT_SIZES.map(([size, label]) =>
        `<button type="button" data-size="${size}" aria-pressed="${size === currentTextSize()}">${label}<span class="visually-hidden"> ${t(`textSize.${size}`)}</span></button>`).join("")}
    </div>`;
}

// Changes the text size, updates the buttons, and remembers the choice on this device.
// (Kept in localStorage, like the language in i18n.js: they are personal settings, not demo data.)
function setTextSize(size) {
  document.documentElement.dataset.size = size;
  document.querySelectorAll(".text-size button").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.size === size));
  });
  try {
    localStorage.setItem("vtc-text-size", size);
  } catch (e) {
    // Storage is blocked (for example in a private window): the size just isn't remembered
  }
}

// Puts back the size chosen last time, or normal if there isn't one
function loadTextSize() {
  let saved = "normal";
  try {
    saved = localStorage.getItem("vtc-text-size") || "normal";
  } catch (e) {
    // Storage is blocked: start at normal size
  }
  setTextSize(saved);
}

// ---------- Read aloud, with the browser's own built-in voice ----------

const canSpeak = "speechSynthesis" in window;

// The "Read aloud" button for the customer header. Returns nothing if the browser can't speak.
function readAloudButtonHtml() {
  if (!canSpeak) return "";
  return `<button type="button" class="tool-btn" data-action="read" aria-pressed="false">${icon("speaker")}<span class="tool-label">${t("header.readAloud")}</span></button>`;
}

// ---------- Read-along: the word being spoken is highlighted (added on frontend-update) ----------
// Each word in the areas being read is wrapped in <span class="w"> (once per area). Each word
// remembers where it starts in the text being spoken, so the browser's "now at character N"
// (boundary) event can be matched to the word on screen. Some voices never send boundary
// events: then, if none arrives within 700 ms of starting, the highlight moves on a timer instead.

let readWords = [];           // [{ span, start }] in reading order
let readFallbackTimer = null;
let readGotBoundary = false;
let readingNow = false;
let currentTalk = null;       // the reading in progress, so a cancelled one's late events are ignored

// Text that should never be wrapped or read: form boxes, code, and anything hidden from screen readers
const READ_SKIP = "textarea, select, option, script, style, [aria-hidden='true']";

// What to read on the current screen: every element marked data-read, in order.
// If a screen marks nothing, it reads the heading and the first paragraph.
function readAreas() {
  const marked = [...document.querySelectorAll("#app [data-read]")];
  if (marked.length) return marked;
  const main = document.querySelector("#app main");
  if (!main) return [];
  return [main.querySelector("h1"), main.querySelector("p")].filter(Boolean);
}

// Wraps each word of one area in <span class="w">, once
function wrapWords(area) {
  if (area.dataset.wrapped) return;
  const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.nodeValue.trim() && !node.parentElement.closest(READ_SKIP) && !node.parentElement.closest(".w")
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const pieces = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(piece => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) { pieces.appendChild(document.createTextNode(piece)); return; }
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = piece;
      pieces.appendChild(span);
    });
    node.parentNode.replaceChild(pieces, node);
  });
  area.dataset.wrapped = "yes";
}

// Wraps the words and builds the text to speak, remembering where each word starts in it
function prepareWords() {
  readWords = [];
  let text = "";
  readAreas().forEach(area => {
    wrapWords(area);
    area.querySelectorAll(".w").forEach(span => {
      // Skip words that can't be seen (for example visually-hidden helper text, or a hidden box)
      if (span.closest(".visually-hidden, [hidden]")) return;
      readWords.push({ span, start: text.length });
      text += span.textContent + " ";
    });
    text += "\n";
  });
  return text;
}

function clearWordMark() {
  document.querySelectorAll(".w.now").forEach(span => span.classList.remove("now"));
}

// Highlights one word. Only scrolls when the word is near the top or bottom edge of the screen.
function markWord(i) {
  clearWordMark();
  const word = readWords[i];
  if (!word) return;
  word.span.classList.add("now");
  const box = word.span.getBoundingClientRect();
  if (box.top < 80 || box.bottom > window.innerHeight - 90) {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    word.span.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
  }
}

// The last word that starts at or before this character position
function wordAt(charIndex) {
  let found = 0;
  for (let i = 0; i < readWords.length; i++) {
    if (readWords[i].start <= charIndex) found = i; else break;
  }
  return found;
}

// For voices that never send word events: move the highlight on a timer, guessing how long
// each word takes to say at this speed (longer words, and a pause after punctuation).
// Chinese is written without spaces, so one "word" here can be a whole phrase. Each Chinese
// character is a syllable and takes much longer to say than one English letter, so it gets
// more time (about 4 characters a second), or the highlight would race ahead of the voice.
function startWordTimer(rate) {
  let i = 0;
  function step() {
    if (!readingNow || readGotBoundary || i >= readWords.length) return;
    markWord(i);
    const word = readWords[i].span.textContent;
    const chinese = (word.match(/[一-鿿]/g) || []).length;
    const pause = /[.,?!:;。，？！：；]$/.test(word) ? 260 : 0;
    i += 1;
    readFallbackTimer = setTimeout(step, (180 + (word.length - chinese) * 55 + chinese * 230 + pause) / rate);
  }
  step();
}

// The voices we would like for each language, best first (see LANGUAGES in i18n.js)
const VOICE_LANGS = { en: ["en-SG", "en-GB"], zh: ["zh-CN", "zh-SG"], ms: ["ms-MY"] };

// Finds a voice for one language. Some phones write "zh_CN" instead of "zh-CN", so we tidy that first.
// On-device voices are preferred: they are the ones most likely to report each word as it is
// spoken, which keeps the word highlighting exact.
function voiceFor(lang, voices) {
  const mine = voices.filter(v => v.lang && v.lang.replace("_", "-").startsWith(lang));
  for (const wanted of VOICE_LANGS[lang]) {
    const exact = mine.filter(v => v.lang.replace("_", "-") === wanted);
    const found = exact.find(v => v.localService) || exact[0];
    if (found) return found;
  }
  return mine.find(v => v.localService) || mine[0] || null;
}

// The voice for the language the customer picked. If this device has no voice for it, an
// English one, and fellBack: true so we can say so politely.
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const lang = getLanguage();
  const voice = voiceFor(lang, voices);
  if (voice || lang === "en") return { voice, fellBack: false };
  // No voices listed at all means the browser hasn't loaded them yet, not that the language is
  // missing. Then we don't warn: the browser picks a voice from talk.lang by itself.
  return { voice: voiceFor("en", voices), fellBack: voices.length > 0 };
}

function setReading(on) {
  readingNow = on;
  document.querySelectorAll('[data-action="read"]').forEach(b => b.setAttribute("aria-pressed", String(on)));
  const app = document.getElementById("app");
  if (app) app.classList.toggle("is-reading", on);
}

// Stops speaking, clears the highlight and shows every Read aloud button as off.
// The router calls this on every screen change.
function stopReading() {
  currentTalk = null;
  if (canSpeak) speechSynthesis.cancel();
  clearTimeout(readFallbackTimer);
  clearWordMark();
  setReading(false);
}

// Starts reading, or stops if it is already reading
function toggleReading() {
  if (readingNow || speechSynthesis.speaking) {
    stopReading();
    return;
  }
  speechSynthesis.cancel();
  const text = prepareWords();
  if (!readWords.length) return;
  const talk = new SpeechSynthesisUtterance(text);
  talk.rate = 0.9;   // a little slower than normal, for older listeners
  talk.lang = getLocale();   // used if no voice can be chosen below
  const { voice, fellBack } = pickVoice();
  if (voice) { talk.voice = voice; talk.lang = voice.lang; }
  if (fellBack) showToast(t("read.noVoice"));   // say why it sounds English, instead of leaving them puzzled
  readGotBoundary = false;
  currentTalk = talk;
  // Events from an older, cancelled reading are ignored, so they can't stop this one
  const mine = handler => event => { if (currentTalk === talk) handler(event); };
  talk.onboundary = mine(event => {
    if (event.name && event.name !== "word") return;
    readGotBoundary = true;
    clearTimeout(readFallbackTimer);
    markWord(wordAt(event.charIndex));
  });
  talk.onstart = mine(() => {
    setTimeout(() => { if (currentTalk === talk && readingNow && !readGotBoundary) startWordTimer(talk.rate); }, 700);
  });
  talk.onend = mine(stopReading);
  talk.onerror = mine(stopReading);
  setReading(true);
  speechSynthesis.speak(talk);
}

// Some browsers load their voices a moment after the page. Ask once so they are ready.
if (canSpeak) speechSynthesis.getVoices();

// ---------- Focus ----------

// Moves keyboard and screen reader focus to the new screen's heading, so they start reading
// there. The router calls this after every screen change except the first page load.
function focusHeading() {
  const heading = document.querySelector("#app h1");
  if (heading) heading.focus();
}

// ---------- Wiring up: one listener for the whole page ----------

document.addEventListener("click", event => {
  const el = event.target.closest("a, button");
  if (!el) return;
  if (el.classList.contains("skip-link")) {
    event.preventDefault();   // keep the address as it is, so the screen does not change
    const main = document.querySelector("#app main");
    if (main) main.focus();
  } else if (el.dataset.size) {
    setTextSize(el.dataset.size);
  } else if (el.dataset.action === "read") {
    toggleReading();
  }
});

loadTextSize();
