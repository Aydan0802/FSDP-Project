"use strict";

// Data for: Verify the Caller (Two-Way Senior Check + Caller Progress Simulation)
// Owner: Yan Lin

const CALLER_CHECK_DATA = {
  waitSeconds: 60,

  scenarios: [
    {
      id: "zhong",
      theme: "🀄 Mahjong Table Check",
      prefix: "ZHONG",
      prompt: "Tap the Red Dragon (中) tile",
      callerPrompt: "Tap the Green Fortune (發) tile",
      targetId: "zhong",
      callerTarget: "fa",
      stamp: "🀄 Green Fortune (發)",
      options: [
        { id: "zhong", type: "mj", char: "中", color: "rp-mj-red", sub: "ZHONG", title: "Red Dragon", hint: "Red middle tile" },
        { id: "fa", type: "mj", char: "發", color: "rp-mj-green", sub: "FA", title: "Green Fortune", hint: "Green prosperity tile" },
        { id: "dong", type: "mj", char: "東", color: "rp-mj-blue", sub: "DONG", title: "East Wind", hint: "Blue wind tile" },
        { id: "wan", type: "mj", char: "萬", color: "rp-mj-red", sub: "WAN", title: "Ten Thousand", hint: "Character suit" }
      ]
    },
    {
      id: "kopi",
      theme: "☕ Kopitiam Breakfast Check",
      prefix: "KOPI",
      prompt: "Tap the Hot Kopi",
      callerPrompt: "Tap the Half-Boiled Eggs",
      targetId: "kopi",
      callerTarget: "eggs",
      stamp: "🥚 Half-Boiled Eggs",
      options: [
        { id: "kopi", type: "kopi", emoji: "☕", title: "Hot Kopi", hint: "Traditional sock coffee" },
        { id: "toast", type: "kopi", emoji: "🍞", title: "Kaya Toast", hint: "Crispy bread with butter" },
        { id: "eggs", type: "kopi", emoji: "🥚", title: "Half-Boiled Eggs", hint: "With dark soy sauce" },
        { id: "teh", type: "kopi", emoji: "🧋", title: "Teh Peng", hint: "Iced milk tea" }
      ]
    },
    {
      id: "huat",
      theme: "🀄 Mahjong Winning Tile",
      prefix: "HUAT",
      prompt: "Tap the Green Fortune (發) tile",
      callerPrompt: "Tap the East Wind (東) tile",
      targetId: "fa",
      callerTarget: "dong",
      stamp: "🀄 East Wind (東)",
      options: [
        { id: "fa", type: "mj", char: "發", color: "rp-mj-green", sub: "FA", title: "Green Fortune", hint: "Huat ah! Green tile" },
        { id: "zhong", type: "mj", char: "中", color: "rp-mj-red", sub: "ZHONG", title: "Red Dragon", hint: "Red middle tile" },
        { id: "dong", type: "mj", char: "東", color: "rp-mj-blue", sub: "DONG", title: "East Wind", hint: "Blue wind tile" },
        { id: "nan", type: "mj", char: "南", color: "rp-mj-blue", sub: "NAN", title: "South Wind", hint: "South direction" }
      ]
    },
    {
      id: "kueh",
      theme: "🥮 Afternoon Tea Check",
      prefix: "KUEH",
      prompt: "Tap the Curry Puff",
      callerPrompt: "Tap the Chinese Tea",
      targetId: "puff",
      callerTarget: "tea",
      stamp: "🫖 Chinese Tea",
      options: [
        { id: "puff", type: "kopi", emoji: "🥟", title: "Curry Puff", hint: "Crispy flaky pastry" },
        { id: "tea", type: "kopi", emoji: "🫖", title: "Chinese Tea", hint: "Hot Pu-erh pot" },
        { id: "pineapple", type: "kopi", emoji: "🍍", title: "Pineapple Tart", hint: "Festive sweet treat" },
        { id: "nasilemak", type: "kopi", emoji: "🍛", title: "Nasi Lemak", hint: "Fragrant coconut rice" }
      ]
    }
  ],

  callerScripts: {
    human: [
      [1200, "Caller opened Verify page and entered {code}"],
      [1400, "Puzzle shown: {callerPrompt}"],
      [1800, "Natural cursor movement detected (Human timing: 1.8s)"],
      [1300, "Tapped the right picture — unlocked stamp & 6 digits"]
    ],
    ai: [
      [1100, "Voice bot transcribed code {code}"],
      [1300, "Puzzle shown: {callerPrompt}"],
      [1700, "Long pause — AI cannot see live picture grid"],
      [1600, "Tapped wrong pictures twice — Check stopped"]
    ]
  }
};