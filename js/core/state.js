"use strict";

// Pause & Prove: app state.
// Owner: SHARED (whole team). Talk to the team before changing this file.
// Everything the app remembers while the page is open lives in one object, appState.
// It is only kept in memory: refreshing the page or visiting #reset starts again from scratch.
// Nothing is ever saved or sent anywhere.
//
// Feature owners: you don't need to edit this file. Store your feature's data under a key
// named after your feature, for example appState.passphrase = "blue mango". #reset wipes it
// along with everything else.

// Returns a brand-new, empty state. Used when the page first loads and on #reset.
function freshState() {
  return {
    role: null,         // "customer" or "staff" once signed in; null for a guest (not signed in)
    userId: "",         // the mobile number (customers) or staff ID typed on the sign-in screen
    userName: "",       // the name a customer typed, used to greet them ("" if they left it blank)
    loginMessage: "",   // a message (translation key) the sign-in screen shows once
    afterSignIn: ""     // the screen a guest was trying to open, e.g. "#passphrase": shown after signing in
  };
}

let appState = freshState();

// Remembers who signed in. Called by the sign-in screens.
// name is optional: customers may give their name so the home screen can greet them.
function signIn(role, userId, name = "") {
  appState.role = role;
  appState.userId = userId;
  appState.userName = name;
}

// Forgets who signed in. message (optional) is shown on the sign-in screen, to explain why.
function signOut(message = "") {
  appState.role = null;
  appState.userId = "";
  appState.userName = "";
  appState.loginMessage = message;
}

// Throws away everything: who is signed in and every feature's data. Used by #reset (see router.js).
function resetState() {
  appState = freshState();
}

// Every "Sign out" button has data-action="signout". One listener on the whole page catches
// all of them, even ones on screens drawn later. Customers go back to the open home screen
// (the urgent tools still work without signing in); staff go back to the staff sign-in.
document.addEventListener("click", event => {
  if (!event.target.closest('[data-action="signout"]')) return;
  const wasStaff = appState.role === "staff";
  const message = t("header.signedOut");   // looked up before signing out, so staff still get English
  signOut();
  location.hash = wasStaff ? "#staff-login" : "#customer";
  showToast(message);
});
