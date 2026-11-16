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
      "cm.title": "Is the bank really calling?",
      "cm.lead": "Type the number that called you. We check it against the calls OCBC really made to you.",
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
      "cm.yes.warning": "Even so, OCBC will never ask for your OTP or ask you to move money. If they do, hang up.",
      "cm.again": "Check another number",
      "cm.no.tag": "No record",
      "cm.no.title": "OCBC did not call you from this number",
      "cm.no.text": "Scammers can make any number show on your phone. Hang up and call OCBC yourself.",
      "cm.no.callerCheck": "Check if the caller is even a real person",
      "cm.no.report": "Report this number"
    },
    zh: {
      "cm.title": "真的是银行打来的吗？",
      "cm.lead": "输入打给你的电话号码。我们会和 OCBC 真正打给你的电话对比。",
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
      "cm.yes.warning": "就算这样，OCBC 绝对不会问你的 OTP，也不会叫你转钱。如果对方这样做，请马上挂电话。",
      "cm.again": "检查另一个号码",
      "cm.no.tag": "没有记录",
      "cm.no.title": "OCBC 没有用这个号码打给你",
      "cm.no.text": "骗子可以让任何号码出现在你的手机上。请挂电话，然后自己打给 OCBC。",
      "cm.no.callerCheck": "检查打电话来的是不是真人",
      "cm.no.report": "举报这个号码"
    },
    ms: {
      "cm.title": "Betulkah bank yang telefon?",
      "cm.lead": "Taip nombor yang telefon anda. Kami semak dengan panggilan yang OCBC betul-betul buat kepada anda.",
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
      "cm.yes.warning": "Walaupun begitu, OCBC tidak akan sekali-kali minta OTP anda atau suruh anda pindahkan wang. Jika mereka buat begitu, letak telefon.",
      "cm.again": "Semak nombor lain",
      "cm.no.tag": "Tiada rekod",
      "cm.no.title": "OCBC tidak telefon anda dari nombor ini",
      "cm.no.text": "Penipu boleh buat apa-apa nombor muncul di telefon anda. Letak telefon dan telefon OCBC sendiri.",
      "cm.no.callerCheck": "Semak sama ada pemanggil itu orang sebenar",
      "cm.no.report": "Laporkan nombor ini"
    }
  }
};
