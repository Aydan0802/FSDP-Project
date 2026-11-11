"use strict";

// Feature: Sign in.
// Owner: Jiliana
// Moved out of the theme samples (shared/samples.js). Choose "A customer" or "Bank staff";
// any ID and password work. Customers go to #customer, staff go to #staff.
// Nothing is checked, saved or sent anywhere, and the password is never kept.
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  // The sign-in screen's HTML
  function loginHtml() {
    return `
    <section class="login-brand" aria-label="About Verify the Caller">
      ${brandHtml("#login")}
      <p class="login-kicker">Anti-scam help, in one place</p>
      <p class="login-tagline">Pause. Check the caller. <span>Stay safe.</span></p>
      <ul class="login-points">
        <li>${icon("wave")}Check if a voice could be made by AI</li>
        <li>${icon("shield")}Find out if the bank is really calling</li>
        <li>${icon("flag")}Report a scam in a few steps</li>
      </ul>
      <div class="login-art" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    </section>

    <main class="login-main" tabindex="-1">
      <div class="login-tools">${textSizeHtml()}</div>
      <form class="login-card" id="login-form" novalidate>
        <h1 tabindex="-1">Sign in</h1>
        <p class="login-sub">Choose who you are, then sign in.</p>
        <p class="field-error" id="login-message" role="alert"></p>
        <fieldset class="role-pick">
          <legend>I am</legend>
          <div class="role-options">
            <label class="role"><input type="radio" name="role" value="customer" checked>${icon("user")}
              <span class="role-text"><strong>A customer</strong><span>Check calls and get help</span></span></label>
            <label class="role"><input type="radio" name="role" value="staff">${icon("briefcase")}
              <span class="role-text"><strong>Bank staff</strong><span>Review reports and trends</span></span></label>
          </div>
        </fieldset>
        <div class="field">
          <label for="login-id" id="login-id-label">User ID</label>
          <input id="login-id" name="userid" autocomplete="off" spellcheck="false" aria-describedby="login-error">
        </div>
        <div class="field">
          <label for="login-pw">Password</label>
          <div class="pw-row">
            <input id="login-pw" name="password" type="password" autocomplete="off" aria-describedby="login-error">
            <button type="button" class="pw-toggle" aria-controls="login-pw">Show<span class="visually-hidden"> password</span></button>
          </div>
        </div>
        <p class="field-error" id="login-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">Sign in ${icon("arrow")}</button>
        <button type="button" class="btn btn-link" id="demo-fill">Fill in demo details</button>
        <p class="login-note">${icon("lock")}<span>Demo only: any ID and password work. Never type a real password here.</span></p>
      </form>
    </main>`;
  }

  // Which radio button is picked: "customer" or "staff"
  function chosenRole(form) {
    return form.elements.role.value;
  }

  // Types the demo ID and password for the chosen role, and clears any error
  function fillDemo(form) {
    const { userid, password } = form.elements;
    userid.value = LOGIN_DATA.demoIds[chosenRole(form)];
    password.value = LOGIN_DATA.demoPassword;
    userid.removeAttribute("aria-invalid");
    password.removeAttribute("aria-invalid");
    document.getElementById("login-error").textContent = "";
  }

  // Shows or hides the password, and changes the button's words to match
  function togglePassword(button) {
    const input = document.getElementById("login-pw");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.innerHTML = `${show ? "Hide" : "Show"}<span class="visually-hidden"> password</span>`;
  }

  // Checks both boxes are filled in, then signs in and goes to that person's home screen
  function submitLogin(event) {
    event.preventDefault();   // stop the browser reloading the page, which is what a form does by default
    const form = event.currentTarget;
    const { userid, password } = form.elements;
    const error = document.getElementById("login-error");
    userid.setAttribute("aria-invalid", String(!userid.value.trim()));
    password.setAttribute("aria-invalid", String(!password.value));
    if (!userid.value.trim() || !password.value) {
      error.textContent = "Type your ID and password, or choose \"Fill in demo details\".";
      (userid.value.trim() ? password : userid).focus();
      return;
    }
    error.textContent = "";
    password.value = "";   // never keep a password, even in a demo
    signIn(chosenRole(form), userid.value.trim());
    location.hash = chosenRole(form) === "staff" ? "#staff" : "#customer";
  }

  // Runs once the screen is on the page: connects the form's buttons, and shows any message
  // left by access.js (e.g. "That page is for bank staff only").
  function afterLogin() {
    const form = document.getElementById("login-form");

    // Staff sign in with a "Staff ID", customers with a "User ID"
    form.addEventListener("change", event => {
      if (event.target.name === "role") {
        document.getElementById("login-id-label").textContent = chosenRole(form) === "staff" ? "Staff ID" : "User ID";
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
