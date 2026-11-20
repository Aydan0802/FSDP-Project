"use strict";

// Feature: Call match logic (no screen of its own).
// Owner: Jose
// This file holds one function, matchCall(). Yan Lin's screen (js/features/call-match.js) calls
// it, so keep its name, its inputs and the shape of what it returns the same.
// It is NOT inside (function () { ... })(); like the other feature files, because matchCall
// has to be reachable from another file. Keep any helper functions you add inside matchCall,
// or give them names starting with "callMatch", so they can't clash with a teammate's file.

// The calls' team, time and about in English, Chinese, Malay and Tamil, for screens that show them
addTranslations(CALL_MATCH_LOGIC_DATA.text);

// Singapore numbers in any writing ("+65 6363 3333", "6363-3333", "006563633333") become
// the same 8 digits, "63633333", so they can be compared
function callMatchDigits(number) {
  const digits = String(number || "").replace(/\D/g, "").replace(/^00/, "");
  return digits.length === 10 && digits.startsWith("65") ? digits.slice(2) : digits;
}

// Checks a caller against the fake list of real OCBC outbound calls
// (CALL_MATCH_LOGIC_DATA.outboundCalls in js/data/call-match-logic.js).
//   callerNumber: the phone number the customer typed, e.g. "+65 6363 3333"
//   officerName:  the name the caller gave, e.g. "Ms Tan" (may be "")
// Returns { matched: true, call: <the matching call> } or { matched: false, call: null }.
// The number must match exactly. If a name is given, it must also be part of the officer's
// name (so "Mr Tan" matches "Mr Tan Wei Ming"); a wrong name means no match.
function matchCall(callerNumber, officerName) {
  const digits = callMatchDigits(callerNumber);
  const name = String(officerName || "").trim().toLowerCase();
  const call = CALL_MATCH_LOGIC_DATA.outboundCalls.find(c =>
    callMatchDigits(c.number) === digits && (!name || c.officer.toLowerCase().includes(name)));
  return call ? { matched: true, call } : { matched: false, call: null };
}
