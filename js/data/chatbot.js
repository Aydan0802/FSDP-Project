"use strict";

// Words for: Ask the helper (AI chat), and its card on Home.
// Owner: Jose
// text: this screen's words in English, Chinese, Malay and Tamil (see js/core/i18n.js).
// The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.
// The buttons under a reply reuse the shared menu words in i18n.js ("side.freeze" and so on).

const HELPER_DATA = {
  // The quick buttons shown before the first message. Tapping one sends its words.
  chips: ["hp.chip.calling", "hp.chip.message", "hp.chip.sent", "hp.chip.bank"],

  text: {
    en: {
      "hp.title": "Ask the helper",
      "hp.lead": "Tell me what happened, in your own words. I'll tell you what to do.",
      "hp.welcome": "Hello! I'm here to help you stay safe from scams. What happened?",
      "hp.chip.calling": "Someone is calling me now",
      "hp.chip.message": "I got a strange message",
      "hp.chip.sent": "I already sent money",
      "hp.chip.bank": "Is this really OCBC?",
      "hp.label": "Your message",
      "hp.placeholder": "For example: a man says he is from the bank",
      "hp.send": "Send",
      "hp.thinking": "Thinking… this can take a few seconds.",
      "hp.error": "Sorry, I can't answer right now. If you are worried, call OCBC.",
      "hp.you": "You said",
      "hp.bot": "The helper said",
      "hp.private": "Never type your OTP, PIN or card number here. If you do, I will hide it.",
      "hp.ai": "Answers come from an AI and can be wrong. For anything about your money, call OCBC.",
      "hp.restart": "Start again",
      "hp.fab": "AI helper",
      "hp.menu": "Ask the helper"
    },
    zh: {
      "hp.title": "问问小帮手",
      "hp.lead": "用您自己的话告诉我发生了什么事，我会告诉您该怎么做。",
      "hp.welcome": "您好！我在这里帮您防范诈骗。发生了什么事？",
      "hp.chip.calling": "现在有人打电话给我",
      "hp.chip.message": "我收到一条奇怪的信息",
      "hp.chip.sent": "我已经转了钱",
      "hp.chip.bank": "这真的是 OCBC 吗？",
      "hp.label": "您的信息",
      "hp.placeholder": "例如：有个男人说他是银行的人",
      "hp.send": "发送",
      "hp.thinking": "正在思考……可能需要几秒钟。",
      "hp.error": "抱歉，我现在无法回答。如果您担心，请打电话给 OCBC。",
      "hp.you": "您说",
      "hp.bot": "小帮手说",
      "hp.private": "千万不要在这里输入您的 OTP、PIN 或卡号。如果您输入了，我会把它隐藏起来。",
      "hp.ai": "回答来自 AI，可能会出错。凡是关于您的钱的事，请打电话给 OCBC。",
      "hp.restart": "重新开始",
      "hp.fab": "AI 小帮手",
      "hp.menu": "问问小帮手"
    },
    ms: {
      "hp.title": "Tanya pembantu",
      "hp.lead": "Ceritakan apa yang berlaku, dengan kata-kata anda sendiri. Saya akan beritahu apa yang perlu dibuat.",
      "hp.welcome": "Helo! Saya di sini untuk membantu anda selamat daripada penipuan. Apa yang berlaku?",
      "hp.chip.calling": "Ada orang sedang telefon saya",
      "hp.chip.message": "Saya dapat mesej yang pelik",
      "hp.chip.sent": "Saya sudah hantar wang",
      "hp.chip.bank": "Betulkah ini OCBC?",
      "hp.label": "Mesej anda",
      "hp.placeholder": "Contoh: seorang lelaki kata dia dari bank",
      "hp.send": "Hantar",
      "hp.thinking": "Sedang berfikir… ini boleh ambil beberapa saat.",
      "hp.error": "Maaf, saya tidak dapat menjawab sekarang. Jika anda risau, telefon OCBC.",
      "hp.you": "Anda kata",
      "hp.bot": "Pembantu kata",
      "hp.private": "Jangan sekali-kali taip OTP, PIN atau nombor kad anda di sini. Jika anda taip, saya akan sembunyikannya.",
      "hp.ai": "Jawapan datang daripada AI dan mungkin salah. Untuk apa-apa tentang wang anda, telefon OCBC.",
      "hp.restart": "Mula semula",
      "hp.fab": "Pembantu AI",
      "hp.menu": "Tanya pembantu"
    },
    ta: {
      "hp.title": "உதவியாளரிடம் கேளுங்கள்",
      "hp.lead": "என்ன நடந்தது என்று உங்கள் சொந்த வார்த்தைகளில் சொல்லுங்கள். என்ன செய்ய வேண்டும் என்று சொல்கிறேன்.",
      "hp.welcome": "வணக்கம்! மோசடிகளிலிருந்து பாதுகாப்பாக இருக்க உதவ நான் இருக்கிறேன். என்ன நடந்தது?",
      "hp.chip.calling": "இப்போது ஒருவர் என்னை அழைக்கிறார்",
      "hp.chip.message": "எனக்கு ஒரு விசித்திரமான செய்தி வந்தது",
      "hp.chip.sent": "நான் ஏற்கெனவே பணம் அனுப்பிவிட்டேன்",
      "hp.chip.bank": "இது உண்மையில் OCBC தானா?",
      "hp.label": "உங்கள் செய்தி",
      "hp.placeholder": "எடுத்துக்காட்டு: ஒருவர் தான் வங்கியைச் சேர்ந்தவர் என்கிறார்",
      "hp.send": "அனுப்பு",
      "hp.thinking": "யோசிக்கிறேன்… இதற்குச் சில வினாடிகள் ஆகலாம்.",
      "hp.error": "மன்னிக்கவும், இப்போது பதில் சொல்ல முடியவில்லை. கவலையாக இருந்தால், OCBC-ஐ அழையுங்கள்.",
      "hp.you": "நீங்கள் சொன்னது",
      "hp.bot": "உதவியாளர் சொன்னது",
      "hp.private": "உங்கள் OTP, PIN அல்லது அட்டை எண்ணை இங்கே ஒருபோதும் தட்டச்சு செய்ய வேண்டாம். செய்தால், நான் அதை மறைத்துவிடுவேன்.",
      "hp.ai": "பதில்கள் AI-இடமிருந்து வருகின்றன, தவறாக இருக்கலாம். உங்கள் பணம் பற்றிய எதற்கும், OCBC-ஐ அழையுங்கள்.",
      "hp.restart": "மீண்டும் தொடங்கு",
      "hp.fab": "AI உதவி",
      "hp.menu": "உதவியாளரிடம் கேளுங்கள்"
    }
  }
};

// Lets the Node tests (server/test/) check every word has a translation. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = HELPER_DATA;
