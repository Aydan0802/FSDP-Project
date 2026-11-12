"use strict";

// Feature: Customer home (urgent banner, tools grid, recent checks).
// Owner: Yan Lin

(function () {
  // "Good morning", "Good afternoon" or "Good evening", from the computer's clock
  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }

  // The customer home screen's content. data-read marks what Read aloud reads (see a11y.js).
  function homeHtml() {
    const data = CUSTOMER_HOME_DATA;
    return customerPageHtml("customer", `
      <section class="hello" data-read>
        <p class="eyebrow">${greeting()}</p>
        <h1 tabindex="-1">Hello, ${data.customerName}</h1>
        <p class="hello-sub">What would you like to do today?</p>
      </section>

      <section class="urgent" aria-labelledby="urgent-title" data-read>
        <div class="urgent-icon">${icon("phone")}</div>
        <div class="urgent-body">
          <h2 id="urgent-title">Someone calling you right now?</h2>
          <p>Don't send money or share any codes yet. We'll help you check who it is, step by step.</p>
          <div class="urgent-actions">
            <a class="btn btn-primary" href="#pause-verify">Check the caller now</a>
            <a class="btn btn-secondary" href="#analyser">Check a recording instead</a>
          </div>
        </div>
      </section>

      <section class="tools-section" aria-labelledby="tools-title">
        <h2 id="tools-title">Your safety tools</h2>
        <ul class="tools">
          ${data.tools.map(t => `<li><a class="tool" href="#${t.route}">
              <span class="tool-icon">${icon(t.icon)}</span>
              <span class="tool-text"><strong>${t.title}</strong><span>${t.text}</span></span>
              ${icon("arrow", "tool-arrow")}
            </a></li>`).join("")}
        </ul>
      </section>

      <div class="cust-lower">
        <section class="recent" aria-labelledby="recent-title">
          <h2 id="recent-title">Your recent checks</h2>
          <ul class="recent-list">
            ${data.recent.map(r => `<li><span class="recent-what"><strong>${r.what}</strong><span>${r.when}</span></span>${badge(r.result)}</li>`).join("")}
          </ul>
        </section>
        <aside class="tip" aria-labelledby="tip-title">
          <h2 id="tip-title">Good to know</h2>
          <p>A real bank officer will never ask you to move money to a "safe account", or to share your one-time password (OTP).</p>
        </aside>
      </div>`);
  }

  registerRoute({
    name: "customer",
    role: "customer",
    render: homeHtml
  });
})();
