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

  function myState() {
    if (!appState.passphrase) appState.passphrase = { list: data.saved.map(p => ({ ...p })), shown: -1 };
    return appState.passphrase;
  }

  function listHtml() {
    const state = myState();
    return state.list.map((p, i) => {
      const shown = i === state.shown;
      return `<li class="pp-saved">
          <span><strong>${esc(p.who)}</strong><br>
            <span class="pp-word">${shown ? esc(p.word) : `<span aria-hidden="true">••••••</span><span class="visually-hidden">hidden</span>`}</span></span>
          <button type="button" class="chip" data-show="${i}" aria-pressed="${shown}">${shown ? "Hide" : "Show"}<span class="visually-hidden"> the passphrase for ${esc(p.who)}</span></button>
        </li>`;
    }).join("");
  }

  function screenHtml() {
    return customerPageHtml("", `<div class="narrow pp-screen">
      ${homeLinkHtml()}
      <section class="panel" data-read>
        <h1 tabindex="-1">Family passphrase</h1>
        <p class="lead">Agree on a secret word with your family. If someone calls saying they are your family and need money, ask for the word. An AI copy of their voice will not know it.</p>
      </section>

      <section class="panel" aria-labelledby="pp-list-title">
        <h2 id="pp-list-title">Your passphrases</h2>
        <ul id="pp-list">${listHtml()}</ul>
      </section>

      <form class="panel" id="pp-form" novalidate aria-labelledby="pp-add-title">
        <h2 id="pp-add-title">Add a new one</h2>
        <div class="field">
          <label for="pp-who">Who is it for?</label>
          <select id="pp-who">${data.who.map(w => `<option>${w}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label for="pp-word">Secret word</label>
          <input type="text" id="pp-word" autocomplete="off" spellcheck="false" aria-describedby="pp-hint pp-error"
            placeholder="For example: the name of your first pet">
        </div>
        <p class="meta" id="pp-hint">Pick something only your family knows. Never post it online.</p>
        <p class="field-error" id="pp-error" role="alert"></p>
        <div class="stack"><button type="submit" class="btn btn-primary">Save passphrase</button></div>
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
        error.textContent = `Please type a word with at least ${data.minLength} letters.`;
        word.setAttribute("aria-invalid", "true");
        word.focus();
        return;
      }
      state.list.push({ who: document.getElementById("pp-who").value, word: text });
      word.value = "";
      word.removeAttribute("aria-invalid");
      error.textContent = "";
      list.innerHTML = listHtml();
      showToast("Passphrase saved");
    });
  }

  registerRoute({
    name: "passphrase",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
