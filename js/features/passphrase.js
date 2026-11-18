"use strict";

// Feature: Family passphrase. #passphrase
// Owner: Jiliana. Built on frontend-update from the senior flow preview (it was a stub).
// A list of secret words agreed with family, each hidden until "Show" is pressed, and a form
// to add a new one. If a caller says they are family and need money, ask for the word:
// an AI copy of their voice will not know it.
// website-refresh, from the team's feedback:
//   - each entry has the family member's name, relationship and (optional) mobile number, so
//     "Call" can ring them back on a number you trust. The bank never needs their account:
//     the word is only between you and your family.
//   - "How it works" in four short bullet points instead of a paragraph
//   - the example ("the name of your first pet") is a line under the box, not inside it, where
//     it was cut off on phones and vanished when typing
//   - after saving: "Saved for <name>" with a tick, and the new entry is highlighted
// Nothing is saved or sent anywhere: the list lasts until the page is refreshed or #reset.
//
// What it remembers (appState.passphrase, cleared by #reset):
//   list       [{ name, who, phone, word }], starting with PASSPHRASE_DATA.saved
//   shown      which passphrase is showing (its place in the list), or -1 for none
//   justAdded  the place of the one just saved (highlighted), or -1
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = PASSPHRASE_DATA;
  const esc = escapeHtml;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words
  // Note: "who" is kept as a translation key (the <option> value), so a saved passphrase's
  // relationship is shown in whatever language the customer picks later.

  function myState() {
    if (!appState.passphrase) appState.passphrase = { list: data.saved.map(p => ({ ...p })), shown: -1, justAdded: -1 };
    return appState.passphrase;
  }

  // "Jun Hao" + "Grandchild"
  function whoText(p) {
    return `${esc(p.name)} · ${esc(t(p.who))}`;
  }

  function listHtml() {
    const state = myState();
    if (!state.list.length) return `<li class="pp-empty">${t("pp.empty")}</li>`;
    return state.list.map((p, i) => {
      const shown = i === state.shown;
      const tel = p.phone ? `tel:${p.phone.replace(/\D/g, "")}` : "";
      return `<li class="pp-saved${i === state.justAdded ? " pp-saved--new" : ""}">
          <span class="pp-who"><strong>${whoText(p)}</strong>
            <span class="pp-word">${shown ? esc(p.word) : `<span aria-hidden="true">••••••</span><span class="visually-hidden">${t("pp.hidden")}</span>`}</span></span>
          <span class="pp-actions">
            <button type="button" class="chip" data-show="${i}" aria-pressed="${shown}">${shown ? t("pp.hide") : t("pp.show")}<span class="visually-hidden">${t("pp.forWho", { who: esc(p.name) })}</span></button>
            ${tel ? `<a class="chip" href="${tel}">${icon("phone")}${t("pp.call")}<span class="visually-hidden">${t("pp.callWho", { who: esc(p.name) })}</span></a>` : ""}
          </span>
        </li>`;
    }).join("");
  }

  // The confirmation after saving: a tick, who it is for, and one tip
  function savedHtml(p) {
    return `<div class="pp-success">
        <span class="done-mark">${icon("check")}</span>
        <div><strong>${t("pp.savedFor", { name: esc(p.name) })}</strong>
          <p>${t("pp.savedTip", { name: esc(p.name) })}</p></div>
      </div>`;
  }

  function screenHtml() {
    const state = myState();
    state.justAdded = -1;   // coming back to the screen: no highlight
    return customerPageHtml("", `<div class="narrow pp-screen">
      ${homeLinkHtml()}
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("pp.title")}</h1>
        <h2 class="pp-how-title">${t("pp.how.title")}</h2>
        <ul class="points">
          <li>${t("pp.how.1")}</li>
          <li>${t("pp.how.2")}</li>
          <li>${t("pp.how.3")}</li>
          <li>${t("pp.how.4")}</li>
        </ul>
      </section>

      <section class="panel" aria-labelledby="pp-list-title">
        <h2 id="pp-list-title">${t("pp.listTitle")}</h2>
        <div id="pp-result" role="status"></div>
        <ul id="pp-list">${listHtml()}</ul>
      </section>

      <form class="panel" id="pp-form" novalidate aria-labelledby="pp-add-title">
        <h2 id="pp-add-title">${t("pp.addTitle")}</h2>
        <div class="field">
          <label for="pp-name">${t("pp.nameLabel")}</label>
          <input type="text" id="pp-name" autocomplete="off" maxlength="40" aria-describedby="pp-error">
        </div>
        <div class="field">
          <label for="pp-who">${t("pp.whoLabel")}</label>
          <select id="pp-who">${data.who.map(w => `<option value="${w}">${t(w)}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label for="pp-phone">${t("pp.phoneLabel")}</label>
          <input type="tel" id="pp-phone" inputmode="numeric" autocomplete="off" maxlength="9" placeholder="9123 4567"
            aria-describedby="pp-phone-hint pp-error">
          <p class="field-hint" id="pp-phone-hint">${t("pp.phoneHint")}</p>
        </div>
        <div class="field">
          <label for="pp-word">${t("pp.wordLabel")}</label>
          <input type="text" id="pp-word" autocomplete="off" spellcheck="false" aria-describedby="pp-example pp-hint pp-error">
          <p class="field-hint" id="pp-example">${t("pp.example")}</p>
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
    const name = document.getElementById("pp-name");
    const phone = document.getElementById("pp-phone");
    const word = document.getElementById("pp-word");
    const error = document.getElementById("pp-error");

    // "91234567" shows as "9123 4567"
    phone.addEventListener("input", () => {
      const digits = phone.value.replace(/\D/g, "").slice(0, 8);
      phone.value = digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;
    });

    function fail(message, field) {
      [name, phone, word].forEach(f => f.removeAttribute("aria-invalid"));
      error.textContent = message;
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      const who = name.value.trim();
      const digits = phone.value.replace(/\D/g, "");
      const text = word.value.trim();
      if (!who) return fail(t("pp.err.name"), name);
      if (digits && !/^[89]\d{7}$/.test(digits)) return fail(t("pp.err.phone"), phone);
      if (text.length < data.minLength) return fail(t("pp.err.short", { min: data.minLength }), word);

      const entry = { name: who, who: document.getElementById("pp-who").value, phone: phone.value.trim(), word: text };
      state.list.push(entry);
      state.justAdded = state.list.length - 1;
      [name, phone, word].forEach(f => { f.value = ""; f.removeAttribute("aria-invalid"); });
      error.textContent = "";

      // Show the confirmation and the highlighted new entry, and bring them into view
      list.innerHTML = listHtml();
      const result = document.getElementById("pp-result");
      result.innerHTML = savedHtml(entry);
      result.scrollIntoView({ behavior: "smooth", block: "center" });
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
