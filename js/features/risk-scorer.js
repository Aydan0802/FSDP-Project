"use strict";

// Feature: Transfer money, with a scam check before the money leaves. #risk-scorer
// Owner: Jose. Jira FSDP-131 to FSDP-134.
//
// This screen looks and works like a bank's "Pay & Transfer" screen. The customer:
//   1. picks one of their payees, or types a new mobile number (PayNow) or account number
//   2. types the amount (and a comment if they want)
//   3. checks the details and taps "Confirm transfer"
// Before any money "leaves", the transfer is scored by the risk scorer (risk-scorer-logic.js),
// using what the customer typed plus their (made-up) history:
//   Low            the transfer goes through and they get a receipt
//   Medium / High  the transfer is paused and they go to the kopi break (Jiliana's #pause-verify).
//                  High also opens a case for the bank's fraud team (Wei Ye's staff console).
// The account, payees, PayNow names and reported numbers are made up, in RISK_SCORER_DATA.bank
// (js/data/risk-scorer.js). No real money moves.
//
// Where each of the scorer's inputs comes from (nothing is picked from a list of samples any more):
//   amount, payeeName       what the customer typed (or the saved payee they tapped)
//   usualAmount             bank.usualAmount, this customer's usual transfer
//   hour                    the time now, in Singapore
//   isNewPayee              true unless it is a saved payee, or they already paid this number today
//   payeeAddedHoursAgo      saved payees: from the data file. New ones: since they first tried to pay them
//   payeeFlagged            true if the number or account is in bank.reportedPayees
//   recentTransferMinutes   the transfers that went through on this visit, and how long ago
//
// It asks the server to score first (POST /api/risk/score). If the server isn't running, it scores
// on this device with the very same code, so the result is the same either way.
//
// Languages: every word on this screen comes from t() (js/core/i18n.js), with the words in
// RISK_SCORER_DATA.text. Names, numbers and bank names are shown as they are.
//
// What it remembers (appState.riskScorer, cleared by #reset):
//   phase       "form", "review", "scoring", "result" or "done"
//   form        what the customer has typed so far, so a language change doesn't lose it
//   review      the checked details waiting on the review screen: { payee, amount, comment }
//   done        "sent" or "cancelled"
//   receipt     the last transfer that went through: { ref, at, payee, amount, comment }
//   sent        transfers that went through on this visit: { key, amount, at } (for "rapid repeats")
//   addedAt     when each new payee was first used: { "mobile:81234567": time in ms }
//   spent       money sent on this visit, taken off the balance
//   lastResult  the last result, for Jiliana's Pause-and-Verify screen:
//               { transfer, payee, score, band, bandLabel, action, actionText, reasons, signals, caseRef, source }
//   cases       High-risk cases for Wei Ye's staff console: { ref, createdAt, payeeName, amount, score, band, reasons }

(function () {
  const data = RISK_SCORER_DATA;
  const bank = data.bank;
  addTranslations(data.text);
  const API_TIMEOUT_MS = 2000;   // R-5: the API must answer within 2 seconds
  const MIN_CHECK_MS = 900;      // show "Checking..." at least this long, so people see it happen

  // The icon that goes with each band's words (icon + words, never colour alone)
  const BAND_ICONS = { low: "check", medium: "warning", high: "lock" };
  // The coloured result box (.verdict in base.css) for each band
  const BAND_BOX = { low: "v-good", medium: "v-careful", high: "v-bad" };

  // Each box on the form: the field in appState.riskScorer.form and the id of its <input>/<select>
  const FIELD_IDS = { mobile: "rs-mobile", bank: "rs-bank", account: "rs-account", accountName: "rs-account-name", amount: "rs-amount", comment: "rs-comment" };

  // ---------- Small helpers ----------

  const esc = escapeHtml;

  // Short money, like the rest of the app: $5,000
  function money(amount) {
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
  }

  // Bank-style money, always with cents: S$12,480.50
  function moneyExact(amount) {
    return "S$" + new Intl.NumberFormat("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  // 1 becomes "1 am" / "凌晨1点" / "1 pagi" (the words are in the data file)
  function hourText(hour) {
    const h = hour % 12 || 12;   // 0 and 12 both say "12"
    const part = hour === 0 ? "midnight" : hour < 6 ? "night" : hour < 12 ? "morning"
      : hour === 12 ? "noon" : hour < 18 ? "afternoon" : "evening";
    return t(`rs.hour.${part}`, { h });
  }

  // How long ago the payee was added, in words ("12 minutes ago" / "12分钟前" / "12 minit lalu")
  function agoText(hours) {
    const ago = new Intl.RelativeTimeFormat(getLocale(), { numeric: "always" });
    if (hours < 1) return ago.format(-Math.round(hours * 60), "minute");
    if (hours < 48) return ago.format(-Math.round(hours), "hour");
    if (hours < 24 * 365) return ago.format(-Math.round(hours / 24), "day");
    return t("rs.overYear");
  }

  // "Others: 14 and 6 minutes ago"
  function recentText(minutes) {
    if (!minutes.length) return t("rs.none");
    return t("rs.recentList", { list: new Intl.ListFormat(getLocale()).format(minutes.map(String)) });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // The hour now in Singapore (0-23), whatever time zone the phone is set to
  function hourNow() {
    return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Singapore" }).format(new Date()));
  }

  function emptyForm() {
    return { mode: "mobile", mobile: "", bank: "", account: "", accountName: "", amount: "", comment: "" };
  }

  // This feature's corner of appState, created the first time it's needed
  function myState() {
    if (!appState.riskScorer) {
      appState.riskScorer = {
        phase: "form", form: emptyForm(), review: null, done: "", receipt: null,
        sent: [], addedAt: {}, spent: 0, lastResult: null, cases: []
      };
    }
    return appState.riskScorer;
  }

  function balance() {
    return bank.fromAccount.balance - myState().spent;
  }

  // ---------- Numbers and payees ----------

  function digitsOnly(text) {
    return String(text || "").replace(/\D/g, "");
  }

  // "+65 9123 4567", "9123-4567" and "6591234567" all become "91234567"
  function cleanMobile(text) {
    const digits = digitsOnly(text);
    return digits.length === 10 && digits.startsWith("65") ? digits.slice(2) : digits;
  }

  // A Singapore mobile number: 8 digits, starting with 8 or 9
  function isMobile(number) {
    return /^[89]\d{7}$/.test(number);
  }

  // "91234567" -> "9123 4567", the way people say it
  function showMobile(number) {
    return `${number.slice(0, 4)} ${number.slice(4)}`;
  }

  function payeeKey(kind, number) {
    return `${kind}:${number}`;
  }

  function findSaved(kind, number) {
    return bank.payees.find(p => p.kind === kind && p.number === number);
  }

  function isReported(kind, number) {
    return bank.reportedPayees.some(p => p.kind === kind && p.number === number);
  }

  // PayNow shows the registered name partly hidden: "JASON ONG" -> "JASON O**"
  function maskName(name) {
    const [first, ...rest] = name.split(" ");
    return [first, ...rest.map(word => word[0] + "*".repeat(Math.max(2, word.length - 1)))].join(" ");
  }

  // The name PayNow would show for a mobile number. Numbers we have no name for get one of
  // otherNames, picked from the digits, so the same number always shows the same name.
  function paynowName(number) {
    const known = bank.paynowNames[number];
    if (known) return maskName(known);
    const sum = [...number].reduce((total, digit) => total + Number(digit), 0);
    return maskName(bank.otherNames[sum % bank.otherNames.length]);
  }

  // "Rachel Lim" -> "RL", for the round picture next to a payee
  function initials(name) {
    return name.replace(/^(Mr|Mrs|Mdm|Ms)\s+/i, "").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  // The line under a saved payee's name: "PayNow 9123 4567" or "DBS / POSB 012-34567-89"
  function payeeLine(payee) {
    return payee.kind === "mobile" ? t("rs.tf.paynowLine", { number: showMobile(payee.number) }) : `${payee.bank} ${payee.shown}`;
  }

  // Who the money is going to, worked out from the form. null if those boxes aren't filled in right yet.
  //   { kind, number, shown, name, saved }   shown is how the number is written on screen
  function payeeFromForm(form) {
    if (form.mode === "mobile") {
      const number = cleanMobile(form.mobile);
      if (!isMobile(number)) return null;
      const saved = findSaved("mobile", number);
      return { kind: "mobile", number, shown: t("rs.tf.paynowLine", { number: showMobile(number) }), name: saved ? saved.name : paynowName(number), saved: Boolean(saved) };
    }
    const number = digitsOnly(form.account);
    const name = form.accountName.trim();
    if (!form.bank || number.length < 9 || number.length > 14 || !name) return null;
    const saved = findSaved("account", number);
    return { kind: "account", number, shown: `${form.bank} ${saved ? saved.shown : number}`, name: saved ? saved.name : name, saved: Boolean(saved) };
  }

  // "1,000", "$50.2" and " 50.20 " are fine; "50.205", "abc" and "0" are not (null)
  function parseAmount(text) {
    const cleaned = String(text || "").replace(/[\s,$]/g, "").replace(/^S/i, "");
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
    const amount = Number(cleaned);
    return amount > 0 ? amount : null;
  }

  // Checks the form. Gives back the problems ({ field: words }) and, if there are none, the details.
  function checkForm(form) {
    const problems = {};
    if (form.mode === "mobile") {
      if (!isMobile(cleanMobile(form.mobile))) problems.mobile = t("rs.tf.err.mobile");
    } else {
      if (!form.bank) problems.bank = t("rs.tf.err.bank");
      const length = digitsOnly(form.account).length;
      if (length < 9 || length > 14) problems.account = t("rs.tf.err.account");
      if (!form.accountName.trim()) problems.accountName = t("rs.tf.err.name");
    }
    const amount = parseAmount(form.amount);
    if (amount === null) problems.amount = t("rs.tf.err.amount");
    else if (amount > balance()) problems.amount = t("rs.tf.err.tooMuch", { amount: moneyExact(balance()) });
    return { problems, payee: payeeFromForm(form), amount };
  }

  // The transfer the scorer gets, built from the payee, the amount and this customer's history
  function transferFor(payee, amount) {
    const state = myState();
    const key = payeeKey(payee.kind, payee.number);
    const now = Date.now();
    const saved = findSaved(payee.kind, payee.number);
    const paidBefore = Boolean(saved) || state.sent.some(s => s.key === key);
    const addedAt = state.addedAt[key];
    const hoursAgo = saved ? saved.addedHoursAgo : addedAt ? (now - addedAt) / 3600000 : 0;
    return {
      payeeName: payee.name,
      amount,
      usualAmount: bank.usualAmount,
      hour: hourNow(),
      isNewPayee: !paidBefore,
      payeeAddedHoursAgo: Math.round(hoursAgo * 100) / 100,
      payeeFlagged: isReported(payee.kind, payee.number),
      recentTransferMinutes: state.sent.map(s => Math.floor((now - s.at) / 60000))
    };
  }

  // A reference number like the ones on bank receipts: TRF20261121-482915
  function newRef() {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date()).replace(/-/g, "");
    return `TRF${day}-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`;
  }

  // ---------- Scoring: the server first, this device if the server can't be reached ----------

  async function scoreOnServer(transfer) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const res = await fetch("/api/risk/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Server answered ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function score(transfer) {
    try {
      return { result: await scoreOnServer(transfer), source: "server" };
    } catch (e) {
      return { result: RISK_SCORER.scoreTransfer(transfer), source: "device" };
    }
  }

  // R-4: a High result opens a case for staff. The server gives the case number; on this
  // device we number it ourselves.
  function openCase(result, transfer) {
    const state = myState();
    const staffCase = {
      ref: result.caseRef || `TR-${String(state.cases.length + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      payeeName: transfer.payeeName,
      amount: transfer.amount,
      score: result.score,
      band: result.band,
      reasons: result.reasons
    };
    state.cases.push(staffCase);
    return staffCase.ref;
  }

  // ---------- Phase 1: the transfer form ----------

  function fromHtml() {
    const account = bank.fromAccount;
    return `
      <div class="rs-from">
        <span class="rs-from-label">${t("rs.tf.from")}</span>
        <span class="rs-from-name">${esc(account.name)}</span>
        <span class="rs-from-num">${esc(account.number)}</span>
        <div class="rs-balance"><span>${t("rs.tf.available")}</span><strong>${moneyExact(balance())}</strong></div>
      </div>`;
  }

  // The saved payees. The one that matches what's typed is marked (aria-pressed).
  function payeesHtml(form) {
    const current = payeeFromForm(form);
    return `
      <h3 class="rs-sub" id="rs-payees-title">${t("rs.tf.myPayees")}</h3>
      <ul class="rs-payees" aria-labelledby="rs-payees-title">
        ${bank.payees.map(p => `<li>
          <button type="button" class="rs-payee" data-payee="${esc(p.id)}" aria-pressed="${Boolean(current && current.kind === p.kind && current.number === p.number)}">
            <span class="rs-avatar" aria-hidden="true">${esc(initials(p.name))}</span>
            <span class="rs-payee-text"><strong>${esc(p.name)}</strong><span>${esc(payeeLine(p))}</span></span>
            ${icon("chevron")}
          </button></li>`).join("")}
      </ul>`;
  }

  // A text box with its label, hint and error line. prefix is the grey "+65" / "SGD" in front.
  function boxHtml(field, label, { hint = "", prefix = "", mode = "text", max = 60, extraClass = "" } = {}) {
    const id = FIELD_IDS[field];
    const describedBy = [hint ? `${id}-hint` : "", `${id}-error`].filter(Boolean).join(" ");
    const input = `<input id="${id}" data-field="${field}" inputmode="${mode}" autocomplete="off" maxlength="${max}"
      value="${esc(myState().form[field])}" aria-describedby="${describedBy}">`;
    return `
      <div class="field ${extraClass}">
        <label for="${id}">${label}</label>
        ${prefix ? `<div class="rs-input-group"><span class="rs-prefix" aria-hidden="true">${prefix}</span>${input}</div>` : input}
        ${hint ? `<p class="field-hint" id="${id}-hint">${hint}</p>` : ""}
        <p class="field-error" id="${id}-error"></p>
      </div>`;
  }

  // The PayNow name under the mobile number, once the number is complete
  function nameCheckHtml(form) {
    if (form.mode !== "mobile") return "";
    const payee = payeeFromForm(form);
    if (!payee) return "";
    return `
      <div class="rs-name-card ${payee.saved ? "rs-name-card--saved" : ""}">
        ${icon(payee.saved ? "check" : "user")}
        <div>
          <span class="rs-name-label">${t("rs.tf.paynowName")}</span>
          <strong>${esc(payee.name)}</strong>
          <span class="rs-tag">${payee.saved ? t("rs.tf.savedPayee") : t("rs.tf.newPayee")}</span>
        </div>
      </div>
      ${payee.saved ? "" : `<p class="rs-name-tip">${icon("warning")}<span>${t("rs.tf.checkName")}</span></p>`}`;
  }

  // The boxes for a new payee: a mobile number, or a bank + account number + name
  function newPayeeHtml(form) {
    if (form.mode === "mobile") {
      return `
        ${boxHtml("mobile", t("rs.tf.mobileLabel"), { hint: t("rs.tf.mobileHint"), prefix: "+65", mode: "numeric", max: 14 })}
        <div id="rs-name-check" class="rs-name-check" aria-live="polite">${nameCheckHtml(form)}</div>`;
    }
    return `
      <div class="field">
        <label for="rs-bank">${t("rs.tf.bankLabel")}</label>
        <select id="rs-bank" data-field="bank" aria-describedby="rs-bank-error">
          <option value="">${t("rs.tf.bankPick")}</option>
          ${bank.banks.map(b => `<option value="${esc(b)}" ${b === form.bank ? "selected" : ""}>${esc(b)}</option>`).join("")}
        </select>
        <p class="field-error" id="rs-bank-error"></p>
      </div>
      ${boxHtml("account", t("rs.tf.accountLabel"), { hint: t("rs.tf.accountHint"), mode: "numeric", max: 20 })}
      ${boxHtml("accountName", t("rs.tf.nameLabel"), { max: 60 })}`;
  }

  function demoTipsHtml() {
    const safe = bank.payees.find(p => p.kind === "mobile");
    const reported = bank.reportedPayees.find(p => p.kind === "mobile");
    return `
      <details class="rs-demo">
        <summary>${t("rs.tf.demoTitle")}</summary>
        <ul class="points">
          <li>${t("rs.tf.demoSafe", { number: showMobile(safe.number) })}</li>
          <li>${t("rs.tf.demoReported", { number: showMobile(reported.number) })}</li>
          <li>${t("rs.tf.demoNew")}</li>
          <li>${t("rs.tf.demoBig")}</li>
        </ul>
      </details>`;
  }

  function formHtml() {
    const form = myState().form;
    return `
      <section class="panel" data-read>
        <p class="eyebrow">${t("rs.tf.eyebrow")}</p>
        <h1 tabindex="-1">${t("rs.tf.title")}</h1>
        ${fromHtml()}
      </section>
      <form class="rs-form" id="rs-form" novalidate>
        <section class="panel" aria-labelledby="rs-to-title">
          <h2 id="rs-to-title">${t("rs.tf.to")}</h2>
          ${payeesHtml(form)}
          <h3 class="rs-sub" id="rs-new-title">${t("rs.tf.orNew")}</h3>
          <div class="rs-tabs" role="group" aria-labelledby="rs-new-title">
            <button type="button" class="rs-tab" data-mode="mobile" aria-pressed="${form.mode === "mobile"}">${t("rs.tf.byMobile")}</button>
            <button type="button" class="rs-tab" data-mode="account" aria-pressed="${form.mode === "account"}">${t("rs.tf.byAccount")}</button>
          </div>
          <div id="rs-new-payee">${newPayeeHtml(form)}</div>
        </section>
        <section class="panel">
          ${boxHtml("amount", t("rs.tf.amountLabel"), { hint: t("rs.tf.amountHint", { amount: moneyExact(balance()) }), prefix: "SGD", mode: "decimal", max: 12, extraClass: "rs-amount" })}
          ${boxHtml("comment", t("rs.tf.commentLabel"), { hint: t("rs.tf.commentHint"), max: 35 })}
          <button type="submit" class="btn btn-primary">${t("rs.tf.next")} ${icon("arrow")}</button>
        </section>
      </form>
      ${demoTipsHtml()}`;
  }

  // ---------- Phase 2: review ----------

  function reviewHtml() {
    const { payee, amount, comment } = myState().review;
    const account = bank.fromAccount;
    return `
      <section class="panel" data-read>
        <p class="eyebrow">${t("rs.tf.reviewEyebrow")}</p>
        <h1 tabindex="-1">${t("rs.tf.reviewTitle")}</h1>
        <p class="rs-big-amount">${moneyExact(amount)}</p>
        <dl class="rs-rows">
          <div><dt>${t("rs.tf.to")}</dt><dd>${esc(payee.name)}<span>${esc(payee.shown)}</span><span class="rs-tag">${payee.saved ? t("rs.tf.savedPayee") : t("rs.tf.newPayee")}</span></dd></div>
          <div><dt>${t("rs.tf.from")}</dt><dd>${esc(account.name)}<span>${esc(account.number)}</span></dd></div>
          <div><dt>${t("rs.tf.when")}</dt><dd>${t("rs.tf.now")}</dd></div>
          ${comment ? `<div><dt>${t("rs.tf.comment")}</dt><dd>${esc(comment)}</dd></div>` : ""}
        </dl>
        <p class="rs-safe-note">${icon("shield")}<span>${t("rs.tf.safetyNote")}</span></p>
        <div class="stack">
          <button type="button" class="btn btn-primary" data-rs="confirm">${t("rs.tf.confirm")}</button>
          <button type="button" class="btn btn-secondary" data-rs="edit">${t("rs.tf.edit")}</button>
        </div>
      </section>`;
  }

  // ---------- Phase 3: checking ----------

  function scoringHtml() {
    return `
      <section class="panel" data-read>
        <h1 tabindex="-1">${t("rs.checking")}</h1>
        <ul class="progress-list"><li class="now"><span class="spin" aria-hidden="true"></span><span>${t("rs.comparing")}</span></li></ul>
      </section>`;
  }

  // ---------- The result (Medium shows this only if autoKopiFrom is raised to 70) ----------

  function transferDetailsHtml(transfer) {
    return `
      <dl class="rs-details">
        <div><dt>${t("rs.to")}</dt><dd>${esc(transfer.payeeName)}</dd></div>
        <div><dt>${t("rs.amount")}</dt><dd>${money(transfer.amount)}</dd></div>
        <div><dt>${t("rs.usual")}</dt><dd>${transfer.usualAmount > 0 ? money(transfer.usualAmount) : t("rs.noHistory")}</dd></div>
        <div><dt>${t("rs.time")}</dt><dd>${hourText(transfer.hour)}</dd></div>
        <div><dt>${t("rs.payeeAdded")}</dt><dd>${agoText(transfer.payeeAddedHoursAgo)}</dd></div>
        <div><dt>${t("rs.paidBefore")}</dt><dd>${transfer.isNewPayee ? t("rs.firstTime") : t("rs.yes")}</dd></div>
        <div><dt>${t("rs.reported")}</dt><dd>${transfer.payeeFlagged ? t("rs.yes") : t("rs.no")}</dd></div>
        <div><dt>${t("rs.recent")}</dt><dd>${recentText(transfer.recentTransferMinutes)}</dd></div>
      </dl>`;
  }

  // Every signal, whether it fired, and the points it added: so nothing is a black box
  function allChecksHtml(result) {
    const fired = new Map(result.signals.map(s => [s.id, s]));
    return `
      <details class="rs-all">
        <summary>${t("rs.seeAll")}</summary>
        <div class="table-wrap">
          <table class="data-table">
            <caption class="visually-hidden">${t("rs.tableCaption")}</caption>
            <thead><tr><th scope="col">${t("rs.colCheck")}</th><th scope="col">${t("rs.colFound")}</th><th scope="col">${t("rs.colPoints")}</th></tr></thead>
            <tbody>
              ${data.config.signals.map(s => `<tr>
                  <th scope="row">${t(`rs.signal.${s.id}.label`)}<span class="rs-rule">${t(`rs.signal.${s.id}.rule`)}</span></th>
                  <td>${fired.has(s.id) ? t("rs.yes") : t("rs.no")}</td>
                  <td>${fired.has(s.id) ? `+${s.weight}` : "0"}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <p class="meta">${t("rs.pointsCap", { max: data.config.maxScore })}</p>
      </details>`;
  }

  // The score's 0-100 bar. Decoration only: the number and the band words say the same thing.
  function meterHtml(score) {
    const [low, medium] = data.config.bands;
    return `
      <div class="rs-meter" aria-hidden="true" style="--b1: ${low.below}%; --b2: ${medium.below}%">
        <i style="left: ${score}%"></i>
      </div>
      <div class="rs-scale" aria-hidden="true"><span>${t("rs.scale.low")}</span><span>${t("rs.scale.medium")}</span><span>${t("rs.scale.high")}</span></div>`;
  }

  // The top reasons (R-3) with the points each one added
  function pointsHtml(result) {
    if (!result.signals.length) {
      return `<ul class="reasons"><li>${icon("check")}<span>${t("rs.noSigns")}</span></li></ul>`;
    }
    const top = result.signals.slice(0, data.config.topReasons);
    const more = result.signals.length - top.length;
    return `
      <ul class="reasons">
        ${top.map(s => `<li>${icon("flag")}<span>${t(`rs.signal.${s.id}.reason`)}</span><span class="pts">+${s.weight}</span></li>`).join("")}
      </ul>
      ${more > 0 ? `<p class="meta">${t("rs.andMore", { count: more })}</p>` : ""}`;
  }

  // Medium and High both pause the transfer for a kopi break; High also sends it to the fraud team
  function nextStepHtml(result) {
    return `
      <p><strong>${t("rs.paused")}</strong> ${t("rs.notLeft")}</p>
      ${result.action === "pause-verify" ? `<p>${t("rs.checkTrusted")}</p>` : ""}
      ${result.caseRef ? `<p class="rs-next">${icon("briefcase")}<span>${t("rs.caseSent", { ref: `<strong>${esc(result.caseRef)}</strong>` })}</span></p>` : ""}
      <div class="stack">
        <a class="btn btn-primary" href="#pause-verify">${t("rs.kopi")} ${icon("arrow")}</a>
        <button type="button" class="btn btn-secondary" data-rs="cancel">${t("rs.cancel")}</button>
      </div>`;
  }

  function resultHtml() {
    const last = myState().lastResult;
    const transfer = last.transfer;
    return `
      <section data-read>
        <div class="verdict ${BAND_BOX[last.band] || "v-careful"}">
          ${icon(BAND_ICONS[last.band] || "question")}
          <div><p><strong>${t(`rs.band.${last.band}.label`)}</strong></p><h1 tabindex="-1">${t("rs.headline", { amount: money(transfer.amount), payee: esc(transfer.payeeName) })}</h1></div>
        </div>
        <div class="panel">
          <p class="rs-score"><span class="rs-score-num">${last.score}</span><span class="rs-score-max"> ${t("rs.outOf", { max: data.config.maxScore })}</span></p>
          ${meterHtml(last.score)}
          <p class="rs-action"><strong>${t("rs.nextLabel")}</strong> ${t(`rs.band.${last.band}.action`)}</p>
          <h2>${t("rs.madeScore")}</h2>
          ${pointsHtml(last)}
        </div>
      </section>
      <section class="panel" aria-label="${t("rs.whatToDo")}">
        ${nextStepHtml(last)}
      </section>
      <section class="panel" aria-labelledby="rs-details-title">
        <h2 id="rs-details-title">${t("rs.transfer")}</h2>
        ${transferDetailsHtml(transfer)}
        ${allChecksHtml(last)}
        <p class="meta rs-source">${last.source === "server" ? t("rs.source.server") : t("rs.source.device")}</p>
      </section>`;
  }

  // ---------- Phase 4: sent (a receipt) or cancelled ----------

  function receiptHtml() {
    const state = myState();
    const { ref, at, payee, amount, comment } = state.receipt;
    const last = state.lastResult;
    const when = new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore" }).format(new Date(at));
    const account = bank.fromAccount;
    return `
      <section class="panel rs-receipt" data-read>
        <div class="done-mark rs-done-ok">${icon("check")}</div>
        <h1 tabindex="-1">${t("rs.tf.success")}</h1>
        <p class="rs-big-amount">${moneyExact(amount)}</p>
        <dl class="rs-rows">
          <div><dt>${t("rs.tf.to")}</dt><dd>${esc(payee.name)}<span>${esc(payee.shown)}</span></dd></div>
          <div><dt>${t("rs.tf.from")}</dt><dd>${esc(account.name)}<span>${esc(account.number)}</span></dd></div>
          <div><dt>${t("rs.tf.when")}</dt><dd>${esc(when)}</dd></div>
          <div><dt>${t("rs.tf.ref")}</dt><dd class="rs-ref">${esc(ref)}</dd></div>
          ${comment ? `<div><dt>${t("rs.tf.comment")}</dt><dd>${esc(comment)}</dd></div>` : ""}
        </dl>
        <p class="rs-safety">${icon("shield")}<span>${t("rs.tf.safety", { band: t(`rs.band.${last.band}.label`), score: last.score, max: data.config.maxScore })}</span></p>
        ${allChecksHtml(last)}
        <p class="meta">${t("rs.done.sentNote")}</p>
        <div class="stack">
          <a class="btn btn-primary" href="#customer">${t("common.backHome")}</a>
          <button type="button" class="btn btn-secondary" data-rs="again">${t("rs.tf.another")}</button>
        </div>
      </section>`;
  }

  function cancelledHtml() {
    return `
      <section class="panel" data-read>
        <div class="done-mark">${icon("check")}</div>
        <h1 tabindex="-1">${t("rs.done.cancelled")}</h1>
        <p>${t("rs.done.cancelledNote")}</p>
        <div class="stack">
          <a class="btn btn-primary" href="#customer">${t("common.backHome")}</a>
          <a class="btn btn-secondary" href="#report">${t("rs.reportScam")}</a>
          <button type="button" class="btn btn-link" data-rs="again">${t("rs.tf.another")}</button>
        </div>
      </section>`;
  }

  function screenHtml() {
    const state = myState();
    // Coming from another screen starts a new transfer (the last result is kept for #pause-verify).
    // If this screen is already showing, it is only being redrawn (next phase, or a language change),
    // so it stays where it is, with everything typed so far.
    const alreadyHere = document.querySelector(".rs-screen") !== null;
    if (!alreadyHere) { state.phase = "form"; state.done = ""; state.form = emptyForm(); state.review = null; }
    if (state.phase === "review" && !state.review) state.phase = "form";
    if (state.phase === "result" && !state.lastResult) state.phase = "form";
    if (state.phase === "done" && state.done === "sent" && !state.receipt) state.phase = "form";
    const phases = {
      form: formHtml,
      review: reviewHtml,
      scoring: scoringHtml,
      result: resultHtml,
      done: () => (state.done === "sent" ? receiptHtml() : cancelledHtml())
    };
    return customerPageHtml("", `<div class="narrow rs-screen">${phases[state.phase]()}</div>`);
  }

  // ---------- Wiring up ----------

  // Clears one box's error (when the customer starts fixing it)
  function clearError(field) {
    const box = document.getElementById(FIELD_IDS[field]);
    if (!box) return;
    box.removeAttribute("aria-invalid");
    document.getElementById(`${FIELD_IDS[field]}-error`).textContent = "";
  }

  // Shows every problem under its box and puts the cursor in the first one
  function showProblems(problems) {
    Object.keys(FIELD_IDS).forEach(clearError);
    let first = null;
    for (const [field, words] of Object.entries(problems)) {
      const box = document.getElementById(FIELD_IDS[field]);
      if (!box) continue;
      box.setAttribute("aria-invalid", "true");
      document.getElementById(`${FIELD_IDS[field]}-error`).textContent = words;
      first = first || box;
    }
    if (first) first.focus();
  }

  // After typing: update the PayNow name and which saved payee is marked, without redrawing the
  // whole screen (a redraw would move the cursor out of the box)
  function refreshPayeeParts() {
    const form = myState().form;
    const current = payeeFromForm(form);
    document.querySelectorAll(".rs-payee").forEach(button => {
      const p = bank.payees.find(x => x.id === button.dataset.payee);
      button.setAttribute("aria-pressed", String(Boolean(current && current.kind === p.kind && current.number === p.number)));
    });
    const nameCheck = document.getElementById("rs-name-check");
    if (nameCheck) nameCheck.innerHTML = nameCheckHtml(form);
  }

  // Switches between "Mobile number" and "Account number"
  function setMode(mode) {
    const form = myState().form;
    form.mode = mode;
    document.querySelectorAll(".rs-tab").forEach(tab => tab.setAttribute("aria-pressed", String(tab.dataset.mode === mode)));
    document.getElementById("rs-new-payee").innerHTML = newPayeeHtml(form);
    refreshPayeeParts();
  }

  // Tapping a saved payee fills in their details, then the cursor goes to the amount
  function pickPayee(id) {
    const payee = bank.payees.find(p => p.id === id);
    const form = myState().form;
    if (payee.kind === "mobile") {
      form.mobile = showMobile(payee.number);
    } else {
      form.bank = payee.bank;
      form.account = payee.number;
      form.accountName = payee.name;
    }
    setMode(payee.kind);
    document.getElementById("rs-amount").focus();
  }

  function goToReview() {
    const state = myState();
    const { problems, payee, amount } = checkForm(state.form);
    if (Object.keys(problems).length) { showProblems(problems); return; }
    state.review = { payee, amount, comment: state.form.comment.trim() };
    state.phase = "review";
    redrawScreen();
  }

  async function confirmTransfer() {
    const state = myState();
    const { payee, amount, comment } = state.review;
    const key = payeeKey(payee.kind, payee.number);
    const transfer = transferFor(payee, amount);
    if (!payee.saved && !state.addedAt[key]) state.addedAt[key] = Date.now();   // adding the payee happens now

    state.phase = "scoring";
    redrawScreen();
    const [{ result, source }] = await Promise.all([score(transfer), wait(MIN_CHECK_MS)]);
    const caseRef = result.action === "pause-and-case" ? openCase(result, transfer) : "";
    state.lastResult = { transfer, payee, ...result, caseRef, source };
    if (state.phase !== "scoring" || !document.querySelector(".rs-screen")) return;   // the customer left

    // Risky enough? Go straight to the kopi break (Jiliana's #pause-verify), no button to skip it
    if (result.score >= data.config.autoKopiFrom) {
      appState.pauseVerify = null;        // start a new kopi break for this transfer
      state.phase = "result";
      location.hash = "#pause-verify";
      return;
    }

    if (result.action === "proceed") {
      // Low risk: the money goes. Remember it, for the balance and the "rapid repeats" check.
      state.sent.push({ key, amount, at: Date.now() });
      state.spent += amount;
      state.receipt = { ref: newRef(), at: new Date().toISOString(), payee, amount, comment };
      state.done = "sent";
      state.phase = "done";
    } else {
      state.phase = "result";
    }
    redrawScreen();
  }

  function startAgain() {
    const state = myState();
    state.phase = "form";
    state.done = "";
    state.form = emptyForm();
    state.review = null;
    redrawScreen();
  }

  function afterRender() {
    const state = myState();
    const screen = document.querySelector(".rs-screen");

    screen.addEventListener("click", event => {
      const payee = event.target.closest("[data-payee]");
      if (payee) { pickPayee(payee.dataset.payee); return; }
      const mode = event.target.closest("[data-mode]");
      if (mode) { setMode(mode.dataset.mode); return; }
      const action = event.target.closest("[data-rs]")?.dataset.rs;
      if (action === "confirm") confirmTransfer();
      if (action === "edit") { state.phase = "form"; redrawScreen(); }
      if (action === "cancel") { state.done = "cancelled"; state.phase = "done"; redrawScreen(); }
      if (action === "again") startAgain();
    });

    // Keeps what's typed in appState, so nothing is lost when the language changes
    const remember = event => {
      const field = event.target.dataset.field;
      if (!field) return;
      state.form[field] = event.target.value;
      clearError(field);
      if (["mobile", "bank", "account", "accountName"].includes(field)) refreshPayeeParts();
    };
    screen.addEventListener("input", remember);
    screen.addEventListener("change", remember);

    const form = document.getElementById("rs-form");
    if (form) form.addEventListener("submit", event => { event.preventDefault(); goToReview(); });
  }

  registerRoute({
    name: "risk-scorer",
    role: "customer",
    render: screenHtml,
    afterRender
  });
})();
