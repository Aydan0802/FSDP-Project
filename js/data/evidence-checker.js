"use strict";

// Made-up data for: Evidence checker (screenshots, photos, letters and documents).
// Owner: Yan Lin
// PLACEHOLDER: the results are written by hand, one per kind of file. Nothing is really looked
// at yet. A real image/document checker would hand back results in this same shape.
// The screen that shows them is the "Check anything" screen (js/features/analyser.js).
//
// Languages: every label, step, title and reason below is a translation key, not the words.
// The words in English, Chinese and Malay are in text at the bottom, and the screen shows them
// with t() (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.

const EVIDENCE_CHECKER_DATA = {
  // The two kinds of file this checker handles: what to call them, their icon, and the three
  // "checking" steps shown while they are checked
  kinds: {
    screenshot: {
      label: "ev.kind.screenshot", icon: "image",
      steps: ["ev.kind.screenshot.step1", "ev.kind.screenshot.step2", "ev.kind.screenshot.step3"]
    },
    document: {
      label: "ev.kind.document", icon: "document",
      steps: ["ev.kind.document.step1", "ev.kind.document.step2", "ev.kind.document.step3"]
    }
  },

  // One result per kind. result is one of the five RESULTS keys (js/core/helpers.js).
  results: {
    screenshot: {
      result: "likely",
      title: "ev.screenshot.title",
      reasons: [
        "ev.screenshot.reason1",
        "ev.screenshot.reason2",
        "ev.screenshot.reason3"
      ],
      steps: [
        "ev.screenshot.step1",
        "ev.screenshot.step2",
        "ev.screenshot.step3"
      ]
    },
    document: {
      result: "uncertain",
      title: "ev.document.title",
      reasons: [
        "ev.document.reason1",
        "ev.document.reason2",
        "ev.document.reason3"
      ],
      steps: [
        "ev.document.step1",
        "ev.document.step2",
        "ev.document.step3"
      ]
    }
  },

  // NEW (1): Dynamic outcomes mapped from TextDetector risk ("high" | "medium" | "low") & OCR errors
  outcomes: {
    high: {
      result: "likely",
      title: "ev.ocr.scam.title",
      reasons: ["ev.ocr.scam.reason1"],
      steps: ["ev.ocr.scam.step1", "ev.ocr.scam.step2"]
    },
    medium: {
      result: "uncertain",
      title: "ev.ocr.suspicious.title",
      reasons: ["ev.ocr.suspicious.reason1"],
      steps: ["ev.ocr.suspicious.step1", "ev.ocr.suspicious.step2"]
    },
    low: {
      result: "real",
      title: "ev.ocr.clean.title",
      reasons: ["ev.ocr.clean.reason1"],
      steps: ["ev.ocr.clean.step1"]
    },
    noFile: {
      result: "uncertain",
      title: "ev.err.noFile.title",
      reasons: ["ev.err.noFile.reason1"],
      steps: ["ev.err.noFile.step1"]
    },
    ocrUnavailable: {
      result: "uncertain",
      title: "ev.err.ocrUnavailable.title",
      reasons: ["ev.err.ocrUnavailable.reason1"],
      steps: ["ev.err.ocrUnavailable.step1"]
    },
    emptyText: {
      result: "uncertain",
      title: "ev.err.emptyText.title",
      reasons: ["ev.err.emptyText.reason1"],
      steps: ["ev.err.emptyText.step1"]
    }
  },

  // Sample files for the "Try a sample" buttons.
  // NEW (2): Added sampleText so clicking a sample feeds real text into TextDetector
  samples: [
    {
      kind: "screenshot",
      label: "ev.sample.screenshot",
      name: "transfer_receipt.png",
      sampleText: "OCBC Alert: Unusual login detected. Verify your account immediately at http://ocbc-secure-sg.example or $2,400 will be deducted."
    },
    {
      kind: "document",
      label: "ev.sample.document",
      name: "OCBC_letter.pdf",
      sampleText: "OCBC Bank Notice: Please reply to our officer via WhatsApp at +65 8123 4567 immediately to avoid account suspension."
    }
  ],

  text: {
    en: {
      "ev.kind.screenshot": "Screenshot or photo",
      "ev.kind.screenshot.step1": "Reading the words in the picture",
      "ev.kind.screenshot.step2": "Looking for signs it was edited",
      "ev.kind.screenshot.step3": "Checking links and logos",
      "ev.kind.document": "Letter or document",
      "ev.kind.document.step1": "Reading the document",
      "ev.kind.document.step2": "Checking the letterhead and signature",
      "ev.kind.document.step3": "Checking phone numbers and links",
      "ev.screenshot.title": "This picture was likely edited",
      "ev.screenshot.reason1": "The numbers near the amount use a different font.",
      "ev.screenshot.reason2": "The OCBC logo is blurry and the wrong shade of red.",
      "ev.screenshot.reason3": "The link in it goes to ocbc-secure-sg.example, not ocbc.com.",
      "ev.screenshot.step1": "Do not send money because of this picture.",
      "ev.screenshot.step2": "Do not tap any link or call any number in it.",
      "ev.screenshot.step3": "Check your account in the OCBC app yourself.",
      "ev.document.title": "Please be careful with this letter",
      "ev.document.reason1": "The letterhead looks normal.",
      "ev.document.reason2": "But the phone number on it is not an OCBC number.",
      "ev.document.reason3": "It asks you to reply by WhatsApp. OCBC letters will not do that.",
      "ev.document.step1": "Do not call the number on the letter.",
      "ev.document.step2": "Call OCBC yourself on the number on the back of your card.",
      "ev.document.step3": "Ask the bank if the letter is real before you do anything it says.",
      "ev.sample.screenshot": "Sample screenshot",
      "ev.sample.document": "Sample letter",
      "ev.redirect.title": "Check anything you are not sure about",
      "ev.redirect.text": "Opening the checker…",

      // NEW (3): Translations for extracted-text outcomes & errors
      "ev.ocr.scam.title": "Strong scam warning signs found in the words",
      "ev.ocr.scam.reason1": "The text in this file uses urgent threats, suspicious links, or asks you to contact an unofficial number.",
      "ev.ocr.scam.step1": "Do not tap any link, call any number, or send money.",
      "ev.ocr.scam.step2": "Call OCBC yourself on 1800 363 3333 to check.",
      "ev.ocr.suspicious.title": "Some suspicious wording found in this file",
      "ev.ocr.suspicious.reason1": "Parts of the text look unusual or try to rush you.",
      "ev.ocr.suspicious.step1": "Do not reply or pay yet.",
      "ev.ocr.suspicious.step2": "Check directly with the official app or hotline first.",
      "ev.ocr.clean.title": "No obvious scam signs found in the text",
      "ev.ocr.clean.reason1": "The words extracted from this file did not match common scam patterns.",
      "ev.ocr.clean.step1": "Still stay careful and never share your OTP or Singpass details.",
      "ev.err.noFile.title": "Could not read the uploaded file",
      "ev.err.noFile.reason1": "The file data was not passed to the checker yet.",
      "ev.err.noFile.step1": "Please choose the file again or paste the text directly.",
      "ev.err.ocrUnavailable.title": "Cannot read text from this file type yet",
      "ev.err.ocrUnavailable.reason1": "The on-device picture or PDF reader is not loaded yet.",
      "ev.err.ocrUnavailable.step1": "Paste the words from the message into the text checker instead.",
      "ev.err.emptyText.title": "No readable words found",
      "ev.err.emptyText.reason1": "We could not find clear text inside this picture or document.",
      "ev.err.emptyText.step1": "Try a clearer screenshot or paste the text directly."
    },
    zh: {
      "ev.kind.screenshot": "截图或照片",
      "ev.kind.screenshot.step1": "正在读图片里的文字",
      "ev.kind.screenshot.step2": "正在找被修改过的痕迹",
      "ev.kind.screenshot.step3": "正在检查链接和标志",
      "ev.kind.document": "信件或文件",
      "ev.kind.document.step1": "正在读这份文件",
      "ev.kind.document.step2": "正在检查信头和签名",
      "ev.kind.document.step3": "正在检查电话号码和链接",
      "ev.screenshot.title": "这张图片很可能被改过",
      "ev.screenshot.reason1": "金额旁边的数字字体不一样。",
      "ev.screenshot.reason2": "OCBC 的标志很模糊，红色也不对。",
      "ev.screenshot.reason3": "里面的链接去 ocbc-secure-sg.example，不是 ocbc.com。",
      "ev.screenshot.step1": "不要因为这张图片转钱。",
      "ev.screenshot.step2": "不要按里面的链接，也不要打里面的电话。",
      "ev.screenshot.step3": "自己打开 OCBC 应用程序查看你的户口。",
      "ev.document.title": "这封信请小心",
      "ev.document.reason1": "信头看起来正常。",
      "ev.document.reason2": "但是上面的电话号码不是 OCBC 的号码。",
      "ev.document.reason3": "信里叫你用 WhatsApp 回复。OCBC 的信不会这样做。",
      "ev.document.step1": "不要打信上的电话号码。",
      "ev.document.step2": "用你银行卡背面的号码，自己打电话给 OCBC。",
      "ev.document.step3": "照信上说的做任何事之前，先问银行这封信是不是真的。",
      "ev.sample.screenshot": "示范截图",
      "ev.sample.document": "示范信件",
      "ev.redirect.title": "检查任何你不确定的东西",
      "ev.redirect.text": "正在打开检查工具…",

      // NEW (3): Chinese translations
      "ev.ocr.scam.title": "文字里发现明显的诈骗警告信号",
      "ev.ocr.scam.reason1": "文件里的文字包含紧急威胁、可疑链接，或要求你联系非官方号码。",
      "ev.ocr.scam.step1": "不要点击任何链接、拨打电话或转账。",
      "ev.ocr.scam.step2": "自己拨打 OCBC 热线 1800 363 3333 核实。",
      "ev.ocr.suspicious.title": "文件里发现一些可疑字眼",
      "ev.ocr.suspicious.reason1": "部分文字看起来不寻常或催促你马上行动。",
      "ev.ocr.suspicious.step1": "先不要回复或付款。",
      "ev.ocr.suspicious.step2": "先通过官方应用程序或热线确认。",
      "ev.ocr.clean.title": "文字里没有发现明显的诈骗信号",
      "ev.ocr.clean.reason1": "提取出的文字没有触发常见的诈骗警告。",
      "ev.ocr.clean.step1": "仍请保持警惕，切勿透露 OTP 或 Singpass 资料。",
      "ev.err.noFile.title": "无法读取上传的文件",
      "ev.err.noFile.reason1": "文件数据尚未传给检查工具。",
      "ev.err.noFile.step1": "请重新选择文件，或直接粘贴文字检查。",
      "ev.err.ocrUnavailable.title": "暂无法读取此类文件的文字",
      "ev.err.ocrUnavailable.reason1": "本地图片或 PDF 阅读工具尚未加载。",
      "ev.err.ocrUnavailable.step1": "请改为把消息文字复制粘贴到文字检查器中。",
      "ev.err.emptyText.title": "未找到可读取的文字",
      "ev.err.emptyText.reason1": "我们无法在这张图片或文件中识别出清晰文字。",
      "ev.err.emptyText.step1": "请换一张更清晰的截图，或直接粘贴文字。"
    },
    ms: {
      "ev.kind.screenshot": "Tangkapan skrin atau foto",
      "ev.kind.screenshot.step1": "Membaca perkataan dalam gambar",
      "ev.kind.screenshot.step2": "Mencari tanda gambar ini telah diubah",
      "ev.kind.screenshot.step3": "Menyemak pautan dan logo",
      "ev.kind.document": "Surat atau dokumen",
      "ev.kind.document.step1": "Membaca dokumen",
      "ev.kind.document.step2": "Menyemak kepala surat dan tandatangan",
      "ev.kind.document.step3": "Menyemak nombor telefon dan pautan",
      "ev.screenshot.title": "Gambar ini mungkin telah diubah",
      "ev.screenshot.reason1": "Nombor di sebelah jumlah wang menggunakan fon yang berbeza.",
      "ev.screenshot.reason2": "Logo OCBC kabur dan warna merahnya tidak betul.",
      "ev.screenshot.reason3": "Pautan di dalamnya pergi ke ocbc-secure-sg.example, bukan ocbc.com.",
      "ev.screenshot.step1": "Jangan hantar wang kerana gambar ini.",
      "ev.screenshot.step2": "Jangan tekan apa-apa pautan atau telefon apa-apa nombor di dalamnya.",
      "ev.screenshot.step3": "Semak akaun anda sendiri dalam aplikasi OCBC.",
      "ev.document.title": "Sila berhati-hati dengan surat ini",
      "ev.document.reason1": "Kepala surat nampak biasa.",
      "ev.document.reason2": "Tetapi nombor telefon di atasnya bukan nombor OCBC.",
      "ev.document.reason3": "Surat ini minta anda balas melalui WhatsApp. Surat OCBC tidak akan buat begitu.",
      "ev.document.step1": "Jangan telefon nombor pada surat itu.",
      "ev.document.step2": "Telefon OCBC sendiri menggunakan nombor di belakang kad anda.",
      "ev.document.step3": "Tanya bank sama ada surat itu betul sebelum anda buat apa-apa yang disuruh.",
      "ev.sample.screenshot": "Contoh tangkapan skrin",
      "ev.sample.document": "Contoh surat",
      "ev.redirect.title": "Semak apa sahaja yang anda tidak pasti",
      "ev.redirect.text": "Sedang membuka penyemak…",

      // NEW (3): Malay translations
      "ev.ocr.scam.title": "Tanda amaran penipuan ditemui dalam teks",
      "ev.ocr.scam.reason1": "Teks dalam fail ini mengandungi ugutan segera, pautan mencurigakan, atau meminta anda hubungi nombor tidak rasmi.",
      "ev.ocr.scam.step1": "Jangan tekan mana-mana pautan, telefon mana-mana nombor, atau hantar wang.",
      "ev.ocr.scam.step2": "Telefon OCBC sendiri di 1800 363 3333 untuk semak.",
      "ev.ocr.suspicious.title": "Beberapa ayat mencurigakan ditemui",
      "ev.ocr.suspicious.reason1": "Sebahagian teks kelihatan luar biasa atau cuba menggesa anda.",
      "ev.ocr.suspicious.step1": "Jangan balas atau bayar lagi.",
      "ev.ocr.suspicious.step2": "Semak terus melalui aplikasi rasmi atau talian hotline dahulu.",
      "ev.ocr.clean.title": "Tiada tanda penipuan ketara dalam teks",
      "ev.ocr.clean.reason1": "Perkataan yang dibaca daripada fail ini tidak sepadan dengan corak penipuan biasa.",
      "ev.ocr.clean.step1": "Tetap berhati-hati dan jangan sekali-kali kongsi OTP atau maklumat Singpass anda.",
      "ev.err.noFile.title": "Fail yang dimuat naik tidak dapat dibaca",
      "ev.err.noFile.reason1": "Data fail belum dihantar kepada penyemak.",
      "ev.err.noFile.step1": "Sila pilih fail semula atau tampal teks secara terus.",
      "ev.err.ocrUnavailable.title": "Belum dapat membaca teks daripada jenis fail ini",
      "ev.err.ocrUnavailable.reason1": "Pembaca gambar atau PDF pada peranti belum dimuatkan.",
      "ev.err.ocrUnavailable.step1": "Tampal perkataan daripada mesej ke dalam penyemak teks.",
      "ev.err.emptyText.title": "Tiada perkataan yang boleh dibaca ditemui",
      "ev.err.emptyText.reason1": "Kami tidak menemui teks yang jelas dalam gambar atau dokumen ini.",
      "ev.err.emptyText.step1": "Cuba tangkapan skrin yang lebih jelas atau tampal teks secara terus."
    }
  }
};