"use strict";

// Feature: Freeze my accounts. #freeze
// Owner: Jose
// One big button sends a freeze request to the bank (POST /api/freeze, server/reports.js), then the
// customer is told to call OCBC and press 8. A "Call OCBC" bar stays at the bottom of the screen.
// The request is saved and bank staff see it under Staff > Reports & freezes, but no real account
// is frozen: this is a prototype, so the screen still says "Demo only". If the server can't be
// reached, the screen still moves on (a senior must never be stuck here), just without a number.
// Every word comes from t() (js/core/i18n.js), so it follows the language the customer picked.
//
// What it remembers (appState.freeze, cleared by #reset):
//   frozen     true once the customer has pressed the button. It stays frozen for this visit.
//   frozenAt   the time it was frozen, e.g. "14:05"
//   ref        the request number from the server, e.g. "FR-0003" ("" if the server wasn't reached)

(function () {
  const data = FREEZE_DATA;
  addTranslations(data.text);

  function myState() {
    if (!appState.freeze) appState.freeze = { frozen: false, frozenAt: "", ref: "" };
    return appState.freeze;
  }

  // Guests (not signed in) can freeze too, without signing in. They only type
  // their mobile number, so the bank knows whose accounts to freeze. (A real app would also
  // confirm it with a one-time code.)
  function phoneFieldHtml() {
    if (appState.role === "customer") return "";
    return `<div class="field fr-phone">
        <label for="fr-phone">${t("fr.phone.label")}</label>
        <input id="fr-phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="9"
          placeholder="9123 4567" aria-describedby="fr-phone-hint fr-phone-error">
        <p class="field-hint" id="fr-phone-hint">${t("fr.phone.hint")}</p>
        <p class="field-error" id="fr-phone-error" role="alert"></p>
      </div>`;
  }

  function askHtml() {
    return `
      <section class="panel" data-read>
        <p class="calm">${icon("heart")}${t("fr.calm")}</p>
        <h1 tabindex="-1">${t("fr.title")}</h1>
        <p>${t("fr.why")}</p>
        ${phoneFieldHtml()}
        <div class="stack">
          <button type="button" class="btn btn-primary" id="freeze-now">${icon("lock")}${t("fr.button")}</button>
          <a class="btn btn-link" href="${OCBC_TEL}">${t("fr.orCall", { phone: OCBC_PHONE, key: data.hotlineKey })}</a>
        </div>
      </section>`;
  }

  function frozenHtml() {
    const state = myState();
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("lock")}</div>
        <h1 tabindex="-1">${t("fr.done.title")}</h1>
        <p>${t("fr.done.text", { phone: OCBC_PHONE, key: data.hotlineKey })}</p>
        ${state.ref ? `<p>${t("fr.ref", { ref: `<strong>${escapeHtml(state.ref)}</strong>` })}</p>` : ""}
        <ul class="reasons">
          ${data.frozenItems.map(key => `<li>${icon("lock")}<span>${t(key)}</span></li>`).join("")}
        </ul>
        <div class="stack">
          <a class="btn btn-primary" href="${OCBC_TEL}">${icon("phone")}${t("common.callOcbcNumber", { phone: OCBC_PHONE })}</a>
          <a class="btn btn-secondary" href="#report/sent">${t("fr.writeDown")}</a>
          <a class="btn btn-link" href="#customer">${t("common.backHome")}</a>
        </div>
      </section>
      <p class="note">${t("fr.demo", { time: state.frozenAt })}</p>`;
  }

  // Sends the freeze request. Gives back { ref, frozenAt }, or null if the server can't be reached.
  // Gives up after 5 seconds: freezing is urgent, so the screen never waits longer than that.
  // DEMO ONLY: X-User-Id tells the server who is signed in, like the family passphrase screen.
  async function sendFreeze(mobile) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch("/api/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": appState.userId || "" },
        body: JSON.stringify({ mobile }),
        signal: controller.signal
      });
      return res.ok ? await res.json() : null;
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function screenHtml() {
    return customerPageHtml("", `<div class="narrow freeze">${myState().frozen ? frozenHtml() : askHtml()}</div>${callBarHtml()}`);
  }

  function afterRender() {
    const button = document.getElementById("freeze-now");
    if (!button) return;
    const phone = document.getElementById("fr-phone");
    if (phone) {
      // "91234567" shows as "9123 4567", like the sign-in screen
      phone.addEventListener("input", () => {
        const digits = phone.value.replace(/\D/g, "").slice(0, 8);
        phone.value = digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;
      });
    }
    button.addEventListener("click", async () => {
      let digits = "";
      if (phone) {
        digits = phone.value.replace(/\D/g, "");
        if (!/^[89]\d{7}$/.test(digits)) {
          phone.setAttribute("aria-invalid", "true");
          document.getElementById("fr-phone-error").textContent = t("fr.phone.err");
          phone.focus();
          return;
        }
        signIn("customer", digits);   // signed in by mobile number only, so they can carry on
      }
      button.disabled = true;   // so a worried tap-tap-tap sends only one request
      const saved = await sendFreeze(digits);
      const state = myState();
      state.frozen = true;
      state.ref = saved ? saved.ref : "";
      const when = saved ? new Date(saved.frozenAt) : new Date();
      state.frozenAt = when.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: false });
      redrawScreen();   // the "frozen" screen, with focus on its heading
    });
  }

  registerRoute({
    name: "freeze",
    role: "public",
    render: screenHtml,
    afterRender
  });
})();