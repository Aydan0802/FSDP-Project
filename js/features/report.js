"use strict";

// Feature: Report a scam. #report (and #report/call, #report/message, #report/sent, which pick
// the answer to "What happened?" in advance, when another screen sends the customer here)
// Owner: Jose. Built on frontend-update from the senior flow preview (it was a stub).
// A short form: two questions answered with buttons, the amount only if money was lost, and
// two optional boxes. Sending it shows a report number. Nothing is sent anywhere: it is a demo.
// Every word comes from t() (js/core/i18n.js), so it follows the language the customer picked.
//
// What it remembers (appState.report, cleared by #reset):
//   phase    "form" or "sent"
//   what     "call", "message", "sent" or "other" ("" until picked)
//   lost     "yes", "no" or "unsure" ("" until picked)
//   amount, contact, more   what is typed in the boxes
//   ref      the report number, once sent
//   sent     every report sent during this visit: [{ ref, what, lost, amount, contact, more, time }]
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = REPORT_DATA;
  const esc = escapeHtml;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words

  function freshForm(what = "") {
    return { phase: "form", what, lost: "", amount: "", contact: "", more: "", ref: "" };
  }
  function myState() {
    if (!appState.report) appState.report = { ...freshForm(), sent: [] };
    return appState.report;
  }

  // A group of pill buttons for one question. aria-pressed says which one is picked.
  // The words for each option are under "rp.<question>.<id>", e.g. "rp.what.call".
  function choicesHtml(name, titleId, options, picked) {
    return `<div class="chips" role="group" aria-labelledby="${titleId}" data-group="${name}">
        ${options.map(o => `<button type="button" class="chip" data-value="${o.id}" aria-pressed="${picked === o.id}">${t(`rp.${name}.${o.id}`)}</button>`).join("")}
      </div>`;
  }

  function formHtml(state) {
    const lostMoney = state.lost === "yes";
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("rp.title")}</h1>
        <p class="lead">${t("rp.lead")}</p>
      </section>
      <form class="panel" id="rp-form" novalidate>
        <h2 id="rp-what-title">${t("rp.what.title")}</h2>
        ${choicesHtml("what", "rp-what-title", data.what, state.what)}

        <div class="field rp-gap">
          <label for="rp-contact">${t("rp.contact")}</label>
          <input type="text" id="rp-contact" autocomplete="off" value="${esc(state.contact)}">
        </div>

        <h2 id="rp-lost-title">${t("rp.lost.title")}</h2>
        ${choicesHtml("lost", "rp-lost-title", data.lost, state.lost)}

        <div id="rp-amount-box"${lostMoney ? "" : " hidden"}>
          <div class="field rp-gap">
            <label for="rp-amount">${t("rp.amount")}</label>
            <input type="text" id="rp-amount" inputmode="decimal" autocomplete="off" value="${esc(state.amount)}">
          </div>
          <a class="btn btn-secondary" href="#freeze">${icon("lock")}${t("rp.freezeFirst")}</a>
        </div>

        <div class="field rp-gap">
          <label for="rp-more">${t("rp.more")}</label>
          <textarea id="rp-more" rows="4">${esc(state.more)}</textarea>
        </div>

        <p class="field-error" id="rp-error" role="alert"></p>
        <div class="stack"><button type="submit" class="btn btn-primary">${t("rp.send")}</button></div>
      </form>`;
  }

  function sentHtml(state) {
    const police = `<a class="tel-link" href="${data.police.tel}">${data.police.phone}</a>`;
    const scamShield = `<a class="tel-link" href="${data.scamShield.tel}">${data.scamShield.phone}</a>`;
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("check")}</div>
        <h1 tabindex="-1">${t("rp.sent.title")}</h1>
        <p>${t("rp.sent.refIs")}</p>
        <p class="rp-ref">${state.ref}</p>
        <p>${t("rp.sent.officer")}</p>
        <p>${t("rp.sent.alsoTell", { police, scamShield })}</p>
        <p class="note">${t("rp.sent.demo")}</p>
        <div class="stack"><a class="btn btn-primary" href="#customer">${t("common.backHome")}</a></div>
      </section>`;
  }

  function screenHtml(param) {
    const state = myState();
    // Coming here from another screen starts a new form. #report/call etc. pick "What happened?".
    // If this screen is already showing, it is only being drawn again (after "Send", or a
    // language change), so keep what the customer has filled in. The old screen is still on the
    // page at this moment, because the router swaps it only after render() returns.
    const alreadyHere = document.querySelector(".rp-screen") !== null;
    if (!alreadyHere) Object.assign(state, freshForm(data.what.some(w => w.id === param) ? param : ""));
    return customerPageHtml("", `<div class="narrow rp-screen">${homeLinkHtml()}${state.phase === "sent" ? sentHtml(state) : formHtml(state)}</div>`);
  }

  function afterRender() {
    const state = myState();
    const form = document.getElementById("rp-form");
    if (!form) return;
    const error = document.getElementById("rp-error");

    // The pill buttons: pick one per question. "Yes, I lost money" shows the amount box.
    form.addEventListener("click", event => {
      const chip = event.target.closest("[data-value]");
      if (!chip) return;
      const group = chip.closest("[data-group]");
      state[group.dataset.group] = chip.dataset.value;
      group.querySelectorAll("[data-value]").forEach(b => b.setAttribute("aria-pressed", String(b === chip)));
      if (group.dataset.group === "lost") document.getElementById("rp-amount-box").hidden = state.lost !== "yes";
      error.textContent = "";
    });

    // Keep what is typed, so it survives the screen being drawn again
    [["rp-contact", "contact"], ["rp-amount", "amount"], ["rp-more", "more"]].forEach(([id, key]) => {
      document.getElementById(id).addEventListener("input", event => {
        state[key] = event.target.value;
        event.target.removeAttribute("aria-invalid");
      });
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      const amount = state.amount.replace(/[$,\s]/g, "").replace(/^S/i, "");
      let problem = "";
      let focusOn = null;
      if (!state.what) {
        problem = t("rp.err.what");
        focusOn = form.querySelector('[data-group="what"] .chip');
      } else if (!state.lost) {
        problem = t("rp.err.lost");
        focusOn = form.querySelector('[data-group="lost"] .chip');
      } else if (state.lost === "yes" && amount && !(Number(amount) > 0)) {
        problem = t("rp.err.amount");
        focusOn = document.getElementById("rp-amount");
        focusOn.setAttribute("aria-invalid", "true");
      }
      if (problem) {
        error.textContent = problem;
        focusOn.focus();
        return;
      }
      state.ref = `${data.refPrefix}${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
      state.sent.push({
        ref: state.ref, what: state.what, lost: state.lost, amount: state.lost === "yes" ? amount : "",
        contact: state.contact.trim(), more: state.more.trim(), time: new Date().toISOString()
      });
      state.phase = "sent";
      redrawScreen();
    });
  }

  registerRoute({
    name: "report",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
