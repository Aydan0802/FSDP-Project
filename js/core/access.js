"use strict";

// Verify the Caller: who may open which screen.
// Owner: Wei Ye
// Every screen says who it is for when it is registered (see registerRoute() in router.js):
//   role: "public"    anyone, signed in or not (only the sign-in screen)
//   role: "customer"  only someone signed in as a customer
//   role: "staff"     only someone signed in as bank staff
// The router asks accessProblem() before drawing every screen. If it gets back a message, it
// signs the person out and shows that message on the sign-in screen.
// This is a demo: the rules run in the browser, so they only stop people clicking or typing
// their way into the wrong side. A real bank would check this on its server.

// True if the person signed in right now may open this screen
function canOpen(route) {
  return route.role === "public" || route.role === appState.role;
}

// Returns "" if the screen may be opened, or a message for the sign-in screen saying why not
function accessProblem(route) {
  if (canOpen(route)) return "";
  if (!appState.role) return "Please sign in first.";
  if (route.role === "staff") return "That page is for bank staff only. Please sign in as bank staff.";
  return "That page is for customers only. Please sign in as a customer.";
}

// The first screen for whoever is signed in: customer home, staff overview, or sign in
function homeRoute() {
  if (appState.role === "customer") return "customer";
  if (appState.role === "staff") return "staff";
  return "login";
}
