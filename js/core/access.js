"use strict";

// Pause & Prove: who may open which screen.
// Owner: Wei Ye
// Every screen says who it is for when it is registered (see registerRoute() in router.js):
//   role: "public"    anyone, signed in or not: the sign-in screens, the home screen and the
//                     urgent tools (someone is calling me, is the bank really calling, freeze...).
//                     A senior in the middle of a scam call should never have to sign in first.
//   role: "customer"  only someone signed in as a customer: their own things, like the family
//                     passphrase, reports and transfer checks
//   role: "staff"     only someone signed in as bank staff
// The router asks accessProblem() before drawing every screen. If it gets back a message, it
// sends the person to the right sign-in screen and shows that message there.
// This is a demo: the rules run in the browser, so they only stop people clicking or typing
// their way into the wrong side. A real bank would check this on its server.

// True if the person signed in right now may open this screen
function canOpen(route) {
  return route.role === "public" || route.role === appState.role;
}

// Returns "" if the screen may be opened, or a message for the sign-in screen saying why not.
// The messages are translation keys (their words are in js/data/login.js), so they follow the
// language the customer picked.
function accessProblem(route) {
  if (canOpen(route)) return "";
  if (!appState.role) return route.role === "staff" ? "login.msg.staffFirst" : "login.msg.signInFirst";
  if (route.role === "staff") return "login.msg.staffOnly";
  return "login.msg.customerOnly";
}

// The first screen for each person: staff overview for staff, the customer home screen for
// everyone else (signed in or not). Nobody has to sign in just to see the home screen.
function homeRoute() {
  return appState.role === "staff" ? "staff" : "customer";
}
