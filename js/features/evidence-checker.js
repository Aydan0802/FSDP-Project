"use strict";

// Feature: Evidence checker (screenshots, photos, letters and documents). No screen of its own.
// Owner: Yan Lin
// The screen is now the one "Check anything" screen (#analyser, js/features/analyser.js, Aydan),
// which takes any file. When the file is a picture or a document, that screen asks this file
// for the steps to show and the result. Message and voice checks stay in analyser.js.
//
// EVIDENCE_CHECKER is NOT inside (function () { ... })(); because analyser.js has to reach it
// (the same way call-match-logic.js shares matchCall()). Keep its name and the shapes below.
//
//   EVIDENCE_CHECKER.handles(kind)   true for "screenshot" and "document"
//   EVIDENCE_CHECKER.kind(kind)      { label, icon, steps: [3 strings] }
//   EVIDENCE_CHECKER.check(kind, fileName)
//                                    { result: <RESULTS key>, title, reasons: [...], steps: [...] }
//   EVIDENCE_CHECKER.samples         [{ kind, label, name }]
//
// PLACEHOLDER: check() returns the hand-written result for that kind (js/data/evidence-checker.js).
// The file itself is never opened, read or uploaded. A real checker would replace check() only.

const EVIDENCE_CHECKER = (function () {
  const data = EVIDENCE_CHECKER_DATA;

  function handles(kind) {
    return Object.prototype.hasOwnProperty.call(data.kinds, kind);
  }

  function kind(name) {
    return data.kinds[name];
  }

  function check(kindName, fileName) {
    const r = data.results[kindName];
    return { result: r.result, title: r.title, reasons: [...r.reasons], steps: [...r.steps], fileName };
  }

  return { handles, kind, check, samples: data.samples };
})();

// The old address #evidence now opens the one "Check anything" screen
(function () {
  registerRoute({
    name: "evidence",
    role: "customer",
    render: () => customerPageHtml("", `<h1 tabindex="-1">Check anything you are not sure about</h1><p>Opening the checker…</p>`),
    afterRender: () => location.replace("#analyser")
  });
})();
