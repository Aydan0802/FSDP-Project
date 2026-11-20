"use strict";

// Feature: Ask the helper (AI chat). #helper
// Owner: Jose
// A senior types (or taps) what is happening. The server (POST /api/chat, server/chat.js) answers
// with a short reply and up to 3 big buttons that open the right screen of the app.
// Anyone can use it, without signing in: someone on a scam call needs help straight away.
// Words come from t(); this screen's words are in HELPER_DATA.text (js/data/chatbot.js).
//
// What it remembers (appState.helper, cleared by #reset):
//   messages   the chat so far: [{ role: "user" | "bot", text, actions, urgent, error }]
//   waiting    true while the server is thinking

(function () {
  const data = HELPER_DATA;
  addTranslations(data.text);

  // Every button the server can send: where it goes, its icon and its words (shared words in
  // i18n.js, so they are already in all four languages). The ids match ACTIONS in server/chat.js.
  // urgent ones are red; the rest are white.
  const BUTTONS = {
    "calling-now": { href: "#calling-now", icon: "phone", label: "side.urgent", urgent: true },
    "call-match": { href: "#call-match", icon: "shield", label: "side.callMatch" },
    "caller-check": { href: "#caller-check", icon: "user", label: "side.callerCheck" },
    "analyser": { href: "#analyser", icon: "search", label: "side.analyser" },
    "freeze": { href: "#freeze", icon: "lock", label: "side.freeze", urgent: true },
    "report": { href: "#report", icon: "flag", label: "side.report" },
    "learn-signs": { href: "#learn-signs", icon: "book", label: "side.learnSigns" },
    "call-ocbc": { href: OCBC_TEL, icon: "phone", label: "callBar.call", urgent: true }
  };

  function myState() {
    if (!appState.helper) appState.helper = { messages: [], waiting: false };
    return appState.helper;
  }

  // ---------- Drawing the chat ----------

  // One message. Everything the senior typed AND everything the AI wrote goes through escapeHtml(),
  // so neither can ever run as code on this page.
  function messageHtml(m) {
    if (m.role === "user") {
      return `<li class="hp-msg hp-msg--user"><span class="visually-hidden">${t("hp.you")}: </span>${escapeHtml(m.text)}</li>`;
    }
    const buttons = (m.actions || []).filter(id => BUTTONS[id]).map(id => {
      const b = BUTTONS[id];
      return `<a class="btn ${b.urgent ? "btn-primary" : "btn-secondary"} hp-action" href="${b.href}">${icon(b.icon)}${t(b.label)}</a>`;
    }).join("");
    return `<li class="hp-msg hp-msg--bot${m.urgent ? " hp-msg--urgent" : ""}" data-read>
        <span class="visually-hidden">${t("hp.bot")}: </span><p>${escapeHtml(m.text)}</p>
        ${buttons ? `<div class="hp-actions">${buttons}</div>` : ""}
      </li>`;
  }

  // The welcome, the chat so far, and "Thinking..." while waiting
  function listHtml(state) {
    return messageHtml({ role: "bot", text: t("hp.welcome") })
      + state.messages.map(messageHtml).join("")
      + (state.waiting ? `<li class="hp-msg hp-msg--bot hp-thinking" role="status"><span class="hp-dots" aria-hidden="true"><span></span><span></span><span></span></span>${t("hp.thinking")}</li>` : "");
  }

  function chipsHtml(state) {
    if (state.messages.length) return "";   // only before the first message
    return `<div class="chips hp-chips">
        ${data.chips.map(key => `<button type="button" class="chip" data-say="${key}">${t(key)}</button>`).join("")}
      </div>`;
  }

  function screenHtml() {
    const state = myState();
    return customerPageHtml("helper", `<div class="narrow hp">
        <section class="panel hp-head" data-read>
          <h1 tabindex="-1">${t("hp.title")}</h1>
          <p class="lead">${t("hp.lead")}</p>
        </section>
        <ol class="hp-list" id="hp-list" aria-live="polite">${listHtml(state)}</ol>
        <div id="hp-chips">${chipsHtml(state)}</div>
        <form class="hp-form" id="hp-form">
          <label for="hp-input" class="visually-hidden">${t("hp.label")}</label>
          <textarea id="hp-input" rows="2" maxlength="500" placeholder="${t("hp.placeholder")}"></textarea>
          <button type="submit" class="btn btn-primary hp-send"${state.waiting ? " disabled" : ""}>${t("hp.send")}</button>
        </form>
        <p class="hp-note">${icon("lock")}<span>${t("hp.private")}</span></p>
        <p class="hp-note">${icon("question")}<span>${t("hp.ai")}</span></p>
        ${state.messages.length ? `<button type="button" class="btn btn-link" id="hp-restart">${t("hp.restart")}</button>` : ""}
      </div>`);
  }

  // Updates only the chat, not the whole screen, so the senior's place and typing are kept
  function refresh() {
    const state = myState();
    const list = document.getElementById("hp-list");
    if (!list) return;   // they went to another screen while waiting
    list.innerHTML = listHtml(state);
    document.getElementById("hp-chips").innerHTML = chipsHtml(state);
    document.querySelector(".hp-send").disabled = state.waiting;
    const last = list.lastElementChild;
    if (last) last.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // ---------- Talking to the server ----------

  // Asks the server. Gives back the helper's message. If the server can't answer (no internet,
  // too slow, an error), the helper says so and offers the Call OCBC button, so nobody is stuck.
  async function ask(messages) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          lang: getLanguage(),
          messages: messages.filter(m => !m.error).map(m => ({ role: m.role, text: m.text }))
        })
      });
      if (!res.ok) throw new Error(`The server answered ${res.status}`);
      const body = await res.json();
      return { role: "bot", text: body.reply, actions: body.actions || [], urgent: Boolean(body.urgent) };
    } catch (err) {
      return { role: "bot", text: t("hp.error"), actions: ["call-ocbc"], urgent: false, error: true };
    } finally {
      clearTimeout(timer);
    }
  }

  // Same rules as the server's hideSecrets() (server/chat.js): an OTP, a card number or an NRIC
  // is hidden on the phone itself, so it is never shown in the chat or sent anywhere
  const SECRETS = [/\b\d(?:[ -]?\d){12,18}\b/g, /\b[STFGM]\d{7}[A-Z]\b/gi, /\b\d{6}\b/g];
  function hideSecrets(text) {
    return SECRETS.reduce((hidden, pattern) => hidden.replace(pattern, "[hidden]"), text);
  }

  async function send(text) {
    const state = myState();
    const words = hideSecrets(String(text || "").trim().slice(0, 500));
    if (!words || state.waiting) return;
    state.messages.push({ role: "user", text: words });
    state.waiting = true;
    refresh();
    const reply = await ask(state.messages);
    state.waiting = false;
    state.messages.push(reply);
    refresh();
  }

  function afterRender() {
    const form = document.getElementById("hp-form");
    const input = document.getElementById("hp-input");
    form.addEventListener("submit", event => {
      event.preventDefault();
      const text = input.value;
      input.value = "";
      send(text);
      input.focus();
    });
    // Enter sends (like a phone's chat app); Shift + Enter starts a new line
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    // A quick button sends its own words
    document.getElementById("hp-chips").addEventListener("click", event => {
      const chip = event.target.closest("[data-say]");
      if (chip) send(t(chip.dataset.say));
    });
    const restart = document.getElementById("hp-restart");
    if (restart) restart.addEventListener("click", () => {
      appState.helper = { messages: [], waiting: false };
      redrawScreen();
    });
  }

  registerRoute({
    name: "helper",
    role: "public",
    render: screenHtml,
    afterRender
  });
})();
