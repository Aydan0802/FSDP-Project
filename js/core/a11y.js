"use strict";

// Verify the Caller: accessibility helpers.
// Owner: SHARED (whole team). Talk to the team before changing this file.
// Text size (A / A+ / A++), read aloud, moving focus to the new screen's heading, and the
// skip link. Copied and adapted from the theme samples (shared/samples.js).

// ---------- Text size ----------

// [size name, button label, words a screen reader says]
const TEXT_SIZES = [["normal", "A", "normal"], ["large", "A+", "large"], ["larger", "A++", "extra large"]];

// The size in use right now, read from <html data-size="...">
function currentTextSize() {
  return document.documentElement.dataset.size || "normal";
}

// The three text size buttons. aria-pressed tells screen readers which one is switched on.
function textSizeHtml() {
  return `<div class="text-size" role="group" aria-label="Text size">
      <span class="text-size-label" aria-hidden="true">Text size</span>
      ${TEXT_SIZES.map(([size, label, words]) =>
        `<button type="button" data-size="${size}" aria-pressed="${size === currentTextSize()}">${label}<span class="visually-hidden"> ${words} text</span></button>`).join("")}
    </div>`;
}

// Changes the text size, updates the buttons, and remembers the choice on this device.
// (This is the one thing kept in localStorage: it is a personal setting, not demo data.)
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
  return `<button type="button" class="tool-btn" data-action="read" aria-pressed="false">${icon("speaker")}<span class="tool-label">Read aloud</span></button>`;
}

// Stops speaking and shows every Read aloud button as off. The router calls this on every screen change.
function stopReading() {
  if (canSpeak) speechSynthesis.cancel();
  document.querySelectorAll('[data-action="read"]').forEach(b => b.setAttribute("aria-pressed", "false"));
}

// What to read on the current screen: every element marked data-read, in order.
// If a screen marks nothing, it reads the heading and the first paragraph.
function textToRead() {
  const marked = [...document.querySelectorAll("#app [data-read]")];
  if (marked.length) return marked.map(el => el.innerText).join("\n");
  const main = document.querySelector("#app main");
  if (!main) return "";
  return [main.querySelector("h1"), main.querySelector("p")].filter(Boolean).map(el => el.innerText).join("\n");
}

// Starts reading, or stops if it is already reading
function toggleReading(button) {
  if (speechSynthesis.speaking) {
    stopReading();
    return;
  }
  const talk = new SpeechSynthesisUtterance(textToRead());
  talk.rate = 0.9;   // a little slower than normal, for older listeners
  talk.onend = stopReading;
  button.setAttribute("aria-pressed", "true");
  speechSynthesis.speak(talk);
}

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
    toggleReading(el);
  }
});

loadTextSize();
