"use strict";

// Made-up data for: Family passphrase.
// Owner: Jiliana
// No safe words here: they are only ever stored hashed, on the server (server/passphrases.js).

const PASSPHRASE_DATA = {
  // The choices for "How are they related to you?"
  relationships: ["Son", "Daughter", "Grandson", "Granddaughter", "Husband or wife",
    "Brother or sister", "Friend", "Someone else"],

  // Ideas shown under the "Safe word" box
  ideas: "two or three words only your family would know, like a favourite dish and a place",

  minLength: 3   // the shortest safe word allowed, in letters
};