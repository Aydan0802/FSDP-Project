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
    "nav.back": "Back",
    "nav.main": "Main menu",
    "nav.tabs": "Quick menu",
    "tab.home": "Home",
    "tab.check": "Check",
    "tab.helpNow": "Help now",
    "tab.learn": "Learn",
    "tab.menu": "Menu",
    "side.close": "Close menu",
    "side.urgent": "Someone is calling me now",
    "side.group.now": "Need help now?",
    "side.group.check": "Check before you act",
    "side.group.ready": "Be ready",
    "side.freeze": "Freeze my accounts",
    "side.analyser": "Check a message or call",
    "side.callMatch": "Is the bank really calling?",
    "side.callerCheck": "Is the caller a real person?",
    "side.riskScorer": "Check a transfer",
    "side.passphrase": "Family passphrase",
    "side.learnSigns": "Learn the signs",
    "side.report": "Report a scam",
    "side.display": "Language and text size",
    "side.signedInAs": "Signed in as {name}",
    "side.signedIn": "You are signed in",
    "side.signInHint": "Use your user ID, mobile number or name, and your password or PIN.",
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
    "header.signIn": "Sign in",
    "header.signedOut": "You have signed out.",
    "lock.tag": "Sign in needed",
    "lang.autoPicked": "Showing English. You can change the language at the top.",
    "textSize.normal": "normal text",
    "textSize.large": "large text",
    "textSize.larger": "extra large text",
    "callBar.question": "Want to talk to a real person?",
    "callBar.call": "Call OCBC",
    "common.callOcbcNumber": "Call OCBC {phone}",
    "common.backHome": "Back to home",
    "read.noVoice": "Sorry, this device has no voice for this language. Reading in English instead.",
    "read.stop": "Stop",
    "read.stopReading": "Stop reading",
    // The five result badges (badge() in helpers.js). Must match RESULTS[key].short there.
    "result.likely": "Likely AI-made",
    "result.partial": "Part AI-made",
    "result.uncertain": "Some signs",
    "result.unsure": "Not sure",
    "result.real": "Probably real"
  },
  zh: {
    "nav.back": "返回",
    "nav.main": "主菜单",
    "nav.tabs": "快捷菜单",
    "tab.home": "主页",
    "tab.check": "检查",
    "tab.helpNow": "紧急求助",
    "tab.learn": "学习",
    "tab.menu": "菜单",
    "side.close": "关闭菜单",
    "side.urgent": "现在有人打电话给我",
    "side.group.now": "现在需要帮忙吗？",
    "side.group.check": "行动前先检查",
    "side.group.ready": "做好准备",
    "side.freeze": "冻结我的户口",
    "side.analyser": "检查信息或电话",
    "side.callMatch": "真的是银行打来的吗？",
    "side.callerCheck": "打电话来的是真人吗？",
    "side.riskScorer": "检查转账",
    "side.passphrase": "家人暗号",
    "side.learnSigns": "认识诈骗迹象",
    "side.report": "举报诈骗",
    "side.display": "语言和字体大小",
    "side.signedInAs": "已登录：{name}",
    "side.signedIn": "您已登录",
    "side.signInHint": "用用户名、手机号码或名字，加上密码或 PIN 登录。",
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
    "header.signIn": "登录",
    "header.signedOut": "您已退出。",
    "lock.tag": "需要登录",
    "lang.autoPicked": "您的手机用中文，所以这里也用中文显示。可以在上方更改语言。",
    "textSize.normal": "正常字体",
    "textSize.large": "大字体",
    "textSize.larger": "特大字体",
    "callBar.question": "想和真人说话吗？",
    "callBar.call": "打电话给 OCBC",
    "common.callOcbcNumber": "打电话给 OCBC {phone}",
    "common.backHome": "回到主页",
    "read.noVoice": "抱歉，这部设备没有中文语音。现在用英语朗读。",
    "read.stop": "停止",
    "read.stopReading": "停止朗读",
    "result.likely": "很可能是 AI 做的",
    "result.partial": "部分是 AI 做的",
    "result.uncertain": "有一些迹象",
    "result.unsure": "不确定",
    "result.real": "可能是真的"
  },
  ms: {
    "nav.back": "Kembali",
    "nav.main": "Menu utama",
    "nav.tabs": "Menu pantas",
    "tab.home": "Utama",
    "tab.check": "Semak",
    "tab.helpNow": "Bantuan",
    "tab.learn": "Belajar",
    "tab.menu": "Menu",
    "side.close": "Tutup menu",
    "side.urgent": "Ada orang sedang telefon saya",
    "side.group.now": "Perlu bantuan sekarang?",
    "side.group.check": "Semak sebelum bertindak",
    "side.group.ready": "Bersedia",
    "side.freeze": "Bekukan akaun saya",
    "side.analyser": "Semak mesej atau panggilan",
    "side.callMatch": "Betulkah bank yang telefon?",
    "side.callerCheck": "Adakah pemanggil orang sebenar?",
    "side.riskScorer": "Semak pindahan",
    "side.passphrase": "Kata laluan keluarga",
    "side.learnSigns": "Kenali tanda-tanda",
    "side.report": "Laporkan penipuan",
    "side.display": "Bahasa dan saiz tulisan",
    "side.signedInAs": "Log masuk sebagai {name}",
    "side.signedIn": "Anda telah log masuk",
    "side.signInHint": "Gunakan ID pengguna, nombor telefon bimbit atau nama, serta kata laluan atau PIN.",
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
    "header.signIn": "Log masuk",
    "header.signedOut": "Anda telah log keluar.",
    "lock.tag": "Perlu log masuk",
    "lang.autoPicked": "Telefon anda menggunakan Bahasa Melayu, jadi kami tunjukkan dalam Bahasa Melayu. Anda boleh tukar bahasa di atas.",
    "textSize.normal": "tulisan biasa",
    "textSize.large": "tulisan besar",
    "textSize.larger": "tulisan paling besar",
    "callBar.question": "Mahu bercakap dengan orang sebenar?",
    "callBar.call": "Telefon OCBC",
    "common.callOcbcNumber": "Telefon OCBC {phone}",
    "common.backHome": "Kembali ke halaman utama",
    "read.noVoice": "Maaf, peranti ini tiada suara Bahasa Melayu. Kami akan baca dalam Bahasa Inggeris.",
    "read.stop": "Berhenti",
    "read.stopReading": "Berhenti membaca",
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
// On a first visit (nothing saved), it looks at the language the phone or computer is set to:
// a senior whose phone is in Chinese sees Chinese straight away, without hunting for the menu.
function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (LANGUAGES[saved]) return saved;
  } catch (e) {
    // Storage is not available: fall through to the device's language
  }
  return deviceLanguage() || "en";
}

// "zh" or "ms" if the device's preferred language is Chinese or Malay, otherwise "".
// navigator.languages is the browser's list, most preferred first, e.g. ["zh-SG", "en"].
function deviceLanguage() {
  if (typeof navigator === "undefined" || !navigator.languages) return "";
  const first = String(navigator.languages[0] || "").toLowerCase();
  if (first.startsWith("zh")) return "zh";
  if (first.startsWith("ms")) return "ms";
  return "";
}

let currentLanguage = loadLanguage();
// True when the language came from the device rather than a choice the person made. The page
// then shows a short note saying so, once (see the bottom of this file).
let languageWasGuessed = currentLanguage !== "en";
try {
  if (localStorage.getItem(LANGUAGE_STORAGE_KEY)) languageWasGuessed = false;
} catch (e) {
  // Storage is blocked: keep the guess
}

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

// ---------- The language picker (put in the customer header by helpers.js) ----------

// One drop-down instead of three buttons, so the header has less to read.
// It is a real <select>: phones open their own big, easy list, and it works
// with Tab and the arrow keys without any extra code. The globe is the sign for "language" that
// people know even when they can't read the words. Each name is written in its own language,
// and lang="..." on each option makes screen readers pronounce it properly.
// where ("top", "side" or empty) says which copy this is when a screen shows two (the top bar
// and the sidebar), so focus goes back to the same one after switching.
function languageSwitchHtml(where = "") {
  return `<label class="lang-pick${where ? ` lang-pick--${where}` : ""}">
      ${icon("globe", "lang-globe")}
      <span class="visually-hidden">${t("lang.label")}</span>
      <select data-lang-select="${where}">
        ${Object.keys(LANGUAGES).map(lang =>
          `<option value="${lang}" lang="${LANGUAGES[lang].locale}"${lang === currentLanguage ? " selected" : ""}>${LANGUAGES[lang].name}</option>`).join("")}
      </select>
      ${icon("caret", "lang-caret")}
    </label>`;
}

if (typeof document !== "undefined") {
  // One listener for the whole page catches the picker, even on screens drawn later
  document.addEventListener("change", event => {
    const select = event.target.closest("[data-lang-select]");
    if (!select) return;
    const where = select.dataset.langSelect;
    setLanguage(select.value);
    // Redrawing replaced the picker and moved focus to the heading. Put keyboard focus back on
    // the same picker, so a keyboard user is not sent away from where they were.
    const again = document.querySelector(`[data-lang-select="${where}"]`);
    if (again) again.focus();
  });

  // Put the saved language on the page as soon as it loads
  applyLanguage();

  // If the language was picked from the device, say so once, so nobody is confused about why
  // the page is not in English. showToast() is in helpers.js, which has loaded by then.
  document.addEventListener("DOMContentLoaded", () => {
    if (languageWasGuessed && typeof showToast === "function") setTimeout(() => showToast(t("lang.autoPicked")), 600);
  });
}

// Lets the Node tests (server/test/) use t(). Browsers skip this line.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { I18N, LANGUAGES, t, addTranslations, setLanguage, getLanguage, getLocale };
}
