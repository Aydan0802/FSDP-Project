"use strict";

// Verify the Caller: app state.
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
    role: null,         // "customer" or "staff" once signed in; null when signed out
    userId: "",         // the ID typed on the sign-in screen
    loginMessage: ""    // a message the sign-in screen shows once, e.g. after a wrong-role redirect
  };
}

let appState = freshState();

// Remembers who signed in. Called by the sign-in screen.
function signIn(role, userId) {
  appState.role = role;
  appState.userId = userId;
}

// Forgets who signed in. message (optional) is shown on the sign-in screen, to explain why.
function signOut(message = "") {
  appState.role = null;
  appState.userId = "";
  appState.loginMessage = message;
}

// Throws away everything: who is signed in and every feature's data. Used by #reset (see router.js).
function resetState() {
  appState = freshState();
}

// Every "Sign out" button has data-action="signout". One listener on the whole page catches
// all of them, even ones on screens drawn later.
document.addEventListener("click", event => {
  if (!event.target.closest('[data-action="signout"]')) return;
  signOut();
  location.hash = "#login";
});
