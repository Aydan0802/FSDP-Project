"use strict";

// Feature: Customer home ("Need help right now?" card, check tools, be-ready tools, recent checks).
// Owner: Yan Lin. Layout updated on frontend-update to match the senior flow preview.
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
  function tilesHtml(tools) {
    return `<ul class="tools">
        ${tools.map(tool => `<li${tool.wide ? ' class="tool-wide"' : ""}><a class="tool" href="#${tool.route}">
            <span class="tool-icon">${icon(tool.icon)}</span>
            <span class="tool-text"><strong>${t(tool.title)}</strong><span>${t(tool.text)}</span></span>
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

  // The customer home screen's content. data-read marks what Read aloud reads (see a11y.js).
  function homeHtml() {
    const data = CUSTOMER_HOME_DATA;
    const recent = recentChecks();
    return customerPageHtml("customer", `<div class="narrow">
      <section class="hello" data-read>
        <p class="eyebrow">${greeting()}</p>
        <h1 tabindex="-1">${t("home.hello", { name: t(data.customerName) })}</h1>
        <p class="hello-sub">${t("home.sub")}</p>
      </section>

      <section class="urgent" aria-labelledby="urgent-title" data-read>
        <h2 id="urgent-title">${t("home.urgent")}</h2>
        <div class="urgent-choices">
          <a class="big-choice" href="#calling-now">
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

      <section class="tools-section" aria-labelledby="check-title" data-read>
        <h2 id="check-title">${t("home.checkTitle")}</h2>
        <p class="tools-sub">${t("home.checkSub")}</p>
        ${tilesHtml(data.checkTools)}
      </section>

      <section class="tools-section" aria-labelledby="ready-title" data-read>
        <h2 id="ready-title">${t("home.readyTitle")}</h2>
        ${tilesHtml(data.readyTools)}
      </section>

      <details class="recent">
        <summary>${t("home.recentTitle", { count: recent.length })}</summary>
        <ul class="recent-list">
          ${recent.map(r => `<li><span class="recent-what"><strong>${escapeHtml(r.what)}</strong><span>${r.when}</span></span>${levelHtml(r)}</li>`).join("")}
        </ul>
      </details>
    </div>`);
  }

  registerRoute({
    name: "customer",
    role: "customer",
    render: homeHtml
  });
})();
