"use strict";

// Feature: Sign in (customers, #login) and Staff sign-in (#staff-login).
// Owner: Jiliana
// Changed on website-refresh, from the team's feedback:
//   - Customers no longer have to sign in to get urgent help: the home screen and the urgent
//     tools are open to everyone (access.js). Signing in is only for their own things.
//   - Customers sign in with ONE box for whatever they remember (user ID, mobile number or
//     name) and ONE box for their password or PIN.
//   - The customer is the main focus. Staff have their own sign-in screen, linked at the bottom.
// After signing in, a customer goes back to the screen they were trying to open (if any),
// otherwise to the home screen. Nothing is checked, saved or sent anywhere.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  const data = LOGIN_DATA;
  addTranslations(data.text);   // the customer screen's English, Chinese and Malay words

  // ---------- Customer sign-in (#login) ----------

  function loginHtml() {
    return `
    <div class="login-top">
      ${backButtonHtml("login-home")}
      <div class="login-tools">${languageSwitchHtml()}${textSizeHtml()}</div>
    </div>
    <section class="login-brand" aria-label="${t("login.about")}">
      ${brandHtml("#customer")}
      <p class="login-kicker">${t("login.kicker")}</p>
      <p class="login-tagline">${t("login.tagline")} <span>${t("login.taglineEnd")}</span></p>
    </section>

    <main class="login-main" tabindex="-1">
      <form class="login-card" id="login-form" novalidate>
        <h1 tabindex="-1">${t("login.title")}</h1>
        <p class="login-sub">${t("login.sub")}</p>
        <p class="login-message" id="login-message" role="status"></p>
        <div class="field">
          <label for="login-id">${t("login.id")}</label>
          <input id="login-id" name="userid" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="40"
            aria-describedby="login-id-hint login-error">
          <p class="field-hint" id="login-id-hint">${t("login.idHint")}</p>
        </div>
        <div class="field">
          <label for="login-pw">${t("login.secret")}</label>
          <div class="pw-row">
            <input id="login-pw" name="secret" type="password" autocomplete="off" maxlength="40"
              aria-describedby="login-pw-hint login-error">
            <button type="button" class="pw-toggle" aria-controls="login-pw">${t("login.show")}<span class="visually-hidden">${t("login.secretHidden")}</span></button>
          </div>
          <p class="field-hint" id="login-pw-hint">${t("login.secretHint")}</p>
        </div>
        <p class="field-error" id="login-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">${t("login.submit")} ${icon("arrow")}</button>
        <button type="button" class="btn btn-link" id="demo-fill">${t("login.demoFill")}</button>
        <p class="login-note">${icon("lock")}<span>${t("login.note")}</span></p>
      </form>

      <section class="login-hurry" aria-labelledby="hurry-title">
        <h2 id="hurry-title">${t("login.hurry.title")}</h2>
        <p>${t("login.hurry.text")}</p>
        <a class="hurry-link" href="#calling-now">${icon("phone")}<span>${t("login.hurry.calling")}</span>${icon("chevron", "hurry-arrow")}</a>
        <a class="hurry-link" href="#call-match">${icon("shield")}<span>${t("login.hurry.bank")}</span>${icon("chevron", "hurry-arrow")}</a>
      </section>

      <p class="staff-entry">${t("login.staffQ")} <a href="#staff-login">${t("login.staffLink")}</a></p>
    </main>`;
  }

  // Shows an error under the boxes and marks the box that needs fixing
  function showError(form, key, field) {
    document.getElementById("login-error").textContent = t(key);
    ["userid", "secret"].forEach(name => form.elements[name].removeAttribute("aria-invalid"));
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  // What the first box holds, so the home screen can greet by name when it is one:
  // "Mdm Lim" is a name (only letters and spaces); "91234567" and "lim88" are a number or an ID.
  function looksLikeName(text) {
    return /^[\p{L}][\p{L} .'-]*$/u.test(text) && !text.includes(".");
  }

  // Needs both boxes filled in. Any details work: this is a demo, nothing is checked.
  function submitLogin(event) {
    event.preventDefault();   // stop the browser reloading the page, which is what a form does by default
    const form = event.currentTarget;
    const { userid, secret } = form.elements;
    const id = userid.value.trim();
    if (!id && !secret.value) return showError(form, "login.err.empty", userid);
    if (!id) return showError(form, "login.err.id", userid);
    if (!secret.value) return showError(form, "login.err.secret", secret);

    secret.value = "";   // never keep a password or PIN, even in a demo
    const name = looksLikeName(id) ? id : "";
    signIn("customer", id.replace(/\s/g, ""), name);
    const next = appState.afterSignIn || "#customer";
    appState.afterSignIn = "";
    location.hash = next;
    showToast(name ? t("login.welcome", { name: escapeHtml(name) }) : t("login.welcomeNoName"));
  }

  // Shows or hides what is typed in a password box, and changes the button's words to match.
  // words: { show, hide, hidden } in the screen's language.
  function togglePassword(button, input, words) {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.innerHTML = `${show ? words.hide : words.show}<span class="visually-hidden">${words.hidden}</span>`;
  }

  // Shows a message left by access.js (e.g. "Please sign in to use this") once. It is filled a
  // moment later so screen readers notice the change. Messages are translation keys.
  function showLoginMessage(elementId, lookUp) {
    if (!appState.loginMessage) return;
    const message = lookUp(appState.loginMessage);
    appState.loginMessage = "";
    setTimeout(() => {
      const box = document.getElementById(elementId);
      if (box) box.textContent = message;
    }, 50);
  }

  function afterLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", submitLogin);
    form.querySelector(".pw-toggle").addEventListener("click", event =>
      togglePassword(event.currentTarget, form.elements.secret, { show: t("login.show"), hide: t("login.hide"), hidden: t("login.secretHidden") }));
    document.getElementById("demo-fill").addEventListener("click", () => {
      form.elements.userid.value = data.demoCustomer.id;
      form.elements.secret.value = data.demoCustomer.secret;
      ["userid", "secret"].forEach(name => form.elements[name].removeAttribute("aria-invalid"));
      document.getElementById("login-error").textContent = "";
    });
    showLoginMessage("login-message", key => t(key));
  }

  // ---------- Staff sign-in (#staff-login): English only, like the staff console ----------

  function staffLoginHtml() {
    const s = data.staff;
    return `
    <div class="login-top" lang="en">
      <a class="login-home" href="#login">${icon("back")}${s.back}</a>
      <div class="login-tools">${textSizeHtml()}</div>
    </div>
    <section class="login-brand" aria-label="${s.about}" lang="en">
      ${brandHtml("#staff-login", "Staff")}
      <p class="login-kicker">${s.kicker}</p>
      <p class="login-tagline">${s.tagline}</p>
    </section>

    <main class="login-main" tabindex="-1" lang="en">
      <form class="login-card" id="staff-form" novalidate>
        <h1 tabindex="-1">${s.title}</h1>
        <p class="login-sub">${s.sub}</p>
        <p class="login-message" id="staff-message" role="status"></p>
        <div class="field">
          <label for="staff-id">${s.id}</label>
          <input id="staff-id" name="userid" autocomplete="off" spellcheck="false" aria-describedby="staff-error">
        </div>
        <div class="field">
          <label for="staff-pw">${s.password}</label>
          <div class="pw-row">
            <input id="staff-pw" name="password" type="password" autocomplete="off" aria-describedby="staff-error">
            <button type="button" class="pw-toggle" aria-controls="staff-pw">${s.show}<span class="visually-hidden">${s.passwordHidden}</span></button>
          </div>
        </div>
        <p class="field-error" id="staff-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">${s.submit} ${icon("arrow")}</button>
        <button type="button" class="btn btn-link" id="staff-demo-fill">${s.demoFill}</button>
        <p class="login-note">${icon("lock")}<span>${s.note}</span></p>
      </form>
    </main>`;
  }

  function submitStaff(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { userid, password } = form.elements;
    const error = document.getElementById("staff-error");
    userid.setAttribute("aria-invalid", String(!userid.value.trim()));
    password.setAttribute("aria-invalid", String(!password.value));
    if (!userid.value.trim() || !password.value) {
      error.textContent = data.staff.errEmpty;
      (userid.value.trim() ? password : userid).focus();
      return;
    }
    error.textContent = "";
    password.value = "";   // never keep a password, even in a demo
    signIn("staff", userid.value.trim());
    location.hash = "#staff";
  }

  function afterStaffLogin() {
    const form = document.getElementById("staff-form");
    form.addEventListener("submit", submitStaff);
    const s = data.staff;
    form.querySelector(".pw-toggle").addEventListener("click", event =>
      togglePassword(event.currentTarget, form.elements.password, { show: s.show, hide: s.hide, hidden: s.passwordHidden }));
    document.getElementById("staff-demo-fill").addEventListener("click", () => {
      form.elements.userid.value = data.demoStaff.id;
      form.elements.password.value = data.demoStaff.password;
      form.elements.userid.removeAttribute("aria-invalid");
      form.elements.password.removeAttribute("aria-invalid");
      document.getElementById("staff-error").textContent = "";
    });
    // Staff messages are always shown in English
    showLoginMessage("staff-message", key => data.text.en[key] || key);
  }

  registerRoute({ name: "login", role: "public", render: loginHtml, afterRender: afterLogin });
  registerRoute({ name: "staff-login", role: "public", render: staffLoginHtml, afterRender: afterStaffLogin });
})();
