"use strict";

// Feature: Call match logic (no screen of its own).
// Owner: Jose
// STUB: build the real matching here on your own branch.
// This file holds one function, matchCall(). Yan Lin's screen (js/features/call-match.js) calls
// it, so keep its name, its inputs and the shape of what it returns the same.
// It is NOT inside (function () { ... })(); like the other feature files, because matchCall
// has to be reachable from another file. Keep any helper functions you add inside matchCall,
// or give them names starting with "callMatch", so they can't clash with a teammate's file.

// Checks a caller against the fake list of real OCBC outbound calls
// (CALL_MATCH_LOGIC_DATA.outboundCalls in js/data/call-match-logic.js).
//   callerNumber: the phone number the customer typed, e.g. "+65 6363 3333"
//   officerName:  the name the caller gave, e.g. "Ms Tan" (may be "")
// Returns { matched: true, call: <the matching call> } or { matched: false, call: null }.
// For now it never finds a match.
function matchCall(callerNumber, officerName) {
  return { matched: false, call: null };
}
