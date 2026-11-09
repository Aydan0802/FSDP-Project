"use strict";

// Verify the Caller: shared helpers.
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
  document: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/>'
};

// Returns one icon as an SVG drawing. aria-hidden hides it from screen readers, because the
// words next to it already say what it means.
function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

// Returns a result badge (icon + words) for one of the five RESULTS keys, e.g. badge("likely")
function badge(key) {
  return `<span class="badge badge--${key}">${icon(RESULTS[key].icon)}${RESULTS[key].short}</span>`;
}

// Turns words into a CSS-friendly name: "In review" becomes "in-review"
function slug(text) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

// ---------- Brand ----------

// The shield logo and name. href is where it links to; tag is an optional label like "Staff".
function brandHtml(href, tag = "") {
  return `<a class="brand" href="${href}">
      <span class="brand-mark">${icon("shield")}</span>
      <span class="brand-name">Verify the Caller</span>
      ${tag ? `<span class="brand-tag">${tag}</span>` : ""}
    </a>`;
}

// ---------- Menus ----------

// The customer's top menu. route is the address after the #.
const CUSTOMER_MENU = [
  { route: "customer", icon: "home", label: "Home" },
  { route: "my-reports", icon: "flag", label: "My reports" },
  { route: "help", icon: "question", label: "Help" }
];

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
function menuLinksHtml(items, current) {
  return items.map(item => `<a href="#${item.route}"${item.route === current ? ' aria-current="page"' : ""}>
      ${icon(item.icon)}${item.label}${item.count ? `<span class="count">${item.count}</span>` : ""}
    </a>`).join("");
}

// ---------- Page frames: header and menu around a screen's content ----------

// A customer screen: header (brand, menu, read aloud, text size, sign out), then the content.
// current is the menu route to highlight; pass "" when the screen isn't in the menu.
// textSizeHtml() and readAloudButtonHtml() live in a11y.js.
function customerPageHtml(current, content) {
  return `
    <header class="app-header">
      ${brandHtml("#customer")}
      <nav class="app-nav" aria-label="Customer menu">${menuLinksHtml(CUSTOMER_MENU, current)}</nav>
      <div class="header-tools">
        ${readAloudButtonHtml()}
        ${textSizeHtml()}
        <button type="button" class="tool-btn" data-action="signout">${icon("logout")}<span class="tool-label">Sign out</span></button>
      </div>
    </header>
    <main class="cust-main" tabindex="-1">${content}</main>`;
}

// A staff screen: header (brand, who is signed in, text size, sign out), side menu, then the content.
// current is the side menu route to highlight (a case detail screen can pass "staff-queue").
function staffPageHtml(current, content) {
  return `
    <header class="app-header staff-header">
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
