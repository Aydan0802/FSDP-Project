"use strict";

// Feature: Customer home ("Need help right now?" card, one big check, the other tools in three
// small groups, recent checks).
// Owner: Yan Lin
// Few choices and few words on purpose: seniors find a long page of tiles hard to scan, so the page
// has two urgent buttons, one big "Check" tile and short one-line lists in small groups, with the
// least urgent last. The AI helper is the small round button at the bottom right (helpers.js).
// This is also the landing page. Guests (not signed in) see it too:
//   - a short welcome for guests, with a small drawing, instead of "Hello, Mdm Lim"
//   - the urgent card and the open check tools work straight away, with no sign-in
//   - tools that need signing in show a small lock (tapping one goes to sign in, then back)
//   - signed-in customers also get their recent checks
// Words come from t() (js/core/i18n.js); this screen's words are in CUSTOMER_HOME_DATA.text.

(function () {
  addTranslations(CUSTOMER_HOME_DATA.text);
  const RISK_WORDS = { high: "home.risk.high", medium: "home.risk.medium", low: "home.risk.low" };
  // A message's risk level shown with the shared badge styles: icon + words, never colour alone
  const RISK_BADGE = { high: ["likely", "warning"], medium: ["uncertain", "warning"], low: ["real", "check"] };

  // "Good morning", "Good afternoon" or "Good evening", from the computer's clock
  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? t("home.morning") : hour < 18 ? t("home.afternoon") : t("home.evening");
  }

  // The one big "Check something" tile (red border): the check most people need.
  // tool.text (a grey line under the title) is optional; Home leaves it out to keep words few.
  function mainToolHtml(tool) {
    return `<a class="tool tool--main" href="#${tool.route}">
        <span class="tool-icon">${icon(tool.icon)}</span>
        <span class="tool-text"><strong>${t(tool.title)}</strong>${tool.text ? `<span>${t(tool.text)}</span>` : ""}</span>
        ${icon("chevron", "tool-arrow")}
      </a>`;
  }

  // Everything else as one plain list: an icon and a few words per row, nothing more.
  // A locked tool still links to its screen: the router sends a guest to sign in first and then
  // straight back to it (router.js). Guests see a small lock on it, explained once under the
  // heading; screen readers hear "Sign in needed" instead.
  function lockIconHtml() {
    return `<span class="menu-lock">${icon("lock")}<span class="visually-hidden"> (${t("lock.tag")})</span></span>`;
  }

  function moreToolsHtml(tools) {
    return `<ul class="more-list">
        ${tools.map(tool => `<li><a class="more-link" href="#${tool.route}">
            <span class="more-icon">${icon(tool.icon)}</span>
            <span class="more-text">${t(tool.title)}</span>
            ${tool.locked && !isSignedIn() ? lockIconHtml() : ""}
            ${icon("chevron", "more-arrow")}
          </a></li>`).join("")}
      </ul>`;
  }

  // One recent check's result: a voice, picture or document has one of the five RESULTS keys;
  // a message has a risk level (high / medium / low) from the analyser
  function levelHtml(item) {
    if (item.result) return badge(item.result);
    const [style, iconName] = RISK_BADGE[item.risk];
    return `<span class="badge badge--${style}">${icon(iconName)}${t(RISK_WORDS[item.risk])}</span>`;
  }

  // Checks from this visit (the analyser keeps them, newest first), then the older made-up ones.
  // The made-up ones hold translation keys, so they are looked up here. Checks from this visit
  // are left as they are: they hold the customer's own file name or words.
  function recentChecks() {
    const thisVisit = (appState.analyser && appState.analyser.history) || [];
    const older = CUSTOMER_HOME_DATA.recent.map(r => ({ ...r, what: t(r.what), when: t(r.when) }));
    return [...thisVisit, ...older];
  }

  // ---------- The welcome at the top ----------

  // A small drawing for the welcome: a phone with an incoming call, and the Pause & Prove
  // pause mark in front of it. Drawn in code with the Clarity colours (customer-home.css), so it
  // matches the logo. The call rings pulse three times then stop; the pause mark slowly
  // "breathes". Both stay still for people who turn off animation. Hidden from screen readers.
  function heroArtHtml() {
    return `<svg class="hero-art" viewBox="0 0 240 210" aria-hidden="true" focusable="false">
        <circle class="ha-blob" cx="128" cy="108" r="92"/>
        <circle class="ha-dot" cx="38" cy="48" r="16"/>
        <circle class="ha-dot" cx="222" cy="34" r="8"/>
        <path class="ha-ring ha-ring--1" d="M66 62a34 34 0 0 0 0 44"/>
        <path class="ha-ring ha-ring--2" d="M53 51a52 52 0 0 0 0 66"/>
        <path class="ha-ring ha-ring--1" d="M182 62a34 34 0 0 1 0 44"/>
        <path class="ha-ring ha-ring--2" d="M195 51a52 52 0 0 1 0 66"/>
        <rect class="ha-phone" x="78" y="20" width="92" height="166" rx="20"/>
        <rect class="ha-screen" x="87" y="36" width="74" height="134" rx="10"/>
        <rect class="ha-slot" x="112" y="27" width="24" height="4" rx="2"/>
        <circle class="ha-avatar" cx="124" cy="73" r="15"/>
        <circle class="ha-head" cx="124" cy="69" r="5"/>
        <path class="ha-body" d="M115 82c2-4 5-6 9-6s7 2 9 6"/>
        <rect class="ha-line" x="101" y="97" width="46" height="7" rx="3.5"/>
        <rect class="ha-line ha-line--soft" x="108" y="110" width="32" height="6" rx="3"/>
        <circle class="ha-decline" cx="106" cy="148" r="10"/>
        <circle class="ha-accept" cx="142" cy="148" r="10"/>
        <g class="ha-pause">
          <rect class="ha-pause-box" x="146" y="120" width="68" height="68" rx="18"/>
          <rect class="ha-bar" x="166" y="137" width="9" height="34" rx="4.5"/>
          <rect class="ha-bar" x="185" y="137" width="9" height="34" rx="4.5"/>
        </g>
        <g class="ha-check">
          <circle cx="211" cy="123" r="13"/>
          <path d="M205 123.5l4 4 8-8.5"/>
        </g>
      </svg>`;
  }

  // Kept short on purpose (a greeting and one line), so the red "Need help right now?" card is
  // on the first screen of a phone without scrolling.
  function helloHtml() {
    // Guests: "Not sure? Pause and check." Signed in: "Hello, Mdm Lim", by the name typed at
    // sign-in (escaped: the customer typed it).
    const name = appState.userName ? escapeHtml(appState.userName) : "";
    const title = !isSignedIn() ? t("home.guest.title")
      : name ? t("home.hello", { name }) : t(appState.newAccount ? "home.welcomeNew" : "home.helloNoName");
    return `<section class="hello hello--hero" data-read>
        <div class="hello-text">
          <p class="eyebrow">${greeting()}</p>
          <h1 tabindex="-1">${title}</h1>
        </div>
        ${heroArtHtml()}
      </section>`;
  }

  // The customer home screen's content. data-read marks what Read aloud reads (see a11y.js).
  function homeHtml() {
    const data = CUSTOMER_HOME_DATA;
    const signedIn = isSignedIn();
    const recent = recentChecks();
    // Guests see what the lock means once, in the first group that has a locked tool
    const lockNoteAt = signedIn ? -1 : data.groups.findIndex(group => group.tools.some(tool => tool.locked));
    return customerPageHtml("customer", `<div class="narrow home">
      ${helloHtml()}

      <section class="urgent" aria-labelledby="urgent-title" data-read>
        <h2 id="urgent-title">${t("home.urgent")}</h2>
        <div class="urgent-choices">
          <a class="big-choice big-choice--first" href="#calling-now">
            <span class="big-choice-icon">${icon("phone")}</span>
            <span class="big-choice-text"><strong>${t("home.callingNow")}</strong></span>
            ${icon("chevron", "big-choice-arrow")}
          </a>
          <a class="big-choice" href="#freeze">
            <span class="big-choice-icon">${icon("lock")}</span>
            <span class="big-choice-text"><strong>${t("home.sentMoney")}</strong><span>${t("home.sentMoneySub")}</span></span>
            ${icon("chevron", "big-choice-arrow")}
          </a>
        </div>
        <p class="call-line">${t("home.callYourself")} <a class="tel-link" href="${OCBC_TEL}">${OCBC_PHONE}</a></p>
      </section>

      ${data.groups.map((group, i) => `<section class="tools-section" aria-labelledby="${group.id}-title" data-read>
        <h2 id="${group.id}-title">${t(group.title)}</h2>
        ${i === lockNoteAt ? `<p class="tools-sub lock-note">${t("home.lockNote", { lock: `<span class="menu-lock" aria-hidden="true">${icon("lock")}</span>` })}</p>` : ""}
        ${group.main ? mainToolHtml(group.main) : ""}
        ${moreToolsHtml(group.tools)}
      </section>`).join("")}

      ${signedIn ? `<details class="recent">
        <summary>${t("home.recentTitle", { count: recent.length })}</summary>
        <ul class="recent-list">
          ${recent.map(r => `<li><span class="recent-what"><strong>${escapeHtml(r.what)}</strong><span>${r.when}</span></span>${levelHtml(r)}</li>`).join("")}
        </ul>
      </details>` : ""}
    </div>`);
  }

  registerRoute({
    name: "customer",
    role: "public",
    render: homeHtml
  });
})();