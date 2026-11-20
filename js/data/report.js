"use strict";

// Made-up data for: Report a scam.
// Owner: Jose
// text: this screen's words in English, Chinese, Malay and Tamil (see js/core/i18n.js).
// The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.

const REPORT_DATA = {
  // "What happened?" choices. #report/call, #report/message and #report/sent pick one in advance.
  // The words for each are in text below, under "rp.what.<id>".
  what: [{ id: "call" }, { id: "message" }, { id: "sent" }, { id: "other" }],

  // "Did you lose money?" choices, words under "rp.lost.<id>". "yes" shows the amount box.
  lost: [{ id: "yes" }, { id: "no" }, { id: "unsure" }],

  refPrefix: "SR-26-",   // made-up numbers, only when the server can't be reached, look like SR-26-48213

  // Other places to report to (real Singapore numbers)
  police: { phone: "1800 255 0000", tel: "tel:18002550000" },
  scamShield: { phone: "1799", tel: "tel:1799" },

  text: {
    en: {
      "rp.title": "Report a scam",
      "rp.lead": "Tell us what happened. Short answers are fine.",
      "rp.what.title": "What happened?",
      "rp.what.call": "A phone call",
      "rp.what.message": "A message",
      "rp.what.sent": "I sent money",
      "rp.what.other": "Something else",
      "rp.contact": "Their phone number or link (if you have it)",
      "rp.lost.title": "Did you lose money?",
      "rp.lost.yes": "Yes",
      "rp.lost.no": "No",
      "rp.lost.unsure": "Not sure",
      "rp.amount": "About how much? (S$)",
      "rp.freezeFirst": "Freeze my accounts first",
      "rp.more": "Anything else? (optional)",
      "rp.send": "Send to OCBC",
      "rp.sending": "Sending…",
      "rp.err.what": "Please choose what happened.",
      "rp.err.lost": "Please choose if you lost money.",
      "rp.err.amount": "Please type the amount as a number, for example 500.",
      "rp.sent.title": "Your report is sent",
      "rp.sent.refIs": "Your report number is",
      "rp.sent.officer": "An OCBC officer will look at it. If they call you, they will never ask for your OTP.",
      "rp.sent.alsoTell": "You can also tell the police: {police}, or the ScamShield Helpline: {scamShield}.",
      "rp.sent.demo": "Demo only: this report was not really sent."
    },
    zh: {
      "rp.title": "举报诈骗",
      "rp.lead": "告诉我们发生了什么事。简单说就可以。",
      "rp.what.title": "发生了什么事？",
      "rp.what.call": "一通电话",
      "rp.what.message": "一条信息",
      "rp.what.sent": "我转了钱",
      "rp.what.other": "其他事情",
      "rp.contact": "对方的电话号码或链接（如果有）",
      "rp.lost.title": "你有没有损失钱？",
      "rp.lost.yes": "有",
      "rp.lost.no": "没有",
      "rp.lost.unsure": "不确定",
      "rp.amount": "大约多少钱？（新元）",
      "rp.freezeFirst": "先冻结我的户口",
      "rp.more": "还有其他要说的吗？（可以不填）",
      "rp.send": "发送给 OCBC",
      "rp.sending": "正在发送…",
      "rp.err.what": "请选择发生了什么事。",
      "rp.err.lost": "请选择你有没有损失钱。",
      "rp.err.amount": "请用数字写金额，例如 500。",
      "rp.sent.title": "你的举报已经发送",
      "rp.sent.refIs": "你的举报号码是",
      "rp.sent.officer": "OCBC 职员会查看。如果他们打电话给你，绝对不会问你的 OTP（一次性密码）。",
      "rp.sent.alsoTell": "你也可以告诉警方：{police}，或者打 ScamShield 热线：{scamShield}。",
      "rp.sent.demo": "只是示范：这份举报没有真的发送出去。"
    },
    ms: {
      "rp.title": "Laporkan penipuan",
      "rp.lead": "Beritahu kami apa yang berlaku. Jawapan pendek pun boleh.",
      "rp.what.title": "Apa yang berlaku?",
      "rp.what.call": "Panggilan telefon",
      "rp.what.message": "Mesej",
      "rp.what.sent": "Saya sudah hantar wang",
      "rp.what.other": "Perkara lain",
      "rp.contact": "Nombor telefon atau pautan mereka (jika ada)",
      "rp.lost.title": "Adakah anda kehilangan wang?",
      "rp.lost.yes": "Ya",
      "rp.lost.no": "Tidak",
      "rp.lost.unsure": "Tidak pasti",
      "rp.amount": "Lebih kurang berapa? (S$)",
      "rp.freezeFirst": "Bekukan akaun saya dahulu",
      "rp.more": "Ada apa-apa lagi? (tidak wajib)",
      "rp.send": "Hantar kepada OCBC",
      "rp.sending": "Sedang dihantar…",
      "rp.err.what": "Sila pilih apa yang berlaku.",
      "rp.err.lost": "Sila pilih sama ada anda kehilangan wang.",
      "rp.err.amount": "Sila taip jumlah sebagai nombor, contohnya 500.",
      "rp.sent.title": "Laporan anda sudah dihantar",
      "rp.sent.refIs": "Nombor laporan anda ialah",
      "rp.sent.officer": "Pegawai OCBC akan menyemaknya. Jika mereka telefon anda, mereka tidak akan sekali-kali minta OTP anda.",
      "rp.sent.alsoTell": "Anda juga boleh beritahu polis: {police}, atau Talian Bantuan ScamShield: {scamShield}.",
      "rp.sent.demo": "Demo sahaja: laporan ini tidak benar-benar dihantar."
    },
    ta: {
      "rp.title": "மோசடியைப் புகாரளி",
      "rp.lead": "என்ன நடந்தது என்று சொல்லுங்கள். சுருக்கமான பதில்கள் போதும்.",
      "rp.what.title": "என்ன நடந்தது?",
      "rp.what.call": "ஒரு தொலைபேசி அழைப்பு",
      "rp.what.message": "ஒரு செய்தி",
      "rp.what.sent": "நான் பணம் அனுப்பினேன்",
      "rp.what.other": "வேறு ஏதோ",
      "rp.contact": "அவர்களின் தொலைபேசி எண் அல்லது இணைப்பு (இருந்தால்)",
      "rp.lost.title": "நீங்கள் பணத்தை இழந்தீர்களா?",
      "rp.lost.yes": "ஆம்",
      "rp.lost.no": "இல்லை",
      "rp.lost.unsure": "உறுதியில்லை",
      "rp.amount": "ஏறக்குறைய எவ்வளவு? (S$)",
      "rp.freezeFirst": "முதலில் என் கணக்குகளை முடக்கு",
      "rp.more": "வேறு ஏதாவது? (விருப்பத்தேர்வு)",
      "rp.send": "OCBC-க்கு அனுப்பு",
      "rp.sending": "அனுப்புகிறோம்…",
      "rp.err.what": "என்ன நடந்தது என்று தேர்ந்தெடுங்கள்.",
      "rp.err.lost": "நீங்கள் பணத்தை இழந்தீர்களா என்று தேர்ந்தெடுங்கள்.",
      "rp.err.amount": "தொகையை எண்ணாகத் தட்டச்சு செய்யுங்கள், எ.கா. 500.",
      "rp.sent.title": "உங்கள் புகார் அனுப்பப்பட்டது",
      "rp.sent.refIs": "உங்கள் புகார் எண்",
      "rp.sent.officer": "ஒரு OCBC அதிகாரி இதைப் பார்ப்பார். அவர் உங்களை அழைத்தால், உங்கள் OTP-ஐ ஒருபோதும் கேட்க மாட்டார்.",
      "rp.sent.alsoTell": "காவல்துறையிடமும் சொல்லலாம்: {police}, அல்லது ScamShield உதவி எண்: {scamShield}.",
      "rp.sent.demo": "மாதிரி மட்டும்: இந்தப் புகார் உண்மையில் அனுப்பப்படவில்லை."
    }
  }
};

// Lets the Node tests (server/test/) check every word has a translation. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = REPORT_DATA;
