"use strict";

// Feature: Customer home ("Need help right now?" card, check tools, be-ready tools, recent checks).
// Owner: Yan Lin. Layout updated on frontend-update to match the senior flow preview.
// The old "Good to know" tip now lives in Learn the signs (js/features/learn-signs.js).

(function () {
  const RISK_WORDS = { high: "High risk", medium: "Medium risk", low: "Low risk" };
  // A message's risk level shown with the shared badge styles: icon + words, never colour alone
  const RISK_BADGE = { high: ["likely", "warning"], medium: ["uncertain", "warning"], low: ["real", "check"] };

  // "Good morning", "Good afternoon" or "Good evening", from the computer's clock
  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }

  function tilesHtml(tools) {
    return `<ul class="tools">
        ${tools.map(t => `<li${t.wide ? ' class="tool-wide"' : ""}><a class="tool" href="#${t.route}">
            <span class="tool-icon">${icon(t.icon)}</span>
            <span class="tool-text"><strong>${t.title}</strong><span>${t.text}</span></span>
            ${icon("chevron", "tool-arrow")}
          </a></li>`).join("")}
      </ul>`;
  }

  // One recent check's result: a voice, picture or document has one of the five RESULTS keys;
  // a message has a risk level (high / medium / low) from the analyser
  function levelHtml(item) {
    if (item.result) return badge(item.result);
    const [style, iconName] = RISK_BADGE[item.risk];
    return `<span class="badge badge--${style}">${icon(iconName)}${RISK_WORDS[item.risk]}</span>`;
  }

  // Checks from this visit (the analyser keeps them, newest first), then the older made-up ones
  function recentChecks() {
    const thisVisit = (appState.analyser && appState.analyser.history) || [];
    return [...thisVisit, ...CUSTOMER_HOME_DATA.recent];
  }

  // The customer home screen's content. data-read marks what Read aloud reads (see a11y.js).
  function homeHtml() {
    const data = CUSTOMER_HOME_DATA;
    const recent = recentChecks();
    return customerPageHtml("customer", `<div class="narrow">
      <section class="hello" data-read>
        <p class="eyebrow">${greeting()}</p>
        <h1 tabindex="-1">Hello, ${data.customerName}</h1>
        <p class="hello-sub">What would you like to do today?</p>
      </section>

      <section class="urgent" aria-labelledby="urgent-title" data-read>
        <h2 id="urgent-title">Need help right now?</h2>
        <div class="urgent-choices">
          <a class="big-choice" href="#calling-now">
            <span class="big-choice-icon">${icon("phone")}</span>
            <span class="big-choice-text"><strong>Someone is calling me now</strong><span>We will help you, one step at a time</span></span>
            ${icon("chevron", "big-choice-arrow")}
          </a>
          <a class="big-choice" href="#freeze">
            <span class="big-choice-icon">${icon("lock")}</span>
            <span class="big-choice-text"><strong>I already sent money or gave a code</strong><span>Stop more money from leaving</span></span>
            ${icon("chevron", "big-choice-arrow")}
          </a>
        </div>
        <p class="call-line">Or call OCBC yourself: <a class="tel-link" href="${OCBC_TEL}">${OCBC_PHONE}</a></p>
      </section>

      <section class="tools-section" aria-labelledby="check-title" data-read>
        <h2 id="check-title">Not sure? Check it first</h2>
        <p class="tools-sub">Check something before you reply or pay.</p>
        ${tilesHtml(data.checkTools)}
      </section>

      <section class="tools-section" aria-labelledby="ready-title" data-read>
        <h2 id="ready-title">Be ready next time</h2>
        ${tilesHtml(data.readyTools)}
      </section>

      <details class="recent">
        <summary>My recent checks (${recent.length})</summary>
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
