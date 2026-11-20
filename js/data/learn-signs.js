"use strict";

// Made-up data for: Learn the signs.
// Owner: Jiliana
// The words are translation keys; the English, Chinese, Malay and Tamil are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.

const LEARN_SIGNS_DATA = {
  // The four signs of a scam call: [icon, title, explanation]
  signs: [
    { icon: "clock", title: "ls.sign.rush.title", text: "ls.sign.rush.text" },
    { icon: "key", title: "ls.sign.otp.title", text: "ls.sign.otp.text" },
    { icon: "transfer", title: "ls.sign.safeAccount.title", text: "ls.sign.safeAccount.text" },
    { icon: "lock", title: "ls.sign.secret.title", text: "ls.sign.secret.text" }
  ],

  // One practice question. answer is the id of the right option.
  // A wrong option can have its own explanation (why); otherwise the general "wrong" one shows.
  quiz: {
    question: "ls.quiz.question",
    options: [
      { id: "a", text: "ls.quiz.a" },
      { id: "b", text: "ls.quiz.b" },
      { id: "c", text: "ls.quiz.c", why: "ls.quiz.wrongStaff" }
    ],
    answer: "b",
    right: "ls.quiz.right",
    wrong: "ls.quiz.wrong"
  },

  tip: "ls.tip",

  text: {
    en: {
      "ls.title": "4 signs of a scam call",
      "ls.lead": "If you notice even one of these, hang up.",
      "ls.sign.rush.title": "They rush you",
      "ls.sign.rush.text": "\"You must do it now, or your account will be closed.\" Real banks give you time.",
      "ls.sign.otp.title": "They ask for your OTP or PIN",
      "ls.sign.otp.text": "OCBC will never ask for these. Not by phone, SMS or email.",
      "ls.sign.safeAccount.title": "They ask you to move money to a \"safe account\"",
      "ls.sign.safeAccount.text": "There is no such thing. This is always a scam.",
      "ls.sign.secret.title": "They tell you to keep it a secret",
      "ls.sign.secret.text": "Scammers do not want you to ask your family or the bank.",
      "ls.tryOne": "Try one",
      "ls.quiz.question": "A caller says he is from the police. He says you must move your money now to protect it. What do you do?",
      "ls.quiz.a": "Move the money quickly to keep it safe",
      "ls.quiz.b": "Hang up, then call the police or the bank yourself",
      "ls.quiz.c": "Ask the caller for their staff number and continue",
      "ls.correct": "Correct",
      "ls.notQuite": "Not quite",
      "ls.quiz.right": "Always hang up and call back on a number you found yourself.",
      "ls.quiz.wrong": "The police and the bank will never ask you to move money. Hang up and call them yourself.",
      "ls.quiz.wrongStaff": "Anyone can make up a staff number, so it proves nothing. Hang up and call the police or the bank yourself.",
      "ls.goodToKnow": "Good to know",
      "ls.tip": "A real bank officer will never ask you to move money to a \"safe account\", or to share your one-time password (OTP)."
    },
    zh: {
      "ls.title": "诈骗电话的 4 个迹象",
      "ls.lead": "只要发现其中一个，就挂电话。",
      "ls.sign.rush.title": "他们催你",
      "ls.sign.rush.text": "“你一定要马上做，不然你的户口会被关掉。”真正的银行会给你时间。",
      "ls.sign.otp.title": "他们问你的 OTP 或 PIN",
      "ls.sign.otp.text": "OCBC 绝对不会问这些，不管是电话、短信还是电邮。",
      "ls.sign.safeAccount.title": "他们叫你把钱转到“安全户口”",
      "ls.sign.safeAccount.text": "根本没有这种东西。这一定是骗局。",
      "ls.sign.secret.title": "他们叫你保守秘密",
      "ls.sign.secret.text": "骗子不想让你去问家人或银行。",
      "ls.tryOne": "试一试",
      "ls.quiz.question": "有人打电话说他是警察，说你一定要马上把钱转走，才能保护你的钱。你会怎么做？",
      "ls.quiz.a": "赶快把钱转走，保护好它",
      "ls.quiz.b": "挂电话，然后自己打电话给警察或银行",
      "ls.quiz.c": "问对方的职员号码，然后继续",
      "ls.correct": "答对了",
      "ls.notQuite": "不太对",
      "ls.quiz.right": "一定要先挂电话，再用你自己找到的号码打回去。",
      "ls.quiz.wrong": "警察和银行绝对不会叫你转钱。请挂电话，然后自己打给他们。",
      "ls.quiz.wrongStaff": "谁都可以编一个职员号码，所以这证明不了什么。请挂电话，然后自己打给警察或银行。",
      "ls.goodToKnow": "小提醒",
      "ls.tip": "真正的银行职员绝对不会叫你把钱转到“安全户口”，也不会叫你说出一次性密码（OTP）。"
    },
    ms: {
      "ls.title": "4 tanda panggilan penipuan",
      "ls.lead": "Jika anda nampak walaupun satu daripada ini, letak telefon.",
      "ls.sign.rush.title": "Mereka mendesak anda",
      "ls.sign.rush.text": "\"Anda mesti buat sekarang, atau akaun anda akan ditutup.\" Bank sebenar beri anda masa.",
      "ls.sign.otp.title": "Mereka minta OTP atau PIN anda",
      "ls.sign.otp.text": "OCBC tidak akan sekali-kali minta ini. Tidak melalui telefon, SMS atau e-mel.",
      "ls.sign.safeAccount.title": "Mereka suruh anda pindahkan wang ke \"akaun selamat\"",
      "ls.sign.safeAccount.text": "Tiada benda seperti itu. Ini sentiasa penipuan.",
      "ls.sign.secret.title": "Mereka suruh anda rahsiakannya",
      "ls.sign.secret.text": "Penipu tidak mahu anda tanya keluarga atau bank.",
      "ls.tryOne": "Cuba satu",
      "ls.quiz.question": "Seorang pemanggil kata dia dari polis. Dia kata anda mesti pindahkan wang anda sekarang untuk melindunginya. Apa yang anda buat?",
      "ls.quiz.a": "Pindahkan wang cepat-cepat supaya selamat",
      "ls.quiz.b": "Letak telefon, kemudian telefon polis atau bank sendiri",
      "ls.quiz.c": "Tanya nombor kakitangan pemanggil dan teruskan",
      "ls.correct": "Betul",
      "ls.notQuite": "Belum tepat",
      "ls.quiz.right": "Sentiasa letak telefon dan telefon semula nombor yang anda cari sendiri.",
      "ls.quiz.wrong": "Polis dan bank tidak akan sekali-kali suruh anda pindahkan wang. Letak telefon dan telefon mereka sendiri.",
      "ls.quiz.wrongStaff": "Sesiapa pun boleh reka nombor kakitangan, jadi ia tidak membuktikan apa-apa. Letak telefon dan telefon polis atau bank sendiri.",
      "ls.goodToKnow": "Perlu tahu",
      "ls.tip": "Pegawai bank sebenar tidak akan sekali-kali suruh anda pindahkan wang ke \"akaun selamat\", atau minta kata laluan sekali guna (OTP) anda."
    },
    ta: {
      "ls.title": "மோசடி அழைப்பின் 4 அறிகுறிகள்",
      "ls.lead": "இவற்றில் ஒன்றைக் கவனித்தாலும், அழைப்பைத் துண்டியுங்கள்.",
      "ls.sign.rush.title": "அவர்கள் உங்களை அவசரப்படுத்துகிறார்கள்",
      "ls.sign.rush.text": "\"இப்போதே செய்ய வேண்டும், இல்லையென்றால் உங்கள் கணக்கு மூடப்படும்.\" உண்மையான வங்கிகள் உங்களுக்கு நேரம் தரும்.",
      "ls.sign.otp.title": "உங்கள் OTP அல்லது PIN-ஐக் கேட்கிறார்கள்",
      "ls.sign.otp.text": "OCBC இவற்றை ஒருபோதும் கேட்காது. தொலைபேசி, SMS அல்லது மின்னஞ்சல் எதிலும் கேட்காது.",
      "ls.sign.safeAccount.title": "பணத்தை ஒரு \"பாதுகாப்பான கணக்குக்கு\" மாற்றச் சொல்கிறார்கள்",
      "ls.sign.safeAccount.text": "அப்படி ஒன்று கிடையாது. இது எப்போதும் மோசடிதான்.",
      "ls.sign.secret.title": "இதை ரகசியமாக வைக்கச் சொல்கிறார்கள்",
      "ls.sign.secret.text": "நீங்கள் குடும்பத்தினரிடமோ வங்கியிடமோ கேட்பதை மோசடிக்காரர்கள் விரும்புவதில்லை.",
      "ls.tryOne": "ஒன்றை முயலுங்கள்",
      "ls.quiz.question": "ஒருவர் தான் காவல்துறையைச் சேர்ந்தவர் என்று சொல்கிறார். உங்கள் பணத்தைப் பாதுகாக்க இப்போதே அதை மாற்ற வேண்டும் என்கிறார். நீங்கள் என்ன செய்வீர்கள்?",
      "ls.quiz.a": "பணம் பாதுகாப்பாக இருக்க விரைவாக மாற்றுவேன்",
      "ls.quiz.b": "அழைப்பைத் துண்டித்து, நானே காவல்துறையையோ வங்கியையோ அழைப்பேன்",
      "ls.quiz.c": "அழைப்பவரின் ஊழியர் எண்ணைக் கேட்டுவிட்டுத் தொடர்வேன்",
      "ls.correct": "சரி",
      "ls.notQuite": "சரியில்லை",
      "ls.quiz.right": "எப்போதும் அழைப்பைத் துண்டித்து, நீங்களே கண்டுபிடித்த எண்ணில் திருப்பி அழையுங்கள்.",
      "ls.quiz.wrong": "காவல்துறையும் வங்கியும் உங்களைப் பணத்தை மாற்றச் சொல்லவே மாட்டார்கள். அழைப்பைத் துண்டித்து, நீங்களே அவர்களை அழையுங்கள்.",
      "ls.quiz.wrongStaff": "யார் வேண்டுமானாலும் ஒரு ஊழியர் எண்ணைச் சொல்லலாம், அதனால் அது எதையும் நிரூபிக்காது. அழைப்பைத் துண்டித்து, நீங்களே காவல்துறையையோ வங்கியையோ அழையுங்கள்.",
      "ls.goodToKnow": "தெரிந்துகொள்வது நல்லது",
      "ls.tip": "உண்மையான வங்கி அதிகாரி பணத்தை ஒரு \"பாதுகாப்பான கணக்குக்கு\" மாற்றச் சொல்லவோ, உங்கள் ஒருமுறைக் கடவுச்சொல்லை (OTP) பகிரச் சொல்லவோ மாட்டார்."
    }
  }
};
