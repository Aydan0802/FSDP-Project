"use strict";

// The words the message checker uses in its summary, in each language.
// Owner: Aydan. Used by detector/checker.js.
// English first. Chinese (zh) and Malay (ms) are added after English works; any wording
// that is missing falls back to English. A teammate who speaks the language should check it.
// {type} and {tip} are filled in by checker.js.

const WORDS = {
  en: {
    // How the summary names each kind of scam (matches labels.en.types on the analyser screen)
    typeNames: {
      impersonation: "a scam pretending to be the bank or government",
      phishing: "a message made to steal your details",
      parcel: "a fake delivery message",
      job: "a job scam",
      investment: "an investment scam",
      love: "a love scam"
    },
    // One short piece of advice for each kind of scam
    tips: {
      impersonation: "A real bank or government officer will never ask for your OTP, your PIN or your money by message.",
      phishing: "Don't tap any link or type in any details. Contact the company through its own app or website instead.",
      parcel: "Couriers don't ask for fees through links like this. Check your parcel in the courier's own app.",
      job: "Real jobs never ask you to pay to start, and nobody pays big money for simple online tasks.",
      investment: "No real investment can promise guaranteed profits. Don't transfer any money.",
      love: "Never send money to someone you have only met online. Talk to your family first."
    },
    high: "This looks like {type}. {tip}",
    medium: "This message has some warning signs of {type}. {tip}",
    lowWithFlags: "We found only small warning signs. It's probably fine, but check before you tap a link or reply.",
    lowNoFlags: "We found no warning signs in this message. That doesn't prove it's safe: if anything feels wrong, contact the person on a number you already know.",
    notSupported: "We can't check messages in this language well yet, so this result is a rough guess.",
    empty: "There's no message to check yet. Paste or type the message first."
  },

  // Chinese (Simplified). Needs a teammate who reads Chinese to check it.
  zh: {
    typeNames: {
      impersonation: "冒充银行或政府的诈骗",
      phishing: "骗取您个人资料的信息",
      parcel: "假冒的快递通知",
      job: "求职诈骗",
      investment: "投资诈骗",
      love: "感情诈骗"
    },
    tips: {
      impersonation: "真正的银行或政府人员绝不会通过短信向您索取验证码、密码或钱。",
      phishing: "不要点击任何链接，也不要填写任何资料。请通过对方的官方应用程序或网站联系。",
      parcel: "快递公司不会通过这样的链接收费。请在快递公司自己的应用程序里查询。",
      job: "真正的工作不会要您先付钱，也没有人会为简单的网上任务付高薪。",
      investment: "没有任何真正的投资能保证赚钱。请不要转账。",
      love: "绝不要把钱汇给只在网上认识的人。请先和家人商量。"
    },
    high: "这条信息看起来像是{type}。{tip}",
    medium: "这条信息有一些{type}的危险信号。{tip}",
    lowWithFlags: "我们只发现了一些小的危险信号。应该没问题，但在点击链接或回复之前请先确认。",
    lowNoFlags: "这条信息没有发现危险信号。但这不能证明它一定安全：如有疑问，请用您已知的号码联系对方。",
    empty: "还没有可检查的信息。请先粘贴或输入信息。"
  },

  // Malay. Needs a teammate who reads Malay to check it.
  ms: {
    typeNames: {
      impersonation: "penipuan yang menyamar sebagai bank atau kerajaan",
      phishing: "mesej untuk mencuri butiran anda",
      parcel: "mesej penghantaran palsu",
      job: "penipuan kerja",
      investment: "penipuan pelaburan",
      love: "penipuan cinta"
    },
    tips: {
      impersonation: "Bank atau pegawai kerajaan yang sebenar tidak akan meminta OTP, PIN atau wang anda melalui mesej.",
      phishing: "Jangan tekan sebarang pautan atau masukkan butiran anda. Hubungi syarikat itu melalui aplikasi atau laman web rasminya.",
      parcel: "Syarikat kurier tidak meminta bayaran melalui pautan seperti ini. Semak bungkusan anda dalam aplikasi kurier itu sendiri.",
      job: "Majikan sebenar tidak akan meminta anda membayar untuk mula bekerja, dan tiada siapa membayar banyak untuk tugasan mudah dalam talian.",
      investment: "Tiada pelaburan sebenar yang boleh menjamin keuntungan. Jangan pindahkan wang.",
      love: "Jangan sekali-kali hantar wang kepada orang yang anda kenal dalam talian sahaja. Bincang dengan keluarga dahulu."
    },
    high: "Mesej ini kelihatan seperti {type}. {tip}",
    medium: "Mesej ini ada beberapa tanda amaran {type}. {tip}",
    lowWithFlags: "Kami hanya menemui tanda amaran kecil. Mungkin tiada masalah, tetapi semak dahulu sebelum anda tekan pautan atau membalas.",
    lowNoFlags: "Kami tidak menemui tanda amaran dalam mesej ini. Itu tidak membuktikan ia selamat: jika ada yang terasa tidak kena, hubungi orang itu melalui nombor yang anda sudah tahu.",
    empty: "Belum ada mesej untuk disemak. Tampal atau taip mesej dahulu."
  }
};

// Works in the browser (as a global) and in Node (with require)
if (typeof module === "object" && module.exports) {
  module.exports = WORDS;
} else {
  globalThis.TEXT_DETECTOR_WORDS = WORDS;
}
