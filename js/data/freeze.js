"use strict";

// Made-up data for: Freeze my accounts.
// Owner: Jose
// text: this screen's words in English, Chinese and Malay (see js/core/i18n.js).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.

const FREEZE_DATA = {
  // The key to press on OCBC's hotline to reach the team that freezes accounts (the preview's wording)
  hotlineKey: "8",

  // What the freeze stops, shown on the "frozen" screen (translation keys, words are in text below)
  frozenItems: ["fr.item.payments", "fr.item.cards", "fr.item.app"],

  text: {
    en: {
      "fr.calm": "Stay calm. Do this first.",
      "fr.title": "Freeze your accounts now.",
      "fr.why": "This stops any more money from leaving. You can unfreeze them later with the bank.",
      "fr.button": "Freeze my accounts",
      "fr.orCall": "Or call OCBC {phone} and press {key}",
      "fr.done.title": "Your accounts are frozen.",
      "fr.done.text": "No more money can leave your accounts. Now call OCBC on {phone} and press {key}. Tell them what happened.",
      "fr.item.payments": "Transfers and PayNow payments are stopped.",
      "fr.item.cards": "Your cards cannot be used.",
      "fr.item.app": "Nobody can sign in to your banking app.",
      "fr.writeDown": "Write down what happened",
      "fr.demo": "Demo only: nothing is really frozen. Frozen at {time} in this demo."
    },
    zh: {
      "fr.calm": "别慌。先做这一步。",
      "fr.title": "马上冻结你的户口。",
      "fr.why": "这样钱就不会再被转走。以后你可以联系银行解冻。",
      "fr.button": "冻结我的户口",
      "fr.orCall": "或者打 OCBC {phone}，然后按 {key}",
      "fr.done.title": "你的户口已经冻结了。",
      "fr.done.text": "钱不能再从你的户口转出去。现在请打 OCBC {phone}，按 {key}，告诉他们发生了什么事。",
      "fr.item.payments": "转账和 PayNow 付款已经停止。",
      "fr.item.cards": "你的卡不能用了。",
      "fr.item.app": "谁都不能登录你的银行应用程序。",
      "fr.writeDown": "写下发生了什么事",
      "fr.demo": "只是示范：没有真的冻结。示范中的冻结时间：{time}。"
    },
    ms: {
      "fr.calm": "Bertenang. Buat ini dahulu.",
      "fr.title": "Bekukan akaun anda sekarang.",
      "fr.why": "Ini menghalang wang daripada keluar lagi. Anda boleh nyahbekukan akaun kemudian dengan bank.",
      "fr.button": "Bekukan akaun saya",
      "fr.orCall": "Atau telefon OCBC {phone} dan tekan {key}",
      "fr.done.title": "Akaun anda sudah dibekukan.",
      "fr.done.text": "Wang tidak boleh keluar dari akaun anda lagi. Sekarang telefon OCBC di {phone} dan tekan {key}. Beritahu mereka apa yang berlaku.",
      "fr.item.payments": "Pindahan wang dan bayaran PayNow dihentikan.",
      "fr.item.cards": "Kad anda tidak boleh digunakan.",
      "fr.item.app": "Tiada sesiapa boleh log masuk ke aplikasi bank anda.",
      "fr.writeDown": "Tulis apa yang berlaku",
      "fr.demo": "Demo sahaja: tiada apa yang benar-benar dibekukan. Dibekukan pada {time} dalam demo ini."
    }
  }
};

// Lets the Node tests (server/test/) check every word has a translation. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = FREEZE_DATA;
