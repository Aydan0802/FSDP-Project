"use strict";

// Data for: Check anything (the analyser): messages and voice recordings.
// Owner: Aydan
// Messages are checked by the real text detector ("text detector prototype/detector/"), so the
// examples below are only sample messages to try: their results come from the detector.
// Voice recordings go to the real voice detector on this computer (voice detector prototype/
// app/api.py). The hand-written voice results below give each result's title, meaning and advice,
// and are shown in full only as a demo when the voice checker isn't running.
// All messages are short, made up and clearly fake: fake names, ".example" links, no real people.
//
// Languages (see "How to translate your screen" in TEAM-FILES.md): the screen's words are
// translation keys ("an.title"), with the English, Chinese and Malay in text at the bottom.
// Results are shown in the language the customer picked, whatever language the message is in.
// The Chinese and Malay text is AI-drafted and still needs a native speaker to check it.

const ANALYSER_DATA = {
  maxLength: 2000,   // the longest message the box accepts (characters)

  // ---------- Next steps for each kind of message (translation keys) ----------
  nextSteps: {
    impersonation: [
      "an.next.impersonation.1",
      "an.next.impersonation.2",
      "an.next.impersonation.3",
      "an.next.impersonation.4"
    ],
    phishing: [
      "an.next.phishing.1",
      "an.next.phishing.2",
      "an.next.phishing.3",
      "an.next.phishing.4"
    ],
    parcel: [
      "an.next.parcel.1",
      "an.next.parcel.2",
      "an.next.parcel.3"
    ],
    job: [
      "an.next.job.1",
      "an.next.job.2",
      "an.next.job.3"
    ],
    investment: [
      "an.next.investment.1",
      "an.next.investment.2",
      "an.next.investment.3"
    ],
    love: [
      "an.next.love.1",
      "an.next.love.2",
      "an.next.love.3"
    ],
    none: [
      "an.next.none.1",
      "an.next.none.2"
    ]
  },

  // ---------- "More message examples": sample messages to try ----------
  // The text detector checks each one like any pasted message. English examples' chip is a
  // translation key; the Chinese and Malay ones are sample messages in that language, so their
  // chip stays in that language.
  examples: [
    {
      id: "bank", chip: "an.ex.bank.chip", lang: "en",
      text: "Bank Security Team: we detected an unusual login on your account. Reply with the 6-digit OTP we sent you within 10 minutes, or your account will be frozen."
    },
    {
      id: "link", chip: "an.ex.link.chip", lang: "en",
      text: "Your card has been suspended. Tap here to verify your details now: card-verify-secure.example/login"
    },
    {
      id: "parcel", chip: "an.ex.parcel.chip", lang: "en",
      text: "Your parcel could not be delivered. Pay a $1.99 redelivery fee within 24 hours: parcel-redeliver.example"
    },
    {
      id: "job", chip: "an.ex.job.chip", lang: "en",
      text: "Part-time job! Earn $300 a day just by liking videos. No experience needed. Pay a $50 registration fee to start. WhatsApp us now."
    },
    {
      id: "invest", chip: "an.ex.invest.chip", lang: "en",
      text: "Join our VIP crypto group. Guaranteed 30% returns every week! Limited slots, transfer today to secure your place."
    },
    {
      id: "love", chip: "an.ex.love.chip", lang: "en",
      text: "My dear, I miss you so much. I'm stuck at the airport and need $2,000 for customs. Please don't tell your family, I'll pay you back next week."
    },
    {
      id: "normal", chip: "an.ex.normal.chip", lang: "en",
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
    message: { label: "an.kind.message", icon: "chat", steps: ["an.kind.message.step1", "an.kind.message.step2", "an.kind.message.step3"] },
    voice: { label: "an.kind.voice", icon: "wave", steps: ["an.kind.voice.step1", "an.kind.voice.step2", "an.kind.voice.step3"] }
  },

  // The "Sample SMS" button checks this example
  sampleMessageId: "bank",

  // ---------- The voice checker ----------
  // voice detector prototype/app/api.py, running on the team laptop.
  // voiceApi: used when the website is opened on the laptop itself.
  // voiceApiPublic: the laptop's public link (the tunnel), used when the website is opened
  // anywhere else (visitors' phones, the Vercel site). "" = none yet, so the demo result shows.
  voiceApi: "http://127.0.0.1:7861/api/voice",
  voiceApiPublic: "https://stagnant-powdered-playing.ngrok-free.dev/api/voice",
  voiceTimeoutMs: 120000,   // give up after 2 minutes (a long recording on a slow computer)
  sampleClipName: "sample-voicemail.wav",

  // ---------- Voice clip results ----------
  // One for each of the five shared results (RESULTS in js/core/helpers.js). The voice detector
  // maps onto these: LOW band = real, MEDIUM = uncertain, HIGH or an AI watermark = likely,
  // "part of this clip" = partial, INCONCLUSIVE = unsure.
  // title: the big headline. meaning: one line explaining "fake voice", for older customers.
  // chance, sure and reasons are only used for the demo result (the real checker sends its own).
  // title, meaning, sure, reasons and extra are translation keys.
  voiceResults: {
    likely: {
      title: "an.voice.likely.title", meaning: "an.voice.meaning.fake",
      chance: 91, sure: "an.voiceSure.high",
      reasons: ["an.voice.likely.reason1", "an.voice.likely.reason2"],
      extra: "an.voice.likely.extra"
    },
    partial: {
      title: "an.voice.partial.title", meaning: "an.voice.meaning.partial",
      chance: 63, sure: "an.voiceSure.medium",
      reasons: ["an.voice.partial.reason1"],
      extra: "an.voice.partial.extra",
      timeline: [false, false, true, true, false, false]   // one entry per 5 seconds of the clip
    },
    uncertain: {
      title: "an.voice.uncertain.title", meaning: "an.voice.meaning.fake",
      chance: 48, sure: "an.voiceSure.medium",
      reasons: ["an.voice.uncertain.reason1", "an.voice.uncertain.reason2"],
      extra: "an.voice.uncertain.extra"
    },
    unsure: {
      title: "an.voice.unsure.title",
      chance: null, sure: "an.voiceSure.low",   // the detector gives no number when it can't tell
      reasons: ["an.voice.unsure.reason1"],
      extra: "an.voice.unsure.extra"
    },
    real: {
      title: "an.voice.real.title",
      chance: 6, sure: "an.voiceSure.high",
      reasons: ["an.voice.real.reason1"],
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

      "an.privacy": "Messages are checked on this device. Voice recordings are sent to our voice checker, checked and deleted straight away. Please only use the sample or a recording of your own voice. Pictures and documents are never opened.",

      "an.samplesTitle": "No file? Try a sample",

      "an.moreExamples": "More message examples",

      "an.demoVoice": "Demo only: the voice result to show if the voice checker isn't running",

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

      "an.timeline.title": "Which seconds sound fake",
      "an.timeline.part": "Seconds {from} to {to}: {what}",
      "an.timeline.ai": "sounds fake",
      "an.timeline.natural": "sounds real",
      "an.timeline.key": "Sounds fake (made by a computer)",

      "an.chanceNone": "No number this time: this recording didn't give us a clear answer.",

      "an.chance": "chance the voice is fake",

      "an.voiceHonesty": "This is a warning, not proof. A real voice can still belong to a scammer.",

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
      "an.kind.message.step3": "Checking any links",
      "an.kind.voice": "Voice recording",
      "an.kind.voice.step1": "Looking for a hidden AI watermark",
      "an.kind.voice.step2": "Listening for signs of an AI voice",
      "an.kind.voice.step3": "Working out how sure we are",

      "an.risk.low": "Low risk",
      "an.risk.medium": "Medium risk",
      "an.risk.high": "High risk",

      "an.looksLike": "It looks like: {type}",

      "an.howSure": "How sure we are",

      "an.sure.low": "Not very sure",
      "an.sure.medium": "Fairly sure",
      "an.sure.high": "Very sure",

      "an.noFlags": "We found no warning signs in this message.",

      "an.stepsTitle": "What to do now",

      "an.honesty": "This is a warning, not proof. If you're not sure, call the bank on the number on your card.",

      "an.type.impersonation": "someone pretending to be the bank or government",
      "an.type.phishing": "a fake link to steal your bank details",
      "an.type.parcel": "a fake delivery message",
      "an.type.job": "a fake job offer",
      "an.type.investment": "a fake investment offer",
      "an.type.love": "someone you met online asking for money",
      "an.type.none": "a normal message",

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
      "an.ex.link.chip": "Card suspended link",
      "an.ex.parcel.chip": "Parcel fee",
      "an.ex.job.chip": "Easy part-time job",
      "an.ex.invest.chip": "Guaranteed returns",
      "an.ex.love.chip": "Online friend needs money",
      "an.ex.normal.chip": "Family dinner (normal)",

      "an.voiceSure.high": "Very sure",
      "an.voiceSure.medium": "Fairly sure",
      "an.voiceSure.low": "Not very sure",

      "an.voice.likely.title": "This voice is likely fake",
      "an.voice.likely.reason1": "The voice sounds like it was made by a computer.",
      "an.voice.likely.reason2": "It sounds this way all the way through.",
      "an.voice.likely.extra": "Don't send money or share any codes. Hang up and call the bank yourself.",
      "an.voice.partial.title": "Part of this voice may be fake",
      "an.voice.partial.reason1": "Seconds 10 to 20 sound computer-made, but the rest sounds real.",
      "an.voice.partial.extra": "Treat this call as suspicious. Hang up and call the person back on a number you know.",
      "an.voice.uncertain.title": "This voice might be fake",
      "an.voice.uncertain.reason1": "Some parts sound a bit like a computer voice, but we're not sure.",
      "an.voice.uncertain.reason2": "It sounds like a phone recording, so this check is less sure.",
      "an.voice.uncertain.extra": "Be careful. Check the caller another way before you do anything they ask.",
      "an.voice.unsure.title": "We can't tell if this voice is real",
      "an.voice.unsure.reason1": "We couldn't get a clear answer from this recording.",
      "an.voice.unsure.extra": "Try a longer recording, or ask the caller a question only the real person would know.",
      "an.voice.real.title": "This voice sounds like a real person",
      "an.voice.real.reason1": "The voice sounds like a real person all the way through.",
      "an.voice.real.extra": "A real voice can still belong to a scammer. If the caller asks for money, codes or secrecy, hang up.",

      "an.headline.high": "This message is likely a scam",
      "an.headline.medium": "Be careful with this message",
      "an.headline.low": "We found no clear scam signs",

      "an.tapHint": "The worrying parts are marked in red. Tap a part to see why.",

      "an.chanceWatermark": "No number needed: this recording carries a hidden mark that computer voice tools add.",

      "an.voiceOffline": "The voice checker isn't running on this computer, so this is a made-up demo result.",

      "an.moreDetails": "More details",

      "an.err.voiceSlow": "The voice check took too long. Please try a shorter recording.",
      "an.err.voiceUnreadable": "We couldn't read this recording. Please try a different file (for example .wav, .mp3 or .m4a).",
      "an.err.voiceTooBig": "This recording is too big. Please use one under 25 MB.",
      "an.err.voiceNoSound": "This recording has no sound we can check.",

      "an.voice.meaning.fake": "A fake voice is made by a computer (AI) to sound like a real person.",
      "an.voice.meaning.partial": "Someone may have mixed a computer-made (AI) voice into a real recording.",

      "an.vr.likely": "The voice sounds like it was made by a computer.",
      "an.vr.partial": "Seconds {from} to {to} sound computer-made, but the rest sounds real.",
      "an.vr.partialSome": "Some parts sound computer-made, but the rest sounds real.",
      "an.vr.uncertain": "Some parts sound a bit like a computer voice, but we're not sure.",
      "an.vr.unsure": "We couldn't get a clear answer from this recording.",
      "an.vr.real": "The voice sounds like a real person.",
      "an.vr.watermark": "This recording carries a hidden mark that computer voice tools add, so it was made by a computer.",
      "an.vr.tooShort": "The recording is very short ({seconds} seconds). Please try a longer one.",
      "an.vr.short": "The recording is short ({seconds} seconds), so this check is less sure.",
      "an.vr.phone": "It sounds like a phone recording, so this check is less sure.",
      "an.vr.disagree": "Different parts of the recording gave different answers.",
      "an.vr.noWatermark": "No AI watermark was found. That alone doesn't prove the voice is real.",
      "an.vr.watermarkFound": "An AI watermark (AudioSeal) was found. It proves the audio was made by AI, not that the call is a scam.",
      "an.vr.audio": "Audio type: {type}, {seconds} seconds long.",
      "an.vr.audio.phone": "phone quality",
      "an.vr.audio.wideband": "clear (wideband)",
      "an.vr.windows": "{n} of {of} five-second windows sounded computer-made."
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

      "an.privacy": "信息在这部设备上检查。语音录音会发送到我们的语音检查程序，检查后马上删除。请只使用示例录音或您自己声音的录音。图片和文件不会被打开。",

      "an.samplesTitle": "没有文件？试试示范",

      "an.moreExamples": "更多信息例子",

      "an.demoVoice": "仅供演示：语音检查程序没有运行时显示的结果",

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

      "an.timeline.title": "哪几秒听起来是假的",
      "an.timeline.part": "第 {from} 到 {to} 秒：{what}",
      "an.timeline.ai": "听起来是假的",
      "an.timeline.natural": "听起来是真的",
      "an.timeline.key": "听起来是假的（电脑做的）",

      "an.chanceNone": "这次没有数字：这段录音没有给出明确的答案。",

      "an.chance": "可能是假声音",

      "an.voiceHonesty": "这只是提醒，不是证据。真的声音也可能是骗子的。",

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
      "an.kind.message.step3": "检查链接",
      "an.kind.voice": "录音",
      "an.kind.voice.step1": "正在找隐藏的 AI 水印",
      "an.kind.voice.step2": "正在听有没有 AI 声音的迹象",
      "an.kind.voice.step3": "正在算我们有多大把握",

      "an.risk.low": "低风险",
      "an.risk.medium": "中风险",
      "an.risk.high": "高风险",

      "an.looksLike": "这看起来像：{type}",

      "an.howSure": "我们的把握",

      "an.sure.low": "不太确定",
      "an.sure.medium": "比较确定",
      "an.sure.high": "非常确定",

      "an.noFlags": "这条信息没有发现危险信号。",

      "an.stepsTitle": "现在该怎么做",

      "an.honesty": "这只是提醒，不是证据。如果不确定，请拨打银行卡背面的电话联系银行。",

      "an.type.impersonation": "冒充银行或政府的人",
      "an.type.phishing": "骗取您银行资料的假链接",
      "an.type.parcel": "假冒的快递通知",
      "an.type.job": "假的工作机会",
      "an.type.investment": "假的投资机会",
      "an.type.love": "网上认识的人向您要钱",
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
      "an.ex.link.chip": "银行卡被停用的链接",
      "an.ex.parcel.chip": "包裹费用",
      "an.ex.job.chip": "轻松的兼职工作",
      "an.ex.invest.chip": "保证回酬",
      "an.ex.love.chip": "网友需要钱",
      "an.ex.normal.chip": "家庭聚餐（普通信息）",

      "an.voiceSure.high": "非常确定",
      "an.voiceSure.medium": "比较确定",
      "an.voiceSure.low": "不太确定",

      "an.voice.likely.title": "这个声音很可能是假的",
      "an.voice.likely.reason1": "这个声音听起来像是电脑做的。",
      "an.voice.likely.reason2": "整段录音都是这样。",
      "an.voice.likely.extra": "不要转钱，也不要给任何密码。请挂电话，然后自己打给银行。",
      "an.voice.partial.title": "这个声音有一部分可能是假的",
      "an.voice.partial.reason1": "第 10 到 20 秒听起来像电脑做的，其他部分听起来是真的。",
      "an.voice.partial.extra": "请把这通电话当作可疑电话。挂断后，用您知道的号码打回给对方。",
      "an.voice.uncertain.title": "这个声音也许是假的",
      "an.voice.uncertain.reason1": "有些部分听起来有点像电脑的声音，但我们不确定。",
      "an.voice.uncertain.reason2": "听起来像电话录音，所以这次检查没那么准。",
      "an.voice.uncertain.extra": "要小心。照对方说的做任何事之前，先用别的方法确认他是谁。",
      "an.voice.unsure.title": "我们无法判断这个声音是不是真的",
      "an.voice.unsure.reason1": "这段录音没有给我们明确的答案。",
      "an.voice.unsure.extra": "试试较长的录音，或者问对方一个只有真人才知道的问题。",
      "an.voice.real.title": "这个声音听起来像真人",
      "an.voice.real.reason1": "整段录音听起来都像真人。",
      "an.voice.real.extra": "真人的声音也可能是骗子。如果对方要钱、要密码或叫你保密，请挂电话。",

      "an.headline.high": "这条信息很可能是诈骗",
      "an.headline.medium": "请小心这条信息",
      "an.headline.low": "没有发现明显的诈骗迹象",

      "an.tapHint": "可疑的部分已用红色标出。点击可以看原因。",

      "an.chanceWatermark": "不需要数字：这段录音带有电脑语音工具加上的隐藏标记。",

      "an.voiceOffline": "这台电脑上的语音检查程序没有运行，所以这是虚构的演示结果。",

      "an.moreDetails": "更多详情",

      "an.err.voiceSlow": "语音检查花了太长时间。请换一段较短的录音。",
      "an.err.voiceUnreadable": "我们无法读取这段录音。请换一个文件（例如 .wav、.mp3 或 .m4a）。",
      "an.err.voiceTooBig": "这段录音太大了。请用小于 25 MB 的录音。",
      "an.err.voiceNoSound": "这段录音没有可以检查的声音。",

      "an.voice.meaning.fake": "假声音是电脑（AI）做出来的，听起来像真人。",
      "an.voice.meaning.partial": "有人可能把电脑（AI）做的声音混进了真的录音里。",

      "an.vr.likely": "这个声音听起来像是电脑做的。",
      "an.vr.partial": "第 {from} 到 {to} 秒听起来像电脑做的，其他部分听起来是真的。",
      "an.vr.partialSome": "有些部分听起来像电脑做的，其他部分听起来是真的。",
      "an.vr.uncertain": "有些部分听起来有点像电脑的声音，但我们不确定。",
      "an.vr.unsure": "这段录音没有给我们明确的答案。",
      "an.vr.real": "这个声音听起来像真人。",
      "an.vr.watermark": "这段录音带有电脑语音工具加上的隐藏标记，所以是电脑做的。",
      "an.vr.tooShort": "这段录音很短（{seconds} 秒）。请试试较长的录音。",
      "an.vr.short": "这段录音比较短（{seconds} 秒），所以这次检查没那么准。",
      "an.vr.phone": "听起来像电话录音，所以这次检查没那么准。",
      "an.vr.disagree": "录音的不同部分给出了不同的答案。",
      "an.vr.noWatermark": "没有发现 AI 水印。但这不能证明声音是真的。",
      "an.vr.watermarkFound": "发现了 AI 水印（AudioSeal）。这证明录音是 AI 做的，但不能证明这通电话是诈骗。",
      "an.vr.audio": "录音类型：{type}，长 {seconds} 秒。",
      "an.vr.audio.phone": "电话音质",
      "an.vr.audio.wideband": "清晰（宽带）",
      "an.vr.windows": "{of} 个五秒片段中有 {n} 个听起来像电脑做的。"
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

      "an.privacy": "Mesej disemak pada peranti ini. Rakaman suara dihantar ke penyemak suara kami, disemak dan terus dipadam. Sila guna sampel atau rakaman suara anda sendiri sahaja. Gambar dan dokumen tidak dibuka.",

      "an.samplesTitle": "Tiada fail? Cuba contoh",

      "an.moreExamples": "Lebih banyak contoh mesej",

      "an.demoVoice": "Demo sahaja: keputusan suara yang dipaparkan jika penyemak suara tidak berjalan",

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

      "an.timeline.title": "Saat mana yang kedengaran palsu",
      "an.timeline.part": "Saat {from} hingga {to}: {what}",
      "an.timeline.ai": "kedengaran palsu",
      "an.timeline.natural": "kedengaran sebenar",
      "an.timeline.key": "Kedengaran palsu (dibuat oleh komputer)",

      "an.chanceNone": "Tiada nombor kali ini: rakaman ini tidak memberi jawapan yang jelas.",

      "an.chance": "kemungkinan suara ini palsu",

      "an.voiceHonesty": "Ini amaran, bukan bukti. Suara sebenar masih boleh milik penipu.",

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
      "an.kind.message.step3": "Menyemak pautan",
      "an.kind.voice": "Rakaman suara",
      "an.kind.voice.step1": "Mencari tanda air AI yang tersembunyi",
      "an.kind.voice.step2": "Mendengar tanda-tanda suara AI",
      "an.kind.voice.step3": "Mengira sejauh mana kami pasti",

      "an.risk.low": "Risiko rendah",
      "an.risk.medium": "Risiko sederhana",
      "an.risk.high": "Risiko tinggi",

      "an.looksLike": "Ini kelihatan seperti: {type}",

      "an.howSure": "Sejauh mana kami pasti",

      "an.sure.low": "Kurang pasti",
      "an.sure.medium": "Agak pasti",
      "an.sure.high": "Sangat pasti",

      "an.noFlags": "Kami tidak menemui tanda amaran dalam mesej ini.",

      "an.stepsTitle": "Apa yang perlu dilakukan sekarang",

      "an.honesty": "Ini amaran, bukan bukti. Jika tidak pasti, hubungi bank melalui nombor pada kad anda.",

      "an.type.impersonation": "orang yang menyamar sebagai bank atau kerajaan",
      "an.type.phishing": "pautan palsu untuk mencuri butiran bank anda",
      "an.type.parcel": "mesej penghantaran palsu",
      "an.type.job": "tawaran kerja palsu",
      "an.type.investment": "tawaran pelaburan palsu",
      "an.type.love": "orang yang dikenali dalam talian meminta wang",
      "an.type.none": "mesej biasa",

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
      "an.ex.link.chip": "Pautan kad digantung",
      "an.ex.parcel.chip": "Yuran bungkusan",
      "an.ex.job.chip": "Kerja sambilan mudah",
      "an.ex.invest.chip": "Pulangan dijamin",
      "an.ex.love.chip": "Kawan dalam talian perlukan wang",
      "an.ex.normal.chip": "Makan malam keluarga (biasa)",

      "an.voiceSure.high": "Sangat pasti",
      "an.voiceSure.medium": "Agak pasti",
      "an.voiceSure.low": "Kurang pasti",

      "an.voice.likely.title": "Suara ini besar kemungkinan palsu",
      "an.voice.likely.reason1": "Suara ini kedengaran seperti dibuat oleh komputer.",
      "an.voice.likely.reason2": "Ia kedengaran begini dari awal hingga akhir.",
      "an.voice.likely.extra": "Jangan hantar wang atau kongsi apa-apa kod. Letak telefon dan telefon bank sendiri.",
      "an.voice.partial.title": "Sebahagian suara ini mungkin palsu",
      "an.voice.partial.reason1": "Saat 10 hingga 20 kedengaran seperti buatan komputer, tetapi selebihnya kedengaran sebenar.",
      "an.voice.partial.extra": "Anggap panggilan ini mencurigakan. Letak telefon dan hubungi orang itu semula melalui nombor yang anda tahu.",
      "an.voice.uncertain.title": "Suara ini mungkin palsu",
      "an.voice.uncertain.reason1": "Sesetengah bahagian kedengaran sedikit seperti suara komputer, tetapi kami tidak pasti.",
      "an.voice.uncertain.reason2": "Ia kedengaran seperti rakaman telefon, jadi semakan ini kurang pasti.",
      "an.voice.uncertain.extra": "Berhati-hati. Semak pemanggil dengan cara lain sebelum buat apa-apa yang dia minta.",
      "an.voice.unsure.title": "Kami tidak pasti sama ada suara ini sebenar",
      "an.voice.unsure.reason1": "Kami tidak mendapat jawapan yang jelas daripada rakaman ini.",
      "an.voice.unsure.extra": "Cuba rakaman yang lebih panjang, atau tanya pemanggil soalan yang hanya orang sebenar tahu.",
      "an.voice.real.title": "Suara ini kedengaran seperti orang sebenar",
      "an.voice.real.reason1": "Suara ini kedengaran seperti orang sebenar dari awal hingga akhir.",
      "an.voice.real.extra": "Suara sebenar pun mungkin milik penipu. Jika pemanggil minta wang, kod atau rahsia, letak telefon.",

      "an.headline.high": "Mesej ini mungkin penipuan",
      "an.headline.medium": "Berhati-hati dengan mesej ini",
      "an.headline.low": "Kami tidak menemui tanda penipuan yang jelas",

      "an.tapHint": "Bahagian yang membimbangkan ditanda merah. Tekan untuk lihat sebabnya.",

      "an.chanceWatermark": "Tiada nombor diperlukan: rakaman ini ada tanda tersembunyi yang ditambah oleh alat suara komputer.",

      "an.voiceOffline": "Penyemak suara tidak berjalan pada komputer ini, jadi ini keputusan demo rekaan.",

      "an.moreDetails": "Butiran lanjut",

      "an.err.voiceSlow": "Semakan suara mengambil masa terlalu lama. Sila cuba rakaman yang lebih pendek.",
      "an.err.voiceUnreadable": "Kami tidak dapat membaca rakaman ini. Sila cuba fail lain (contohnya .wav, .mp3 atau .m4a).",
      "an.err.voiceTooBig": "Rakaman ini terlalu besar. Sila guna rakaman di bawah 25 MB.",
      "an.err.voiceNoSound": "Rakaman ini tiada bunyi yang boleh disemak.",

      "an.voice.meaning.fake": "Suara palsu dibuat oleh komputer (AI) supaya kedengaran seperti orang sebenar.",
      "an.voice.meaning.partial": "Seseorang mungkin telah mencampurkan suara buatan komputer (AI) ke dalam rakaman sebenar.",

      "an.vr.likely": "Suara ini kedengaran seperti dibuat oleh komputer.",
      "an.vr.partial": "Saat {from} hingga {to} kedengaran seperti buatan komputer, tetapi selebihnya kedengaran sebenar.",
      "an.vr.partialSome": "Sesetengah bahagian kedengaran seperti buatan komputer, tetapi selebihnya kedengaran sebenar.",
      "an.vr.uncertain": "Sesetengah bahagian kedengaran sedikit seperti suara komputer, tetapi kami tidak pasti.",
      "an.vr.unsure": "Kami tidak mendapat jawapan yang jelas daripada rakaman ini.",
      "an.vr.real": "Suara ini kedengaran seperti orang sebenar.",
      "an.vr.watermark": "Rakaman ini ada tanda tersembunyi yang ditambah oleh alat suara komputer, jadi ia dibuat oleh komputer.",
      "an.vr.tooShort": "Rakaman ini sangat pendek ({seconds} saat). Sila cuba rakaman yang lebih panjang.",
      "an.vr.short": "Rakaman ini pendek ({seconds} saat), jadi semakan ini kurang pasti.",
      "an.vr.phone": "Ia kedengaran seperti rakaman telefon, jadi semakan ini kurang pasti.",
      "an.vr.disagree": "Bahagian rakaman yang berbeza memberi jawapan yang berbeza.",
      "an.vr.noWatermark": "Tiada tanda air AI ditemui. Itu sahaja tidak membuktikan suara itu sebenar.",
      "an.vr.watermarkFound": "Tanda air AI (AudioSeal) ditemui. Ia membuktikan audio itu dibuat oleh AI, bukan bahawa panggilan itu penipuan.",
      "an.vr.audio": "Jenis audio: {type}, {seconds} saat panjang.",
      "an.vr.audio.phone": "kualiti telefon",
      "an.vr.audio.wideband": "jelas (jalur lebar)",
      "an.vr.windows": "{n} daripada {of} tetingkap lima saat kedengaran seperti buatan komputer."
    }
  }
};
