"use strict";

// Made-up data for: Check anything (the analyser): messages and voice recordings.
// Owner: Aydan
// The example and voice results below are written by hand. A typed or pasted message that isn't
// one of the examples is really scanned on this device for the scam phrases in "phrases".
// When the real voice detector is ready, it will produce results in this same shape.
// All messages are short, made up and clearly fake: fake names, ".example" links, no real people.
// The Chinese and Malay examples still need a teammate to check the wording.
//
// Languages (see "How to translate your screen" in TEAM-FILES.md): the screen's words are
// translation keys ("an.title"), with the English, Chinese and Malay in text at the bottom.
// The Chinese and Malay EXAMPLES are different: they are sample messages in that language, and
// their results are written in that language right here (labels.zh, labels.ms and their own
// steps), whatever language the customer picked. English examples' results follow the customer's language.
// The text at the bottom is AI-drafted and still needs a native speaker to check it.

const ANALYSER_DATA = {
  maxLength: 2000,   // the longest message the box accepts (characters)

  // ---------- Words the message result uses, in each language ----------
  // en holds translation keys (the screen looks them up in the customer's language).
  // zh and ms are the words for a Chinese or Malay example, which always gets its result in its own language.
  labels: {
    en: {
      risk: { low: "an.risk.low", medium: "an.risk.medium", high: "an.risk.high" },
      looksLike: "an.looksLike",
      howSure: "an.howSure",
      sure: { low: "an.sure.low", medium: "an.sure.medium", high: "an.sure.high" },
      flagsTitle: "an.flagsTitle",
      noFlags: "an.noFlags",
      stepsTitle: "an.stepsTitle",
      honesty: "an.honesty",
      types: {
        impersonation: "an.type.impersonation",
        phishing: "an.type.phishing",
        parcel: "an.type.parcel",
        job: "an.type.job",
        investment: "an.type.investment",
        love: "an.type.love",
        none: "an.type.none"
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

  // ---------- Next steps for each kind of message (translation keys) ----------
  // An example can give its own "steps" instead (the Chinese and Malay ones do).
  nextSteps: {
    impersonation: ["an.next.impersonation.1", "an.next.impersonation.2", "an.next.impersonation.3", "an.next.impersonation.4"],
    phishing: ["an.next.phishing.1", "an.next.phishing.2", "an.next.phishing.3", "an.next.phishing.4"],
    parcel: ["an.next.parcel.1", "an.next.parcel.2", "an.next.parcel.3"],
    job: ["an.next.job.1", "an.next.job.2", "an.next.job.3"],
    investment: ["an.next.investment.1", "an.next.investment.2", "an.next.investment.3"],
    love: ["an.next.love.1", "an.next.love.2", "an.next.love.3"],
    none: ["an.next.none.1", "an.next.none.2"]
  },

  // ---------- "Try an example" messages, each with a hand-written result ----------
  // risk: "low" | "medium" | "high". confidence: "low" | "medium" | "high".
  // type: one of the keys in labels.en.types. flags: phrases copied exactly from the text.
  // English examples: chip, summary and each flag's reason are translation keys (the message text
  // and the phrases stay as they are). Chinese and Malay examples: written out in their own language.
  examples: [
    {
      id: "bank", chip: "an.ex.bank.chip", lang: "en",
      text: "Bank Security Team: we detected an unusual login on your account. Reply with the 6-digit OTP we sent you within 10 minutes, or your account will be frozen.",
      result: {
        risk: "high", type: "impersonation", confidence: "high",
        summary: "an.ex.bank.summary",
        flags: [
          { phrase: "Bank Security Team", reason: "an.ex.bank.flag1" },
          { phrase: "Reply with the 6-digit OTP", reason: "an.ex.bank.flag2" },
          { phrase: "within 10 minutes", reason: "an.ex.bank.flag3" },
          { phrase: "your account will be frozen", reason: "an.ex.bank.flag4" }
        ]
      }
    },
    {
      id: "link", chip: "an.ex.link.chip", lang: "en",
      text: "Your card has been suspended. Tap here to verify your details now: card-verify-secure.example/login",
      result: {
        risk: "high", type: "phishing", confidence: "high",
        summary: "an.ex.link.summary",
        flags: [
          { phrase: "Your card has been suspended", reason: "an.ex.link.flag1" },
          { phrase: "Tap here to verify your details", reason: "an.ex.link.flag2" },
          { phrase: "card-verify-secure.example/login", reason: "an.ex.link.flag3" }
        ]
      }
    },
    {
      id: "parcel", chip: "an.ex.parcel.chip", lang: "en",
      text: "Your parcel could not be delivered. Pay a $1.99 redelivery fee within 24 hours: parcel-redeliver.example",
      result: {
        risk: "medium", type: "parcel", confidence: "high",
        summary: "an.ex.parcel.summary",
        flags: [
          { phrase: "Pay a $1.99 redelivery fee", reason: "an.ex.parcel.flag1" },
          { phrase: "within 24 hours", reason: "an.ex.parcel.flag2" },
          { phrase: "parcel-redeliver.example", reason: "an.ex.parcel.flag3" }
        ]
      }
    },
    {
      id: "job", chip: "an.ex.job.chip", lang: "en",
      text: "Part-time job! Earn $300 a day just by liking videos. No experience needed. Pay a $50 registration fee to start. WhatsApp us now.",
      result: {
        risk: "high", type: "job", confidence: "high",
        summary: "an.ex.job.summary",
        flags: [
          { phrase: "Earn $300 a day just by liking videos", reason: "an.ex.job.flag1" },
          { phrase: "Pay a $50 registration fee to start", reason: "an.ex.job.flag2" },
          { phrase: "WhatsApp us now", reason: "an.ex.job.flag3" }
        ]
      }
    },
    {
      id: "invest", chip: "an.ex.invest.chip", lang: "en",
      text: "Join our VIP crypto group. Guaranteed 30% returns every week! Limited slots, transfer today to secure your place.",
      result: {
        risk: "high", type: "investment", confidence: "high",
        summary: "an.ex.invest.summary",
        flags: [
          { phrase: "Guaranteed 30% returns every week", reason: "an.ex.invest.flag1" },
          { phrase: "Limited slots", reason: "an.ex.invest.flag2" },
          { phrase: "transfer today", reason: "an.ex.invest.flag3" }
        ]
      }
    },
    {
      id: "love", chip: "an.ex.love.chip", lang: "en",
      text: "My dear, I miss you so much. I'm stuck at the airport and need $2,000 for customs. Please don't tell your family, I'll pay you back next week.",
      result: {
        risk: "high", type: "love", confidence: "medium",
        summary: "an.ex.love.summary",
        flags: [
          { phrase: "need $2,000 for customs", reason: "an.ex.love.flag1" },
          { phrase: "Please don't tell your family", reason: "an.ex.love.flag2" }
        ]
      }
    },
    {
      id: "normal", chip: "an.ex.normal.chip", lang: "en",
      text: "Hi Auntie, the family dinner is moved to Saturday 7pm at the usual restaurant. See you there!",
      result: {
        risk: "low", type: "none", confidence: "high",
        summary: "an.ex.normal.summary",
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

  // ---------- The kinds of thing the "Check anything" screen handles here ----------
  // Screenshots and documents are Yan Lin's (js/data/evidence-checker.js).
  kinds: {
    message: { label: "an.kind.message", icon: "chat", steps: ["an.kind.message.step1", "an.kind.message.step2", "an.kind.message.step3"] },
    voice: { label: "an.kind.voice", icon: "wave", steps: ["an.kind.voice.step1", "an.kind.voice.step2", "an.kind.voice.step3"] }
  },

  // The "Sample SMS" button uses this example, so it shows the full hand-written result
  sampleMessageId: "bank",

  // ---------- Scam phrases looked for in any message the customer types or pastes ----------
  // A real check, done on this device: each pattern that is found adds one warning sign.
  // 2 or more signs is high risk, 1 is medium, none is low. reason is a translation key.
  phrases: [
    { pattern: /safe account/i, reason: "an.phrase.safeAccount" },
    { pattern: /\b(otp|one[- ]time password|pin|verification code|tac)\b/i, reason: "an.phrase.otp" },
    { pattern: /\burgent(ly)?\b|immediately|within \d+\s*(min|mins|minutes|hour|hours|hrs)\b|right now|act now/i, reason: "an.phrase.rush" },
    { pattern: /https?:\/\/\S+|www\.\S+|bit\.ly\/\S+|\b[\w-]+\.(com|sg|co|net|org|xyz|link|info|example)(\/\S*)?/i, reason: "an.phrase.link" },
    { pattern: /\bpolice\b|\bmas\b|\bcourt\b|\bcustoms\b|\bica\b|\bgovernment\b|\bmoh\b|\biras\b/i, reason: "an.phrase.authority" },
    { pattern: /don'?t tell|do not tell|keep (this|it) (a )?secret|do not share this|don'?t share this/i, reason: "an.phrase.secret" },
    { pattern: /\blocked\b|suspended|frozen|suspicious (login|activity)|unusual login|will be closed|deactivated/i, reason: "an.phrase.account" }
  ],

  // What the result says for a typed or pasted message, by risk level (translation keys)
  scan: {
    titles: {
      high: "an.scan.title.high",
      medium: "an.scan.title.medium",
      low: "an.scan.title.low"
    },
    noSigns: ["an.scan.noSigns.1", "an.scan.noSigns.2"],
    steps: {
      high: ["an.scan.high.1", "an.scan.risky.2", "an.scan.risky.3"],
      medium: ["an.scan.medium.1", "an.scan.risky.2", "an.scan.risky.3"],
      low: ["an.next.none.1", "an.scan.low.2"]
    }
  },

  // ---------- Voice clip results ----------
  // One for each of the five shared results (RESULTS in js/core/helpers.js). The real voice
  // detector (voice detector prototype/detectors/verdict.py) maps onto these: LOW band = real,
  // MEDIUM = uncertain, HIGH or an AI watermark = likely, "part of this clip" = partial,
  // INCONCLUSIVE = unsure. Wording copied from the first website prototype.
  // title, sure, reasons and extra are translation keys.
  sampleClipName: "sample-voicemail.wav",
  voiceResults: {
    likely: {
      title: "an.voice.likely.title",
      chance: 91, sure: "an.voiceSure.high",
      reasons: ["an.voice.likely.reason1", "an.voice.likely.reason2", "an.voice.clearEnough"],
      extra: "an.voice.likely.extra"
    },
    partial: {
      title: "an.voice.partial.title",
      chance: 63, sure: "an.voiceSure.medium",
      reasons: ["an.voice.partial.reason1", "an.voice.partial.reason2", "an.voice.noWatermark"],
      extra: "an.voice.partial.extra",
      timeline: [false, false, true, true, false, false]   // one entry per 5 seconds of the clip
    },
    uncertain: {
      title: "an.voice.uncertain.title",
      chance: 48, sure: "an.voiceSure.medium",
      reasons: ["an.voice.uncertain.reason1", "an.voice.uncertain.reason2", "an.voice.noWatermark"],
      extra: "an.voice.uncertain.extra"
    },
    unsure: {
      title: "an.voice.unsure.title",
      chance: null, sure: "an.voiceSure.low",   // the detector gives no number when it can't tell
      reasons: ["an.voice.unsure.reason1", "an.voice.unsure.reason2"],
      extra: "an.voice.unsure.extra"
    },
    real: {
      title: "an.voice.real.title",
      chance: 6, sure: "an.voiceSure.high",
      reasons: ["an.voice.real.reason1", "an.voice.real.reason2", "an.voice.clearEnough"],
      extra: "an.voice.real.extra"
    }
  },

  // ---------- The screen's words in English, Chinese and Malay ----------
  text: {
    en: {
      "an.title": "Check anything you are not sure about",
      "an.lead": "Add a message, a call recording, a screenshot or a letter. You do not need to pick what it is. We will work it out.",
      "an.drop.title": "Tap here to add a file",
      "an.drop.sub": "or drag it into this box",
      "an.or": "or",
      "an.textLabel": "Paste or type the message",
      "an.placeholder": "For example: Your account is locked. Tap this link...",
      "an.checkMessage": "Check this message",
      "an.privacy": "Your file stays on this device. Recordings, pictures and documents are never opened or uploaded.",
      "an.samplesTitle": "No file? Try a sample",
      "an.moreExamples": "More message examples",
      "an.demoVoice": "Demo only: pick the result the next voice check shows",
      "an.demoVoiceLegend": "Result for the next voice check",
      "an.demoErrors": "Demo only: show the error screens",
      "an.demo.fail": "Check failed",
      "an.demo.long": "Message too long",
      "an.sample.voice": "Sample voice message",
      "an.sample.sms": "Sample SMS",
      "an.found": "We found: {kind}",
      "an.done": " (done)",
      "an.checking": "Checking it now…",
      "an.fewSeconds": "This takes a few seconds.",
      "an.report": "Report this to OCBC",
      "an.sentMoney": "I already sent money or a code",
      "an.callerCheck": "Is the caller a real person?",
      "an.callMatch": "Is the bank really calling?",
      "an.again": "Check something else",
      "an.demoTag": "Demo result",
      "an.why": "Why we think so",
      "an.timeline.title": "Which parts sound AI-made",
      "an.timeline.part": "Seconds {from} to {to}: {what}",
      "an.timeline.ai": "sounds AI-made",
      "an.timeline.natural": "sounds natural",
      "an.timeline.key": "Sounds AI-made",
      "an.chanceNone": "No number this time: the clip didn't give a clear answer.",
      "an.chance": "chance the voice is AI-made",
      "an.voiceHonesty": "The voice check is one warning sign, not proof. A real voice can still belong to a scammer.",
      "an.evidenceHonesty": "These are warning signs, not proof. If you're unsure, ask the bank.",
      "an.error.title": "We couldn't check this",
      "an.error.text": "Something went wrong on our side. Nothing was saved or sent. Please try again in a moment.",
      "an.error.help": "Need help now? Call the Anti-Scam Helpline on 1799.",
      "an.retry": "Try again",
      "an.err.read": "We could not read that file. Please paste the message instead.",
      "an.err.empty": "That file is empty. Please paste the message instead.",
      "an.err.fileLong": "That file is too long. Please paste up to {max} characters instead.",
      "an.count": "{n} / {max} characters",
      "an.err.tooLong": "This is {over} characters too long. Please shorten it to {max} characters or fewer.",
      "an.err.nothing": "Please paste a message, add a file, or try a sample.",
      "an.label.pasted": "Pasted message",
      "an.label.example": "Example: {chip}",
      "an.today": "Today {time}",
      "an.status": "Checking. Please wait.",

      "an.kind.message": "Text message",
      "an.kind.message.step1": "Reading the words",
      "an.kind.message.step2": "Looking for scam phrases",
      "an.kind.message.step3": "Checking links and phone numbers",
      "an.kind.voice": "Voice recording",
      "an.kind.voice.step1": "Looking for a hidden AI watermark",
      "an.kind.voice.step2": "Listening for signs of an AI voice",
      "an.kind.voice.step3": "Working out how sure we are",

      "an.risk.low": "Low risk",
      "an.risk.medium": "Medium risk",
      "an.risk.high": "High risk",
      "an.looksLike": "This looks like",
      "an.howSure": "How sure we are",
      "an.sure.low": "Not very sure",
      "an.sure.medium": "Fairly sure",
      "an.sure.high": "Very sure",
      "an.flagsTitle": "Warning signs in your message",
      "an.noFlags": "We found no warning signs in this message.",
      "an.stepsTitle": "What to do now",
      "an.honesty": "These are warning signs, not proof of a scam. If you're unsure, ask the bank.",
      "an.type.impersonation": "A scam pretending to be the bank or government",
      "an.type.phishing": "A fake link to steal your details",
      "an.type.parcel": "A fake delivery message",
      "an.type.job": "A job scam",
      "an.type.investment": "An investment scam",
      "an.type.love": "A love scam",
      "an.type.none": "A normal message",

      "an.next.impersonation.1": "Don't reply, and never share a one-time password (OTP) or PIN.",
      "an.next.impersonation.2": "Call the bank yourself on the number on the back of your card.",
      "an.next.impersonation.3": "Never move money to a “safe account”. A real bank never asks for this.",
      "an.next.impersonation.4": "Still unsure? Call the Anti-Scam Helpline on 1799.",
      "an.next.phishing.1": "Don't tap the link.",
      "an.next.phishing.2": "If you already tapped it, don't type anything. Open your bank's own app instead.",
      "an.next.phishing.3": "Report the message to the bank.",
      "an.next.phishing.4": "Still unsure? Call the Anti-Scam Helpline on 1799.",
      "an.next.parcel.1": "Don't tap the link or pay any fee.",
      "an.next.parcel.2": "Check your delivery in the courier's own app or website.",
      "an.next.parcel.3": "If you typed your card details, call the bank straight away.",
      "an.next.job.1": "Don't pay anything to “start” a job.",
      "an.next.job.2": "Don't share your bank details or one-time password (OTP).",
      "an.next.job.3": "Block the sender. Still unsure? Call the Anti-Scam Helpline on 1799.",
      "an.next.investment.1": "Don't transfer any money.",
      "an.next.investment.2": "Check the company on the MAS Investor Alert List.",
      "an.next.investment.3": "Talk to family or the bank before you invest.",
      "an.next.love.1": "Never send money to someone you have only met online.",
      "an.next.love.2": "Tell a family member or friend about it.",
      "an.next.love.3": "Still unsure? Call the Anti-Scam Helpline on 1799.",
      "an.next.none.1": "You don't need to do anything.",
      "an.next.none.2": "If something still feels wrong, contact the person on a number you already know.",

      "an.ex.bank.chip": "Bank “security team”",
      "an.ex.bank.summary": "This looks like a scam pretending to be your bank. A real bank will never ask for your OTP by message. Don't reply, and don't share any code.",
      "an.ex.bank.flag1": "Claims to be your bank",
      "an.ex.bank.flag2": "Asks for your one-time password (OTP)",
      "an.ex.bank.flag3": "Rushes you",
      "an.ex.bank.flag4": "Threatens you",
      "an.ex.link.chip": "Card suspended link",
      "an.ex.link.summary": "This looks like a fake link made to steal your card details. The link doesn't go to your bank's real website. Don't tap it.",
      "an.ex.link.flag1": "A scary claim to make you act fast",
      "an.ex.link.flag2": "Asks you to tap a link and type your details",
      "an.ex.link.flag3": "Not your bank's real website",
      "an.ex.parcel.chip": "Parcel fee",
      "an.ex.parcel.summary": "This looks like a fake delivery message. Couriers don't ask for small fees through links like this. Check your parcel in the courier's own app instead.",
      "an.ex.parcel.flag1": "A small fee to get your card details",
      "an.ex.parcel.flag2": "Rushes you",
      "an.ex.parcel.flag3": "An unknown link",
      "an.ex.job.chip": "Easy part-time job",
      "an.ex.job.summary": "This looks like a job scam. Real jobs never ask you to pay to start, and nobody pays $300 a day for liking videos. Don't pay or share your bank details.",
      "an.ex.job.flag1": "Too good to be true",
      "an.ex.job.flag2": "Asks you to pay first",
      "an.ex.job.flag3": "Moves you to a private chat, fast",
      "an.ex.invest.chip": "Guaranteed returns",
      "an.ex.invest.summary": "This looks like an investment scam. No real investment can promise guaranteed profits every week. Don't transfer any money.",
      "an.ex.invest.flag1": "Promises profit that is too good to be true",
      "an.ex.invest.flag2": "Pressure to act fast",
      "an.ex.invest.flag3": "Asks for money",
      "an.ex.love.chip": "Online friend needs money",
      "an.ex.love.summary": "This looks like a love scam. Someone you have only met online is asking for money and asking you to keep it a secret. Talk to your family before you do anything.",
      "an.ex.love.flag1": "Asks for money",
      "an.ex.love.flag2": "Asks you to keep a secret",
      "an.ex.normal.chip": "Family dinner (normal)",
      "an.ex.normal.summary": "We found no warning signs in this message. It doesn't ask for money, codes or links. If anything still feels wrong, contact the person on a number you already know.",

      "an.phrase.safeAccount": "Asks you to move money to a \"safe account\"",
      "an.phrase.otp": "Asks for your OTP, PIN or a code",
      "an.phrase.rush": "Rushes you to act now",
      "an.phrase.link": "Has a link for you to tap",
      "an.phrase.authority": "Says it is from the police or government",
      "an.phrase.secret": "Tells you to keep it a secret",
      "an.phrase.account": "Says your account is in trouble",

      "an.scan.title.high": "This message is likely a scam",
      "an.scan.title.medium": "Please be careful with this message",
      "an.scan.title.low": "We did not find scam signs",
      "an.scan.noSigns.1": "No requests for codes, money or secrecy.",
      "an.scan.noSigns.2": "No links or rushing words.",
      "an.scan.high.1": "Don't reply, tap links or send money.",
      "an.scan.medium.1": "Don't reply, tap links or send money until you're sure.",
      "an.scan.risky.2": "Never share a one-time password (OTP) or PIN with anyone.",
      "an.scan.risky.3": "Call the bank on the number on the back of your card, or the Anti-Scam Helpline on 1799.",
      "an.scan.low.2": "If something still feels wrong, call OCBC yourself before you reply or pay.",

      "an.voiceSure.high": "High",
      "an.voiceSure.medium": "Medium",
      "an.voiceSure.low": "Low",
      "an.voice.clearEnough": "The clip was long and clear enough to check.",
      "an.voice.noWatermark": "No hidden AI watermark was found.",
      "an.voice.likely.title": "Likely an AI-made voice",
      "an.voice.likely.reason1": "The voice has patterns that are common in AI-made speech.",
      "an.voice.likely.reason2": "These patterns run through the whole clip, not just one part.",
      "an.voice.likely.extra": "Don't send money or share any codes. Hang up and call the bank yourself.",
      "an.voice.partial.title": "Part of this clip sounds AI-made",
      "an.voice.partial.reason1": "Seconds 10 to 20 sound different from the rest of the clip.",
      "an.voice.partial.reason2": "A real voice may have been mixed with an AI-made one.",
      "an.voice.partial.extra": "Treat this call as suspicious.",
      "an.voice.uncertain.title": "Some signs of an AI voice",
      "an.voice.uncertain.reason1": "Some parts of the voice sound smoother than a person normally does.",
      "an.voice.uncertain.reason2": "This sounds like phone-call audio, where our checks make more mistakes.",
      "an.voice.uncertain.extra": "Be careful. Check the caller another way before you do anything they ask.",
      "an.voice.unsure.title": "Not sure: not enough clear evidence",
      "an.voice.unsure.reason1": "Different parts of the clip gave very different results.",
      "an.voice.unsure.reason2": "There was no clear pattern either way.",
      "an.voice.unsure.extra": "Try a longer clip, or check the caller with questions instead.",
      "an.voice.real.title": "Probably a real human voice",
      "an.voice.real.reason1": "No hidden AI watermark was found. That alone doesn't prove the voice is real.",
      "an.voice.real.reason2": "The voice sounds natural all the way through.",
      "an.voice.real.extra": "A real voice can still belong to a scammer. If the caller asks for money, codes or secrecy, hang up."
    },
    zh: {
      "an.title": "检查任何你不确定的东西",
      "an.lead": "放进一条信息、电话录音、截图或信件。你不用选它是什么，我们会看出来。",
      "an.drop.title": "按这里加入文件",
      "an.drop.sub": "或者把文件拖进这个框",
      "an.or": "或者",
      "an.textLabel": "贴上或输入信息",
      "an.placeholder": "例如：你的户口被锁了。按这个链接……",
      "an.checkMessage": "检查这条信息",
      "an.privacy": "你的文件留在这部设备上。录音、图片和文件都不会被打开或上传。",
      "an.samplesTitle": "没有文件？试试示范",
      "an.moreExamples": "更多信息例子",
      "an.demoVoice": "只是示范：选下一次声音检查的结果",
      "an.demoVoiceLegend": "下一次声音检查的结果",
      "an.demoErrors": "只是示范：显示错误画面",
      "an.demo.fail": "检查失败",
      "an.demo.long": "信息太长",
      "an.sample.voice": "示范语音信息",
      "an.sample.sms": "示范短信",
      "an.found": "我们发现：{kind}",
      "an.done": "（完成）",
      "an.checking": "正在检查…",
      "an.fewSeconds": "需要几秒钟。",
      "an.report": "向 OCBC 举报",
      "an.sentMoney": "我已经转了钱或给了密码",
      "an.callerCheck": "打电话来的是真人吗？",
      "an.callMatch": "真的是银行打来的吗？",
      "an.again": "检查别的东西",
      "an.demoTag": "示范结果",
      "an.why": "为什么我们这样认为",
      "an.timeline.title": "哪些部分听起来像 AI 做的",
      "an.timeline.part": "第 {from} 到 {to} 秒：{what}",
      "an.timeline.ai": "听起来像 AI 做的",
      "an.timeline.natural": "听起来很自然",
      "an.timeline.key": "听起来像 AI 做的",
      "an.chanceNone": "这次没有数字：这段录音没有给出清楚的答案。",
      "an.chance": "的机会是 AI 做的声音",
      "an.voiceHonesty": "声音检查只是一个危险信号，不是证明。真人的声音也可能是骗子。",
      "an.evidenceHonesty": "这些只是危险信号，不是证明。如有疑问，请问银行。",
      "an.error.title": "我们没办法检查",
      "an.error.text": "我们这边出了问题。没有保存或发送任何东西。请等一下再试。",
      "an.error.help": "现在需要帮助？请打反诈骗热线 1799。",
      "an.retry": "再试一次",
      "an.err.read": "我们读不到这个文件。请直接贴上信息。",
      "an.err.empty": "这个文件是空的。请直接贴上信息。",
      "an.err.fileLong": "这个文件太长了。请最多贴上 {max} 个字。",
      "an.count": "{n} / {max} 个字",
      "an.err.tooLong": "多了 {over} 个字。请缩短到 {max} 个字或以下。",
      "an.err.nothing": "请贴上一条信息、加入文件，或者试试示范。",
      "an.label.pasted": "贴上的信息",
      "an.label.example": "例子：{chip}",
      "an.today": "今天 {time}",
      "an.status": "正在检查，请稍等。",

      "an.kind.message": "短信",
      "an.kind.message.step1": "正在读文字",
      "an.kind.message.step2": "正在找诈骗用语",
      "an.kind.message.step3": "正在检查链接和电话号码",
      "an.kind.voice": "录音",
      "an.kind.voice.step1": "正在找隐藏的 AI 水印",
      "an.kind.voice.step2": "正在听有没有 AI 声音的迹象",
      "an.kind.voice.step3": "正在算我们有多大把握",

      "an.risk.low": "低风险",
      "an.risk.medium": "中风险",
      "an.risk.high": "高风险",
      "an.looksLike": "这看起来像",
      "an.howSure": "我们的把握",
      "an.sure.low": "不太确定",
      "an.sure.medium": "比较确定",
      "an.sure.high": "非常确定",
      "an.flagsTitle": "信息中的危险信号",
      "an.noFlags": "这条信息没有发现危险信号。",
      "an.stepsTitle": "现在该怎么做",
      "an.honesty": "这些只是危险信号，不能证明一定是诈骗。如有疑问，请联系银行。",
      "an.type.impersonation": "冒充银行或政府的诈骗",
      "an.type.phishing": "偷你资料的假链接",
      "an.type.parcel": "假的送货信息",
      "an.type.job": "工作诈骗",
      "an.type.investment": "投资诈骗",
      "an.type.love": "爱情诈骗",
      "an.type.none": "普通信息",

      "an.next.impersonation.1": "不要回复，也绝对不要说出一次性密码（OTP）或 PIN。",
      "an.next.impersonation.2": "用你银行卡背面的号码，自己打电话给银行。",
      "an.next.impersonation.3": "绝对不要把钱转到“安全户口”。真正的银行从来不会这样要求。",
      "an.next.impersonation.4": "还是不确定？请打反诈骗热线 1799。",
      "an.next.phishing.1": "不要按链接。",
      "an.next.phishing.2": "如果你已经按了，什么都不要输入。请打开你银行自己的应用程序。",
      "an.next.phishing.3": "把这条信息举报给银行。",
      "an.next.phishing.4": "还是不确定？请打反诈骗热线 1799。",
      "an.next.parcel.1": "不要按链接，也不要付任何费用。",
      "an.next.parcel.2": "在快递公司自己的应用程序或网站查看你的包裹。",
      "an.next.parcel.3": "如果你输入了银行卡资料，请马上打电话给银行。",
      "an.next.job.1": "不要为了“开始”工作付任何钱。",
      "an.next.job.2": "不要说出你的银行资料或一次性密码（OTP）。",
      "an.next.job.3": "封锁发信人。还是不确定？请打反诈骗热线 1799。",
      "an.next.investment.1": "不要转任何钱。",
      "an.next.investment.2": "在 MAS 投资者警示名单上查一查这家公司。",
      "an.next.investment.3": "投资之前，先和家人或银行谈一谈。",
      "an.next.love.1": "绝对不要把钱转给只在网上认识的人。",
      "an.next.love.2": "把这件事告诉家人或朋友。",
      "an.next.love.3": "还是不确定？请打反诈骗热线 1799。",
      "an.next.none.1": "你不需要做什么。",
      "an.next.none.2": "如果还是觉得不对，请用你本来就知道的号码联系这个人。",

      "an.ex.bank.chip": "银行“保安团队”",
      "an.ex.bank.summary": "这看起来像是冒充你银行的诈骗。真正的银行绝对不会用信息问你的 OTP。不要回复，也不要给任何密码。",
      "an.ex.bank.flag1": "自称是你的银行",
      "an.ex.bank.flag2": "问你的一次性密码（OTP）",
      "an.ex.bank.flag3": "催你",
      "an.ex.bank.flag4": "威胁你",
      "an.ex.link.chip": "银行卡被停用的链接",
      "an.ex.link.summary": "这看起来是用来偷你银行卡资料的假链接。这个链接不是去你银行真正的网站。不要按它。",
      "an.ex.link.flag1": "用吓人的话让你赶快行动",
      "an.ex.link.flag2": "叫你按链接，输入你的资料",
      "an.ex.link.flag3": "不是你银行真正的网站",
      "an.ex.parcel.chip": "包裹费用",
      "an.ex.parcel.summary": "这看起来是假的送货信息。快递公司不会用这样的链接收小额费用。请在快递公司自己的应用程序查看你的包裹。",
      "an.ex.parcel.flag1": "用一点小钱骗你的银行卡资料",
      "an.ex.parcel.flag2": "催你",
      "an.ex.parcel.flag3": "不认识的链接",
      "an.ex.job.chip": "轻松的兼职工作",
      "an.ex.job.summary": "这看起来是工作诈骗。真正的工作绝对不会叫你先付钱，也没有人会因为你按赞视频，一天付你 $300。不要付钱，也不要说出你的银行资料。",
      "an.ex.job.flag1": "好得不像真的",
      "an.ex.job.flag2": "叫你先付钱",
      "an.ex.job.flag3": "很快叫你去私人聊天",
      "an.ex.invest.chip": "保证回酬",
      "an.ex.invest.summary": "这看起来是投资诈骗。真正的投资不能保证每个星期都赚钱。不要转任何钱。",
      "an.ex.invest.flag1": "答应的利润好得不像真的",
      "an.ex.invest.flag2": "逼你赶快行动",
      "an.ex.invest.flag3": "向你要钱",
      "an.ex.love.chip": "网友需要钱",
      "an.ex.love.summary": "这看起来是爱情诈骗。一个你只在网上认识的人向你要钱，还叫你保守秘密。做任何事之前，先和家人谈一谈。",
      "an.ex.love.flag1": "向你要钱",
      "an.ex.love.flag2": "叫你保守秘密",
      "an.ex.normal.chip": "家庭聚餐（普通信息）",
      "an.ex.normal.summary": "这条信息没有发现危险信号。它没有向你要钱、密码，也没有链接。如果还是觉得不对，请用你本来就知道的号码联系这个人。",

      "an.phrase.safeAccount": "叫你把钱转到“安全户口”",
      "an.phrase.otp": "问你的 OTP、PIN 或密码",
      "an.phrase.rush": "催你马上行动",
      "an.phrase.link": "有一个链接叫你按",
      "an.phrase.authority": "说自己是警察或政府",
      "an.phrase.secret": "叫你保守秘密",
      "an.phrase.account": "说你的户口出了问题",

      "an.scan.title.high": "这条信息很可能是诈骗",
      "an.scan.title.medium": "这条信息请小心",
      "an.scan.title.low": "我们没有发现诈骗迹象",
      "an.scan.noSigns.1": "没有要密码、要钱，或叫你保密。",
      "an.scan.noSigns.2": "没有链接，也没有催你的话。",
      "an.scan.high.1": "不要回复，不要按链接，也不要转钱。",
      "an.scan.medium.1": "在你确定之前，不要回复，不要按链接，也不要转钱。",
      "an.scan.risky.2": "绝对不要把一次性密码（OTP）或 PIN 告诉任何人。",
      "an.scan.risky.3": "用你银行卡背面的号码打电话给银行，或者打反诈骗热线 1799。",
      "an.scan.low.2": "如果还是觉得不对，回复或付钱之前，先自己打电话给 OCBC。",

      "an.voiceSure.high": "高",
      "an.voiceSure.medium": "中",
      "an.voiceSure.low": "低",
      "an.voice.clearEnough": "这段录音够长，也够清楚，可以检查。",
      "an.voice.noWatermark": "没有找到隐藏的 AI 水印。",
      "an.voice.likely.title": "很可能是 AI 做的声音",
      "an.voice.likely.reason1": "这个声音有 AI 声音常见的特点。",
      "an.voice.likely.reason2": "这些特点出现在整段录音里，不只是一部分。",
      "an.voice.likely.extra": "不要转钱，也不要给任何密码。请挂电话，然后自己打给银行。",
      "an.voice.partial.title": "这段录音有一部分像 AI 做的",
      "an.voice.partial.reason1": "第 10 到 20 秒听起来和其他部分不一样。",
      "an.voice.partial.reason2": "可能把真人的声音和 AI 的声音混在一起。",
      "an.voice.partial.extra": "请把这通电话当作可疑电话。",
      "an.voice.uncertain.title": "有一些 AI 声音的迹象",
      "an.voice.uncertain.reason1": "声音有些部分比一般人说话更顺。",
      "an.voice.uncertain.reason2": "这听起来像电话录音，我们的检查在这种情况下比较容易出错。",
      "an.voice.uncertain.extra": "要小心。照对方说的做任何事之前，先用别的方法确认他是谁。",
      "an.voice.unsure.title": "不确定：没有足够清楚的证据",
      "an.voice.unsure.reason1": "录音的不同部分给出很不一样的结果。",
      "an.voice.unsure.reason2": "看不出明显的特点。",
      "an.voice.unsure.extra": "试试更长的录音，或者问对方一些问题来确认。",
      "an.voice.real.title": "可能是真人的声音",
      "an.voice.real.reason1": "没有找到隐藏的 AI 水印。但只凭这点，不能证明声音是真的。",
      "an.voice.real.reason2": "整段声音听起来都很自然。",
      "an.voice.real.extra": "真人的声音也可能是骗子。如果对方要钱、要密码或叫你保密，请挂电话。"
    },
    ms: {
      "an.title": "Semak apa sahaja yang anda tidak pasti",
      "an.lead": "Masukkan mesej, rakaman panggilan, tangkapan skrin atau surat. Anda tidak perlu pilih jenisnya. Kami akan tahu sendiri.",
      "an.drop.title": "Tekan di sini untuk tambah fail",
      "an.drop.sub": "atau seret fail ke dalam kotak ini",
      "an.or": "atau",
      "an.textLabel": "Tampal atau taip mesej",
      "an.placeholder": "Contohnya: Akaun anda dikunci. Tekan pautan ini...",
      "an.checkMessage": "Semak mesej ini",
      "an.privacy": "Fail anda kekal pada peranti ini. Rakaman, gambar dan dokumen tidak akan dibuka atau dimuat naik.",
      "an.samplesTitle": "Tiada fail? Cuba contoh",
      "an.moreExamples": "Lebih banyak contoh mesej",
      "an.demoVoice": "Demo sahaja: pilih keputusan untuk semakan suara seterusnya",
      "an.demoVoiceLegend": "Keputusan untuk semakan suara seterusnya",
      "an.demoErrors": "Demo sahaja: tunjuk skrin ralat",
      "an.demo.fail": "Semakan gagal",
      "an.demo.long": "Mesej terlalu panjang",
      "an.sample.voice": "Contoh mesej suara",
      "an.sample.sms": "Contoh SMS",
      "an.found": "Kami jumpa: {kind}",
      "an.done": " (selesai)",
      "an.checking": "Sedang menyemak…",
      "an.fewSeconds": "Ini ambil masa beberapa saat.",
      "an.report": "Laporkan kepada OCBC",
      "an.sentMoney": "Saya sudah hantar wang atau kod",
      "an.callerCheck": "Adakah pemanggil orang sebenar?",
      "an.callMatch": "Betulkah bank yang telefon?",
      "an.again": "Semak benda lain",
      "an.demoTag": "Keputusan demo",
      "an.why": "Mengapa kami fikir begitu",
      "an.timeline.title": "Bahagian mana yang macam dibuat oleh AI",
      "an.timeline.part": "Saat {from} hingga {to}: {what}",
      "an.timeline.ai": "macam dibuat oleh AI",
      "an.timeline.natural": "kedengaran semula jadi",
      "an.timeline.key": "Macam dibuat oleh AI",
      "an.chanceNone": "Tiada nombor kali ini: rakaman tidak memberi jawapan yang jelas.",
      "an.chance": "peluang suara ini dibuat oleh AI",
      "an.voiceHonesty": "Semakan suara ialah satu tanda amaran, bukan bukti. Suara sebenar pun mungkin milik penipu.",
      "an.evidenceHonesty": "Ini hanya tanda amaran, bukan bukti. Jika ragu, tanya bank.",
      "an.error.title": "Kami tidak dapat menyemak ini",
      "an.error.text": "Ada masalah di pihak kami. Tiada apa yang disimpan atau dihantar. Sila cuba lagi sebentar lagi.",
      "an.error.help": "Perlu bantuan sekarang? Hubungi Talian Bantuan Anti-Penipuan di 1799.",
      "an.retry": "Cuba lagi",
      "an.err.read": "Kami tidak dapat baca fail itu. Sila tampal mesej sahaja.",
      "an.err.empty": "Fail itu kosong. Sila tampal mesej sahaja.",
      "an.err.fileLong": "Fail itu terlalu panjang. Sila tampal sehingga {max} aksara sahaja.",
      "an.count": "{n} / {max} aksara",
      "an.err.tooLong": "Ini terlebih {over} aksara. Sila pendekkan kepada {max} aksara atau kurang.",
      "an.err.nothing": "Sila tampal mesej, tambah fail, atau cuba contoh.",
      "an.label.pasted": "Mesej yang ditampal",
      "an.label.example": "Contoh: {chip}",
      "an.today": "Hari ini {time}",
      "an.status": "Sedang menyemak. Sila tunggu.",

      "an.kind.message": "Mesej teks",
      "an.kind.message.step1": "Membaca perkataan",
      "an.kind.message.step2": "Mencari ayat penipuan",
      "an.kind.message.step3": "Menyemak pautan dan nombor telefon",
      "an.kind.voice": "Rakaman suara",
      "an.kind.voice.step1": "Mencari tanda air AI yang tersembunyi",
      "an.kind.voice.step2": "Mendengar tanda-tanda suara AI",
      "an.kind.voice.step3": "Mengira sejauh mana kami pasti",

      "an.risk.low": "Risiko rendah",
      "an.risk.medium": "Risiko sederhana",
      "an.risk.high": "Risiko tinggi",
      "an.looksLike": "Ini kelihatan seperti",
      "an.howSure": "Sejauh mana kami pasti",
      "an.sure.low": "Kurang pasti",
      "an.sure.medium": "Agak pasti",
      "an.sure.high": "Sangat pasti",
      "an.flagsTitle": "Tanda amaran dalam mesej anda",
      "an.noFlags": "Kami tidak menemui tanda amaran dalam mesej ini.",
      "an.stepsTitle": "Apa yang perlu dilakukan sekarang",
      "an.honesty": "Ini hanya tanda amaran, bukan bukti penipuan. Jika ragu, tanya pihak bank.",
      "an.type.impersonation": "Penipuan yang menyamar sebagai bank atau kerajaan",
      "an.type.phishing": "Pautan palsu untuk mencuri butiran anda",
      "an.type.parcel": "Mesej penghantaran palsu",
      "an.type.job": "Penipuan kerja",
      "an.type.investment": "Penipuan pelaburan",
      "an.type.love": "Penipuan cinta",
      "an.type.none": "Mesej biasa",

      "an.next.impersonation.1": "Jangan balas, dan jangan sekali-kali kongsi kata laluan sekali guna (OTP) atau PIN.",
      "an.next.impersonation.2": "Telefon bank sendiri menggunakan nombor di belakang kad anda.",
      "an.next.impersonation.3": "Jangan sekali-kali pindahkan wang ke “akaun selamat”. Bank sebenar tidak pernah minta begini.",
      "an.next.impersonation.4": "Masih ragu? Hubungi Talian Bantuan Anti-Penipuan di 1799.",
      "an.next.phishing.1": "Jangan tekan pautan itu.",
      "an.next.phishing.2": "Jika anda sudah tekan, jangan taip apa-apa. Buka aplikasi bank anda sendiri.",
      "an.next.phishing.3": "Laporkan mesej ini kepada bank.",
      "an.next.phishing.4": "Masih ragu? Hubungi Talian Bantuan Anti-Penipuan di 1799.",
      "an.next.parcel.1": "Jangan tekan pautan atau bayar apa-apa yuran.",
      "an.next.parcel.2": "Semak penghantaran anda dalam aplikasi atau laman web syarikat kurier itu sendiri.",
      "an.next.parcel.3": "Jika anda sudah taip butiran kad, telefon bank dengan segera.",
      "an.next.job.1": "Jangan bayar apa-apa untuk “memulakan” kerja.",
      "an.next.job.2": "Jangan kongsi butiran bank atau kata laluan sekali guna (OTP).",
      "an.next.job.3": "Sekat pengirim. Masih ragu? Hubungi Talian Bantuan Anti-Penipuan di 1799.",
      "an.next.investment.1": "Jangan pindahkan apa-apa wang.",
      "an.next.investment.2": "Semak syarikat itu dalam Senarai Amaran Pelabur MAS.",
      "an.next.investment.3": "Bincang dengan keluarga atau bank sebelum anda melabur.",
      "an.next.love.1": "Jangan sekali-kali hantar wang kepada orang yang anda kenal dalam talian sahaja.",
      "an.next.love.2": "Beritahu ahli keluarga atau kawan tentang hal ini.",
      "an.next.love.3": "Masih ragu? Hubungi Talian Bantuan Anti-Penipuan di 1799.",
      "an.next.none.1": "Anda tidak perlu buat apa-apa.",
      "an.next.none.2": "Jika masih rasa tidak kena, hubungi orang itu melalui nombor yang anda sudah tahu.",

      "an.ex.bank.chip": "\"Pasukan keselamatan\" bank",
      "an.ex.bank.summary": "Ini kelihatan seperti penipuan yang menyamar sebagai bank anda. Bank sebenar tidak akan sekali-kali minta OTP anda melalui mesej. Jangan balas, dan jangan kongsi apa-apa kod.",
      "an.ex.bank.flag1": "Mengaku sebagai bank anda",
      "an.ex.bank.flag2": "Minta kata laluan sekali guna (OTP) anda",
      "an.ex.bank.flag3": "Mendesak anda",
      "an.ex.bank.flag4": "Mengugut anda",
      "an.ex.link.chip": "Pautan kad digantung",
      "an.ex.link.summary": "Ini kelihatan seperti pautan palsu untuk mencuri butiran kad anda. Pautan ini tidak pergi ke laman web bank anda yang sebenar. Jangan tekan.",
      "an.ex.link.flag1": "Ayat menakutkan supaya anda bertindak cepat",
      "an.ex.link.flag2": "Suruh anda tekan pautan dan taip butiran anda",
      "an.ex.link.flag3": "Bukan laman web bank anda yang sebenar",
      "an.ex.parcel.chip": "Yuran bungkusan",
      "an.ex.parcel.summary": "Ini kelihatan seperti mesej penghantaran palsu. Syarikat kurier tidak minta yuran kecil melalui pautan seperti ini. Semak bungkusan anda dalam aplikasi kurier itu sendiri.",
      "an.ex.parcel.flag1": "Yuran kecil untuk dapatkan butiran kad anda",
      "an.ex.parcel.flag2": "Mendesak anda",
      "an.ex.parcel.flag3": "Pautan yang tidak dikenali",
      "an.ex.job.chip": "Kerja sambilan mudah",
      "an.ex.job.summary": "Ini kelihatan seperti penipuan kerja. Kerja sebenar tidak akan suruh anda bayar untuk mula, dan tiada siapa bayar $300 sehari hanya untuk 'like' video. Jangan bayar atau kongsi butiran bank anda.",
      "an.ex.job.flag1": "Terlalu bagus untuk menjadi kenyataan",
      "an.ex.job.flag2": "Suruh anda bayar dahulu",
      "an.ex.job.flag3": "Cepat-cepat bawa anda ke sembang peribadi",
      "an.ex.invest.chip": "Pulangan dijamin",
      "an.ex.invest.summary": "Ini kelihatan seperti penipuan pelaburan. Tiada pelaburan sebenar yang boleh menjamin untung setiap minggu. Jangan pindahkan apa-apa wang.",
      "an.ex.invest.flag1": "Janji untung yang terlalu bagus untuk menjadi kenyataan",
      "an.ex.invest.flag2": "Desakan supaya bertindak cepat",
      "an.ex.invest.flag3": "Minta wang",
      "an.ex.love.chip": "Kawan dalam talian perlukan wang",
      "an.ex.love.summary": "Ini kelihatan seperti penipuan cinta. Orang yang anda kenal dalam talian sahaja minta wang dan suruh anda rahsiakannya. Bincang dengan keluarga anda sebelum buat apa-apa.",
      "an.ex.love.flag1": "Minta wang",
      "an.ex.love.flag2": "Suruh anda simpan rahsia",
      "an.ex.normal.chip": "Makan malam keluarga (biasa)",
      "an.ex.normal.summary": "Kami tidak menemui tanda amaran dalam mesej ini. Ia tidak minta wang, kod atau pautan. Jika masih rasa tidak kena, hubungi orang itu melalui nombor yang anda sudah tahu.",

      "an.phrase.safeAccount": "Suruh anda pindahkan wang ke \"akaun selamat\"",
      "an.phrase.otp": "Minta OTP, PIN atau kod anda",
      "an.phrase.rush": "Mendesak anda bertindak sekarang",
      "an.phrase.link": "Ada pautan untuk anda tekan",
      "an.phrase.authority": "Mengaku dari polis atau kerajaan",
      "an.phrase.secret": "Suruh anda rahsiakannya",
      "an.phrase.account": "Kata akaun anda ada masalah",

      "an.scan.title.high": "Mesej ini mungkin penipuan",
      "an.scan.title.medium": "Sila berhati-hati dengan mesej ini",
      "an.scan.title.low": "Kami tidak jumpa tanda penipuan",
      "an.scan.noSigns.1": "Tiada permintaan untuk kod, wang atau rahsia.",
      "an.scan.noSigns.2": "Tiada pautan atau perkataan yang mendesak.",
      "an.scan.high.1": "Jangan balas, tekan pautan atau hantar wang.",
      "an.scan.medium.1": "Jangan balas, tekan pautan atau hantar wang sehingga anda pasti.",
      "an.scan.risky.2": "Jangan sekali-kali kongsi kata laluan sekali guna (OTP) atau PIN dengan sesiapa.",
      "an.scan.risky.3": "Telefon bank menggunakan nombor di belakang kad anda, atau Talian Bantuan Anti-Penipuan di 1799.",
      "an.scan.low.2": "Jika masih rasa tidak kena, telefon OCBC sendiri sebelum anda balas atau bayar.",

      "an.voiceSure.high": "Tinggi",
      "an.voiceSure.medium": "Sederhana",
      "an.voiceSure.low": "Rendah",
      "an.voice.clearEnough": "Rakaman ini cukup panjang dan jelas untuk disemak.",
      "an.voice.noWatermark": "Tiada tanda air AI tersembunyi dijumpai.",
      "an.voice.likely.title": "Mungkin suara yang dibuat oleh AI",
      "an.voice.likely.reason1": "Suara ini ada corak yang biasa dalam pertuturan buatan AI.",
      "an.voice.likely.reason2": "Corak ini ada di sepanjang rakaman, bukan di satu bahagian sahaja.",
      "an.voice.likely.extra": "Jangan hantar wang atau kongsi apa-apa kod. Letak telefon dan telefon bank sendiri.",
      "an.voice.partial.title": "Sebahagian rakaman ini macam dibuat oleh AI",
      "an.voice.partial.reason1": "Saat 10 hingga 20 kedengaran berbeza daripada bahagian lain.",
      "an.voice.partial.reason2": "Suara sebenar mungkin telah dicampur dengan suara buatan AI.",
      "an.voice.partial.extra": "Anggap panggilan ini mencurigakan.",
      "an.voice.uncertain.title": "Ada beberapa tanda suara AI",
      "an.voice.uncertain.reason1": "Beberapa bahagian suara kedengaran lebih lancar daripada orang biasa bercakap.",
      "an.voice.uncertain.reason2": "Ini macam audio panggilan telefon, yang mana semakan kami lebih mudah tersilap.",
      "an.voice.uncertain.extra": "Berhati-hati. Semak pemanggil dengan cara lain sebelum buat apa-apa yang dia minta.",
      "an.voice.unsure.title": "Tidak pasti: bukti tidak cukup jelas",
      "an.voice.unsure.reason1": "Bahagian rakaman yang berbeza memberi keputusan yang sangat berbeza.",
      "an.voice.unsure.reason2": "Tiada corak yang jelas.",
      "an.voice.unsure.extra": "Cuba rakaman yang lebih panjang, atau semak pemanggil dengan bertanya soalan.",
      "an.voice.real.title": "Mungkin suara manusia sebenar",
      "an.voice.real.reason1": "Tiada tanda air AI tersembunyi dijumpai. Itu sahaja tidak membuktikan suara ini sebenar.",
      "an.voice.real.reason2": "Suara ini kedengaran semula jadi dari awal hingga akhir.",
      "an.voice.real.extra": "Suara sebenar pun mungkin milik penipu. Jika pemanggil minta wang, kod atau rahsia, letak telefon."
    }
  }
};
