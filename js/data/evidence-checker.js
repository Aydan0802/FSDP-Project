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

  // Sample files for the "Try a sample" buttons. Only the name is used.
  samples: [
    { kind: "screenshot", label: "ev.sample.screenshot", name: "transfer_receipt.png" },
    { kind: "document", label: "ev.sample.document", name: "OCBC_letter.pdf" }
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
      "ev.redirect.text": "Opening the checker…"
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
      "ev.redirect.text": "正在打开检查工具…"
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
      "ev.redirect.text": "Sedang membuka penyemak…"
    }
  }
};
