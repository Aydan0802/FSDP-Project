"use strict";

// Data for: Check anything (the analyser): messages and voice recordings.
// Owner: Aydan
// Messages are checked by the real text detector ("text detector prototype/detector/"), so the
// examples below are only sample messages to try: their results come from the detector.
// Voice recordings go to the real voice detector on this computer. The hand-written voice results
// below give each result's title and advice, and are shown in full only as a demo when the voice
// checker isn't running.
// All messages are short, made up and clearly fake: fake names, ".example" links, no real people.
// The Chinese and Malay wording still needs a teammate who speaks each language to check it.

const ANALYSER_DATA = {
  maxLength: 2000,   // the longest message the box accepts (characters)

  // ---------- Words the message result uses, in each language ----------
  // Most of the screen is in English. A Chinese or Malay message gets its result in that language.
  // Anything missing in zh or ms falls back to English.
  labels: {
    en: {
      risk: { low: "Low risk", medium: "Medium risk", high: "High risk" },
      // The big headline, in plain words, for each risk level
      headline: {
        high: "This message is likely a scam",
        medium: "Be careful with this message",
        low: "We found no clear scam signs"
      },
      looksLike: "It looks like:",
      howSure: "How sure we are",
      sure: { low: "Not very sure", medium: "Fairly sure", high: "Very sure" },
      flagsTitle: "Why we think so",
      tapHint: "The worrying parts are marked in red. Tap a part to see why.",
      noFlags: "We found no warning signs in this message.",
      stepsTitle: "What to do now",
      honesty: "This is a warning, not proof. If you're not sure, call the bank on the number on your card.",
      types: {
        impersonation: "someone pretending to be the bank or government",
        phishing: "a fake link to steal your bank details",
        parcel: "a fake delivery message",
        job: "a fake job offer",
        investment: "a fake investment offer",
        love: "someone you met online asking for money",
        none: "a normal message"
      }
    },
    zh: {
      risk: { low: "低风险", medium: "中风险", high: "高风险" },
      headline: {
        high: "这条信息很可能是诈骗",
        medium: "请小心这条信息",
        low: "没有发现明显的诈骗迹象"
      },
      looksLike: "这看起来像：",
      howSure: "我们的把握",
      sure: { low: "不太确定", medium: "比较确定", high: "非常确定" },
      flagsTitle: "我们为什么这样认为",
      tapHint: "可疑的部分已用红色标出。点击可以看原因。",
      noFlags: "这条信息没有发现危险信号。",
      stepsTitle: "现在该怎么做",
      honesty: "这些只是危险信号，不能证明一定是诈骗。如有疑问，请联系银行。",
      types: {
        impersonation: "冒充银行或政府的诈骗",
        phishing: "骗取您个人资料的假链接",
        parcel: "假冒的快递通知",
        job: "求职诈骗",
        investment: "投资诈骗",
        love: "感情诈骗"
      }
    },
    ms: {
      risk: { low: "Risiko rendah", medium: "Risiko sederhana", high: "Risiko tinggi" },
      headline: {
        high: "Mesej ini mungkin penipuan",
        medium: "Berhati-hati dengan mesej ini",
        low: "Kami tidak menemui tanda penipuan yang jelas"
      },
      looksLike: "Ini kelihatan seperti:",
      howSure: "Sejauh mana kami pasti",
      sure: { low: "Kurang pasti", medium: "Agak pasti", high: "Sangat pasti" },
      flagsTitle: "Mengapa kami fikir begitu",
      tapHint: "Bahagian yang membimbangkan ditanda merah. Tekan untuk lihat sebabnya.",
      noFlags: "Kami tidak menemui tanda amaran dalam mesej ini.",
      stepsTitle: "Apa yang perlu dilakukan sekarang",
      honesty: "Ini hanya tanda amaran, bukan bukti penipuan. Jika ragu, tanya pihak bank.",
      types: {
        impersonation: "penipuan yang menyamar sebagai bank atau kerajaan",
        phishing: "pautan palsu untuk mencuri butiran anda",
        parcel: "mesej penghantaran palsu",
        job: "penipuan kerja",
        investment: "penipuan pelaburan",
        love: "penipuan cinta"
      }
    }
  },

  // ---------- Next steps for each kind of message (English) ----------
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

  // Next steps for Chinese and Malay messages: one list for any scam, one for a low-risk message
  otherLangSteps: {
    zh: {
      scam: [
        "不要回复、点击链接或转账。",
        "绝不要把验证码（OTP）或密码告诉任何人。",
        "请拨打银行卡背面的电话号码联系银行，或拨打反诈骗热线 1799。"
      ],
      none: [
        "您不需要做任何事。",
        "如果仍觉得不对劲，请用您已知的号码联系对方。"
      ]
    },
    ms: {
      scam: [
        "Jangan balas, tekan pautan atau hantar wang.",
        "Jangan sekali-kali kongsi OTP atau PIN anda dengan sesiapa.",
        "Hubungi bank melalui nombor di belakang kad anda, atau Talian Bantuan Anti-Penipuan di 1799."
      ],
      none: [
        "Anda tidak perlu berbuat apa-apa.",
        "Jika masih terasa tidak kena, hubungi orang itu melalui nombor yang anda sudah tahu."
      ]
    }
  },

  // ---------- "More message examples": sample messages to try ----------
  // The text detector checks each one like any pasted message.
  examples: [
    {
      id: "bank", chip: "Bank “security team”", lang: "en",
      text: "Bank Security Team: we detected an unusual login on your account. Reply with the 6-digit OTP we sent you within 10 minutes, or your account will be frozen."
    },
    {
      id: "link", chip: "Card suspended link", lang: "en",
      text: "Your card has been suspended. Tap here to verify your details now: card-verify-secure.example/login"
    },
    {
      id: "parcel", chip: "Parcel fee", lang: "en",
      text: "Your parcel could not be delivered. Pay a $1.99 redelivery fee within 24 hours: parcel-redeliver.example"
    },
    {
      id: "job", chip: "Easy part-time job", lang: "en",
      text: "Part-time job! Earn $300 a day just by liking videos. No experience needed. Pay a $50 registration fee to start. WhatsApp us now."
    },
    {
      id: "invest", chip: "Guaranteed returns", lang: "en",
      text: "Join our VIP crypto group. Guaranteed 30% returns every week! Limited slots, transfer today to secure your place."
    },
    {
      id: "love", chip: "Online friend needs money", lang: "en",
      text: "My dear, I miss you so much. I'm stuck at the airport and need $2,000 for customs. Please don't tell your family, I'll pay you back next week."
    },
    {
      id: "normal", chip: "Family dinner (normal)", lang: "en",
      text: "Hi Auntie, the family dinner is moved to Saturday 7pm at the usual restaurant. See you there!"
    },
    {
      id: "zh-bank", chip: "中文：银行通知", lang: "zh",
      text: "【银行通知】您的账户出现异常登录。请在10分钟内点击链接验证，否则账户将被冻结：bank-verify.example"
    },
    {
      id: "ms-job", chip: "Melayu: kerja sambilan", lang: "ms",
      text: "Kerja sambilan dari rumah! Dapat $300 sehari hanya dengan 'like' video. Bayar yuran pendaftaran $50 dahulu. WhatsApp kami sekarang!"
    }
  ],

  // ---------- The kinds of thing the "Check anything" screen handles here ----------
  // Screenshots and documents are Yan Lin's (js/data/evidence-checker.js).
  kinds: {
    message: { label: "Text message", icon: "chat", steps: ["Reading the words", "Looking for scam phrases", "Checking any links"] },
    voice: { label: "Voice recording", icon: "wave", steps: ["Looking for a hidden AI watermark", "Listening for signs of an AI voice", "Working out how sure we are"] }
  },

  // The "Sample SMS" button checks this example
  sampleMessageId: "bank",

  // ---------- Voice clip results ----------
  // One for each of the five shared results (RESULTS in js/core/helpers.js). The real voice
  // detector (voice detector prototype/detectors/verdict.py) maps onto these: LOW band = real,
  // MEDIUM = uncertain, HIGH or an AI watermark = likely, "part of this clip" = partial,
  // INCONCLUSIVE = unsure. Wording copied from the first website prototype.
  sampleClipName: "sample-voicemail.wav",
  // The voice checker (voice detector prototype/app/api.py) runs on this computer only
  voiceApi: "http://127.0.0.1:7861/api/voice",
  voiceTimeoutMs: 120000,   // give up after 2 minutes (a long recording on a slow computer)
  voiceResults: {
    // title: the big headline. meaning: one line explaining "fake voice", for older customers.
    likely: {
      title: "This voice is likely fake",
      meaning: "A fake voice is made by a computer (AI) to sound like a real person.",
      chance: 91, sure: "High",
      reasons: [
        "The voice sounds like it was made by a computer.",
        "It sounds this way all the way through."
      ],
      extra: "Don't send money or share any codes. Hang up and call the bank yourself."
    },
    partial: {
      title: "Part of this voice may be fake",
      meaning: "Someone may have mixed a computer-made (AI) voice into a real recording.",
      chance: 63, sure: "Medium",
      reasons: [
        "Seconds 10 to 20 sound computer-made, but the rest sounds real."
      ],
      extra: "Treat this call as suspicious. Hang up and call the person back on a number you know.",
      timeline: [false, false, true, true, false, false]   // one entry per 5 seconds of the clip
    },
    uncertain: {
      title: "This voice might be fake",
      meaning: "A fake voice is made by a computer (AI) to sound like a real person.",
      chance: 48, sure: "Medium",
      reasons: [
        "Some parts sound a bit like a computer voice, but we're not sure.",
        "It sounds like a phone recording, so this check is less sure."
      ],
      extra: "Be careful. Check the caller another way before you do anything they ask."
    },
    unsure: {
      title: "We can't tell if this voice is real",
      chance: null, sure: "Low",   // the detector gives no number when it can't tell
      reasons: [
        "We couldn't get a clear answer from this recording."
      ],
      extra: "Try a longer recording, or ask the caller a question only the real person would know."
    },
    real: {
      title: "This voice sounds like a real person",
      chance: 6, sure: "High",
      reasons: [
        "The voice sounds like a real person all the way through."
      ],
      extra: "A real voice can still belong to a scammer. If the caller asks for money, codes or secrecy, hang up."
    }
  }
};
