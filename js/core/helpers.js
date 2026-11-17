"use strict";

// Pause & Prove: shared helpers.
// Owner: SHARED (whole team). Talk to the team before changing this file.
// Small pieces that many screens use: icons, the five result badges, the brand, the customer
// and staff page frames (header and menu), and the stub screen. Copied and adapted from the
// theme samples (shared/samples.js). Every function here returns a string of HTML.

// ---------- The five results, told apart by icon and words as well as colour ----------

const RESULTS = {
  likely: { short: "Likely AI-made", icon: "warning" },
  partial: { short: "Part AI-made", icon: "warning" },
  uncertain: { short: "Some signs", icon: "question" },
  unsure: { short: "Not sure", icon: "dash" },
  real: { short: "Probably real", icon: "check" }
};

// ---------- Icons: small line drawings, 24 x 24 ----------

const ICONS = {
  check: '<circle cx="12" cy="12" r="9.5"/><path d="M8 12.5l2.7 2.7L16.2 9.5"/>',
  question: '<circle cx="12" cy="12" r="9.5"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><path d="M12 17h.01"/>',
  warning: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5"/><path d="M12 17.3h.01"/>',
  dash: '<circle cx="12" cy="12" r="9.5"/><path d="M8 12h8"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  wave: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
  phone: '<path d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.6 5.5a2 2 0 0 1 2-2z"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.9 12.1 19 4M15.5 7.5l2.5 2.5M17.5 5.5l2 2"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/>',
  list: '<path d="M8.5 6H20M8.5 12H20M8.5 18H20M4 6h.01M4 12h.01M4 18h.01"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  // New for the two added home tiles: money moving both ways, and a page with lines on it
  transfer: '<path d="M4 8h14M14 4l4 4-4 4"/><path d="M20 16H6M10 12l-4 4 4 4"/>',
  document: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/>',
  // Added for the senior flow (frontend-update): pictures, chat, upload, small arrows, a cross,
  // a heart for the "you are doing the right thing" pill, and a clock
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M20.5 16l-5-5-9 8.5"/>',
  chat: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/><path d="M8 9h8M8 12.5h5"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 14.5V20h15v-5.5"/>',
  chevron: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  cross: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
  // Added on website-refresh: a globe for the language picker and a small down arrow
  globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.6 3.9 5.8 3.9 9.5s-1.3 6.9-3.9 9.5c-2.6-2.6-3.9-5.8-3.9-9.5S9.4 5.1 12 2.5z"/>',
  caret: '<path d="M7 10l5 5 5-5"/>',
  // For the bottom bar: three lines for "Menu", a magnifying glass for "Check"
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20.5 20.5"/>'
};

// Returns one icon as an SVG drawing. aria-hidden hides it from screen readers, because the
// words next to it already say what it means.
function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

// Returns a result badge (icon + words) for one of the five RESULTS keys, e.g. badge("likely").
// The words come from i18n.js ("result.likely"), so they follow the customer's language.
function badge(key) {
  return `<span class="badge badge--${key}">${icon(RESULTS[key].icon)}${t(`result.${key}`)}</span>`;
}

// Turns words into a CSS-friendly name: "In review" becomes "in-review"
function slug(text) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

// ---------- Brand ----------

// The shield logo and name. href is where it links to; tag is an optional label like "Staff".
function brandHtml(href, tag = "") {
  return `<a class="brand" href="${href}">
      <span class="brand-mark brand-mark--logo"><img src="img/pause&prove_logo.png" alt=""></span>
      <span class="brand-name">Pause & Prove</span>
      ${tag ? `<span class="brand-tag">${tag}</span>` : ""}
    </a>`;
}

// ---------- Menus ----------

// ---------- Customer navigation (website-refresh): one menu, three layouts ----------
// Following Google's Material Design and Apple's guidelines for phones, tablets and desktops:
//   phone (under 600px)      a bar at the bottom with 5 big labelled buttons (TAB_MENU), easy to
//                            reach with a thumb; "Menu" slides in the full sidebar
//   tablet / iPad upright    the same 5 buttons as a "rail" down the left edge
//   iPad sideways / desktop  the full sidebar (SIDE_MENU) stays open on the left
// The sizes are set in base.css. route is the address after the #. labelKey is a translation
// key (i18n.js), so the words follow the customer's language. locked: true means it needs
// signing in; guests see a small lock next to it.

// The 5 buttons of the bottom bar (phone) and the rail (tablet). "Help now" is the red one in
// the middle: help for someone on a scam call is always one tap away.
const TAB_MENU = [
  { route: "customer", icon: "home", labelKey: "tab.home" },
  { route: "analyser", icon: "search", labelKey: "tab.check" },
  { route: "calling-now", icon: "phone", labelKey: "tab.helpNow", urgent: true },
  { route: "learn-signs", icon: "book", labelKey: "tab.learn" },
  { action: "open-menu", icon: "menu", labelKey: "tab.menu" }
];

// Everything, in groups, for the sidebar
const SIDE_MENU = [
  { groupKey: "side.group.now", items: [
    { route: "freeze", icon: "lock", labelKey: "side.freeze" }
  ] },
  { groupKey: "side.group.check", items: [
    { route: "customer", icon: "home", labelKey: "menu.home" },
    { route: "analyser", icon: "search", labelKey: "side.analyser" },
    { route: "call-match", icon: "shield", labelKey: "side.callMatch" },
    { route: "caller-check", icon: "user", labelKey: "side.callerCheck" },
    { route: "risk-scorer", icon: "transfer", labelKey: "side.riskScorer", locked: true }
  ] },
  { groupKey: "side.group.ready", items: [
    { route: "passphrase", icon: "key", labelKey: "side.passphrase", locked: true },
    { route: "learn-signs", icon: "book", labelKey: "side.learnSigns" },
    { route: "report", icon: "flag", labelKey: "side.report", locked: true },
    { route: "my-reports", icon: "list", labelKey: "menu.myReports", locked: true },
    { route: "help", icon: "question", labelKey: "menu.help" }
  ] }
];

// True when a customer is signed in (guests can still use the home screen and urgent tools)
function isSignedIn() {
  return appState.role === "customer";
}

// The small "Sign in" tag on a locked tile or menu link, for guests only. The lock icon is
// hidden from screen readers; the words "Sign in needed" are read instead.
function lockTagHtml() {
  return isSignedIn() ? "" : `<span class="lock-tag">${icon("lock")}<span>${t("lock.tag")}</span></span>`;
}

// The staff side menu. count is the small number badge (it matches "Waiting for review" on the overview).
const STAFF_MENU = [
  { route: "staff", icon: "chart", label: "Overview" },
  { route: "staff-queue", icon: "list", label: "Case queue", count: 9 },
  { route: "staff-trends", icon: "wave", label: "Trends" },
  { route: "staff-scam-types", icon: "flag", label: "Scam types" },
  { route: "staff-settings", icon: "settings", label: "Settings" }
];

// Turns a menu list into links. The link for the current route gets aria-current="page",
// which tells screen readers "you are here" and lets the CSS highlight it.
// An item has either labelKey (translated, the customer menu) or label (English only, the staff menu).
function menuLinksHtml(items, current) {
  return items.map(item => `<a href="#${item.route}"${item.route === current ? ' aria-current="page"' : ""}>
      ${icon(item.icon)}${item.labelKey ? t(item.labelKey) : item.label}${item.count ? `<span class="count">${item.count}</span>` : ""}${item.locked && !isSignedIn() ? `<span class="menu-lock">${icon("lock")}<span class="visually-hidden"> (${t("lock.tag")})</span></span>` : ""}
    </a>`).join("");
}

// ---------- Page frames: header and menu around a screen's content ----------

// The screen showing now ("customer" for #customer, "report" for #report/call), so the menus
// can highlight it. Worked out from the address, so no screen has to pass it in.
function currentRoute() {
  return location.hash.slice(1).split("/")[0] || "customer";
}

// " aria-current="page"" for the screen showing now: screen readers say "current page" and
// the CSS highlights it
function hereAttr(route, here) {
  return route === here ? ' aria-current="page"' : "";
}

// The bottom bar (phone) / rail (tablet): 5 buttons, each an icon with its word under it
function tabBarHtml(here) {
  return `<nav class="tabbar" aria-label="${t("nav.tabs")}">
      <a class="tabbar-logo" href="#customer" aria-label="Pause & Prove, ${t("menu.home")}"><img src="img/pause&prove_logo.png" alt=""></a>
      ${TAB_MENU.map(tab => tab.action
        ? `<button type="button" class="tab" data-action="${tab.action}" aria-controls="sidebar" aria-expanded="false">
            <span class="tab-icon">${icon(tab.icon)}</span><span class="tab-label">${t(tab.labelKey)}</span></button>`
        : `<a class="tab${tab.urgent ? " tab--urgent" : ""}" href="#${tab.route}"${hereAttr(tab.route, here)}>
            <span class="tab-icon">${icon(tab.icon)}</span><span class="tab-label">${t(tab.labelKey)}</span></a>`).join("")}
    </nav>`;
}

// The sidebar: brand, "Need help now?" with the red "Someone is calling me now" button, every
// tool in groups, the display settings (phone only) and the account. Open all the time on wide screens; on phones
// and tablets it slides in over the page when "Menu" is tapped (see openMenu() below).
function sidebarHtml(here) {
  const name = appState.userName ? escapeHtml(appState.userName) : "";
  const account = isSignedIn()
    ? `<p class="side-who">${icon("user")}<span>${name ? t("side.signedInAs", { name }) : t("side.signedIn")}</span></p>
       <button type="button" class="btn btn-secondary btn-small" data-action="signout">${icon("logout")}${t("header.signOut")}</button>`
    : `<a class="btn btn-primary btn-small side-signin" href="#login">${icon("user")}${t("header.signIn")}</a>
       <p class="side-hint">${t("side.signInHint")}</p>`;
  return `<aside class="sidebar" id="sidebar" aria-label="${t("tab.menu")}">
      <div class="side-top">
        ${brandHtml("#customer")}
        <button type="button" class="side-close" data-action="close-menu" aria-label="${t("side.close")}">${icon("cross")}</button>
      </div>
      <nav aria-label="${t("nav.main")}">
        ${SIDE_MENU.map((group, i) => `<p class="side-group">${t(group.groupKey)}</p>
          ${i === 0 ? `<a class="side-urgent" href="#calling-now"${hereAttr("calling-now", here)}>${icon("phone")}<span>${t("side.urgent")}</span></a>` : ""}
          <ul class="side-list">
            ${group.items.map(item => `<li><a class="side-link" href="#${item.route}"${hereAttr(item.route, here)}>
                ${icon(item.icon)}<span>${t(item.labelKey)}</span>${item.locked && !isSignedIn() ? `<span class="menu-lock">${icon("lock")}<span class="visually-hidden"> (${t("lock.tag")})</span></span>` : ""}
              </a></li>`).join("")}
          </ul>`).join("")}
      </nav>
      <div class="side-display">
        <p class="side-group">${t("side.display")}</p>
        ${languageSwitchHtml("side")}
        ${textSizeHtml()}
        ${readAloudButtonHtml().replace('class="tool-btn"', 'class="tool-btn side-read" data-close-menu')}
      </div>
      <div class="side-account">${account}</div>
    </aside>
    <div class="scrim" data-action="close-menu" aria-hidden="true"></div>`;
}

// A customer screen: the sidebar, a slim bar along the top (language, read aloud, text size,
// sign in), the content, and the bottom bar / rail. Guests (not signed in) see "Sign in" where
// signed-in customers see "Sign out". current is kept for the screens that pass it, but the
// menus now work out the screen themselves (currentRoute()).
// textSizeHtml() and readAloudButtonHtml() live in a11y.js; languageSwitchHtml() in i18n.js.
function customerPageHtml(current, content) {
  const here = currentRoute() || current;
  const account = isSignedIn()
    ? `<button type="button" class="tool-btn topbar-account" data-action="signout">${icon("logout")}<span class="tool-label">${t("header.signOut")}</span></button>`
    : `<a class="tool-btn tool-btn--signin topbar-account" href="#login">${icon("user")}<span>${t("header.signIn")}</span></a>`;
  return `<div class="shell">
      ${sidebarHtml(here)}
      <div class="shell-main">
        <header class="topbar">
          ${here === "customer" ? "" : backButtonHtml("topbar-back")}
          ${brandHtml("#customer")}
          <div class="topbar-tools">
            ${languageSwitchHtml("top")}
            ${readAloudButtonHtml()}
            ${textSizeHtml()}
            ${account}
          </div>
        </header>
        <main class="cust-main" tabindex="-1">${content}</main>
      </div>
      ${tabBarHtml(here)}
    </div>`;
}

// ---------- The Back button (website-refresh) ----------
// Not every phone has a back button, so every screen you open has one in the same place: the
// top-left of the top bar. It goes back to the screen you came from, or home if there is none
// (goBack() in router.js). extraClass places it (topbar-back, staff-back, login-home).
function backButtonHtml(extraClass = "") {
  return `<button type="button" class="back-btn ${extraClass}" data-action="back">${icon("back")}<span>${t("nav.back")}</span></button>`;
}

// ---------- Opening and closing the sliding sidebar (phones and tablets) ----------

let menuOpener = null;   // the button that opened the menu, to put focus back on it afterwards

// While the menu is open, the page behind it is "inert": Tab and screen readers stay inside
// the menu, the way a pop-up should work
function setPageInert(on) {
  document.querySelectorAll(".shell-main, .tabbar").forEach(el => { el.inert = on; });
}

function openMenu(opener) {
  menuOpener = opener || null;
  document.body.classList.add("menu-open");
  setPageInert(true);
  document.querySelectorAll('[data-action="open-menu"]').forEach(b => b.setAttribute("aria-expanded", "true"));
  const close = document.querySelector(".side-close");
  if (close) setTimeout(() => close.focus(), 50);   // after it starts sliding in
}

function closeMenu() {
  if (!document.body.classList.contains("menu-open")) return;
  document.body.classList.remove("menu-open");
  setPageInert(false);
  document.querySelectorAll('[data-action="open-menu"]').forEach(b => b.setAttribute("aria-expanded", "false"));
  if (menuOpener && document.body.contains(menuOpener)) menuOpener.focus();
  menuOpener = null;
}

if (typeof document !== "undefined") {
  document.addEventListener("click", event => {
    if (event.target.closest('[data-action="back"]')) { goBack(); return; }
    // Moving with the bottom bar, rail or sidebar is like switching tabs in an app: the screens
    // fade instead of sliding (router.js). Only if it really goes somewhere else.
    const navLink = event.target.closest(".tabbar a, .sidebar a");
    if (navLink && navLink.getAttribute("href") !== location.hash) setNextMotion("lateral");
    const opener = event.target.closest('[data-action="open-menu"]');
    if (opener) { openMenu(opener); return; }
    if (event.target.closest('[data-action="close-menu"], [data-close-menu]')) closeMenu();
  });
  // Esc closes it; going to another screen closes it too
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  window.addEventListener("hashchange", () => {
    document.body.classList.remove("menu-open");
    menuOpener = null;
  });
  // Turning an iPad sideways makes the sidebar stay open by itself, so the sliding one closes
  if (window.matchMedia) {
    matchMedia("(min-width: 64rem)").addEventListener("change", event => { if (event.matches) closeMenu(); });
  }
}

// A staff screen: header (brand, who is signed in, text size, sign out), side menu, then the content.
// current is the side menu route to highlight (a case detail screen can pass "staff-queue").
function staffPageHtml(current, content) {
  return `
    <header class="app-header staff-header">
      ${currentRoute() === "staff" ? "" : backButtonHtml("staff-back")}
      ${brandHtml("#staff", "Staff")}
      <div class="header-tools">
        <p class="who">${icon("user")}<span>R. Tan<br>Fraud operations</span></p>
        ${textSizeHtml()}
        <button type="button" class="tool-btn" data-action="signout">${icon("logout")}<span class="tool-label">Sign out</span></button>
      </div>
    </header>
    <div class="staff-body">
      <nav class="side-nav" aria-label="Staff menu">${menuLinksHtml(STAFF_MENU, current)}</nav>
      <main class="staff-main" tabindex="-1">${content}</main>
    </div>`;
}

// ---------- Senior flow pieces (added on frontend-update) ----------

// OCBC's phone number, written for people and as a link that dials it
const OCBC_PHONE = "1800 363 3333";
const OCBC_TEL = "tel:18003633333";

// A small "Home" link for the top of a screen
// website-refresh: now empty. Every screen has the Back button in the top bar instead, and Home
// is always in the bottom bar, rail or sidebar, so this link would only repeat them. Screens that
// still call it keep working.
function homeLinkHtml() {
  return "";
}

// The bar fixed to the bottom of the screen on stressful screens (calling now, freeze).
// The spacer stops the bar covering the last button on the page.
function callBarHtml() {
  return `
    <div class="call-bar-space" aria-hidden="true"></div>
    <div class="call-bar">
      <div class="call-bar-in">
        <p>${t("callBar.question")}</p>
        <a class="btn btn-primary btn-small" href="${OCBC_TEL}">${icon("phone")}${t("callBar.call")}</a>
      </div>
    </div>`;
}

// A short message at the bottom of the screen ("Passphrase saved") that screen readers also read
function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  setTimeout(() => { toast.textContent = text; }, 50);   // filled a moment later so screen readers notice
  setTimeout(() => toast.remove(), 3200);
}

// Makes text typed by the customer safe to put inside HTML
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// ---------- Stub screen ----------

// The placeholder content each feature shows until its owner builds it: a heading, one line
// about what will be here, and a way back. tabindex="-1" on the heading lets the router move
// focus to it (see focusHeading() in a11y.js).
function stubHtml(title, text, backRoute, backLabel) {
  return `
    <h1 tabindex="-1">${title}</h1>
    <p>${text}</p>
    <a class="btn btn-secondary btn-small" href="#${backRoute}">${backLabel}</a>`;
}
