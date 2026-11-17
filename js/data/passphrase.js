"use strict";

// Made-up data for: Family passphrase.
// Owner: Jiliana
// "who" values are translation keys; the words in English, Chinese and Malay are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.
// website-refresh: each passphrase now has the family member's name, relationship and
// (optional) mobile number, from the team's feedback.

const PASSPHRASE_DATA = {
  // The passphrase already saved when the demo starts (made-up person and number)
  saved: [
    { name: "Jun Hao", who: "pp.who.grandchild", phone: "9123 4567", word: "ondeh" }
  ],

  // The choices for "Relationship"
  who: ["pp.who.son", "pp.who.daughter", "pp.who.grandchild", "pp.who.spouse", "pp.who.other"],

  minLength: 3,   // the shortest passphrase allowed, in letters

  text: {
    en: {
      "pp.who.son": "Son",
      "pp.who.daughter": "Daughter",
      "pp.who.grandchild": "Grandchild",
      "pp.who.spouse": "Husband or wife",
      "pp.who.other": "Someone else",
      "pp.hidden": "hidden",
      "pp.show": "Show",
      "pp.hide": "Hide",
      "pp.forWho": " the passphrase for {who}",
      "pp.call": "Call",
      "pp.callWho": " {who}",
      "pp.title": "Family passphrase",
      "pp.how.title": "How it works",
      "pp.how.1": "You and your family agree on a secret word.",
      "pp.how.2": "If a caller says they are family and asks for money, ask for the word.",
      "pp.how.3": "An AI copy of their voice will not know it.",
      "pp.how.4": "The bank never sees the word. It stays with you.",
      "pp.listTitle": "Your passphrases",
      "pp.empty": "No passphrases yet.",
      "pp.addTitle": "Add a new one",
      "pp.nameLabel": "Their name",
      "pp.whoLabel": "Relationship",
      "pp.phoneLabel": "Their mobile number (optional)",
      "pp.phoneHint": "So you can call them back on a number you trust.",
      "pp.wordLabel": "Secret word",
      "pp.example": "Example: the name of your first pet.",
      "pp.hint": "Pick something only your family knows. Never post it online.",
      "pp.save": "Save passphrase",
      "pp.err.name": "Please type their name.",
      "pp.err.phone": "A mobile number has 8 digits, like 9123 4567.",
      "pp.err.short": "Please type a word with at least {min} letters.",
      "pp.saved": "Passphrase saved",
      "pp.savedFor": "Saved for {name}",
      "pp.savedTip": "Tell {name} the word in person, not by message."
    },
    zh: {
      "pp.who.son": "儿子",
      "pp.who.daughter": "女儿",
      "pp.who.grandchild": "孙子或孙女",
      "pp.who.spouse": "丈夫或妻子",
      "pp.who.other": "其他人",
      "pp.hidden": "已隐藏",
      "pp.show": "显示",
      "pp.hide": "隐藏",
      "pp.forWho": "{who}的暗号",
      "pp.call": "打电话",
      "pp.callWho": "给{who}",
      "pp.title": "家人暗号",
      "pp.how.title": "怎么用",
      "pp.how.1": "您和家人约好一个秘密词。",
      "pp.how.2": "如果有人打来说是家人，又要钱，就问他这个词。",
      "pp.how.3": "用 AI 模仿的声音不会知道。",
      "pp.how.4": "银行看不到这个词，它只留在您这里。",
      "pp.listTitle": "您的暗号",
      "pp.empty": "还没有暗号。",
      "pp.addTitle": "加一个新的",
      "pp.nameLabel": "对方的名字",
      "pp.whoLabel": "关系",
      "pp.phoneLabel": "对方的手机号码（可不填）",
      "pp.phoneHint": "方便您用信得过的号码打回给他。",
      "pp.wordLabel": "秘密词",
      "pp.example": "例如：您第一只宠物的名字。",
      "pp.hint": "选一个只有您家人知道的词。千万不要放上网。",
      "pp.save": "保存暗号",
      "pp.err.name": "请输入对方的名字。",
      "pp.err.phone": "手机号码有 8 个数字，例如 9123 4567。",
      "pp.err.short": "请输入至少 {min} 个字母的词。",
      "pp.saved": "暗号已保存",
      "pp.savedFor": "已为{name}保存",
      "pp.savedTip": "请当面告诉{name}这个词，不要用短信发。"
    },
    ms: {
      "pp.who.son": "Anak lelaki",
      "pp.who.daughter": "Anak perempuan",
      "pp.who.grandchild": "Cucu",
      "pp.who.spouse": "Suami atau isteri",
      "pp.who.other": "Orang lain",
      "pp.hidden": "tersembunyi",
      "pp.show": "Tunjuk",
      "pp.hide": "Sembunyi",
      "pp.forWho": " kata laluan untuk {who}",
      "pp.call": "Telefon",
      "pp.callWho": " {who}",
      "pp.title": "Kata laluan keluarga",
      "pp.how.title": "Cara ia berfungsi",
      "pp.how.1": "Anda dan keluarga setuju satu perkataan rahsia.",
      "pp.how.2": "Jika pemanggil kata dia keluarga dan minta wang, tanya perkataan itu.",
      "pp.how.3": "Suara tiruan AI tidak akan tahu.",
      "pp.how.4": "Bank tidak nampak perkataan itu. Ia kekal dengan anda.",
      "pp.listTitle": "Kata laluan anda",
      "pp.empty": "Belum ada kata laluan.",
      "pp.addTitle": "Tambah yang baharu",
      "pp.nameLabel": "Nama mereka",
      "pp.whoLabel": "Hubungan",
      "pp.phoneLabel": "Nombor telefon bimbit mereka (tidak wajib)",
      "pp.phoneHint": "Supaya anda boleh telefon semula melalui nombor yang anda percaya.",
      "pp.wordLabel": "Perkataan rahsia",
      "pp.example": "Contohnya: nama haiwan peliharaan pertama anda.",
      "pp.hint": "Pilih sesuatu yang hanya keluarga anda tahu. Jangan sekali-kali letak dalam talian.",
      "pp.save": "Simpan kata laluan",
      "pp.err.name": "Sila taip nama mereka.",
      "pp.err.phone": "Nombor telefon bimbit ada 8 digit, contohnya 9123 4567.",
      "pp.err.short": "Sila taip perkataan dengan sekurang-kurangnya {min} huruf.",
      "pp.saved": "Kata laluan disimpan",
      "pp.savedFor": "Disimpan untuk {name}",
      "pp.savedTip": "Beritahu {name} perkataan itu secara bersemuka, bukan melalui mesej."
    }
  }
};
