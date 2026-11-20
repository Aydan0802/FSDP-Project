"use strict";

// The words the message checker uses in its summary, in each language.
// Owner: Aydan. Used by detector/checker.js.
// English first. Chinese (zh), Malay (ms) and Tamil (ta) are added after English works; any wording
// that is missing falls back to English. A teammate who speaks the language should check it.
// {type} and {tip} are filled in by checker.js.

const WORDS = {
  en: {
    // How the summary names each kind of scam (matches labels.en.types on the analyser screen)
    typeNames: {
      impersonation: "a scam pretending to be someone you trust, like the bank, the government or family",
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
    empty: "There's no message to check yet. Paste or type the message first.",
    // "What to do now" steps, picked to match the red flags found (checker.js).
    // Wording from KakiGuard, a teammate's hackathon project, reused with permission;
    // checkOldNumber is ours.
    steps: {
      noClick: "Do not click the link.",
      noCode: "Never share your OTP, password or card details.",
      noPay: "Do not pay or transfer any money.",
      noInstall: "Do not install any app they send you.",
      checkOldNumber: "Call the person on the number you already have for them before you do anything.",
      verifyOfficial: "Contact the organisation yourself using its official website or the number on your card.",
      stopReplying: "Hang up or stop replying. Real officials will not mind.",
      askFamily: "Ask a family member before you do anything.",
      call1799: "Unsure? Call the ScamShield Helpline at 1799.",
      stillCareful: "Looks okay, but never share codes or send money to people you have not met."
    }
  },

  // Chinese (Simplified). Needs a teammate who reads Chinese to check it.
  zh: {
    typeNames: {
      impersonation: "冒充您信任的人（例如银行、政府或家人）的诈骗",
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
    empty: "还没有可检查的信息。请先粘贴或输入信息。",
    // Wording from KakiGuard (teammate's project, reused with permission); checkOldNumber is ours
    steps: {
      noClick: "不要点击链接。",
      noCode: "绝不透露 OTP、密码或卡号。",
      noPay: "不要付款或转账。",
      noInstall: "不要安装对方发来的应用。",
      checkOldNumber: "先用您原本存的号码打给对方确认，再做任何事。",
      verifyOfficial: "自己用官方网站或卡上的号码联系该机构。",
      stopReplying: "挂断或停止回复。真正的官员不会介意。",
      askFamily: "先问问家人再行动。",
      call1799: "不确定？拨打 ScamShield 热线 1799。",
      stillCareful: "看起来没问题，但绝不要把验证码或钱给不认识的人。"
    }
  },

  // Malay. Needs a teammate who reads Malay to check it.
  ms: {
    typeNames: {
      impersonation: "penipuan yang menyamar sebagai orang yang anda percaya, seperti bank, kerajaan atau keluarga",
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
    empty: "Belum ada mesej untuk disemak. Tampal atau taip mesej dahulu.",
    // Wording from KakiGuard (teammate's project, reused with permission); checkOldNumber is ours
    steps: {
      noClick: "Jangan klik pautan itu.",
      noCode: "Jangan sesekali kongsi OTP, kata laluan atau butiran kad.",
      noPay: "Jangan bayar atau pindahkan wang.",
      noInstall: "Jangan pasang aplikasi yang mereka hantar.",
      checkOldNumber: "Telefon orang itu melalui nombor lama yang anda simpan sebelum berbuat apa-apa.",
      verifyOfficial: "Hubungi organisasi itu sendiri melalui laman rasmi atau nombor di kad anda.",
      stopReplying: "Letak telefon atau berhenti membalas. Pegawai sebenar tidak kisah.",
      askFamily: "Tanya ahli keluarga sebelum bertindak.",
      call1799: "Tidak pasti? Hubungi Talian ScamShield 1799.",
      stillCareful: "Nampak okay, tetapi jangan beri kod atau wang kepada orang yang anda tidak kenal."
    }
  },

  // Tamil. Only the result words for now: the red-flag rules themselves are English, Chinese and
  // Malay, so a Tamil message is still checked with those (and gets the "rough guess" note).
  // Needs a teammate or family member who reads Tamil to check it.
  ta: {
    typeNames: {
      impersonation: "வங்கி, அரசாங்கம் அல்லது குடும்பம் போல நீங்கள் நம்பும் ஒருவராக நடிக்கும் மோசடி",
      phishing: "உங்கள் விவரங்களைத் திருடச் செய்யப்பட்ட செய்தி",
      parcel: "போலி விநியோகச் செய்தி",
      job: "வேலை மோசடி",
      investment: "முதலீட்டு மோசடி",
      love: "காதல் மோசடி"
    },
    tips: {
      impersonation: "உண்மையான வங்கி அல்லது அரசாங்க அதிகாரி உங்கள் OTP, PIN அல்லது பணத்தைச் செய்தி மூலம் ஒருபோதும் கேட்க மாட்டார்.",
      phishing: "எந்த இணைப்பையும் தொட வேண்டாம், எந்த விவரத்தையும் தட்டச்சு செய்ய வேண்டாம். நிறுவனத்தின் சொந்தச் செயலி அல்லது இணையத்தளம் மூலம் தொடர்புகொள்ளுங்கள்.",
      parcel: "விநியோக நிறுவனங்கள் இப்படிப்பட்ட இணைப்புகள் மூலம் கட்டணம் கேட்பதில்லை. அவர்களின் சொந்தச் செயலியில் உங்கள் பார்சலைச் சரிபாருங்கள்.",
      job: "உண்மையான வேலைகள் தொடங்கப் பணம் கேட்பதில்லை; எளிய இணைய வேலைகளுக்கு யாரும் பெரிய தொகை தருவதில்லை.",
      investment: "எந்த உண்மையான முதலீடும் உத்தரவாத லாபத்தை வாக்களிக்க முடியாது. பணம் எதையும் மாற்ற வேண்டாம்.",
      love: "இணையத்தில் மட்டுமே சந்தித்த ஒருவருக்கு ஒருபோதும் பணம் அனுப்ப வேண்டாம். முதலில் உங்கள் குடும்பத்தினரிடம் பேசுங்கள்."
    },
    high: "இது {type} போலத் தெரிகிறது. {tip}",
    medium: "இந்தச் செய்தியில் சில எச்சரிக்கை அறிகுறிகள் உள்ளன. இது இந்த வகையாக இருக்கலாம்: {type}. {tip}",
    lowWithFlags: "சிறிய எச்சரிக்கை அறிகுறிகள் மட்டுமே கிடைத்தன. பெரும்பாலும் பிரச்சினை இல்லை, ஆனால் இணைப்பைத் தொடும் முன் அல்லது பதில் அனுப்பும் முன் சரிபாருங்கள்.",
    lowNoFlags: "இந்தச் செய்தியில் எச்சரிக்கை அறிகுறிகள் இல்லை. அது பாதுகாப்பானது என்று இது நிரூபிக்காது: ஏதாவது சரியில்லை என்று தோன்றினால், உங்களுக்கு ஏற்கெனவே தெரிந்த எண்ணில் அந்த நபரைத் தொடர்புகொள்ளுங்கள்.",
    notSupported: "இந்த மொழியில் உள்ள செய்திகளை இன்னும் நன்றாகச் சரிபார்க்க முடியாது, எனவே இந்த முடிவு ஒரு தோராயமான கணிப்பு.",
    empty: "சரிபார்க்க இன்னும் செய்தி இல்லை. முதலில் செய்தியை ஒட்டுங்கள் அல்லது தட்டச்சு செய்யுங்கள்.",
    steps: {
      noClick: "இணைப்பைத் தொட வேண்டாம்.",
      noCode: "உங்கள் OTP, கடவுச்சொல் அல்லது அட்டை விவரங்களை ஒருபோதும் பகிர வேண்டாம்.",
      noPay: "எந்தப் பணத்தையும் செலுத்தவோ மாற்றவோ வேண்டாம்.",
      noInstall: "அவர்கள் அனுப்பும் எந்தச் செயலியையும் நிறுவ வேண்டாம்.",
      checkOldNumber: "எதையும் செய்யும் முன், உங்களிடம் ஏற்கெனவே உள்ள எண்ணில் அந்த நபரை அழையுங்கள்.",
      verifyOfficial: "அதிகாரப்பூர்வ இணையத்தளம் அல்லது உங்கள் அட்டையில் உள்ள எண் மூலம் நீங்களே அந்த நிறுவனத்தைத் தொடர்புகொள்ளுங்கள்.",
      stopReplying: "அழைப்பைத் துண்டியுங்கள் அல்லது பதில் அனுப்புவதை நிறுத்துங்கள். உண்மையான அதிகாரிகள் வருத்தப்பட மாட்டார்கள்.",
      askFamily: "எதையும் செய்யும் முன் ஒரு குடும்ப உறுப்பினரிடம் கேளுங்கள்.",
      call1799: "உறுதியில்லையா? ScamShield உதவி எண் 1799-ஐ அழையுங்கள்.",
      stillCareful: "சரியாகத் தெரிகிறது, ஆனால் உங்களுக்குத் தெரியாதவர்களுக்குக் குறியீடுகளையோ பணத்தையோ ஒருபோதும் தர வேண்டாம்."
    }
  }
};

// Works in the browser (as a global) and in Node (with require)
if (typeof module === "object" && module.exports) {
  module.exports = WORDS;
} else {
  globalThis.TEXT_DETECTOR_WORDS = WORDS;
}
