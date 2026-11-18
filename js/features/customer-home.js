"use strict";

// Feature: Customer home ("Need help right now?" card, check tools, be-ready tools, recent checks).
// Owner: Yan Lin. Layout updated on frontend-update to match the senior flow preview.
// website-refresh: this is now also the landing page. Guests (not signed in) see it too:
//   - a welcome for guests, with a small drawing, instead of "Hello, Mdm Lim"
//   - the urgent card and the open check tools work straight away, with no sign-in
//   - tools that need signing in show "Sign in needed" (tapping one goes to sign in, then back)
//   - signed-in customers also get "Your safety checklist" (with a progress bar) and recent checks
// The old "Good to know" tip now lives in Learn the signs (js/features/learn-signs.js).
// Words come from t() (js/core/i18n.js); this screen's words are in CUSTOMER_HOME_DATA.text.

(function () {
  addTranslations(CUSTOMER_HOME_DATA.text);   // this screen's English, Chinese and Malay words
  const RISK_WORDS = { high: "home.risk.high", medium: "home.risk.medium", low: "home.risk.low" };
  // A message's risk level shown with the shared badge styles: icon + words, never colour alone
  const RISK_BADGE = { high: ["likely", "warning"], medium: ["uncertain", "warning"], low: ["real", "check"] };

  // "Good morning", "Good afternoon" or "Good evening", from the computer's clock
  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? t("home.morning") : hour < 18 ? t("home.afternoon") : t("home.evening");
  }

  // (The loop name is "tool", not "t", so it doesn't hide the t() that looks up words.)
  // A locked tool still links to its screen: the router sends a guest to sign in first and then
  // straight back to it (router.js).
  // If the tiles that share rows (two per row) are an odd number, the last one would sit alone
  // with a gap beside it, so it spans the whole row instead.
  function tilesHtml(tools) {
    const paired = tools.filter(tool => !tool.wide).length;
    const last = tools[tools.length - 1];
    // tool-wide: the featured tile (red border); tool-span: just takes the whole row
    const rowClass = tool => tool.wide ? ' class="tool-wide"' : paired % 2 === 1 && tool === last ? ' class="tool-span"' : "";
    return `<ul class="tools">
        ${tools.map(tool => `<li${rowClass(tool)}><a class="tool" href="#${tool.route}">
            <span class="tool-icon">${icon(tool.icon)}</span>
            <span class="tool-text"><strong>${t(tool.title)}</strong><span>${t(tool.text)}</span>${tool.locked ? lockTagHtml() : ""}</span>
            ${icon("chevron", "tool-arrow")}
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

  function helloHtml() {
    if (!isSignedIn()) {
      return `<section class="hello hello--hero" data-read>
          <div class="hello-text">
            <p class="eyebrow">${greeting()}</p>
            <h1 tabindex="-1">${t("home.guest.title")}</h1>
            <p class="hello-sub">${t("home.guest.sub")}</p>
          </div>
          ${heroArtHtml()}
        </section>`;
    }
    // Greet by the name typed at sign-in (escaped: the customer typed it), or the made-up one
    const name = appState.userName ? escapeHtml(appState.userName) : "";
    return `<section class="hello hello--hero" data-read>
        <div class="hello-text">
          <p class="eyebrow">${greeting()}</p>
          <h1 tabindex="-1">${name ? t("home.hello", { name }) : t("home.helloNoName")}</h1>
          <p class="hello-sub">${t("home.sub")}</p>
        </div>
        ${heroArtHtml()}
      </section>`;
  }

  // ---------- "Your safety checklist" (signed-in customers) ----------

  // Which steps are done, from what the other features remember for this visit
  function stepDone(id) {
    if (id === "signIn") return isSignedIn();
    if (id === "passphrase") {
      // The family list now comes from the server (passphrase.js): done once it has someone on it.
      // list is null until the Family passphrase screen has loaded it.
      const family = appState.passphrase && appState.passphrase.list;
      return Array.isArray(family) && family.length > 0;
    }
    if (id === "learn") return Boolean(appState.learnSigns && appState.learnSigns.picked);
    if (id === "check") return Boolean(appState.analyser && appState.analyser.history.length);
    return false;
  }

  // A progress bar ("2 of 4 done"), the steps with ticks, and a button for the next step.
  // When everything is done, the bar is full and a tick celebrates it (the peak-end rule:
  // people remember the high point, so finishing should feel good).
  function checklistHtml(data) {
    const steps = data.checklist.map(step => ({ ...step, done: stepDone(step.id) }));
    const done = steps.filter(step => step.done).length;
    const total = steps.length;
    const next = steps.find(step => !step.done);
    return `<section class="checklist" aria-labelledby="checklist-title" data-read>
        <div class="checklist-head">
          <h2 id="checklist-title">${t("home.progress.title")}</h2>
          <p class="checklist-count tabular">${t("home.progress.count", { done, total })}</p>
        </div>
        <div class="checklist-bar" role="progressbar" aria-labelledby="checklist-title"
          aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-valuetext="${t("home.progress.count", { done, total })}">
          <span style="--p: ${done / total}"></span>
        </div>
        <ol class="checklist-steps">
          ${steps.map(step => `<li class="${step.done ? "is-done" : ""}">
              <span class="checklist-mark">${step.done ? icon("check") : ""}</span>
              <span>${t(step.label)}${step.done ? `<span class="visually-hidden"> (${t("home.progress.doneLabel")})</span>` : ""}</span>
            </li>`).join("")}
        </ol>
        ${next
          ? `<a class="btn btn-secondary btn-small checklist-next" href="#${next.route}">${t("home.progress.next", { step: t(next.label) })}${icon("arrow")}</a>`
          : `<p class="checklist-all"><span class="done-mark">${icon("check")}</span>${t("home.progress.allDone")}</p>`}
      </section>`;
  }

  // The customer home screen's content. data-read marks what Read aloud reads (see a11y.js).
  function homeHtml() {
    const data = CUSTOMER_HOME_DATA;
    const signedIn = isSignedIn();
    const recent = recentChecks();
    return customerPageHtml("customer", `<div class="narrow home">
      ${helloHtml()}

      <section class="urgent" aria-labelledby="urgent-title" data-read>
        <h2 id="urgent-title">${t("home.urgent")}</h2>
        <div class="urgent-choices">
          <a class="big-choice big-choice--first" href="#calling-now">
            <span class="big-choice-icon">${icon("phone")}</span>
            <span class="big-choice-text"><strong>${t("home.callingNow")}</strong><span>${t("home.callingNowSub")}</span></span>
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

      ${signedIn ? checklistHtml(data) : ""}

      <section class="tools-section" aria-labelledby="check-title" data-read>
        <h2 id="check-title">${t("home.checkTitle")}</h2>
        <p class="tools-sub">${t("home.checkSub")}</p>
        ${tilesHtml(data.checkTools)}
      </section>

      <section class="tools-section" aria-labelledby="ready-title" data-read>
        <h2 id="ready-title">${t("home.readyTitle")}</h2>
        ${signedIn ? "" : `<p class="tools-sub">${t("home.readySubGuest")}</p>`}
        ${tilesHtml(data.readyTools)}
      </section>

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
    role: "public",   // open to everyone: no sign-in needed (website-refresh)
    render: homeHtml
  });
})();