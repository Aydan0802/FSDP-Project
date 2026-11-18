"use strict";

// Pause & Prove: router.
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
let lastScreenKey = "";   // the screen drawn last ("name/param"), to tell a new screen from a redraw

// Reads the address and shows the right screen. Runs when the page loads and every time the
// address after the # changes.
function showScreen() {
  // "#staff-case/VC-2611-0103" becomes name "staff-case" and param "VC-2611-0103"
  const [name, param = ""] = location.hash.slice(1).split("/");

  // #reset: forget everything and go back to the home screen. location.replace() swaps the
  // address without adding a history entry, so the Back button doesn't land on #reset again.
  if (name === "reset") {
    resetState();
    location.replace("#customer");
    return;   // changing the address runs showScreen() again, for #customer
  }

  // An address we don't know (or no address at all): go to the home screen for this person
  const route = routes[name];
  if (!route) {
    location.replace(`#${homeRoute()}`);
    return;
  }

  // Not allowed to see this screen: send the person to the right sign-in screen and explain why
  // (access.js). A guest who tapped a locked customer tool is taken straight back to it after
  // signing in, so they don't have to find it again.
  const problem = accessProblem(route);
  if (problem) {
    if (appState.role) signOut(problem);       // signed in on the wrong side: sign out first
    else appState.loginMessage = problem;
    if (route.role === "customer") appState.afterSignIn = location.hash;
    location.replace(route.role === "staff" ? "#staff-login" : "#login");
    return;
  }

  const direction = rememberPlace();   // "forward" or "back"

  // Draw the screen. The wrapper's class (e.g. "screen-login") lets each feature's CSS target it.
  // Moving to a new screen slides it in like a phone app (see below); redrawing the same screen
  // (a language switch, a check finishing) just swaps it, with no movement.
  stopReading();
  const app = document.getElementById("app");
  const screenKey = `${name}/${param}`;
  const isNew = screenKey !== lastScreenKey;
  lastScreenKey = screenKey;
  const motion = isNew && !firstLoad ? (nextMotion || direction) : "";
  nextMotion = "";

  function paint(enterClass) {
    app.innerHTML = `<div class="screen screen-${route.name}${enterClass}">${route.render(param)}</div>`;

    // The browser tab shows the screen's heading, e.g. "Report a scam | Pause & Prove"
    const heading = app.querySelector("h1");
    document.title = heading ? `${heading.textContent} | Pause & Prove` : "Pause & Prove";
    window.scrollTo(0, 0);

    if (route.afterRender) route.afterRender(param);
    // Redrawn while the sliding menu is open (e.g. the language was changed in it): keep the page
    // behind the menu inert (helpers.js)
    if (document.body.classList.contains("menu-open") && typeof setPageInert === "function") setPageInert(true);

    // Move keyboard and screen reader focus to the new heading, except on the first load
    if (!firstLoad) focusHeading();
    firstLoad = false;
  }

  // Page transitions, like the Grab app:
  //   forward  the new screen slides in from the right, over the old one
  //   back     the screen slides away to the right, showing the one before
  //   lateral  switching tabs in the bottom bar or sidebar: a quick fade, no slide
  // Browsers with View Transitions (Chrome, Edge, Safari 18) slide the whole page while the top
  // bar, bottom bar and sidebar stay still (base.css). Other browsers get a short slide of the
  // content instead. Nothing moves for people who turn off animation in their settings.
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motion && !calm && document.startViewTransition) {
    document.documentElement.dataset.nav = motion;
    const transition = document.startViewTransition(() => paint(""));
    transition.finished.finally(() => { delete document.documentElement.dataset.nav; });
  } else {
    paint(motion ? ` screen-enter screen-enter--${motion}` : "");
  }
}

// The kind of movement for the next screen change, when it is not simply forward or back.
// helpers.js sets "lateral" when the bottom bar, rail or sidebar is used.
let nextMotion = "";
function setNextMotion(kind) {
  nextMotion = kind;
}

// ---------- The Back button ----------
// Not every phone has a back button, so every inner screen has one at the top (helpers.js).
// It should go to the screen the person came from, like the browser's Back. But if they opened
// a link straight to an inner screen, the browser's Back would leave our site, so then it goes
// to the home screen instead.
// To tell the two apart, each screen's place in this visit is written into the browser's history
// entry (history.state.place: 0 for the first screen, then 1, 2 ...). Going back to an entry
// reads its number again, and a page refresh keeps it.
let currentPlace = 0;

// Also says which way the person moved: "back" if this screen is earlier in the visit than the
// one before it, otherwise "forward" (used for the page transition)
function rememberPlace() {
  const before = currentPlace;
  const saved = history.state && typeof history.state.place === "number" ? history.state.place : null;
  if (saved !== null) {
    currentPlace = saved;
  } else {
    currentPlace = firstLoad ? 0 : currentPlace + 1;
    history.replaceState({ place: currentPlace }, "");
  }
  return currentPlace < before ? "back" : "forward";
}

// Goes back one screen, or to the home screen if this is the first screen of the visit
function goBack() {
  if (currentPlace > 0) history.back();
  else location.hash = `#${homeRoute()}`;
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
