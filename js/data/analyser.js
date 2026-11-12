"use strict";

// Made-up data for: Check a message or voice clip (the analyser).
// Owner: Aydan
// PLACEHOLDER: every result below is written by hand. Nothing is analysed yet. When the real
// message checker and voice detector are ready, they will produce results in this same shape,
// so the screen (js/features/analyser.js) won't need to change.
// All messages are short, made up and clearly fake: fake names, ".example" links, no real people.
// The Chinese and Malay examples still need a teammate to check the wording.

const ANALYSER_DATA = {
  maxLength: 2000,   // the longest message the box accepts (characters)

  // ---------- Words the message result uses, in each language ----------
  // Most of the screen is in English. A Chinese or Malay example gets its result in that language.
  labels: {
    en: {
      risk: { low: "Low risk", medium: "Medium risk", high: "High risk" },
      looksLike: "This looks like",
      howSure: "How sure we are",
      sure: { low: "Not very sure", medium: "Fairly sure", high: "Very sure" },
      flagsTitle: "Warning signs in your message",
      noFlags: "We found no warning signs in this message.",
      stepsTitle: "What to do now",
      honesty: "These are warning signs, not proof of a scam. If you're unsure, ask the bank.",
      types: {
        impersonation: "A scam pretending to be the bank or government",
        phishing: "A fake link to steal your details",
        parcel: "A fake delivery message",
        job: "A job scam",
        investment: "An investment scam",
        love: "A love scam",
        none: "A normal message"
      }
    },
    zh: {
      risk: { low: "低风险", medium: "中风险", high: "高风险" },
      looksLike: "这看起来像",
      howSure: "我们的把握",
      sure: { low: "不太确定", medium: "比较确定", high: "非常确定" },
      flagsTitle: "信息中的危险信号",
      noFlags: "这条信息没有发现危险信号。",
      stepsTitle: "现在该怎么做",
      honesty: "这些只是危险信号，不能证明一定是诈骗。如有疑问，请联系银行。",
      types: { impersonation: "冒充银行或政府的诈骗" }
    },
    ms: {
      risk: { low: "Risiko rendah", medium: "Risiko sederhana", high: "Risiko tinggi" },
      looksLike: "Ini kelihatan seperti",
      howSure: "Sejauh mana kami pasti",
      sure: { low: "Kurang pasti", medium: "Agak pasti", high: "Sangat pasti" },
      flagsTitle: "Tanda amaran dalam mesej anda",
      noFlags: "Kami tidak menemui tanda amaran dalam mesej ini.",
      stepsTitle: "Apa yang perlu dilakukan sekarang",
      honesty: "Ini hanya tanda amaran, bukan bukti penipuan. Jika ragu, tanya pihak bank.",
      types: { job: "Penipuan kerja" }
    }
  },

  // ---------- Next steps for each kind of message (English) ----------
  // An example can give its own "steps" instead (the Chinese and Malay ones do).
  nextSteps: {
    impersonation: [
      "Don't reply, and never share a one-time password (OTP) or PIN.",
      "Call the bank yourself on the number on the back of your card.",
      "Never move money to a “safe account”. A real bank never asks for this.",
      "Still unsure? Call the Anti-Scam Helpline on 1799."
    ],
    phishing: [
      "Don't tap the link.",
      "If you already tapped it, don't type anything. Open your bank's own app instead.",
      "Report the message to the bank.",
      "Still unsure? Call the Anti-Scam Helpline on 1799."
    ],
    parcel: [
      "Don't tap the link or pay any fee.",
      "Check your delivery in the courier's own app or website.",
      "If you typed your card details, call the bank straight away."
    ],
    job: [
      "Don't pay anything to “start” a job.",
      "Don't share your bank details or one-time password (OTP).",
      "Block the sender. Still unsure? Call the Anti-Scam Helpline on 1799."
    ],
    investment: [
      "Don't transfer any money.",
      "Check the company on the MAS Investor Alert List.",
      "Talk to family or the bank before you invest."
    ],
    love: [
      "Never send money to someone you have only met online.",
      "Tell a family member or friend about it.",
      "Still unsure? Call the Anti-Scam Helpline on 1799."
    ],
    none: [
      "You don't need to do anything.",
      "If something still feels wrong, contact the person on a number you already know."
    ]
  },

  // ---------- "Try an example" messages, each with a hand-written result ----------
  // risk: "low" | "medium" | "high". confidence: "low" | "medium" | "high".
  // type: one of the keys in labels.en.types. flags: phrases copied exactly from the text.
  examples: [
    {
      id: "bank", chip: "Bank “security team”", lang: "en",
      text: "Bank Security Team: we detected an unusual login on your account. Reply with the 6-digit OTP we sent you within 10 minutes, or your account will be frozen.",
      result: {
        risk: "high", type: "impersonation", confidence: "high",
        summary: "This looks like a scam pretending to be your bank. A real bank will never ask for your OTP by message. Don't reply, and don't share any code.",
        flags: [
          { phrase: "Bank Security Team", reason: "Claims to be your bank" },
          { phrase: "Reply with the 6-digit OTP", reason: "Asks for your one-time password (OTP)" },
          { phrase: "within 10 minutes", reason: "Rushes you" },
          { phrase: "your account will be frozen", reason: "Threatens you" }
        ]
      }
    },
    {
      id: "link", chip: "Card suspended link", lang: "en",
      text: "Your card has been suspended. Tap here to verify your details now: card-verify-secure.example/login",
      result: {
        risk: "high", type: "phishing", confidence: "high",
        summary: "This looks like a fake link made to steal your card details. The link doesn't go to your bank's real website. Don't tap it.",
        flags: [
          { phrase: "Your card has been suspended", reason: "A scary claim to make you act fast" },
          { phrase: "Tap here to verify your details", reason: "Asks you to tap a link and type your details" },
          { phrase: "card-verify-secure.example/login", reason: "Not your bank's real website" }
        ]
      }
    },
    {
      id: "parcel", chip: "Parcel fee", lang: "en",
      text: "Your parcel could not be delivered. Pay a $1.99 redelivery fee within 24 hours: parcel-redeliver.example",
      result: {
        risk: "medium", type: "parcel", confidence: "high",
        summary: "This looks like a fake delivery message. Couriers don't ask for small fees through links like this. Check your parcel in the courier's own app instead.",
        flags: [
          { phrase: "Pay a $1.99 redelivery fee", reason: "A small fee to get your card details" },
          { phrase: "within 24 hours", reason: "Rushes you" },
          { phrase: "parcel-redeliver.example", reason: "An unknown link" }
        ]
      }
    },
    {
      id: "job", chip: "Easy part-time job", lang: "en",
      text: "Part-time job! Earn $300 a day just by liking videos. No experience needed. Pay a $50 registration fee to start. WhatsApp us now.",
      result: {
        risk: "high", type: "job", confidence: "high",
        summary: "This looks like a job scam. Real jobs never ask you to pay to start, and nobody pays $300 a day for liking videos. Don't pay or share your bank details.",
        flags: [
          { phrase: "Earn $300 a day just by liking videos", reason: "Too good to be true" },
          { phrase: "Pay a $50 registration fee to start", reason: "Asks you to pay first" },
          { phrase: "WhatsApp us now", reason: "Moves you to a private chat, fast" }
        ]
      }
    },
    {
      id: "invest", chip: "Guaranteed returns", lang: "en",
      text: "Join our VIP crypto group. Guaranteed 30% returns every week! Limited slots, transfer today to secure your place.",
      result: {
        risk: "high", type: "investment", confidence: "high",
        summary: "This looks like an investment scam. No real investment can promise guaranteed profits every week. Don't transfer any money.",
        flags: [
          { phrase: "Guaranteed 30% returns every week", reason: "Promises profit that is too good to be true" },
          { phrase: "Limited slots", reason: "Pressure to act fast" },
          { phrase: "transfer today", reason: "Asks for money" }
        ]
      }
    },
    {
      id: "love", chip: "Online friend needs money", lang: "en",
      text: "My dear, I miss you so much. I'm stuck at the airport and need $2,000 for customs. Please don't tell your family, I'll pay you back next week.",
      result: {
        risk: "high", type: "love", confidence: "medium",
        summary: "This looks like a love scam. Someone you have only met online is asking for money and asking you to keep it a secret. Talk to your family before you do anything.",
        flags: [
          { phrase: "need $2,000 for customs", reason: "Asks for money" },
          { phrase: "Please don't tell your family", reason: "Asks you to keep a secret" }
        ]
      }
    },
    {
      id: "normal", chip: "Family dinner (normal)", lang: "en",
      text: "Hi Auntie, the family dinner is moved to Saturday 7pm at the usual restaurant. See you there!",
      result: {
        risk: "low", type: "none", confidence: "high",
        summary: "We found no warning signs in this message. It doesn't ask for money, codes or links. If anything still feels wrong, contact the person on a number you already know.",
        flags: []
      }
    },
    {
      id: "zh-bank", chip: "中文：银行通知", lang: "zh",
      text: "【银行通知】您的账户出现异常登录。请在10分钟内点击链接验证，否则账户将被冻结：bank-verify.example",
      result: {
        risk: "high", type: "impersonation", confidence: "high",
        summary: "这条信息看起来像是冒充银行的诈骗。真正的银行不会要求您点击链接来验证账户。请不要点击链接，也不要提供任何验证码。",
        flags: [
          { phrase: "【银行通知】", reason: "自称是银行" },
          { phrase: "10分钟内", reason: "催促您马上行动" },
          { phrase: "点击链接验证", reason: "要求您点击链接" },
          { phrase: "账户将被冻结", reason: "威胁您" }
        ],
        steps: [
          "不要点击链接，也不要回复。",
          "请拨打银行卡背面的电话号码，直接联系银行。",
          "仍有疑问？请拨打反诈骗热线 1799。"
        ]
      }
    },
    {
      id: "ms-job", chip: "Melayu: kerja sambilan", lang: "ms",
      text: "Kerja sambilan dari rumah! Dapat $300 sehari hanya dengan 'like' video. Bayar yuran pendaftaran $50 dahulu. WhatsApp kami sekarang!",
      result: {
        risk: "high", type: "job", confidence: "medium",
        summary: "Mesej ini kelihatan seperti penipuan kerja. Majikan sebenar tidak akan meminta anda membayar untuk mula bekerja. Jangan bayar apa-apa dan jangan berikan butiran bank anda.",
        flags: [
          { phrase: "Dapat $300 sehari hanya dengan 'like' video", reason: "Terlalu bagus untuk menjadi kenyataan" },
          { phrase: "Bayar yuran pendaftaran $50 dahulu", reason: "Meminta anda membayar dahulu" },
          { phrase: "WhatsApp kami sekarang", reason: "Mendesak anda" }
        ],
        steps: [
          "Jangan bayar apa-apa untuk “memulakan” kerja.",
          "Jangan kongsi butiran bank atau kata laluan sekali guna (OTP).",
          "Masih ragu? Hubungi Talian Bantuan Anti-Penipuan di 1799."
        ]
      }
    }
  ],

  // Shown for any message typed or pasted by the customer, because nothing is really checked yet
  typedResult: {
    title: "This is a demo",
    text: "The real message checker isn't connected yet. When it is, you'll see the risk level, the kind of scam, the warning signs in your message and what to do next. Try one of the examples to see a full result.",
    steps: [
      "Don't reply, tap links or send money until you're sure.",
      "Never share a one-time password (OTP) or PIN with anyone.",
      "Call the bank on the number on the back of your card, or the Anti-Scam Helpline on 1799."
    ]
  },

  // ---------- Voice clip results ----------
  // One for each of the five shared results (RESULTS in js/core/helpers.js). The real voice
  // detector (voice detector prototype/detectors/verdict.py) maps onto these: LOW band = real,
  // MEDIUM = uncertain, HIGH or an AI watermark = likely, "part of this clip" = partial,
  // INCONCLUSIVE = unsure. Wording copied from the first website prototype.
  sampleClipName: "sample-voicemail.wav",
  voiceResults: {
    likely: {
      title: "Likely an AI-made voice",
      chance: 91, sure: "High",
      reasons: [
        "The voice has patterns that are common in AI-made speech.",
        "These patterns run through the whole clip, not just one part.",
        "The clip was long and clear enough to check."
      ],
      extra: "Don't send money or share any codes. Hang up and call the bank yourself."
    },
    partial: {
      title: "Part of this clip sounds AI-made",
      chance: 63, sure: "Medium",
      reasons: [
        "Seconds 10 to 20 sound different from the rest of the clip.",
        "A real voice may have been mixed with an AI-made one.",
        "No hidden AI watermark was found."
      ],
      extra: "Treat this call as suspicious.",
      timeline: [false, false, true, true, false, false]   // one entry per 5 seconds of the clip
    },
    uncertain: {
      title: "Some signs of an AI voice",
      chance: 48, sure: "Medium",
      reasons: [
        "Some parts of the voice sound smoother than a person normally does.",
        "This sounds like phone-call audio, where our checks make more mistakes.",
        "No hidden AI watermark was found."
      ],
      extra: "Be careful. Check the caller another way before you do anything they ask."
    },
    unsure: {
      title: "Not sure: not enough clear evidence",
      chance: null, sure: "Low",   // the detector gives no number when it can't tell
      reasons: [
        "Different parts of the clip gave very different results.",
        "There was no clear pattern either way."
      ],
      extra: "Try a longer clip, or check the caller with questions instead."
    },
    real: {
      title: "Probably a real human voice",
      chance: 6, sure: "High",
      reasons: [
        "No hidden AI watermark was found. That alone doesn't prove the voice is real.",
        "The voice sounds natural all the way through.",
        "The clip was long and clear enough to check."
      ],
      extra: "A real voice can still belong to a scammer. If the caller asks for money, codes or secrecy, hang up."
    }
  },

  // The three steps shown while a clip is "checked"
  voiceSteps: ["Looking for a hidden AI watermark", "Listening for signs of an AI voice", "Working out how sure we are"]
};
