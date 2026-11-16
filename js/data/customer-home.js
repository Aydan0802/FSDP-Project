"use strict";

// Made-up data for: Customer home.
// Owner: Yan Lin
// The words are translation keys; the English, Chinese and Malay for each are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.

const CUSTOMER_HOME_DATA = {
  customerName: "home.customerName",

  // "Not sure? Check it first": tools for checking something before replying or paying.
  // wide: true makes the tile span the whole row.
  checkTools: [
    { icon: "upload", title: "home.tool.analyser.title", text: "home.tool.analyser.text", route: "analyser", wide: true },
    { icon: "shield", title: "home.tool.callMatch.title", text: "home.tool.callMatch.text", route: "call-match" },
    { icon: "user", title: "home.tool.callerCheck.title", text: "home.tool.callerCheck.text", route: "caller-check" },
    { icon: "transfer", title: "home.tool.riskScorer.title", text: "home.tool.riskScorer.text", route: "risk-scorer" }
  ],

  // "Be ready next time": things to set up or learn before a scam happens
  readyTools: [
    { icon: "key", title: "home.tool.passphrase.title", text: "home.tool.passphrase.text", route: "passphrase" },
    { icon: "book", title: "home.tool.learnSigns.title", text: "home.tool.learnSigns.text", route: "learn-signs" },
    { icon: "flag", title: "home.tool.report.title", text: "home.tool.report.text", route: "report" }
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
      "home.sub": "What would you like to do today?",
      "home.urgent": "Need help right now?",
      "home.callingNow": "Someone is calling me now",
      "home.callingNowSub": "We will help you, one step at a time",
      "home.sentMoney": "I already sent money or gave a code",
      "home.sentMoneySub": "Stop more money from leaving",
      "home.callYourself": "Or call OCBC yourself:",
      "home.checkTitle": "Not sure? Check it first",
      "home.checkSub": "Check something before you reply or pay.",
      "home.readyTitle": "Be ready next time",
      "home.recentTitle": "My recent checks ({count})",
      "home.risk.high": "High risk",
      "home.risk.medium": "Medium risk",
      "home.risk.low": "Low risk",
      "home.tool.analyser.title": "Check a message, call or picture",
      "home.tool.analyser.text": "Add anything: an SMS, a call recording, a screenshot or a letter. We work out what it is.",
      "home.tool.callMatch.title": "Is the bank really calling?",
      "home.tool.callMatch.text": "Match the caller to real OCBC calls",
      "home.tool.callerCheck.title": "Is the caller a real person?",
      "home.tool.callerCheck.text": "A quick code check that AI voices fail",
      "home.tool.riskScorer.title": "Check a transfer first",
      "home.tool.riskScorer.text": "See how risky it looks before you send",
      "home.tool.passphrase.title": "Family passphrase",
      "home.tool.passphrase.text": "A secret word to test callers",
      "home.tool.learnSigns.title": "Learn the signs",
      "home.tool.learnSigns.text": "Real banks never ask for your OTP",
      "home.tool.report.title": "Report a scam",
      "home.tool.report.text": "Tell the bank what happened",
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
      "home.hello": "{name}，你好",
      "home.sub": "今天想做什么？",
      "home.urgent": "现在需要帮忙吗？",
      "home.callingNow": "现在有人打电话给我",
      "home.callingNowSub": "我们一步一步帮你",
      "home.sentMoney": "我已经转了钱或给了密码",
      "home.sentMoneySub": "阻止更多钱被转走",
      "home.callYourself": "或者你自己打电话给 OCBC：",
      "home.checkTitle": "不确定？先检查一下",
      "home.checkSub": "回复或付钱之前，先检查一下。",
      "home.readyTitle": "为下一次做好准备",
      "home.recentTitle": "我最近的检查（{count}）",
      "home.risk.high": "高风险",
      "home.risk.medium": "中风险",
      "home.risk.low": "低风险",
      "home.tool.analyser.title": "检查信息、电话或图片",
      "home.tool.analyser.text": "什么都可以放进来：短信、电话录音、截图或信件。我们会看出它是什么。",
      "home.tool.callMatch.title": "真的是银行打来的吗？",
      "home.tool.callMatch.text": "和 OCBC 真正打出的电话对比",
      "home.tool.callerCheck.title": "打电话来的是真人吗？",
      "home.tool.callerCheck.text": "一个简单的密码测试，AI 声音过不了",
      "home.tool.riskScorer.title": "转账前先检查",
      "home.tool.riskScorer.text": "转账之前，看看风险有多大",
      "home.tool.passphrase.title": "家人暗号",
      "home.tool.passphrase.text": "一个用来考打电话的人的秘密词",
      "home.tool.learnSigns.title": "认识诈骗迹象",
      "home.tool.learnSigns.text": "真正的银行绝对不会问你的 OTP",
      "home.tool.report.title": "举报诈骗",
      "home.tool.report.text": "告诉银行发生了什么事",
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
      "home.sub": "Apa yang anda mahu buat hari ini?",
      "home.urgent": "Perlu bantuan sekarang?",
      "home.callingNow": "Ada orang sedang telefon saya",
      "home.callingNowSub": "Kami akan bantu anda, satu langkah demi satu langkah",
      "home.sentMoney": "Saya sudah hantar wang atau beri kod",
      "home.sentMoneySub": "Hentikan lebih banyak wang daripada keluar",
      "home.callYourself": "Atau telefon OCBC sendiri:",
      "home.checkTitle": "Tidak pasti? Semak dahulu",
      "home.checkSub": "Semak dahulu sebelum anda balas atau bayar.",
      "home.readyTitle": "Bersedia untuk lain kali",
      "home.recentTitle": "Semakan terbaru saya ({count})",
      "home.risk.high": "Risiko tinggi",
      "home.risk.medium": "Risiko sederhana",
      "home.risk.low": "Risiko rendah",
      "home.tool.analyser.title": "Semak mesej, panggilan atau gambar",
      "home.tool.analyser.text": "Masukkan apa sahaja: SMS, rakaman panggilan, tangkapan skrin atau surat. Kami akan tahu apa itu.",
      "home.tool.callMatch.title": "Betulkah bank yang telefon?",
      "home.tool.callMatch.text": "Padankan pemanggil dengan panggilan OCBC yang sebenar",
      "home.tool.callerCheck.title": "Adakah pemanggil orang sebenar?",
      "home.tool.callerCheck.text": "Ujian kod yang cepat, suara AI akan gagal",
      "home.tool.riskScorer.title": "Semak pindahan dahulu",
      "home.tool.riskScorer.text": "Lihat betapa berisikonya sebelum anda hantar",
      "home.tool.passphrase.title": "Kata laluan keluarga",
      "home.tool.passphrase.text": "Satu perkataan rahsia untuk menguji pemanggil",
      "home.tool.learnSigns.title": "Kenali tanda-tanda",
      "home.tool.learnSigns.text": "Bank sebenar tidak akan minta OTP anda",
      "home.tool.report.title": "Laporkan penipuan",
      "home.tool.report.text": "Beritahu bank apa yang berlaku",
      "home.recent.nephew.what": "Mesej suara yang macam suara anak saudara saya",
      "home.recent.nephew.when": "Disemak 2 Nov",
      "home.recent.parcel.what": "Mesej suara pendek tentang bungkusan",
      "home.recent.parcel.when": "Disemak 30 Okt"
    }
  }
};
