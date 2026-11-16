"use strict";

// Feature: Family passphrase. #passphrase
// Owner: Jiliana. Built on frontend-update from the senior flow preview (it was a stub).
// A list of secret words agreed with family, each hidden until "Show" is pressed, and a form
// to add a new one. If a caller says they are family and need money, ask for the word:
// an AI copy of their voice will not know it.
// Nothing is saved or sent anywhere: the list lasts until the page is refreshed or #reset.
//
// What it remembers (appState.passphrase, cleared by #reset):
//   list    [{ who, word }], starting with PASSPHRASE_DATA.saved
//   shown   which passphrase is showing (its place in the list), or -1 for none
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = PASSPHRASE_DATA;
  const esc = escapeHtml;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words
  // Note: "who" is kept as a translation key (the <option> value), so a saved passphrase's
  // "who" is shown in whatever language the customer picks later.

  function myState() {
    if (!appState.passphrase) appState.passphrase = { list: data.saved.map(p => ({ ...p })), shown: -1 };
    return appState.passphrase;
  }

  function listHtml() {
    const state = myState();
    return state.list.map((p, i) => {
      const shown = i === state.shown;
      return `<li class="pp-saved">
          <span><strong>${esc(t(p.who))}</strong><br>
            <span class="pp-word">${shown ? esc(p.word) : `<span aria-hidden="true">••••••</span><span class="visually-hidden">${t("pp.hidden")}</span>`}</span></span>
          <button type="button" class="chip" data-show="${i}" aria-pressed="${shown}">${shown ? t("pp.hide") : t("pp.show")}<span class="visually-hidden">${t("pp.forWho", { who: esc(t(p.who)) })}</span></button>
        </li>`;
    }).join("");
  }

  function screenHtml() {
    return customerPageHtml("", `<div class="narrow pp-screen">
      ${homeLinkHtml()}
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("pp.title")}</h1>
        <p class="lead">${t("pp.lead")}</p>
      </section>

      <section class="panel" aria-labelledby="pp-list-title">
        <h2 id="pp-list-title">${t("pp.listTitle")}</h2>
        <ul id="pp-list">${listHtml()}</ul>
      </section>

      <form class="panel" id="pp-form" novalidate aria-labelledby="pp-add-title">
        <h2 id="pp-add-title">${t("pp.addTitle")}</h2>
        <div class="field">
          <label for="pp-who">${t("pp.whoLabel")}</label>
          <select id="pp-who">${data.who.map(w => `<option value="${w}">${t(w)}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label for="pp-word">${t("pp.wordLabel")}</label>
          <input type="text" id="pp-word" autocomplete="off" spellcheck="false" aria-describedby="pp-hint pp-error"
            placeholder="${t("pp.placeholder")}">
        </div>
        <p class="meta" id="pp-hint">${t("pp.hint")}</p>
        <p class="field-error" id="pp-error" role="alert"></p>
        <div class="stack"><button type="submit" class="btn btn-primary">${t("pp.save")}</button></div>
      </form>
    </div>`);
  }

  function afterRender() {
    const state = myState();
    const list = document.getElementById("pp-list");

    // Show or hide one passphrase, keeping focus on the same button
    list.addEventListener("click", event => {
      const button = event.target.closest("[data-show]");
      if (!button) return;
      const i = Number(button.dataset.show);
      state.shown = state.shown === i ? -1 : i;
      list.innerHTML = listHtml();
      list.querySelector(`[data-show="${i}"]`).focus();
    });

    const form = document.getElementById("pp-form");
    const word = document.getElementById("pp-word");
    const error = document.getElementById("pp-error");
    form.addEventListener("submit", event => {
      event.preventDefault();
      const text = word.value.trim();
      if (text.length < data.minLength) {
        error.textContent = t("pp.err.short", { min: data.minLength });
        word.setAttribute("aria-invalid", "true");
        word.focus();
        return;
      }
      state.list.push({ who: document.getElementById("pp-who").value, word: text });
      word.value = "";
      word.removeAttribute("aria-invalid");
      error.textContent = "";
      list.innerHTML = listHtml();
      showToast(t("pp.saved"));
    });
  }

  registerRoute({
    name: "passphrase",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
