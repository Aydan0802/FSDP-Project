"use strict";

// Made-up data for: Is the caller a real person? (the enhanced senior CAPTCHA check)
// Owner: Yan Lin (updated with Mahjong & Kopitiam scenarios)

const CALLER_CHECK_DATA = {
  // How long the caller has to type the code and solve the puzzle, in seconds
  waitSeconds: 60,

  // Randomized cultural scenarios (Mahjong & Kopitiam) designed for elderly target audience
  scenarios: [
    {
      theme: "🀄 Mahjong Table Check",
      prefix: "ZHONG",
      prompt: "Tap the Red Dragon (中) tile",
      callerPrompt: "Tap the Red Dragon (中) tile",
      targetId: "zhong",
      stamp: "🀄 Red Dragon (中)",
      options: [
        { id: "zhong", type: "mj", char: "中", color: "rp-mj-red", sub: "ZHONG", title: "Red Dragon", hint: "Red middle tile" },
        { id: "fa", type: "mj", char: "發", color: "rp-mj-green", sub: "FA", title: "Green Fortune", hint: "Green prosperity tile" },
        { id: "dong", type: "mj", char: "東", color: "rp-mj-blue", sub: "DONG", title: "East Wind", hint: "Blue wind tile" },
        { id: "wan", type: "mj", char: "萬", color: "rp-mj-red", sub: "WAN", title: "Ten Thousand", hint: "Character suit" }
      ]
    },
    {
      theme: "☕ Kopitiam Breakfast Check",
      prefix: "KOPI",
      prompt: "Tap the Hot Kopi",
      callerPrompt: "Tap the Half-Boiled Eggs",
      targetId: "kopi",
      stamp: "☕ Hot Kopi",
      options: [
        { id: "kopi", type: "kopi", emoji: "☕", title: "Hot Kopi", hint: "Traditional sock coffee" },
        { id: "toast", type: "kopi", emoji: "🍞", title: "Kaya Toast", hint: "Crispy bread with butter" },
        { id: "eggs", type: "kopi", emoji: "🥚", title: "Half-Boiled Eggs", hint: "With dark soy sauce" },
        { id: "teh", type: "kopi", emoji: "🧋", title: "Teh Peng", hint: "Iced milk tea" }
      ]
    },
    {
      theme: "🀄 Mahjong Winning Tile",
      prefix: "HUAT",
      prompt: "Tap the Green Fortune (發) tile",
      callerPrompt: "Tap the East Wind (東) tile",
      targetId: "fa",
      stamp: "🀄 Green Fortune (發)",
      options: [
        { id: "fa", type: "mj", char: "發", color: "rp-mj-green", sub: "FA", title: "Green Fortune", hint: "Huat ah! Green tile" },
        { id: "zhong", type: "mj", char: "中", color: "rp-mj-red", sub: "ZHONG", title: "Red Dragon", hint: "Red middle tile" },
        { id: "bai", type: "mj", char: "白", color: "rp-mj-blue", sub: "BAI", title: "White Board", hint: "Blue frame tile" },
        { id: "nan", type: "mj", char: "南", color: "rp-mj-blue", sub: "NAN", title: "South Wind", hint: "South direction" }
      ]
    },
    {
      theme: "🥮 Afternoon Tea Check",
      prefix: "KUEH",
      prompt: "Tap the Curry Puff",
      callerPrompt: "Tap the Chinese Tea Pot",
      targetId: "puff",
      stamp: "🥟 Crispy Curry Puff",
      options: [
        { id: "puff", type: "kopi", emoji: "🥟", title: "Curry Puff", hint: "Crispy flaky pastry" },
        { id: "tea", type: "kopi", emoji: "🫖", title: "Chinese Tea", hint: "Hot Pu-erh pot" },
        { id: "pineapple", type: "kopi", emoji: "🍍", title: "Pineapple Tart", hint: "Festive sweet treat" },
        { id: "nasilemak", type: "kopi", emoji: "🍛", title: "Nasi Lemak", hint: "Fragrant coconut rice" }
      ]
    }
  ],

  // What the caller's side does in the demo simulation (including bot latency telemetry)
  callerScripts: {
    human: [
      [1200, "Caller opened OCBC Verify and entered code {code}"],
      [1400, "Live puzzle shown: {callerPrompt}"],
      [2000, "Natural cursor movement detected <span class='rp-tel-badge rp-tel-ok'>Human Timing: 2.0s</span>"],
      [1300, "Solved puzzle & unlocked picture stamp"]
    ],
    ai: [
      [1100, "Voice-to-text transcribed code {code}"],
      [1300, "Live puzzle shown: {callerPrompt}"],
      [1700, "⚠️ Long audio pause (AI trying to parse image) <span class='rp-tel-badge rp-tel-bot'>Bot Latency: 3.9s</span>"],
      [1700, "Blindly tapped wrong tiles twice — <strong>Blocked by AI Guard</strong>"]
    ]
  }
};