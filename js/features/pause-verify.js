"use strict";

// Feature: Pause and check the caller ("Let's take a kopi break").
// Owner: Jiliana
// When a transfer looks risky it is paused for a short kopi break. While the timer runs, the
// customer sees why the transfer was stopped, answers one question per screen, then sees their
// own answers played back with what to do next. The made-up data (questions, scam lines,
// results) is at the top of this file, in DATA.
//
// What this feature remembers lives in appState.pauseVerify (#reset clears it):
//   step     0 = "why we stopped you", 1..N = the questions, N + 1 = the result
//   answers  the Yes / No / Not sure answers, by question id, e.g. { phone: "yes" }
//   heard    the ids of the scam lines the customer ticked
//   endsAt   the clock time (in milliseconds) when the kopi break ends
//   outcome  "scam", "careful" or "clear", once the questions are finished
//   done     "" while in progress, then "cancelled" or "sent"
// Wei Ye: outcome, answers, heard and done stay here afterwards, for the staff case queue.
//
// Everything is inside (function () { ... })(); so the names you create in this file stay
// private to it and can't clash with a teammate's file.

(function () {
  // ---------- Made-up data ----------

  // Everything the screen shows that is not layout: how long the break lasts, the example
  // transfer, the questions, the scam lines and the three possible results. It is all fixed
  // text for now (nothing comes from a server), kept here so the feature is one file.
  const DATA = {
    // How long the kopi break lasts, in seconds. Short so the demo is quick; a real bank would wait longer.
    breakSeconds: 90,

    // The transfer that was stopped, and why. Made up for now.
    // When Joseph's risk scorer is ready, its reasons replace these (see whyHtml() further down).
    sampleTransfer: {
      amount: "S$8,000",
      reasons: [
        "You have never sent money to this person before.",
        "S$8,000 is much more than you usually send."
      ]
    },

    // The questions, asked one per screen, in this order.
    //   type "choice": Yes / No / Not sure buttons. riskyAnswer is the answer that is a warning sign,
    //                  and playback is the sentence shown back to the customer at the end.
    //   type "lines":  the kopitiam menu board. The customer taps every line they heard.
    questions: [
      {
        id: "phone",
        type: "choice",
        text: "Is someone on the phone with you right now?",
        riskyAnswer: "yes",
        playback: "Someone is on the phone with you right now."
      },
      {
        id: "heard",
        type: "lines",
        text: "Did anyone say any of these to you?",
        hint: "Tap every one you heard, by phone or by message. If you heard none of them, just press Next.",
        lines: [
          { id: "danger", text: "Your account is in danger" },
          { id: "safe-account", text: "Move your money to a safe account" },
          { id: "secret", text: "Don't tell anyone, not even the bank" },
          { id: "now", text: "You must do it now" }
        ]
      },
      {
        id: "met",
        type: "choice",
        text: "Have you met the person you are sending money to, face to face?",
        riskyAnswer: "no",
        playback: "You have never met this person face to face."
      }
    ],

    // The Yes / No / Not sure buttons for "choice" questions
    choices: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" }
    ],

    // The three results. Which one is shown depends on how many warning signs the answers gave:
    // 2 or more is "scam", exactly 1 is "careful", none is "clear".
    outcomes: {
      scam: {
        label: "Looks like a scam",
        icon: "warning",
        title: "This looks like a scam",
        text: "These are the biggest signs of a scam. A real bank officer will never ask you to keep a secret or to move money to a \"safe account\"."
      },
      careful: {
        label: "Be careful",
        icon: "question",
        title: "Please be careful",
        text: "This is one sign of a scam. Check with someone you trust before you send any money."
      },
      clear: {
        label: "No warning signs",
        icon: "check",
        title: "We did not find any warning signs",
        text: "Your answers did not show any signs of a scam. If anything still feels wrong, it is okay to cancel."
      }
    }
  };

  // The repeating timer (from setInterval), or null when nothing is ticking
  let timerId = null;

  // ---------- State ----------

  // A brand-new kopi break: first step, no answers, timer starting now
  function freshState() {
    return { step: 0, answers: {}, heard: [], endsAt: Date.now() + DATA.breakSeconds * 1000, outcome: "", done: "" };
  }

  // Whole seconds left in the kopi break (never below 0)
  function secondsLeft() {
    return Math.max(0, Math.ceil((appState.pauseVerify.endsAt - Date.now()) / 1000));
  }

  // 272 seconds becomes "04:32"
  function timeText(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  // The warning signs in the customer's answers, as sentences to show back to them
  function warningSigns() {
    const state = appState.pauseVerify;
    const signs = [];
    DATA.questions.forEach(question => {
      if (question.type === "choice" && state.answers[question.id] === question.riskyAnswer) {
        signs.push(question.playback);
      }
      if (question.type === "lines") {
        question.lines
          .filter(line => state.heard.includes(line.id))
          .forEach(line => signs.push(`Someone told you: "${line.text}".`));
      }
    });
    return signs;
  }

  // 2 or more warning signs is "scam", exactly 1 is "careful", none is "clear"
  function outcomeKey() {
    const count = warningSigns().length;
    return count >= 2 ? "scam" : count === 1 ? "careful" : "clear";
  }

  // ---------- HTML: the pieces of the screen ----------

  // The kopi cup drawing: a white kopitiam cup and saucer with a green flower on it, sitting
  // on a round table top. Its colours are set in css/features/pause-verify.css.
  function cupHtml() {
    const leaves = `<path d="M112 114c-14-8-26-2-30 8c12 6 24 2 30-8z"/><path d="M114 123c-10 2-17 9-17 17c9 0 17-8 17-17z"/>`;
    const petals = [0, 72, 144, 216, 288].map(turn =>
      `<ellipse cx="130" cy="100" rx="5.5" ry="9" transform="rotate(${turn} 130 110)"/>`).join("");
    return `<svg class="pv-cup" viewBox="0 0 260 210" aria-hidden="true" focusable="false">
        <circle class="pv-cup-table" cx="130" cy="105" r="105"/>
        <path class="pv-cup-steam" d="M112 42c-8-10 8-16 0-28M148 42c-8-10 8-16 0-28"/>
        <ellipse class="pv-cup-under" cx="130" cy="158" rx="90" ry="24"/>
        <ellipse class="pv-cup-white" cx="130" cy="152" rx="90" ry="24"/>
        <ellipse class="pv-cup-shade" cx="130" cy="151" rx="60" ry="14"/>
        <ellipse class="pv-cup-handle" cx="198" cy="98" rx="20" ry="22"/>
        <path class="pv-cup-white" d="M66 66C66 66 62 120 84 144C96 156 164 156 176 144C198 120 194 66 194 66Z"/>
        <ellipse class="pv-cup-rim" cx="130" cy="66" rx="64" ry="16"/>
        <ellipse class="pv-cup-kopi" cx="130" cy="68" rx="54" ry="11"/>
        <path class="pv-cup-shine" d="M100 67q30-9 58-2"/>
        <g class="pv-cup-flower">${petals}${leaves}<g transform="translate(260 0) scale(-1 1)">${leaves}</g></g>
        <circle class="pv-cup-dot" cx="130" cy="110" r="3.5"/>
      </svg>`;
  }

  // The top card: heading, cup, countdown, and "your money is safe".
  // After the first step it gets smaller (no cup) so the question is closer to the top.
  function heroHtml() {
    const small = appState.pauseVerify.step > 0 ? " pv-hero--small" : "";
    return `
      <section class="pv-hero${small}" data-read>
        <p class="pv-pill">Transfer paused</p>
        <h1 tabindex="-1">Wait ah, let's take a kopi break</h1>
        ${cupHtml()}
        <p class="pv-time" id="pv-time" role="timer">${timeText(secondsLeft())}</p>
        <p class="pv-time-label" id="pv-time-label">until your kopi break ends and you can decide</p>
        <div class="pv-bar" aria-hidden="true"><span id="pv-bar-fill"></span></div>
        <p class="pv-safe">${icon("lock")}<span>Your money is safe and still in your account.</span></p>
      </section>
      <div class="pv-tiles" aria-hidden="true"></div>`;
  }

  // The red note under every question: scammers coach people to lie to the bank
  function coachHtml() {
    return `<aside class="pv-coach">${icon("warning")}
        <p>If someone told you what to answer here, that is a scam. A real bank officer will never do that.</p>
      </aside>`;
  }

  // Step 0: why the transfer was stopped.
  // JOSEPH: these reasons are made up (DATA.sampleTransfer). When the risk scorer saves its own
  // reasons, read them here instead, e.g. from appState.riskScorer.
  function whyHtml() {
    return `
      <section class="pv-card" data-read>
        <h2 tabindex="-1" id="pv-step-title">Why we stopped you</h2>
        <ul class="pv-reasons">
          ${DATA.sampleTransfer.reasons.map(reason => `<li>${icon("warning")}<span>${reason}</span></li>`).join("")}
        </ul>
        <p>We will ask you ${DATA.questions.length} quick questions while you wait.</p>
        <div class="pv-actions">
          <button type="button" class="btn btn-primary" data-pv="start">Okay, ask me ${icon("arrow")}</button>
          <button type="button" class="btn btn-link" data-pv="cancel">Cancel this transfer</button>
        </div>
      </section>`;
  }

  // A Yes / No / Not sure question. The answer picked before (if the customer came back) is marked.
  function choiceHtml(question) {
    const picked = appState.pauseVerify.answers[question.id];
    return `<div class="pv-answers">
        ${DATA.choices.map(choice =>
          `<button type="button" class="btn btn-secondary" data-pv="answer" data-value="${choice.value}" aria-pressed="${choice.value === picked}">${choice.label}</button>`).join("")}
      </div>`;
  }

  // The kopitiam menu board: tap every line you heard. aria-pressed says which are ticked.
  function linesHtml(question) {
    const heard = appState.pauseVerify.heard;
    return `<p class="pv-hint">${question.hint}</p>
      <div class="pv-lines">
        ${question.lines.map(line =>
          `<button type="button" class="pv-line" data-pv="toggle" data-line="${line.id}" aria-pressed="${heard.includes(line.id)}">
            <span class="pv-tick">${icon("check")}</span><span>"${line.text}"</span>
          </button>`).join("")}
      </div>
      <button type="button" class="btn btn-primary" data-pv="next">Next ${icon("arrow")}</button>`;
  }

  // Steps 1 to N: one question per screen
  function questionHtml(question, number) {
    const board = question.type === "lines" ? " pv-board" : "";
    return `
      <section class="pv-card${board}" data-read>
        <p class="pv-count">Question ${number} of ${DATA.questions.length}</p>
        <h2 tabindex="-1" id="pv-step-title">${question.text}</h2>
        ${question.type === "lines" ? linesHtml(question) : choiceHtml(question)}
      </section>
      ${coachHtml()}
      <button type="button" class="btn btn-link" data-pv="back">Back</button>`;
  }

  // The "continue" button only works once the kopi break is over
  function continueHtml(label, style) {
    const waiting = secondsLeft() > 0;
    return `<button type="button" class="btn ${style}" data-pv="continue"${waiting ? " disabled" : ""}>${label}</button>
      <p class="pv-note" id="pv-wait-note"${waiting ? "" : " hidden"}>You can continue when the kopi break ends.</p>`;
  }

  // Step N + 1: the customer's own answers played back, the result, and what to do now
  function outcomeHtml() {
    const key = appState.pauseVerify.outcome;
    const outcome = DATA.outcomes[key];
    const signs = warningSigns();
    const risky = key !== "clear";
    return `
      <section class="pv-card" data-read>
        <p class="pv-result pv-result--${key}">${icon(outcome.icon)}${outcome.label}</p>
        <h2 tabindex="-1" id="pv-step-title">${outcome.title}</h2>
        ${signs.length ? `<h3>Here is what you told us</h3>
          <ul class="pv-signs">${signs.map(sign => `<li>${icon("flag")}<span>${sign}</span></li>`).join("")}</ul>` : ""}
        <p class="pv-verdict">${outcome.text}</p>
      </section>
      <section class="pv-card" data-read>
        <h2>What to do now</h2>
        ${risky ? `<p>Hang up the call. It is okay, a real bank officer will not mind.</p>` : ""}
        <div class="pv-actions">
          ${risky ? `
            <button type="button" class="btn btn-primary" data-pv="cancel">Cancel this transfer</button>
            <a class="btn btn-secondary" href="#call-match">Check if the bank is really calling</a>
            <a class="btn btn-secondary" href="#passphrase">Ask for my family passphrase</a>
            <a class="btn btn-secondary" href="#report">Report this scam</a>
            ${continueHtml("I am sure, continue with the transfer", "btn-link")}` : `
            ${continueHtml("Continue with the transfer", "btn-primary")}
            <button type="button" class="btn btn-secondary" data-pv="cancel">Cancel this transfer</button>`}
        </div>
      </section>
      <button type="button" class="btn btn-link" data-pv="back">Back</button>`;
  }

  // After "Cancel" or "Continue": a short ending. The whole screen is replaced, so it has its own h1.
  function doneHtml() {
    const cancelled = appState.pauseVerify.done === "cancelled";
    return `
      <section class="pv-card pv-done" data-read>
        <p class="pv-result pv-result--clear">${icon("check")}${cancelled ? "Cancelled" : "Sent"}</p>
        <h1 tabindex="-1">${cancelled ? "Your transfer is cancelled" : "Your transfer is on its way"}</h1>
        <p>${cancelled
          ? "No money has left your account. If someone is still pressuring you, hang up and tell the bank."
          : "This is a demo, so no real money was sent."}</p>
        <div class="pv-actions">
          <a class="btn btn-primary" href="#customer">Back to home</a>
          ${cancelled ? `<a class="btn btn-secondary" href="#report">Report a scam</a>` : ""}
          <button type="button" class="btn btn-link" data-pv="restart">Start the demo again</button>
        </div>
      </section>`;
  }

  // Everything inside the screen, for whichever step the customer is on
  function viewHtml() {
    const state = appState.pauseVerify;
    if (state.done) return doneHtml();
    const question = DATA.questions[state.step - 1];
    const step = state.step === 0 ? whyHtml() : question ? questionHtml(question, state.step) : outcomeHtml();
    return heroHtml() + step;
  }

  // ---------- Timer ----------

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  // Shows the time left. Runs once a second, and after every redraw.
  // If the countdown isn't on the page (the customer left, or the journey ended) it stops itself.
  function updateTimer() {
    const time = document.getElementById("pv-time");
    if (!time) {
      stopTimer();
      return;
    }
    const left = secondsLeft();
    time.textContent = timeText(left);
    document.getElementById("pv-bar-fill").style.width = `${100 - (left / DATA.breakSeconds) * 100}%`;
    if (left > 0) return;

    // The break is over: say so, and switch on any "continue" button
    stopTimer();
    document.getElementById("pv-time-label").textContent = "Your kopi break is over. Take your time to decide.";
    document.querySelectorAll('[data-pv="continue"]').forEach(button => { button.disabled = false; });
    const note = document.getElementById("pv-wait-note");
    if (note) note.hidden = true;
    // Tell screen readers once, in the quiet "live" line that sits outside the redrawn area
    const live = document.getElementById("pv-live");
    if (live && !appState.pauseVerify.announced) {
      appState.pauseVerify.announced = true;
      live.textContent = "Your kopi break is over. You can decide now.";
    }
  }

  function startTimer() {
    stopTimer();
    if (appState.pauseVerify.done) return;
    timerId = setInterval(updateTimer, 1000);
    updateTimer();
  }

  // ---------- Moving between steps ----------

  // Redraws the screen for the current step, then moves focus to the new heading so screen
  // readers and keyboard users start there
  function draw() {
    const root = document.getElementById("pv-root");
    root.innerHTML = viewHtml();
    startTimer();
    const heading = document.getElementById("pv-step-title") || root.querySelector("h1");
    if (heading) heading.focus();
  }

  // Ticks or unticks one scam line, without redrawing the screen
  function toggleLine(button) {
    const state = appState.pauseVerify;
    const id = button.dataset.line;
    const ticked = !state.heard.includes(id);
    state.heard = ticked ? [...state.heard, id] : state.heard.filter(lineId => lineId !== id);
    button.setAttribute("aria-pressed", String(ticked));
  }

  // One listener for every button on this screen. Each button says what it does with data-pv.
  function onClick(event) {
    const button = event.target.closest("[data-pv]");
    if (!button) return;
    const state = appState.pauseVerify;
    const question = DATA.questions[state.step - 1];

    switch (button.dataset.pv) {
      case "toggle":
        toggleLine(button);
        return;   // nothing else changes, so no redraw
      case "start":
      case "next":
        state.step += 1;
        break;
      case "answer":
        state.answers[question.id] = button.dataset.value;
        state.step += 1;
        break;
      case "back":
        state.step -= 1;
        break;
      case "cancel":
        state.done = "cancelled";
        break;
      case "continue":
        if (secondsLeft() > 0) return;   // the kopi break is not over yet
        state.done = "sent";
        break;
      case "restart":
        appState.pauseVerify = freshState();
        break;
    }

    // Work out the result as soon as the last question is answered
    const current = appState.pauseVerify;
    if (current.step > DATA.questions.length || current.done) current.outcome = outcomeKey();
    draw();
  }

  // ---------- The screen ----------

  // The router calls this to get the screen's HTML. A new visit starts a new kopi break, unless
  // one is still in progress (so leaving and coming back does not reset the timer).
  function pauseVerifyHtml() {
    if (!appState.pauseVerify || appState.pauseVerify.done) appState.pauseVerify = freshState();
    return customerPageHtml("", `
      <div id="pv-root">${viewHtml()}</div>
      <p class="visually-hidden" id="pv-live" aria-live="polite"></p>`);
  }

  // Runs once the screen is on the page: connects the buttons and starts the countdown
  function afterPauseVerify() {
    document.getElementById("pv-root").addEventListener("click", onClick);
    startTimer();
  }

  registerRoute({
    name: "pause-verify",
    role: "customer",
    render: pauseVerifyHtml,
    afterRender: afterPauseVerify
  });
})();