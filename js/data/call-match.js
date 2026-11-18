"use strict";

// Made-up data for: Is the bank really calling? (the screen).
// Owner: Yan Lin
// text: this screen's words in English, Chinese and Malay (see "How to translate your screen"
// in TEAM-FILES.md). The Chinese and Malay are AI-drafted and still need a native speaker to check them.

const CALL_MATCH_DATA = {
  // The "Try:" buttons: one number OCBC really called from, and one it didn't
  sampleNumbers: ["+65 6363 3333", "+65 8123 9876"],

  text: {
    en: {
      "cm.no.1": "Scammers can make any number show on your phone.",
      "cm.no.2": "Hang up now.",
      "cm.no.3": "Call OCBC yourself on the number on your card.",
      "cm.checking.title": "Checking this number…",
      "cm.checking.step1": "Looking up the number",
      "cm.checking.step2": "Matching it with the calls OCBC made to you",
      "cm.checking.step3": "Getting your answer ready",
      "cm.title": "Is the bank really calling?",
      "cm.lead": "Type the number that called you. We check it against OCBC's real calls.",
      "cm.numberLabel": "Number that called you",
      "cm.placeholder": "For example: 6363 3333",
      "cm.try": "Try:",
      "cm.check": "Check this number",
      "cm.err.number": "Please type the 8-digit number that called you.",
      "cm.yes.tag": "OCBC called you",
      "cm.yes.title": "Yes, this was a real OCBC call",
      "cm.officer": "Officer",
      "cm.team": "Team",
      "cm.when": "When",
      "cm.about": "About",
      "cm.yes.warning": "OCBC will never ask for your OTP or ask you to move money. If they do, hang up.",
      "cm.again": "Check another number",
      "cm.no.tag": "No record",
      "cm.no.title": "OCBC did not call you from this number",
      "cm.no.text": "Scammers can make any number show on your phone. Hang up and call OCBC yourself.",
      "cm.no.callerCheck": "Check if the caller is a real person",
      "cm.no.report": "Report this number"
    },
    zh: {
      "cm.no.1": "骗子可以让任何号码显示在您的手机上。",
      "cm.no.2": "现在就挂断。",
      "cm.no.3": "用卡上的号码自己打给 OCBC。",
      "cm.checking.title": "正在检查这个号码…",
      "cm.checking.step1": "查找这个号码",
      "cm.checking.step2": "和 OCBC 打给您的电话对比",
      "cm.checking.step3": "准备好您的答案",
      "cm.title": "真的是银行打来的吗？",
      "cm.lead": "输入打给您的号码，我们和 OCBC 真正打出的电话对比。",
      "cm.numberLabel": "打给你的电话号码",
      "cm.placeholder": "例如：6363 3333",
      "cm.try": "试试：",
      "cm.check": "检查这个号码",
      "cm.err.number": "请输入打给你的 8 位数电话号码。",
      "cm.yes.tag": "OCBC 打过电话给你",
      "cm.yes.title": "是的，这是 OCBC 真正打来的电话",
      "cm.officer": "职员",
      "cm.team": "部门",
      "cm.when": "时间",
      "cm.about": "关于",
      "cm.yes.warning": "OCBC 绝不会问您的 OTP，也不会叫您转钱。如果对方这样做，请挂断。",
      "cm.again": "检查另一个号码",
      "cm.no.tag": "没有记录",
      "cm.no.title": "OCBC 没有用这个号码打给你",
      "cm.no.text": "骗子可以让任何号码出现在你的手机上。请挂电话，然后自己打给 OCBC。",
      "cm.no.callerCheck": "检查打电话来的是不是真人",
      "cm.no.report": "举报这个号码"
    },
    ms: {
      "cm.no.1": "Penipu boleh buat apa-apa nombor muncul di telefon anda.",
      "cm.no.2": "Letak telefon sekarang.",
      "cm.no.3": "Telefon OCBC sendiri melalui nombor di kad anda.",
      "cm.checking.title": "Sedang menyemak nombor ini…",
      "cm.checking.step1": "Mencari nombor itu",
      "cm.checking.step2": "Memadankannya dengan panggilan OCBC kepada anda",
      "cm.checking.step3": "Menyediakan jawapan anda",
      "cm.title": "Betulkah bank yang telefon?",
      "cm.lead": "Taip nombor yang menelefon anda. Kami semak dengan panggilan sebenar OCBC.",
      "cm.numberLabel": "Nombor yang telefon anda",
      "cm.placeholder": "Contohnya: 6363 3333",
      "cm.try": "Cuba:",
      "cm.check": "Semak nombor ini",
      "cm.err.number": "Sila taip nombor 8 digit yang telefon anda.",
      "cm.yes.tag": "OCBC telefon anda",
      "cm.yes.title": "Ya, ini panggilan OCBC yang sebenar",
      "cm.officer": "Pegawai",
      "cm.team": "Pasukan",
      "cm.when": "Bila",
      "cm.about": "Tentang",
      "cm.yes.warning": "OCBC tidak akan minta OTP anda atau suruh anda pindahkan wang. Jika mereka minta, letak telefon.",
      "cm.again": "Semak nombor lain",
      "cm.no.tag": "Tiada rekod",
      "cm.no.title": "OCBC tidak telefon anda dari nombor ini",
      "cm.no.text": "Penipu boleh buat apa-apa nombor muncul di telefon anda. Letak telefon dan telefon OCBC sendiri.",
      "cm.no.callerCheck": "Semak sama ada pemanggil itu orang sebenar",
      "cm.no.report": "Laporkan nombor ini"
    }
  }
};
