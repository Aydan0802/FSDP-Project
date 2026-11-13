"use strict";

// Made-up data for: Evidence checker (screenshots, photos, letters and documents).
// Owner: Yan Lin
// PLACEHOLDER: the results are written by hand, one per kind of file. Nothing is really looked
// at yet. A real image/document checker would hand back results in this same shape.
// The screen that shows them is the "Check anything" screen (js/features/analyser.js).

const EVIDENCE_CHECKER_DATA = {
  // The two kinds of file this checker handles: what to call them, their icon, and the three
  // "checking" steps shown while they are checked
  kinds: {
    screenshot: {
      label: "Screenshot or photo", icon: "image",
      steps: ["Reading the words in the picture", "Looking for signs it was edited", "Checking links and logos"]
    },
    document: {
      label: "Letter or document", icon: "document",
      steps: ["Reading the document", "Checking the letterhead and signature", "Checking phone numbers and links"]
    }
  },

  // One result per kind. result is one of the five RESULTS keys (js/core/helpers.js).
  results: {
    screenshot: {
      result: "likely",
      title: "This picture was likely edited",
      reasons: [
        "The numbers near the amount use a different font.",
        "The OCBC logo is blurry and the wrong shade of red.",
        "The link in it goes to ocbc-secure-sg.example, not ocbc.com."
      ],
      steps: [
        "Do not send money because of this picture.",
        "Do not tap any link or call any number in it.",
        "Check your account in the OCBC app yourself."
      ]
    },
    document: {
      result: "uncertain",
      title: "Please be careful with this letter",
      reasons: [
        "The letterhead looks normal.",
        "But the phone number on it is not an OCBC number.",
        "It asks you to reply by WhatsApp. OCBC letters will not do that."
      ],
      steps: [
        "Do not call the number on the letter.",
        "Call OCBC yourself on the number on the back of your card.",
        "Ask the bank if the letter is real before you do anything it says."
      ]
    }
  },

  // Sample files for the "Try a sample" buttons. Only the name is used.
  samples: [
    { kind: "screenshot", label: "Sample screenshot", name: "transfer_receipt.png" },
    { kind: "document", label: "Sample letter", name: "OCBC_letter.pdf" }
  ]
};
