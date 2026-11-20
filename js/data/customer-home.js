"use strict";

// Made-up data for: Customer home.
// Owner: Yan Lin
// The words are translation keys; the English, Chinese, Malay and Tamil for each are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.
// The home screen is also the landing page for guests (not signed in).
// locked: true marks a tool that needs signing in (guests see "Sign in needed" on it).

const CUSTOMER_HOME_DATA = {
  customerName: "home.customerName",

  // The home screen keeps few choices so a senior is not overwhelmed:
  //   1. the two urgent buttons (in the red card)
  //   2. the other tools in three small groups, the most used first. The first group has ONE big
  //      "Check" tile (main), the check most people need. Every other tool is a plain one-line
  //      row, no extra words. "Learn the signs" is last: useful, but never urgent.
  groups: [
    { id: "check", title: "home.checkTitle",
      main: { icon: "upload", title: "home.tool.analyser.title", route: "analyser" },
      tools: [
        { icon: "transfer", title: "home.tool.riskScorer.title", route: "risk-scorer", locked: true }
      ] },
    { id: "call", title: "home.callTitle", tools: [
      { icon: "shield", title: "home.tool.callMatch.title", route: "call-match" },
      { icon: "user", title: "home.tool.callerCheck.title", route: "caller-check" }
    ] },
    { id: "more", title: "home.moreTitle", tools: [
      { icon: "key", title: "home.tool.passphrase.title", route: "passphrase", locked: true },
      { icon: "flag", title: "home.tool.report.title", route: "report", locked: true },
      { icon: "book", title: "home.tool.learnSigns.title", route: "learn-signs" }
    ] }
  ],

  // Checks the customer did before this visit. result is one of the five RESULTS keys (helpers.js).
  // Checks made during this visit come from the analyser (appState.analyser.history) and are shown first.
  recent: [
    { result: "likely", what: "home.recent.nephew.what", when: "home.recent.nephew.when" },
    { result: "unsure", what: "home.recent.parcel.what", when: "home.recent.parcel.when" }
  ],

  text: {
    en: {
      "home.customerName": "Mdm Lim",
      "home.morning": "Good morning",
      "home.afternoon": "Good afternoon",
      "home.evening": "Good evening",
      "home.hello": "Hello, {name}",
      "home.helloNoName": "Welcome back",
      "home.welcomeNew": "Welcome",   // just made an account, so not "back"
      "home.guest.title": "Not sure? Pause and check.",
      "home.urgent": "Need help right now?",
      "home.callingNow": "Someone is calling me now",
      "home.sentMoney": "I sent money or gave a code",
      "home.sentMoneySub": "Freeze your accounts",
      "home.callYourself": "Or call OCBC:",
      "home.checkTitle": "Check first",
      "home.callTitle": "Got a call?",
      "home.moreTitle": "More help",
      "home.lockNote": "{lock} means you sign in first",
      "home.recentTitle": "My recent checks ({count})",
      "home.risk.high": "High risk",
      "home.risk.medium": "Medium risk",
      "home.risk.low": "Low risk",
      "home.tool.analyser.title": "Check a message, call or picture",
      "home.tool.callMatch.title": "Is the bank really calling?",
      "home.tool.callerCheck.title": "Is the caller a real person?",
      "home.tool.riskScorer.title": "Check a transfer first",
      "home.tool.passphrase.title": "Family passphrase",
      "home.tool.learnSigns.title": "Learn the signs",
      "home.tool.report.title": "Report a scam",
      "home.recent.nephew.what": "Voice message that sounded like my nephew",
      "home.recent.nephew.when": "Checked 2 Nov",
      "home.recent.parcel.what": "Short voicemail about a parcel",
      "home.recent.parcel.when": "Checked 30 Oct"
    },
    zh: {
      "home.customerName": "林女士",
      "home.morning": "早上好",
      "home.afternoon": "下午好",
      "home.evening": "晚上好",
      "home.hello": "{name}，您好",
      "home.helloNoName": "欢迎回来",
      "home.welcomeNew": "欢迎",
      "home.guest.title": "不确定？先停一停，查一查。",
      "home.urgent": "现在需要帮忙吗？",
      "home.callingNow": "现在有人打电话给我",
      "home.sentMoney": "我转了钱或给了密码",
      "home.sentMoneySub": "冻结您的户口",
      "home.callYourself": "或打电话给 OCBC：",
      "home.checkTitle": "先检查",
      "home.callTitle": "接到电话？",
      "home.moreTitle": "更多帮助",
      "home.lockNote": "有 {lock} 的需要先登录",
      "home.recentTitle": "我最近的检查（{count}）",
      "home.risk.high": "高风险",
      "home.risk.medium": "中风险",
      "home.risk.low": "低风险",
      "home.tool.analyser.title": "检查信息、电话或图片",
      "home.tool.callMatch.title": "真的是银行打来的吗？",
      "home.tool.callerCheck.title": "打电话来的是真人吗？",
      "home.tool.riskScorer.title": "转账前先检查",
      "home.tool.passphrase.title": "家人暗号",
      "home.tool.learnSigns.title": "认识诈骗迹象",
      "home.tool.report.title": "举报诈骗",
      "home.recent.nephew.what": "听起来像我侄子的语音信息",
      "home.recent.nephew.when": "11月2日检查",
      "home.recent.parcel.what": "关于包裹的简短语音留言",
      "home.recent.parcel.when": "10月30日检查"
    },
    ms: {
      "home.customerName": "Puan Lim",
      "home.morning": "Selamat pagi",
      "home.afternoon": "Selamat petang",
      "home.evening": "Selamat malam",
      "home.hello": "Helo, {name}",
      "home.helloNoName": "Selamat kembali",
      "home.welcomeNew": "Selamat datang",
      "home.guest.title": "Tidak pasti? Berhenti dan semak.",
      "home.urgent": "Perlu bantuan sekarang?",
      "home.callingNow": "Ada orang sedang telefon saya",
      "home.sentMoney": "Saya sudah hantar wang atau beri kod",
      "home.sentMoneySub": "Bekukan akaun anda",
      "home.callYourself": "Atau telefon OCBC:",
      "home.checkTitle": "Semak dahulu",
      "home.callTitle": "Dapat panggilan?",
      "home.moreTitle": "Bantuan lain",
      "home.lockNote": "{lock} bermaksud anda perlu log masuk dahulu",
      "home.recentTitle": "Semakan terbaru saya ({count})",
      "home.risk.high": "Risiko tinggi",
      "home.risk.medium": "Risiko sederhana",
      "home.risk.low": "Risiko rendah",
      "home.tool.analyser.title": "Semak mesej, panggilan atau gambar",
      "home.tool.callMatch.title": "Betulkah bank yang telefon?",
      "home.tool.callerCheck.title": "Adakah pemanggil orang sebenar?",
      "home.tool.riskScorer.title": "Semak pindahan dahulu",
      "home.tool.passphrase.title": "Kata laluan keluarga",
      "home.tool.learnSigns.title": "Kenali tanda-tanda",
      "home.tool.report.title": "Laporkan penipuan",
      "home.recent.nephew.what": "Mesej suara yang macam suara anak saudara saya",
      "home.recent.nephew.when": "Disemak 2 Nov",
      "home.recent.parcel.what": "Mesej suara pendek tentang bungkusan",
      "home.recent.parcel.when": "Disemak 30 Okt"
    },
    ta: {
      "home.customerName": "திருமதி லிம்",
      "home.morning": "காலை வணக்கம்",
      "home.afternoon": "மதிய வணக்கம்",
      "home.evening": "மாலை வணக்கம்",
      "home.hello": "வணக்கம், {name}",
      "home.helloNoName": "மீண்டும் வருக",
      "home.welcomeNew": "வருக",
      "home.guest.title": "உறுதியில்லையா? நிறுத்தி, சரிபாருங்கள்.",
      "home.urgent": "இப்போதே உதவி வேண்டுமா?",
      "home.callingNow": "இப்போது ஒருவர் என்னை அழைக்கிறார்",
      "home.sentMoney": "பணம் அல்லது குறியீட்டைக் கொடுத்துவிட்டேன்",
      "home.sentMoneySub": "உங்கள் கணக்குகளை முடக்குங்கள்",
      "home.callYourself": "அல்லது OCBC-ஐ அழையுங்கள்:",
      "home.checkTitle": "முதலில் சரிபாருங்கள்",
      "home.callTitle": "அழைப்பு வந்ததா?",
      "home.moreTitle": "மேலும் உதவி",
      "home.lockNote": "{lock} இருந்தால் முதலில் உள்நுழைய வேண்டும்",
      "home.recentTitle": "என் சமீபத்திய சரிபார்ப்புகள் ({count})",
      "home.risk.high": "அதிக ஆபத்து",
      "home.risk.medium": "நடுத்தர ஆபத்து",
      "home.risk.low": "குறைந்த ஆபத்து",
      "home.tool.analyser.title": "செய்தி, அழைப்பு அல்லது படத்தைச் சரிபார்",
      "home.tool.callMatch.title": "உண்மையில் வங்கிதான் அழைக்கிறதா?",
      "home.tool.callerCheck.title": "அழைப்பவர் உண்மையான நபரா?",
      "home.tool.riskScorer.title": "முதலில் பணப் பரிமாற்றத்தைச் சரிபார்",
      "home.tool.passphrase.title": "குடும்ப ரகசியச் சொல்",
      "home.tool.learnSigns.title": "அறிகுறிகளை அறிக",
      "home.tool.report.title": "மோசடியைப் புகாரளி",
      "home.recent.nephew.what": "என் மருமகன் போலக் கேட்ட குரல் செய்தி",
      "home.recent.nephew.when": "2 நவ. அன்று சரிபார்க்கப்பட்டது",
      "home.recent.parcel.what": "பார்சல் பற்றிய சிறிய குரலஞ்சல்",
      "home.recent.parcel.when": "30 அக். அன்று சரிபார்க்கப்பட்டது"
    }
  }
};