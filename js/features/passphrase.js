"use strict";

// Feature: Family passphrase. #passphrase
// Owner: Jiliana
// The customer saves a safe word for each family member. The server stores it HASHED, so nobody,
// not even the bank, can read it back. When someone calls saying "it's me, I need money", the
// customer asks for the word, types what the caller says, and the app answers "Matches" or
// "Doesn't match". There is no "Show" button, because the app no longer knows the word.
// Server side: server/passphrases.js (routes under /api/passphrases).
//
// What it remembers (appState.passphrase, cleared by #reset):
//   list      the family list from the server ([{ id, name, relationship, created_at }]), null while loading
//   loadError true if the list could not be loaded
//   checking  the id of the card whose "Check a caller's word" box is open, or ""
//   justAdded the id of the person just added, or ""
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = PASSPHRASE_DATA;
  const esc = escapeHtml;
  addTranslations(data.text);   // this screen's English, Chinese and Malay words

  // The server saves the English word ("Son"); show it in the customer's language
  function relationshipLabel(value) {
    const r = data.relationships.find(item => item.value === value);
    return r ? t(r.key) : esc(value);
  }

  function myState() {
    if (!appState.passphrase) appState.passphrase = { list: null, loadError: false, checking: "", justAdded: "" };
    return appState.passphrase;
  }

  // Talks to the server. Throws an Error whose .status is the HTTP status, and .body the reply.
  // DEMO ONLY: X-User-Id tells the server who is signed in. Swap for your login's token when it is ready.
  async function api(path, options = {}) {
    const res = await fetch(`/api/passphrases${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "X-User-Id": appState.userId || "" }
    });
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error((body && body.error) || "Request failed");
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  // "2026-11-18T07:30:00Z" becomes "18 Nov 2026"
  function niceDate(iso) {
    return new Date(iso).toLocaleDateString(getLocale(), { day: "numeric", month: "short", year: "numeric" });
  }

  // ---------- HTML ----------

  function checkFormHtml(p) {
    return `<form class="pp-check" data-check-form="${esc(p.id)}" novalidate>
        <label for="pp-check-${esc(p.id)}">${t("pp.checkLabel")}</label>
        <div class="pw-row">
          <input id="pp-check-${esc(p.id)}" type="password" autocomplete="off" spellcheck="false">
          <button type="submit" class="btn btn-primary btn-small">${t("pp.check")}</button>
        </div>
        <div class="pp-check-result" aria-live="polite"></div>
      </form>`;
  }

  function listHtml() {
    const state = myState();
    if (state.loadError) return `<li class="pp-empty">${t("pp.loadError")}</li>`;
    if (!state.list) return `<li class="pp-empty">${t("pp.loading")}</li>`;
    if (!state.list.length) return `<li class="pp-empty">${t("pp.empty")}</li>`;
    return state.list.map(p => {
      const isNew = p.id === state.justAdded;
      const open = p.id === state.checking;
      return `<li class="pp-person${isNew ? " pp-person--new" : ""}">
          <p class="pp-name">${esc(p.name)}${isNew ? ` <span class="pp-tag">${t("pp.new")}</span>` : ""}</p>
          <p class="pp-rel">${t("pp.savedOn", { relationship: relationshipLabel(p.relationship), date: esc(niceDate(p.created_at)) })}</p>
          <div class="pp-actions">
            <button type="button" class="btn btn-secondary btn-small" data-open-check="${esc(p.id)}" aria-expanded="${open}">${t("pp.checkWord")}</button>
            <button type="button" class="btn btn-link btn-small" data-remove="${esc(p.id)}">${t("pp.remove")}<span class="visually-hidden"> ${esc(p.name)}</span></button>
          </div>
          ${open ? checkFormHtml(p) : ""}
        </li>`;
    }).join("");
  }

  function addFormHtml() {
    return `<form class="panel" id="pp-form" novalidate aria-labelledby="pp-add-title">
        <h2 id="pp-add-title">${t("pp.addTitle")}</h2>
        <div id="pp-success" tabindex="-1"></div>
        <div class="field">
          <label for="pp-name">${t("pp.name")}</label>
          <input type="text" id="pp-name" autocomplete="off" aria-describedby="pp-name-error">
          <p class="field-error" id="pp-name-error"></p>
        </div>
        <div class="field">
          <label for="pp-rel">${t("pp.rel")}</label>
          <select id="pp-rel" aria-describedby="pp-rel-error">
            <option value="">${t("pp.choose")}</option>
            ${data.relationships.map(r => `<option value="${esc(r.value)}">${t(r.key)}</option>`).join("")}
          </select>
          <p class="field-error" id="pp-rel-error"></p>
        </div>
        <div class="field">
          <label for="pp-word">${t("pp.word")}</label>
          <p class="meta" id="pp-word-hint">${t("pp.wordHint")}</p>
          <div class="pw-row">
            <input type="password" id="pp-word" autocomplete="off" spellcheck="false" aria-describedby="pp-word-hint pp-word-error">
            <button type="button" class="pw-toggle" aria-controls="pp-word">${t("pp.show")}<span class="visually-hidden"> ${t("pp.safeWord")}</span></button>
          </div>
          <p class="field-error" id="pp-word-error"></p>
        </div>
        <div class="stack"><button type="submit" class="btn btn-primary">${t("pp.save")}</button></div>
      </form>`;
  }

  function screenHtml() {
    const state = myState();
    state.justAdded = "";
    state.checking = "";
    return customerPageHtml("", `<div class="narrow pp-screen">
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("pp.title")}</h1>
        <p class="lead">${t("pp.lead")}</p>
        <div class="pp-promise">
          ${icon("lock")}
          <p>${t("pp.promise")}</p>
        </div>
      </section>
      <section class="panel" aria-labelledby="pp-list-title">
        <h2 id="pp-list-title" tabindex="-1">${t("pp.listTitle")}</h2>
        <ul id="pp-list" class="pp-list">${listHtml()}</ul>
      </section>
      ${addFormHtml()}
    </div>`);
  }

  // ---------- Behaviour ----------

  function setError(input, message) {
    document.getElementById(`${input.id}-error`).textContent = message;
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function redrawList() {
    document.getElementById("pp-list").innerHTML = listHtml();
  }

  async function loadList() {
    const state = myState();
    try {
      state.list = await api("");
      state.loadError = false;
    } catch (err) {
      state.loadError = true;
    }
    if (document.getElementById("pp-list")) redrawList();
  }

  // Shows the answer to "does this word match?"
  function resultHtml(person, reply) {
    if (reply.match) {
      return `<div class="pp-result pp-result--match">${icon("check")}<p>${t("pp.match")}</p></div>`;
    }
    const left = reply.triesLeft > 0 ? " " + (reply.triesLeft === 1 ? t("pp.triesLeftOne") : t("pp.triesLeft", { n: reply.triesLeft })) : "";
    return `<div class="pp-result pp-result--no">${icon("cross")}<p>${t("pp.noMatch", { name: esc(person.name) })}${left}</p></div>`;
  }

  async function check(form) {
    const state = myState();
    const id = form.dataset.checkForm;
    const person = state.list.find(p => p.id === id);
    const input = form.querySelector("input");
    const result = form.querySelector(".pp-check-result");
    if (!input.value.trim()) {
      result.innerHTML = `<p class="field-error">${t("pp.typeWord")}</p>`;
      input.focus();
      return;
    }
    try {
      const reply = await api(`/${encodeURIComponent(id)}/check`, { method: "POST", body: JSON.stringify({ word: input.value }) });
      result.innerHTML = resultHtml(person, reply);
    } catch (err) {
      result.innerHTML = err.status === 429
        ? `<div class="pp-result pp-result--no">${icon("clock")}<p>${t("pp.tooMany", { minutes: esc(err.body.minutesLeft), name: esc(person.name) })}</p></div>`
        : `<p class="field-error">${t("pp.cantCheck", { name: esc(person.name) })}</p>`;
    }
    input.value = "";   // never leave the word on screen
  }

  async function remove(id) {
    const state = myState();
    const person = state.list.find(p => p.id === id);
    try {
      await api(`/${encodeURIComponent(id)}`, { method: "DELETE" });
      state.list = state.list.filter(p => p.id !== id);
      state.justAdded = "";
      redrawList();
      showToast(t("pp.removed", { name: person.name }));
      document.getElementById("pp-list-title").focus();
    } catch (err) {
      showToast(t("pp.cantRemove"));
    }
  }

  function afterRender() {
    const state = myState();
    const list = document.getElementById("pp-list");
    const form = document.getElementById("pp-form");
    const success = document.getElementById("pp-success");
    const nameBox = document.getElementById("pp-name");
    const relBox = document.getElementById("pp-rel");
    const wordBox = document.getElementById("pp-word");

    loadList();

    list.addEventListener("click", event => {
      const opener = event.target.closest("[data-open-check]");
      const remover = event.target.closest("[data-remove]");
      if (opener) {
        const id = opener.dataset.openCheck;
        state.checking = state.checking === id ? "" : id;
        redrawList();
        const box = document.getElementById(`pp-check-${id}`);
        (box || list.querySelector(`[data-open-check="${id}"]`)).focus();
      }
      if (remover) remove(remover.dataset.remove);
    });

    list.addEventListener("submit", event => {
      const checkForm = event.target.closest("[data-check-form]");
      if (!checkForm) return;
      event.preventDefault();
      check(checkForm);
    });

    form.querySelector(".pw-toggle").addEventListener("click", event => {
      const show = wordBox.type === "password";
      wordBox.type = show ? "text" : "password";
      event.currentTarget.innerHTML = `${show ? t("pp.hide") : t("pp.show")}<span class="visually-hidden"> ${t("pp.safeWord")}</span>`;
    });

    form.addEventListener("input", event => {
      if ([nameBox, relBox, wordBox].includes(event.target)) setError(event.target, "");
      success.innerHTML = "";
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const name = nameBox.value.trim();
      const relationship = relBox.value;
      const word = wordBox.value;
      setError(nameBox, name ? "" : t("pp.err.name"));
      setError(relBox, relationship ? "" : t("pp.err.rel"));
      setError(wordBox, word.trim().length >= data.minLength ? "" : t("pp.err.word", { n: data.minLength }));
      const firstProblem = [nameBox, relBox, wordBox].find(input => input.getAttribute("aria-invalid") === "true");
      if (firstProblem) return firstProblem.focus();

      try {
        const saved = await api("", { method: "POST", body: JSON.stringify({ name, relationship, word }) });
        (state.list || (state.list = [])).push(saved);
        state.justAdded = saved.id;
        redrawList();
        form.reset();
        wordBox.type = "password";
        success.innerHTML = `<div class="pp-success" role="status">
            <p class="pp-success-title">${icon("check")}${t("pp.savedTitle")}</p>
            <p>${t("pp.savedText", { name: esc(saved.name) })}</p>
          </div>`;
        success.focus();
      } catch (err) {
        wordBox.value = "";
        success.innerHTML = `<p class="field-error">${t("pp.cantSave")}</p>`;
      }
    });
  }

  registerRoute({
    name: "passphrase",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();