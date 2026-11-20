"use strict";

// Made-up data for: Someone is calling me now (the stress flow).
// Owner: SHARED (whole team)
// text: the screen's words in English, Chinese, Malay and Tamil (see "How to translate your screen" in
// TEAM-FILES.md). The Chinese, Malay and Tamil are AI-drafted and still need a native speaker to check them.

const CALLING_NOW_DATA = {
  text: {
    en: {
      "cn.safe.1": "Want to check with the bank? Call OCBC yourself.",
      "cn.safe.2": "Use the number on the back of your card.",
      "cn.safe.3": "Never call back the number that called you.",
      "cn.leave": "Back to home",
      "cn.stepOf": "Step {step} of 2",
      "cn.calm": "You are doing the right thing",
      "cn.hangUp.title": "Hang up the phone now.",
      "cn.hangUp.text": "It is safe to hang up. A real bank officer will not mind.",
      "cn.rule.code": "Do not share any code.",
      "cn.rule.money": "Do not send any money.",
      "cn.hungUp": "I have hung up",
      "cn.checkFirst": "Check who is calling first",
      "cn.q.title": "Did you give a code or send money?",
      "cn.q.text": "It is okay if you did. We can still help.",
      "cn.q.no": "No, I did not",
      "cn.q.yes": "Yes, I did",
      "cn.q.unsure": "I am not sure",
      "cn.back": "Back",
      "cn.safe.title": "Your money is safe.",
      "cn.safe.text": "If you want to check with the bank, call OCBC yourself. Use the number on the back of your card. Never call back the number that called you.",
      "cn.safe.tell": "Tell the bank about this call"
    },
    zh: {
      "cn.safe.1": "想向银行确认？自己打电话给 OCBC。",
      "cn.safe.2": "用卡背面的号码。",
      "cn.safe.3": "千万不要回拨打给您的号码。",
      "cn.leave": "离开",
      "cn.stepOf": "第 {step} 步，共 2 步",
      "cn.calm": "你做得很对",
      "cn.hangUp.title": "现在就挂电话。",
      "cn.hangUp.text": "挂电话是安全的。真正的银行职员不会介意。",
      "cn.rule.code": "不要给任何密码。",
      "cn.rule.money": "不要转任何钱。",
      "cn.hungUp": "我已经挂电话了",
      "cn.checkFirst": "我想先查一查是谁打来的",
      "cn.q.title": "你有没有给密码或转钱？",
      "cn.q.text": "如果有，也没关系。我们还是可以帮你。",
      "cn.q.no": "没有",
      "cn.q.yes": "有",
      "cn.q.unsure": "我不确定",
      "cn.back": "返回",
      "cn.safe.title": "你的钱很安全。",
      "cn.safe.text": "如果你想向银行确认，请自己打电话给 OCBC。用你银行卡背面的号码。千万不要回拨刚才打给你的号码。",
      "cn.safe.tell": "把这通电话告诉银行"
    },
    ms: {
      "cn.safe.1": "Mahu semak dengan bank? Telefon OCBC sendiri.",
      "cn.safe.2": "Gunakan nombor di belakang kad anda.",
      "cn.safe.3": "Jangan sekali-kali telefon semula nombor yang menelefon anda.",
      "cn.leave": "Keluar",
      "cn.stepOf": "Langkah {step} daripada 2",
      "cn.calm": "Anda buat perkara yang betul",
      "cn.hangUp.title": "Letak telefon sekarang.",
      "cn.hangUp.text": "Selamat untuk letak telefon. Pegawai bank sebenar tidak kisah.",
      "cn.rule.code": "Jangan beri apa-apa kod.",
      "cn.rule.money": "Jangan hantar apa-apa wang.",
      "cn.hungUp": "Saya sudah letak telefon",
      "cn.checkFirst": "Saya mahu semak siapa yang telefon dahulu",
      "cn.q.title": "Adakah anda beri kod atau hantar wang?",
      "cn.q.text": "Tidak apa jika anda sudah buat. Kami masih boleh bantu.",
      "cn.q.no": "Tidak, saya tidak buat",
      "cn.q.yes": "Ya, saya buat",
      "cn.q.unsure": "Saya tidak pasti",
      "cn.back": "Kembali",
      "cn.safe.title": "Wang anda selamat.",
      "cn.safe.text": "Jika anda mahu semak dengan bank, telefon OCBC sendiri. Gunakan nombor di belakang kad anda. Jangan sekali-kali telefon semula nombor yang telefon anda tadi.",
      "cn.safe.tell": "Beritahu bank tentang panggilan ini"
    },
    ta: {
      "cn.safe.1": "வங்கியிடம் சரிபார்க்க வேண்டுமா? நீங்களே OCBC-ஐ அழையுங்கள்.",
      "cn.safe.2": "உங்கள் அட்டையின் பின்புறம் உள்ள எண்ணைப் பயன்படுத்துங்கள்.",
      "cn.safe.3": "உங்களை அழைத்த எண்ணைத் திருப்பி அழைக்காதீர்கள்.",
      "cn.leave": "முகப்புக்குத் திரும்பு",
      "cn.stepOf": "படி {step} / 2",
      "cn.calm": "நீங்கள் சரியானதைச் செய்கிறீர்கள்",
      "cn.hangUp.title": "இப்போதே அழைப்பைத் துண்டியுங்கள்.",
      "cn.hangUp.text": "துண்டிப்பது பாதுகாப்பானது. உண்மையான வங்கி அதிகாரி வருத்தப்பட மாட்டார்.",
      "cn.rule.code": "எந்தக் குறியீட்டையும் பகிர வேண்டாம்.",
      "cn.rule.money": "எந்தப் பணத்தையும் அனுப்ப வேண்டாம்.",
      "cn.hungUp": "நான் துண்டித்துவிட்டேன்",
      "cn.checkFirst": "முதலில் யார் அழைக்கிறார் என்று சரிபார்",
      "cn.q.title": "நீங்கள் குறியீடு கொடுத்தீர்களா அல்லது பணம் அனுப்பினீர்களா?",
      "cn.q.text": "அப்படிச் செய்திருந்தாலும் பரவாயில்லை. நாங்கள் இன்னும் உதவ முடியும்.",
      "cn.q.no": "இல்லை, செய்யவில்லை",
      "cn.q.yes": "ஆம், செய்தேன்",
      "cn.q.unsure": "எனக்கு உறுதியாகத் தெரியவில்லை",
      "cn.back": "பின்செல்",
      "cn.safe.title": "உங்கள் பணம் பாதுகாப்பாக உள்ளது.",
      "cn.safe.text": "வங்கியிடம் சரிபார்க்க விரும்பினால், நீங்களே OCBC-ஐ அழையுங்கள். உங்கள் அட்டையின் பின்புறம் உள்ள எண்ணைப் பயன்படுத்துங்கள். உங்களை அழைத்த எண்ணைத் திருப்பி அழைக்காதீர்கள்.",
      "cn.safe.tell": "இந்த அழைப்பைப் பற்றி வங்கியிடம் சொல்லுங்கள்"
    }
  }
};
