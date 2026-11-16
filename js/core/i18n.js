"use strict";

// Verify the Caller: languages (English, 中文, Bahasa Melayu).
// Owner: Jose. Shared by everyone: any screen can call t().
//
// Our users are seniors in Singapore, and many read Chinese or Malay more easily than English.
// Every piece of text a customer sees has a short key, for example "menu.home". t("menu.home")
// gives back that text in the language the customer picked.
//
// IMPORTANT: the Chinese and Malay below were drafted with AI help. A native speaker must check
// them before this is shown to real customers.
//
// How to translate your own screen (also in TEAM-FILES.md):
//   1. In your data file, add  text: { en: { "pv.title": "Pause" }, zh: { ... }, ms: { ... } }  to your _DATA.
//   2. At the top of your feature file:  addTranslations(PAUSE_VERIFY_DATA.text);
//   3. In your HTML:  <h1 tabindex="-1">${t("pv.title")}</h1>
// Start your keys with a short name for your feature ("pv.", "rp.") so they never clash.

// The languages we offer. locale is the full language code browsers and voices use.
const LANGUAGES = {
  en: { name: "English", locale: "en-SG" },
  zh: { name: "中文", locale: "zh-SG" },
  ms: { name: "Bahasa Melayu", locale: "ms-MY" }
};

// The localStorage key for the saved choice. It is separate from appState on purpose:
// #reset wipes appState, but a senior should not have to pick their language again.
const LANGUAGE_STORAGE_KEY = "vtc-language";

// The shared words: header, menu and buttons used on many screens.
// Each feature adds its own words with addTranslations(), from its own data file.
const I18N = {
  en: {
    "lang.label": "Language",
    "skip": "Skip to main content",
    "demo.title": "Student prototype.",
    "demo.text": "Not a real OCBC service. All data is made up.",
    "nav.customer": "Customer menu",
    "menu.home": "Home",
    "menu.myReports": "My reports",
    "menu.help": "Help",
    "header.readAloud": "Read aloud",
    "header.textSize": "Text size",
    "header.signOut": "Sign out",
    "textSize.normal": "normal text",
    "textSize.large": "large text",
    "textSize.larger": "extra large text",
    "callBar.question": "Want to talk to a real person?",
    "callBar.call": "Call OCBC",
    "common.callOcbcNumber": "Call OCBC {phone}",
    "common.backHome": "Back to home",
    "read.noVoice": "Sorry, this device has no voice for this language. Reading in English instead.",
    // The five result badges (badge() in helpers.js). Must match RESULTS[key].short there.
    "result.likely": "Likely AI-made",
    "result.partial": "Part AI-made",
    "result.uncertain": "Some signs",
    "result.unsure": "Not sure",
    "result.real": "Probably real"
  },
  zh: {
    "lang.label": "语言",
    "skip": "跳到主要内容",
    "demo.title": "学生作品。",
    "demo.text": "这不是真正的 OCBC 服务。所有资料都是虚构的。",
    "nav.customer": "客户菜单",
    "menu.home": "主页",
    "menu.myReports": "我的举报",
    "menu.help": "帮助",
    "header.readAloud": "朗读",
    "header.textSize": "字体大小",
    "header.signOut": "退出",
    "textSize.normal": "正常字体",
    "textSize.large": "大字体",
    "textSize.larger": "特大字体",
    "callBar.question": "想和真人说话吗？",
    "callBar.call": "打电话给 OCBC",
    "common.callOcbcNumber": "打电话给 OCBC {phone}",
    "common.backHome": "回到主页",
    "read.noVoice": "抱歉，这部设备没有中文语音。现在用英语朗读。",
    "result.likely": "很可能是 AI 做的",
    "result.partial": "部分是 AI 做的",
    "result.uncertain": "有一些迹象",
    "result.unsure": "不确定",
    "result.real": "可能是真的"
  },
  ms: {
    "lang.label": "Bahasa",
    "skip": "Langkau ke kandungan utama",
    "demo.title": "Prototaip pelajar.",
    "demo.text": "Bukan perkhidmatan OCBC sebenar. Semua data adalah rekaan.",
    "nav.customer": "Menu pelanggan",
    "menu.home": "Utama",
    "menu.myReports": "Laporan saya",
    "menu.help": "Bantuan",
    "header.readAloud": "Bacakan",
    "header.textSize": "Saiz tulisan",
    "header.signOut": "Log keluar",
    "textSize.normal": "tulisan biasa",
    "textSize.large": "tulisan besar",
    "textSize.larger": "tulisan paling besar",
    "callBar.question": "Mahu bercakap dengan orang sebenar?",
    "callBar.call": "Telefon OCBC",
    "common.callOcbcNumber": "Telefon OCBC {phone}",
    "common.backHome": "Kembali ke halaman utama",
    "read.noVoice": "Maaf, peranti ini tiada suara Bahasa Melayu. Kami akan baca dalam Bahasa Inggeris.",
    "result.likely": "Mungkin dibuat oleh AI",
    "result.partial": "Sebahagian dibuat oleh AI",
    "result.uncertain": "Ada beberapa tanda",
    "result.unsure": "Tidak pasti",
    "result.real": "Mungkin benar"
  }
};

// ---------- Picking and remembering the language ----------

// Reads the saved choice. Falls back to English if nothing is saved, the saved value is not
// one we know, or storage is blocked (a private window, or the Node tests, which have no browser).
function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (LANGUAGES[saved]) return saved;
  } catch (e) {
    // Storage is not available: just start in English
  }
  return "en";
}

let currentLanguage = loadLanguage();

function getLanguage() {
  return currentLanguage;
}

// The full code ("zh-SG"), for the <html lang> attribute, dates and the read aloud voice
function getLocale() {
  return LANGUAGES[currentLanguage].locale;
}

// Missing keys we have already warned about, so the console is not flooded on every redraw
const warnedKeys = new Set();

// Returns the text for key in the current language.
// values fills in blanks: t("common.callOcbcNumber", { phone: "1800 363 3333" }) puts the
// number where {phone} is. Values are put in as they are (not escaped), so a screen can pass
// a link; anything the customer typed must go through escapeHtml() first.
// If the current language has no text for this key, we show the English instead (better than
// a blank button) and warn in the console so the team notices and adds it.
function t(key, values = {}) {
  // Bank staff always get English (the staff console is English-only), even if a customer
  // picked another language earlier on this same device.
  const lang = typeof appState !== "undefined" && appState.role === "staff" ? "en" : currentLanguage;
  let text = I18N[lang][key];
  if (text === undefined) {
    if (!warnedKeys.has(lang + ":" + key)) {
      warnedKeys.add(lang + ":" + key);
      console.warn(`Missing translation: "${key}" in "${lang}". Showing English instead.`);
    }
    text = I18N.en[key];
  }
  if (text === undefined) return key;   // not even in English: show the key, so it is easy to spot
  return text.replace(/\{(\w+)\}/g, (blank, name) => (name in values ? values[name] : blank));
}

// Adds a feature's own words to the dictionary: strings is { en: {...}, zh: {...}, ms: {...} }.
// Each feature calls this from its own file, so nobody has to edit this shared file.
function addTranslations(strings) {
  Object.keys(strings).forEach(lang => {
    if (I18N[lang]) Object.assign(I18N[lang], strings[lang]);
  });
}

// Puts the language on the page itself: <html lang> tells screen readers and the browser how
// to pronounce the text, and elements outside the screens (the demo banner, the skip link)
// carry data-i18n="key" so they can be swapped too, because the router never redraws them.
function applyLanguage() {
  if (typeof document === "undefined") return;   // the Node tests have no page
  document.documentElement.lang = getLocale();
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
}

// Switches language, remembers it on this device, and draws the current screen again so the
// change shows straight away. redrawScreen() is the router's own redraw (router.js).
function setLanguage(lang) {
  if (!LANGUAGES[lang]) return;
  currentLanguage = lang;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    // Storage is blocked: the choice still works until the page is closed, it just isn't remembered
  }
  applyLanguage();
  if (typeof redrawScreen === "function" && document.querySelector("#app .screen")) redrawScreen();
}

// ---------- The language buttons (put in the customer header by helpers.js) ----------

// Three real buttons, so they work with Tab and Enter/Space without any extra code.
// Each name is written in its own language, because someone who can't read English must still
// find their language. lang="..." on each button makes screen readers pronounce it properly.
// aria-pressed says which one is switched on.
function languageSwitchHtml() {
  return `<div class="lang-switch" role="group" aria-label="${t("lang.label")}">
      ${Object.keys(LANGUAGES).map(lang =>
        `<button type="button" data-lang="${lang}" lang="${LANGUAGES[lang].locale}" aria-pressed="${lang === currentLanguage}">${LANGUAGES[lang].name}</button>`).join("")}
    </div>`;
}

if (typeof document !== "undefined") {
  // One listener for the whole page catches every language button, even on screens drawn later
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-lang]");
    if (!button) return;
    const lang = button.dataset.lang;
    setLanguage(lang);
    // Redrawing replaced the buttons and moved focus to the heading. Put keyboard focus back on
    // the button just pressed, so a keyboard user is not sent away from where they were.
    const again = document.querySelector(`[data-lang="${lang}"]`);
    if (again) again.focus();
  });

  // Put the saved language on the page as soon as it loads
  applyLanguage();
}

// Lets the Node tests (server/test/) use t(). Browsers skip this line.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { I18N, LANGUAGES, t, addTranslations, setLanguage, getLanguage, getLocale };
}
