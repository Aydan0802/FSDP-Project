"use strict";

// Feature: Sign in.
// Owner: Jiliana
// Moved out of the theme samples (shared/samples.js). Choose "A customer" or "Bank staff", type an
// ID and password, and the server checks them against the accounts in the database
// (POST /api/auth/login, see server/auth.js). Only a right ID and password for the chosen side gets
// in. Customers go to #customer, staff go to #staff.
// New customers can make an account at #login/signup (POST /api/auth/signup). Staff accounts are
// made by the bank, so there is no staff sign-up.
// The password is only sent to the server to be checked. It is never kept in the page.
// This needs the server running (npm start in /server, then open http://localhost:3000): a plain file
// server such as Live Server or python -m http.server has nothing to check the password with.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  addTranslations(LOGIN_DATA.text);   // this screen's English, Chinese and Malay words

  // The sign-in screen's HTML. At #login/signup the card is the sign-up form instead.
  function loginHtml(param) {
    const signingUp = param === "signup";
    return `
    <section class="login-brand" aria-label="${t("login.about")}">
      ${brandHtml("#login")}
      <p class="login-kicker">${t("login.kicker")}</p>
      <p class="login-tagline">${t("login.tagline")} <span>${t("login.taglineEnd")}</span></p>
      <ul class="login-points">
        <li>${icon("wave")}${t("login.point.voice")}</li>
        <li>${icon("shield")}${t("login.point.bank")}</li>
        <li>${icon("flag")}${t("login.point.report")}</li>
      </ul>
      <div class="login-art" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    </section>

    <main class="login-main" tabindex="-1">
      <div class="login-tools">${textSizeHtml()}</div>
      ${signingUp ? signupCardHtml() : loginCardHtml()}
    </main>`;
  }

  // The sign-in card
  function loginCardHtml() {
    return `
      <form class="login-card" id="login-form" novalidate>
        <h1 tabindex="-1">${t("login.title")}</h1>
        <p class="login-sub">${t("login.sub")}</p>
        <p class="field-error" id="login-message" role="alert"></p>
        <fieldset class="role-pick">
          <legend>${t("login.iAm")}</legend>
          <div class="role-options">
            <label class="role"><input type="radio" name="role" value="customer" checked>${icon("user")}
              <span class="role-text"><strong>${t("login.customer")}</strong><span>${t("login.customerSub")}</span></span></label>
            <label class="role"><input type="radio" name="role" value="staff">${icon("briefcase")}
              <span class="role-text"><strong>${t("login.staff")}</strong><span>${t("login.staffSub")}</span></span></label>
          </div>
        </fieldset>
        <div class="field">
          <label for="login-id" id="login-id-label">${t("login.userId")}</label>
          <input id="login-id" name="userid" autocomplete="off" spellcheck="false" aria-describedby="login-error">
        </div>
        <div class="field">
          <label for="login-pw">${t("login.password")}</label>
          <div class="pw-row">
            <input id="login-pw" name="password" type="password" autocomplete="off" aria-describedby="login-error">
            <button type="button" class="pw-toggle" aria-controls="login-pw">${t("login.show")}<span class="visually-hidden">${t("login.passwordHidden")}</span></button>
          </div>
        </div>
        <p class="field-error" id="login-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">${t("login.submit")} ${icon("arrow")}</button>
        <button type="button" class="btn btn-link" id="demo-fill">${t("login.demoFill")}</button>
        <p class="login-note">${icon("lock")}<span>${t("login.note")}</span></p>
        <p class="login-switch">${t("login.newHere")} <a href="#login/signup">${t("login.createLink")}</a></p>
      </form>`;
  }

  // The sign-up card (customers only)
  function signupCardHtml() {
    return `
      <form class="login-card" id="signup-form" novalidate>
        <h1 tabindex="-1">${t("signup.title")}</h1>
        <p class="login-sub">${t("signup.sub")}</p>
        <div class="field">
          <label for="signup-id">${t("signup.userId")}</label>
          <input id="signup-id" name="userid" autocomplete="off" spellcheck="false" maxlength="30" aria-describedby="signup-id-hint signup-error">
          <p class="field-hint" id="signup-id-hint">${t("signup.idHint")}</p>
        </div>
        <div class="field">
          <label for="signup-pw">${t("signup.password")}</label>
          <div class="pw-row">
            <input id="signup-pw" name="password" type="password" autocomplete="new-password" aria-describedby="signup-pw-hint signup-error">
            <button type="button" class="pw-toggle" aria-controls="signup-pw signup-pw2">${t("login.show")}<span class="visually-hidden">${t("login.passwordHidden")}</span></button>
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

  // Which radio button is picked: "customer" or "staff"
  function chosenRole(form) {
    return form.elements.role.value;
  }

  // Types the demo ID and password for the chosen role, and clears any error
  function fillDemo(form) {
    const { userid, password } = form.elements;
    userid.value = LOGIN_DATA.demoIds[chosenRole(form)];
    password.value = LOGIN_DATA.demoPasswords[chosenRole(form)];
    userid.removeAttribute("aria-invalid");
    password.removeAttribute("aria-invalid");
    document.getElementById("login-error").textContent = "";
  }

  // Shows or hides the password box(es) next to the button, and changes the button's words to match
  function togglePassword(button) {
    const inputs = button.getAttribute("aria-controls").split(" ").map(id => document.getElementById(id));
    const show = inputs[0].type === "password";
    inputs.forEach(input => { input.type = show ? "text" : "password"; });
    button.innerHTML = `${show ? t("login.hide") : t("login.show")}<span class="visually-hidden">${t("login.passwordHidden")}</span>`;
  }

  // Asks the server whether this ID and password are right for this side.
  // Gives back { ok: true, userId } or { ok: false, key, values } where key is the words to show.
  async function checkCredentials(role, userId, password) {
    let response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userId, password })
      });
    } catch (error) {
      console.warn("Sign in needs the server: run npm start in the /server folder, then open http://localhost:3000");
      return { ok: false, key: "login.err.server" };
    }
    let data = {};
    try { data = await response.json(); } catch (error) { /* not JSON: probably a plain file server with no sign-in */ }

    if (response.ok && data.ok) return { ok: true, userId: data.userId };
    if (response.status === 400 || response.status === 401) return { ok: false, key: "login.err.wrong" };
    if (response.status === 423) return { ok: false, key: "login.err.locked", values: { minutes: data.minutes || 5 } };
    if (response.status === 503) return { ok: false, key: "login.err.database" };
    console.warn("Sign in needs the server: run npm start in the /server folder, then open http://localhost:3000");
    return { ok: false, key: "login.err.server" };
  }

  // Checks both boxes are filled in, asks the server, then signs in and goes to that person's home screen
  async function submitLogin(event) {
    event.preventDefault();   // stop the browser reloading the page, which is what a form does by default
    const form = event.currentTarget;
    const { userid, password } = form.elements;
    const error = document.getElementById("login-error");
    userid.setAttribute("aria-invalid", String(!userid.value.trim()));
    password.setAttribute("aria-invalid", String(!password.value));
    if (!userid.value.trim() || !password.value) {
      error.textContent = t("login.err.empty");
      (userid.value.trim() ? password : userid).focus();
      return;
    }
    error.textContent = "";

    // Ask the server. The button is switched off meanwhile so a second click can't send it twice.
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    const role = chosenRole(form);
    const result = await checkCredentials(role, userid.value.trim(), password.value);
    button.disabled = false;
    button.removeAttribute("aria-busy");
    password.value = "";   // never keep a password, whatever the answer

    if (!result.ok) {
      error.textContent = t(result.key, result.values);
      password.setAttribute("aria-invalid", "true");
      password.focus();
      return;
    }
    signIn(role, result.userId);
    location.hash = role === "staff" ? "#staff" : "#customer";
  }

  // Asks the server to make a customer account. Gives back { ok: true, userId } or { ok: false, key }.
  async function createAccount(userId, password) {
    let response;
    try {
      response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
      });
    } catch (error) {
      console.warn("Sign up needs the server: run npm start in the /server folder, then open http://localhost:3000");
      return { ok: false, key: "login.err.server" };
    }
    let data = {};
    try { data = await response.json(); } catch (error) { /* not JSON: probably a plain file server */ }

    if (response.ok && data.ok) return { ok: true, userId: data.userId };
    if (response.status === 409) return { ok: false, key: "signup.err.taken" };
    if (response.status === 429) return { ok: false, key: "signup.err.tooMany" };
    if (response.status === 400) {
      const keys = { id: "signup.err.id", short: "signup.err.short", "same-as-id": "signup.err.sameAsId", common: "signup.err.common" };
      return { ok: false, key: keys[data.problem] || "signup.err.id" };
    }
    if (response.status === 503) return { ok: false, key: "login.err.database" };
    return { ok: false, key: "login.err.server" };
  }

  // Checks the sign-up boxes, asks the server, then signs the new customer in
  async function submitSignup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { userid, password, password2 } = form.elements;
    const error = document.getElementById("signup-error");
    const id = userid.value.trim();
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
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    const result = await createAccount(id, password.value);
    button.disabled = false;
    button.removeAttribute("aria-busy");
    password.value = "";   // never keep a password, whatever the answer
    password2.value = "";

    if (!result.ok) {
      error.textContent = t(result.key);
      (result.key === "signup.err.taken" || result.key === "signup.err.id" ? userid : password).focus();
      return;
    }
    signIn("customer", result.userId);   // a new account is signed in straight away
    location.hash = "#customer";
  }

  // Tell the server to forget this sign-in too. Best effort: the page signs out either way.
  document.addEventListener("click", event => {
    if (event.target.closest('[data-action="signout"]')) fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  });

  // Runs once the screen is on the page: connects the form's buttons, and shows any message
  // left by access.js (e.g. "That page is for bank staff only").
  function afterLogin(param) {
    if (param === "signup") {
      const signupForm = document.getElementById("signup-form");
      signupForm.addEventListener("submit", submitSignup);
      signupForm.querySelector(".pw-toggle").addEventListener("click", event => togglePassword(event.currentTarget));
      return;
    }
    const form = document.getElementById("login-form");

    // Staff sign in with a "Staff ID", customers with a "User ID"
    form.addEventListener("change", event => {
      if (event.target.name === "role") {
        document.getElementById("login-id-label").textContent = chosenRole(form) === "staff" ? t("login.staffId") : t("login.userId");
      }
    });
    form.addEventListener("submit", submitLogin);
    document.getElementById("demo-fill").addEventListener("click", () => fillDemo(form));
    form.querySelector(".pw-toggle").addEventListener("click", event => togglePassword(event.currentTarget));

    if (appState.loginMessage) {
      const message = appState.loginMessage;
      appState.loginMessage = "";   // show it once only
      // Fill it a moment later so screen readers notice the change
      setTimeout(() => {
        document.getElementById("login-message").textContent = message;
      }, 50);
    }
  }

  registerRoute({
    name: "login",
    role: "public",
    render: loginHtml,
    afterRender: afterLogin
  });
})();
