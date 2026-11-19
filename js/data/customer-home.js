"use strict";

// Made-up data for: Customer home.
// Owner: Yan Lin
// The words are translation keys; the English, Chinese and Malay for each are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.
// The home screen is also the landing page for guests (not signed in).
// locked: true marks a tool that needs signing in (guests see "Sign in needed" on it).

const CUSTOMER_HOME_DATA = {
  customerName: "home.customerName",

  // "Not sure? Check it first": tools for checking something before replying or paying.
  // wide: true makes the tile span the whole row.
  checkTools: [
    { icon: "upload", title: "home.tool.analyser.title", text: "home.tool.analyser.text", route: "analyser", wide: true },
    { icon: "shield", title: "home.tool.callMatch.title", text: "home.tool.callMatch.text", route: "call-match" },
    { icon: "user", title: "home.tool.callerCheck.title", text: "home.tool.callerCheck.text", route: "caller-check" },
    { icon: "transfer", title: "home.tool.riskScorer.title", text: "home.tool.riskScorer.text", route: "risk-scorer", locked: true }
  ],

  // "Be ready next time": things to set up or learn before a scam happens
  readyTools: [
    { icon: "key", title: "home.tool.passphrase.title", text: "home.tool.passphrase.text", route: "passphrase", locked: true },
    { icon: "book", title: "home.tool.learnSigns.title", text: "home.tool.learnSigns.text", route: "learn-signs" },
    { icon: "flag", title: "home.tool.report.title", text: "home.tool.report.text", route: "report", locked: true }
  ],

  // "Your safety checklist" (signed-in customers only): four small steps, with a progress bar.
  // Signing in counts as the first step, so everyone starts with one done: people finish a list
  // more often when they can see they have already started (the goal-gradient effect).
  checklist: [
    { id: "signIn", label: "home.progress.signIn", route: "customer" },
    { id: "passphrase", label: "home.progress.passphrase", route: "passphrase" },
    { id: "learn", label: "home.progress.learn", route: "learn-signs" },
    { id: "check", label: "home.progress.check", route: "analyser" }
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
      "home.sub": "What would you like to do today?",
      "home.guest.title": "Not sure if it's a scam? Pause and check.",
      "home.guest.sub": "Free help from your bank. You don't need to sign in for urgent help.",
      "home.urgent": "Need help right now?",
      "home.callingNow": "Someone is calling me now",
      "home.callingNowSub": "We'll guide you, one step at a time",
      "home.sentMoney": "I already sent money or gave a code",
      "home.sentMoneySub": "Freeze your accounts so no more money can leave",
      "home.callYourself": "Or call OCBC yourself:",
      "home.checkTitle": "Not sure? Check it first",
      "home.checkSub": "Check something before you reply or pay.",
      "home.readyTitle": "Be ready next time",
      "home.readySubGuest": "Some of these need you to sign in first.",
      "home.recentTitle": "My recent checks ({count})",
      "home.risk.high": "High risk",
      "home.risk.medium": "Medium risk",
      "home.risk.low": "Low risk",
      "home.progress.title": "Your safety checklist",
      "home.progress.count": "{done} of {total} done",
      "home.progress.signIn": "Sign in",
      "home.progress.passphrase": "Save a family passphrase",
      "home.progress.learn": "Try the scam quiz",
      "home.progress.check": "Check a message or call",
      "home.progress.next": "Next: {step}",
      "home.progress.allDone": "All done. You are ready if a scammer calls.",
      "home.progress.doneLabel": "done",
      "home.tool.analyser.title": "Check a message, call or picture",
      "home.tool.analyser.text": "An SMS, a voice message, a screenshot or a letter. We'll tell you if it looks like a scam.",
      "home.tool.callMatch.title": "Is the bank really calling?",
      "home.tool.callMatch.text": "See if OCBC really called you",
      "home.tool.callerCheck.title": "Is the caller a real person?",
      "home.tool.callerCheck.text": "A quick check that AI voices can't pass",
      "home.tool.riskScorer.title": "Check a transfer first",
      "home.tool.riskScorer.text": "See if it looks risky before you send money",
      "home.tool.passphrase.title": "Family passphrase",
      "home.tool.passphrase.text": "A secret word only your family knows",
      "home.tool.learnSigns.title": "Learn the signs",
      "home.tool.learnSigns.text": "4 signs of a scam call, and a quick quiz",
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
      "home.hello": "{name}，您好",
      "home.helloNoName": "欢迎回来",
      "home.welcomeNew": "欢迎",
      "home.sub": "今天想做什么？",
      "home.guest.title": "不确定是不是诈骗？先停一停，查一查。",
      "home.guest.sub": "银行提供的免费帮助。紧急帮助不需要登录。",
      "home.urgent": "现在需要帮忙吗？",
      "home.callingNow": "现在有人打电话给我",
      "home.callingNowSub": "我们一步一步帮您",
      "home.sentMoney": "我已经转了钱或给了密码",
      "home.sentMoneySub": "冻结您的户口，阻止更多钱被转走",
      "home.callYourself": "或者您自己打电话给 OCBC：",
      "home.checkTitle": "不确定？先检查一下",
      "home.checkSub": "回复或付钱之前，先检查一下。",
      "home.readyTitle": "为下一次做好准备",
      "home.readySubGuest": "其中一些需要先登录。",
      "home.recentTitle": "我最近的检查（{count}）",
      "home.risk.high": "高风险",
      "home.risk.medium": "中风险",
      "home.risk.low": "低风险",
      "home.progress.title": "您的安全清单",
      "home.progress.count": "已完成 {done} / {total}",
      "home.progress.signIn": "登录",
      "home.progress.passphrase": "保存一个家人暗号",
      "home.progress.learn": "做一次防诈骗小测验",
      "home.progress.check": "检查一条信息或电话",
      "home.progress.next": "下一步：{step}",
      "home.progress.allDone": "全部完成。骗子打来时，您已经准备好了。",
      "home.progress.doneLabel": "已完成",
      "home.tool.analyser.title": "检查信息、电话或图片",
      "home.tool.analyser.text": "短信、语音信息、截图或信件都可以。我们会告诉您它像不像诈骗。",
      "home.tool.callMatch.title": "真的是银行打来的吗？",
      "home.tool.callMatch.text": "看看 OCBC 是否真的打给您",
      "home.tool.callerCheck.title": "打电话来的是真人吗？",
      "home.tool.callerCheck.text": "一个 AI 声音过不了的简单测试",
      "home.tool.riskScorer.title": "转账前先检查",
      "home.tool.riskScorer.text": "转账之前，看看风险有多大",
      "home.tool.passphrase.title": "家人暗号",
      "home.tool.passphrase.text": "一个只有家人知道的秘密词",
      "home.tool.learnSigns.title": "认识诈骗迹象",
      "home.tool.learnSigns.text": "诈骗电话的 4 个迹象，加一个小测验",
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
      "home.helloNoName": "Selamat kembali",
      "home.welcomeNew": "Selamat datang",
      "home.sub": "Apa yang anda mahu buat hari ini?",
      "home.guest.title": "Tidak pasti jika ia penipuan? Berhenti dan semak.",
      "home.guest.sub": "Bantuan percuma daripada bank anda. Anda tidak perlu log masuk untuk bantuan segera.",
      "home.urgent": "Perlu bantuan sekarang?",
      "home.callingNow": "Ada orang sedang telefon saya",
      "home.callingNowSub": "Kami akan bimbing anda, satu langkah demi satu langkah",
      "home.sentMoney": "Saya sudah hantar wang atau beri kod",
      "home.sentMoneySub": "Bekukan akaun anda supaya tiada lagi wang boleh keluar",
      "home.callYourself": "Atau telefon OCBC sendiri:",
      "home.checkTitle": "Tidak pasti? Semak dahulu",
      "home.checkSub": "Semak dahulu sebelum anda balas atau bayar.",
      "home.readyTitle": "Bersedia untuk lain kali",
      "home.readySubGuest": "Sesetengahnya perlu anda log masuk dahulu.",
      "home.recentTitle": "Semakan terbaru saya ({count})",
      "home.risk.high": "Risiko tinggi",
      "home.risk.medium": "Risiko sederhana",
      "home.risk.low": "Risiko rendah",
      "home.progress.title": "Senarai semak keselamatan anda",
      "home.progress.count": "{done} daripada {total} selesai",
      "home.progress.signIn": "Log masuk",
      "home.progress.passphrase": "Simpan kata laluan keluarga",
      "home.progress.learn": "Cuba kuiz penipuan",
      "home.progress.check": "Semak mesej atau panggilan",
      "home.progress.next": "Seterusnya: {step}",
      "home.progress.allDone": "Semua selesai. Anda sudah bersedia jika penipu menelefon.",
      "home.progress.doneLabel": "selesai",
      "home.tool.analyser.title": "Semak mesej, panggilan atau gambar",
      "home.tool.analyser.text": "SMS, mesej suara, tangkapan skrin atau surat. Kami akan beritahu jika ia kelihatan seperti penipuan.",
      "home.tool.callMatch.title": "Betulkah bank yang telefon?",
      "home.tool.callMatch.text": "Lihat sama ada OCBC betul-betul menelefon anda",
      "home.tool.callerCheck.title": "Adakah pemanggil orang sebenar?",
      "home.tool.callerCheck.text": "Ujian cepat yang suara AI tidak boleh lepasi",
      "home.tool.riskScorer.title": "Semak pindahan dahulu",
      "home.tool.riskScorer.text": "Lihat sama ada ia berisiko sebelum anda hantar wang",
      "home.tool.passphrase.title": "Kata laluan keluarga",
      "home.tool.passphrase.text": "Satu perkataan rahsia yang hanya keluarga anda tahu",
      "home.tool.learnSigns.title": "Kenali tanda-tanda",
      "home.tool.learnSigns.text": "4 tanda panggilan penipuan, dan kuiz ringkas",
      "home.tool.report.title": "Laporkan penipuan",
      "home.tool.report.text": "Beritahu bank apa yang berlaku",
      "home.recent.nephew.what": "Mesej suara yang macam suara anak saudara saya",
      "home.recent.nephew.when": "Disemak 2 Nov",
      "home.recent.parcel.what": "Mesej suara pendek tentang bungkusan",
      "home.recent.parcel.when": "Disemak 30 Okt"
    }
  }
};
