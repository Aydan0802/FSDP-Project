"use strict";

// Feature: Sign in (customers, #login), Sign up (#login/signup) and Staff sign-in (#staff-login).
// Owner: Jiliana. Server sign-in and sign-up by Wei Ye (server/auth.js).
//   - Customers don't have to sign in for urgent help: the home screen and urgent tools are
//     open to everyone (access.js). Signing in is only for their own things.
//   - One box for the ID (the user ID they signed up with; a mobile number can be used as the ID)
//     and one for the password or PIN. The server checks them: POST /api/auth/login, against
//     Supabase, or against its built-in demo accounts when Supabase isn't set up.
//   - New customers make an account at #login/signup (POST /api/auth/signup). Staff accounts are
//     made by the bank, so staff have their own sign-in screen with no sign-up.
//   - Demo mode: if no sign-in server answers at all (the page is served by a plain file server or
//     the voice checker, e.g. the shared ngrok link), the screen says so and lets any details in,
//     so the prototype can still be shown. A server that answers "wrong password" is never skipped.
// The password is only sent to the server to be checked. It is never kept in the page.
// After signing in, a customer goes back to the screen they were trying to open (if any).
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  const data = LOGIN_DATA;
  addTranslations(data.text);   // the customer screens' English, Chinese and Malay words

  // ---------- Talking to the sign-in server ----------

  // Sends one request to the auth server. Gives back { reachable: false } when there is no
  // sign-in server here (no answer, no such route, or not JSON), otherwise { reachable, status, body }.
  async function askServer(path, payload) {
    let response;
    try {
      response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (error) {
      return { reachable: false };
    }
    if ([404, 405, 501].includes(response.status)) return { reachable: false };
    let body = null;
    try { body = await response.json(); } catch (error) { return { reachable: false }; }
    return { reachable: true, status: response.status, body };
  }

  // Asks the server whether this ID and password are right for this side.
  // { ok: true, userId, demo } or { ok: false, key, values } (key: the words to show)
  async function checkCredentials(role, userId, password) {
    const answer = await askServer("/api/auth/login", { role, userId, password });
    if (!answer.reachable) return { ok: true, userId, demo: true };
    const { status, body } = answer;
    if (status >= 200 && status < 300 && body.ok) return { ok: true, userId: body.userId };
    if (status === 400 || status === 401) return { ok: false, key: "login.err.wrong" };
    if (status === 423) return { ok: false, key: "login.err.locked", values: { minutes: body.minutes || 5 } };
    if (status === 503) return { ok: false, key: "login.err.database" };
    return { ok: false, key: "login.err.server" };
  }

  // Asks the server to make a customer account. { ok: true, userId, demo } or { ok: false, key }.
  async function createAccount(userId, password) {
    const answer = await askServer("/api/auth/signup", { userId, password });
    if (!answer.reachable) return { ok: true, userId, demo: true };
    const { status, body } = answer;
    if (status >= 200 && status < 300 && body.ok) return { ok: true, userId: body.userId };
    if (status === 409) return { ok: false, key: "signup.err.taken" };
    if (status === 429) return { ok: false, key: "signup.err.tooMany" };
    if (status === 400) {
      const keys = { id: "signup.err.id", short: "signup.err.short", "same-as-id": "signup.err.sameAsId", common: "signup.err.common" };
      return { ok: false, key: keys[body.problem] || "signup.err.id" };
    }
    if (status === 503) return { ok: false, key: "login.err.database" };
    return { ok: false, key: "login.err.server" };
  }

  // Tell the server to forget this sign-in too. Best effort: the page signs out either way.
  document.addEventListener("click", event => {
    if (event.target.closest('[data-action="signout"]')) fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  });

  // Switches a submit button off while the server is asked, so a second tap can't send it twice
  function busy(button, on) {
    button.disabled = on;
    if (on) button.setAttribute("aria-busy", "true");
    else button.removeAttribute("aria-busy");
  }

  // Shows or hides what is typed in password boxes, and changes the button's words to match.
  // words: { show, hide, hidden } in the screen's language.
  function togglePassword(button, inputs, words) {
    const show = inputs[0].type === "password";
    inputs.forEach(input => { input.type = show ? "text" : "password"; });
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

  // "Mdm Lim" is a name (only letters and spaces), so the home screen can greet by it;
  // "91234567" and "customer01" are a number or an ID
  function looksLikeName(text) {
    return /^[\p{L}][\p{L} .'-]*$/u.test(text) && !text.includes(".");
  }

  // Goes to the screen the customer was trying to open, or home, and says hello
  // isNew: the account was made just now, so the home screen says "Welcome", not "Welcome back"
  function finishCustomerSignIn(id, demo, isNew = false) {
    const name = looksLikeName(id) ? id : "";
    signIn("customer", id, name);
    appState.newAccount = isNew;
    const next = appState.afterSignIn || "#customer";
    appState.afterSignIn = "";
    location.hash = next;
    showToast(demo ? t("login.demoMode") : name ? t("login.welcome", { name: escapeHtml(name) }) : t("login.welcomeNoName"));
  }

  // ---------- Customer sign-in (#login) and sign-up (#login/signup) ----------

  function loginHtml(param) {
    const signingUp = param === "signup";
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
      ${signingUp ? signupCardHtml() : loginCardHtml()}

      <section class="login-hurry" aria-labelledby="hurry-title">
        <h2 id="hurry-title">${t("login.hurry.title")}</h2>
        <p>${t("login.hurry.text")}</p>
        <a class="hurry-link" href="#calling-now">${icon("phone")}<span>${t("login.hurry.calling")}</span>${icon("chevron", "hurry-arrow")}</a>
        <a class="hurry-link" href="#call-match">${icon("shield")}<span>${t("login.hurry.bank")}</span>${icon("chevron", "hurry-arrow")}</a>
      </section>

      <p class="staff-entry">${t("login.staffQ")} <a href="#staff-login">${t("login.staffLink")}</a></p>
    </main>`;
  }

  function loginCardHtml() {
    return `
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
            <input id="login-pw" name="secret" type="password" autocomplete="off" maxlength="64"
              aria-describedby="login-pw-hint login-error">
            <button type="button" class="pw-toggle" aria-controls="login-pw">${t("login.show")}<span class="visually-hidden">${t("login.secretHidden")}</span></button>
          </div>
          <p class="field-hint" id="login-pw-hint">${t("login.secretHint")}</p>
        </div>
        <p class="field-error" id="login-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">${t("login.submit")} ${icon("arrow")}</button>
        <button type="button" class="btn btn-link" id="demo-fill">${t("login.demoFill")}</button>
        <p class="login-note">${icon("lock")}<span>${t("login.note")}</span></p>
        <p class="login-switch">${t("login.newHere")} <a href="#login/signup">${t("login.createLink")}</a></p>
      </form>`;
  }

  function signupCardHtml() {
    return `
      <form class="login-card" id="signup-form" novalidate>
        <h1 tabindex="-1">${t("signup.title")}</h1>
        <p class="login-sub">${t("signup.sub")}</p>
        <div class="field">
          <label for="signup-id">${t("signup.userId")}</label>
          <input id="signup-id" name="userid" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="30" aria-describedby="signup-id-hint signup-error">
          <p class="field-hint" id="signup-id-hint">${t("signup.idHint")}</p>
        </div>
        <div class="field">
          <label for="signup-pw">${t("signup.password")}</label>
          <div class="pw-row">
            <input id="signup-pw" name="password" type="password" autocomplete="new-password" aria-describedby="signup-pw-hint signup-error">
            <button type="button" class="pw-toggle" aria-controls="signup-pw signup-pw2">${t("login.show")}<span class="visually-hidden">${t("login.secretHidden")}</span></button>
          </div>
          <p class="field-hint" id="signup-pw-hint">${t("signup.pwHint")}</p>
        </div>
        <div class="field">
          <label for="signup-pw2">${t("signup.password2")}</label>
          <input id="signup-pw2" name="password2" type="password" autocomplete="new-password" aria-describedby="signup-error">
        </div>
        <p class="field-error" id="signup-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">${t("signup.submit")} ${icon("arrow")}</button>
        <p class="login-note">${icon("lock")}<span>${t("signup.note")}</span></p>
        <p class="login-switch">${t("signup.haveAccount")} <a href="#login">${t("signup.signInLink")}</a></p>
      </form>`;
  }

  // Shows an error under the boxes and marks the box that needs fixing
  function showError(form, key, field, values) {
    document.getElementById("login-error").textContent = t(key, values);
    ["userid", "secret"].forEach(name => form.elements[name].removeAttribute("aria-invalid"));
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  // Needs both boxes; then the server checks them
  async function submitLogin(event) {
    event.preventDefault();   // stop the browser reloading the page, which is what a form does by default
    const form = event.currentTarget;
    const { userid, secret } = form.elements;
    const id = userid.value.trim();
    if (!id && !secret.value) return showError(form, "login.err.empty", userid);
    if (!id) return showError(form, "login.err.id", userid);
    if (!secret.value) return showError(form, "login.err.secret", secret);

    const button = form.querySelector('button[type="submit"]');
    busy(button, true);
    const result = await checkCredentials("customer", id.replace(/\s/g, ""), secret.value);
    busy(button, false);
    secret.value = "";   // never keep a password or PIN, whatever the answer
    if (!result.ok) return showError(form, result.key, secret, result.values);
    finishCustomerSignIn(looksLikeName(id) ? id : result.userId, result.demo);
  }

  // Checks the sign-up boxes, asks the server, then signs the new customer in
  async function submitSignup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { userid, password, password2 } = form.elements;
    const error = document.getElementById("signup-error");
    const id = userid.value.trim().replace(/\s/g, "");
    let problem = "";
    if (!id || !password.value || !password2.value) problem = "signup.err.empty";
    else if (!/^[A-Za-z0-9][A-Za-z0-9._-]{3,29}$/.test(id)) problem = "signup.err.id";
    else if (password.value.length < 8) problem = "signup.err.short";
    else if (password.value !== password2.value) problem = "signup.err.mismatch";
    if (problem) {
      error.textContent = t(problem);
      const field = problem === "signup.err.id" || !id ? userid : (problem === "signup.err.mismatch" ? password2 : password);
      [userid, password, password2].forEach(input => input.setAttribute("aria-invalid", String(input === field)));
      field.focus();
      return;
    }
    error.textContent = "";
    [userid, password, password2].forEach(input => input.removeAttribute("aria-invalid"));

    const button = form.querySelector('button[type="submit"]');
    busy(button, true);
    const result = await createAccount(id, password.value);
    busy(button, false);
    password.value = "";   // never keep a password, whatever the answer
    password2.value = "";
    if (!result.ok) {
      error.textContent = t(result.key);
      (result.key === "signup.err.taken" || result.key === "signup.err.id" ? userid : password).focus();
      return;
    }
    finishCustomerSignIn(result.userId, result.demo, true);   // a new account is signed in straight away
  }

  function afterLogin(param) {
    const words = { show: t("login.show"), hide: t("login.hide"), hidden: t("login.secretHidden") };
    if (param === "signup") {
      const form = document.getElementById("signup-form");
      form.addEventListener("submit", submitSignup);
      form.querySelector(".pw-toggle").addEventListener("click", event =>
        togglePassword(event.currentTarget, [form.elements.password, form.elements.password2], words));
      return;
    }
    const form = document.getElementById("login-form");
    form.addEventListener("submit", submitLogin);
    form.querySelector(".pw-toggle").addEventListener("click", event =>
      togglePassword(event.currentTarget, [form.elements.secret], words));
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

  async function submitStaff(event) {
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
    const button = form.querySelector('button[type="submit"]');
    busy(button, true);
    const result = await checkCredentials("staff", userid.value.trim(), password.value);
    busy(button, false);
    password.value = "";   // never keep a password, even in a demo
    if (!result.ok) {
      error.textContent = data.text.en[result.key] ? data.text.en[result.key].replace("{minutes}", (result.values || {}).minutes || 5) : result.key;
      password.setAttribute("aria-invalid", "true");
      password.focus();
      return;
    }
    signIn("staff", result.userId);
    location.hash = "#staff";
    if (result.demo) showToast(data.text.en["login.demoMode"]);
  }

  function afterStaffLogin() {
    const form = document.getElementById("staff-form");
    const s = data.staff;
    form.addEventListener("submit", submitStaff);
    form.querySelector(".pw-toggle").addEventListener("click", event =>
      togglePassword(event.currentTarget, [form.elements.password], { show: s.show, hide: s.hide, hidden: s.passwordHidden }));
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
