"use strict";

// Verify the Caller: router.
// Owner: SHARED (whole team). Talk to the team before changing this file.
// The address after the # says which screen to show: #login, #customer, #staff-case/VC-2611-0103 ...
// Each feature file tells the router about its screens with registerRoute(). When the address
// changes, the router checks who may see that screen (access.js), draws it into <div id="app">,
// sets the page title and moves focus to the new heading.

// Every screen the app knows, by name. Feature files fill this in with registerRoute().
const routes = {};

// Adds one screen. A feature file calls it like this:
//   registerRoute({
//     name: "report",                 // the address: #report
//     role: "customer",               // who may open it: "public", "customer" or "staff"
//     render: param => "<h1>...",     // returns the screen's HTML as a string
//     afterRender: param => { ... }   // optional: runs once the HTML is on the page (add listeners here)
//   });
// param is anything after a slash in the address: for #staff-case/VC-2611-0103 it is "VC-2611-0103".
function registerRoute(route) {
  routes[route.name] = route;
}

let firstLoad = true;

// Reads the address and shows the right screen. Runs when the page loads and every time the
// address after the # changes.
function showScreen() {
  // "#staff-case/VC-2611-0103" becomes name "staff-case" and param "VC-2611-0103"
  const [name, param = ""] = location.hash.slice(1).split("/");

  // #reset: forget everything and go back to sign in. location.replace() swaps the address
  // without adding a history entry, so the Back button doesn't land on #reset again.
  if (name === "reset") {
    resetState();
    location.replace("#login");
    return;   // changing the address runs showScreen() again, for #login
  }

  // An address we don't know (or no address at all): go to the home screen for this person
  const route = routes[name];
  if (!route) {
    location.replace(`#${homeRoute()}`);
    return;
  }

  // Not allowed to see this screen: sign out and explain why on the sign-in screen (access.js)
  const problem = accessProblem(route);
  if (problem) {
    signOut(problem);
    location.replace("#login");
    return;
  }

  // Draw the screen. The wrapper's class (e.g. "screen-login") lets each feature's CSS target it.
  stopReading();
  const app = document.getElementById("app");
  app.innerHTML = `<div class="screen screen-${route.name}">${route.render(param)}</div>`;

  // The browser tab shows the screen's heading, e.g. "Report a scam | Verify the Caller"
  const heading = app.querySelector("h1");
  document.title = heading ? `${heading.textContent} | Verify the Caller` : "Verify the Caller";
  window.scrollTo(0, 0);

  if (route.afterRender) route.afterRender(param);

  // Move keyboard and screen reader focus to the new heading, except on the first load
  if (!firstLoad) focusHeading();
  firstLoad = false;
}

// Draws the current screen again, for a feature that moves to its next step without changing
// the address (for example "Checking..." then the result). Like any screen change, it stops
// Read aloud, moves to the top and moves focus to the new heading.
function redrawScreen() {
  showScreen();
}

window.addEventListener("hashchange", showScreen);
// DOMContentLoaded fires after every <script> in index.html has run, so all routes are registered by then
document.addEventListener("DOMContentLoaded", showScreen);
