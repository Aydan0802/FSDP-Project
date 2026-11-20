"use strict";

// Made-up data for: Freeze my accounts.
// Owner: Jose
// text: this screen's words in English, Chinese, Malay and Tamil (see js/core/i18n.js).
// The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.

const FREEZE_DATA = {
  // The key to press on OCBC's hotline to reach the team that freezes accounts (the preview's wording)
  hotlineKey: "8",

  // What the freeze stops, shown on the "frozen" screen (translation keys, words are in text below)
  frozenItems: ["fr.item.payments", "fr.item.cards", "fr.item.app"],

  text: {
    en: {
      "fr.phone.label": "Your mobile number",
      "fr.phone.hint": "So we know which accounts to freeze. You don't need to sign in.",
      "fr.phone.err": "Type your 8-digit mobile number, like 9123 4567.",
      "fr.calm": "Stay calm. Do this first.",
      "fr.title": "Freeze your accounts now.",
      "fr.why": "This stops any more money from leaving. You can unfreeze them later with the bank.",
      "fr.button": "Freeze my accounts",
      "fr.ref": "Your request number is {ref}. OCBC can see it now.",
      "fr.orCall": "Or call OCBC {phone} and press {key}",
      "fr.done.title": "Your accounts are frozen.",
      "fr.done.text": "Next: call OCBC on {phone} and press {key}. Tell them what happened.",
      "fr.item.payments": "Transfers and PayNow payments are stopped.",
      "fr.item.cards": "Your cards cannot be used.",
      "fr.item.app": "Nobody can sign in to your banking app.",
      "fr.writeDown": "Write down what happened",
      "fr.demo": "Demo only: nothing is really frozen. Frozen at {time} in this demo."
    },
    zh: {
      "fr.phone.label": "您的手机号码",
      "fr.phone.hint": "这样我们才知道要冻结哪些户口。不需要登录。",
      "fr.phone.err": "请输入您的 8 位数手机号码，例如 9123 4567。",
      "fr.calm": "别慌。先做这一步。",
      "fr.title": "马上冻结你的户口。",
      "fr.why": "这样钱就不会再被转走。以后你可以联系银行解冻。",
      "fr.button": "冻结我的户口",
      "fr.ref": "您的申请编号是 {ref}。OCBC 现在已经收到。",
      "fr.orCall": "或者打 OCBC {phone}，然后按 {key}",
      "fr.done.title": "你的户口已经冻结了。",
      "fr.done.text": "下一步：打电话给 OCBC {phone}，按 {key}，告诉他们发生了什么。",
      "fr.item.payments": "转账和 PayNow 付款已经停止。",
      "fr.item.cards": "你的卡不能用了。",
      "fr.item.app": "谁都不能登录你的银行应用程序。",
      "fr.writeDown": "写下发生了什么事",
      "fr.demo": "只是示范：没有真的冻结。示范中的冻结时间：{time}。"
    },
    ms: {
      "fr.phone.label": "Nombor telefon bimbit anda",
      "fr.phone.hint": "Supaya kami tahu akaun mana yang perlu dibekukan. Anda tidak perlu log masuk.",
      "fr.phone.err": "Taip nombor telefon bimbit 8 digit anda, contohnya 9123 4567.",
      "fr.calm": "Bertenang. Buat ini dahulu.",
      "fr.title": "Bekukan akaun anda sekarang.",
      "fr.why": "Ini menghalang wang daripada keluar lagi. Anda boleh nyahbekukan akaun kemudian dengan bank.",
      "fr.button": "Bekukan akaun saya",
      "fr.ref": "Nombor permintaan anda ialah {ref}. OCBC kini boleh melihatnya.",
      "fr.orCall": "Atau telefon OCBC {phone} dan tekan {key}",
      "fr.done.title": "Akaun anda sudah dibekukan.",
      "fr.done.text": "Seterusnya: telefon OCBC di {phone} dan tekan {key}. Beritahu mereka apa yang berlaku.",
      "fr.item.payments": "Pindahan wang dan bayaran PayNow dihentikan.",
      "fr.item.cards": "Kad anda tidak boleh digunakan.",
      "fr.item.app": "Tiada sesiapa boleh log masuk ke aplikasi bank anda.",
      "fr.writeDown": "Tulis apa yang berlaku",
      "fr.demo": "Demo sahaja: tiada apa yang benar-benar dibekukan. Dibekukan pada {time} dalam demo ini."
    },
    ta: {
      "fr.phone.label": "உங்கள் கைபேசி எண்",
      "fr.phone.hint": "எந்தக் கணக்குகளை முடக்க வேண்டும் என்று தெரிந்துகொள்ள. நீங்கள் உள்நுழைய வேண்டியதில்லை.",
      "fr.phone.err": "உங்கள் 8 இலக்கக் கைபேசி எண்ணைத் தட்டச்சு செய்யுங்கள், எ.கா. 9123 4567.",
      "fr.calm": "அமைதியாக இருங்கள். முதலில் இதைச் செய்யுங்கள்.",
      "fr.title": "உங்கள் கணக்குகளை இப்போதே முடக்குங்கள்.",
      "fr.why": "இது மேலும் பணம் போவதைத் தடுக்கும். பின்னர் வங்கியுடன் சேர்ந்து முடக்கத்தை நீக்கலாம்.",
      "fr.button": "என் கணக்குகளை முடக்கு",
      "fr.ref": "உங்கள் கோரிக்கை எண் {ref}. OCBC இப்போது அதைப் பார்க்க முடியும்.",
      "fr.orCall": "அல்லது OCBC {phone}-ஐ அழைத்து {key}-ஐ அழுத்துங்கள்",
      "fr.done.title": "உங்கள் கணக்குகள் முடக்கப்பட்டுள்ளன.",
      "fr.done.text": "அடுத்து: OCBC-ஐ {phone}-இல் அழைத்து {key}-ஐ அழுத்துங்கள். என்ன நடந்தது என்று சொல்லுங்கள்.",
      "fr.item.payments": "பணப் பரிமாற்றங்களும் PayNow கட்டணங்களும் நிறுத்தப்பட்டன.",
      "fr.item.cards": "உங்கள் அட்டைகளைப் பயன்படுத்த முடியாது.",
      "fr.item.app": "உங்கள் வங்கிச் செயலியில் யாரும் உள்நுழைய முடியாது.",
      "fr.writeDown": "என்ன நடந்தது என்று எழுதி வையுங்கள்",
      "fr.demo": "மாதிரி மட்டும்: உண்மையில் எதுவும் முடக்கப்படவில்லை. இந்த மாதிரியில் {time}-க்கு முடக்கப்பட்டது."
    }
  }
};

// Lets the Node tests (server/test/) check every word has a translation. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = FREEZE_DATA;
