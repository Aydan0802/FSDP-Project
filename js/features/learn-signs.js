"use strict";

// Feature: Learn the signs. #learn-signs
// Owner: Jiliana. Built on frontend-update from the senior flow preview (it was a stub).
// Four signs of a scam call, one practice question, and the "Good to know" tip that used to be
// on the customer home screen.
//
// What it remembers (appState.learnSigns, cleared by #reset):
//   picked   the id of the answer the customer picked ("" until they pick one)
// Everything is inside (function () { ... })(); so its names stay private to this file.

(function () {
  const data = LEARN_SIGNS_DATA;

  function myState() {
    if (!appState.learnSigns) appState.learnSigns = { picked: "" };
    return appState.learnSigns;
  }

  // Right or wrong, as icon + words in a result box
  function feedbackHtml(picked) {
    if (!picked) return "";
    const right = picked === data.quiz.answer;
    return `<div class="verdict ${right ? "v-good" : "v-bad"}">
        ${icon(right ? "check" : "cross")}
        <div><p><strong>${right ? "Correct" : "Not quite"}</strong></p><p>${right ? data.quiz.right : data.quiz.wrong}</p></div>
      </div>`;
  }

  function optionsHtml(picked) {
    return data.quiz.options.map(o =>
      `<button type="button" class="btn btn-secondary ls-option" data-option="${o.id}" aria-pressed="${picked === o.id}">${o.text}</button>`).join("");
  }

  function screenHtml() {
    const picked = myState().picked;
    return customerPageHtml("", `<div class="narrow ls-screen">
      ${homeLinkHtml()}
      <section data-read>
        <h1 tabindex="-1">4 signs of a scam call</h1>
        <p class="lead">If you notice even one of these, hang up.</p>
        <ul class="ls-signs">
          ${data.signs.map(s => `<li>${icon(s.icon)}<span><strong>${s.title}</strong>${s.text}</span></li>`).join("")}
        </ul>
      </section>

      <section class="panel ls-quiz" aria-labelledby="ls-quiz-title" data-read>
        <h2 id="ls-quiz-title">Try one</h2>
        <p id="ls-question">${data.quiz.question}</p>
        <div class="stack" role="group" aria-labelledby="ls-question" id="ls-options">${optionsHtml(picked)}</div>
        <div id="ls-feedback" aria-live="polite">${feedbackHtml(picked)}</div>
      </section>

      <aside class="ls-tip" aria-labelledby="ls-tip-title" data-read>
        <h2 id="ls-tip-title">Good to know</h2>
        <p>${data.tip}</p>
      </aside>
    </div>`);
  }

  // Picking an answer shows right or wrong underneath, without moving focus off the button
  function afterRender() {
    const state = myState();
    const options = document.getElementById("ls-options");
    options.addEventListener("click", event => {
      const button = event.target.closest("[data-option]");
      if (!button) return;
      state.picked = button.dataset.option;
      options.querySelectorAll("[data-option]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      document.getElementById("ls-feedback").innerHTML = feedbackHtml(state.picked);
    });
  }

  registerRoute({
    name: "learn-signs",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
