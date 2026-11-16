"use strict";

// Made-up data for: Family passphrase.
// Owner: Jiliana
// "who" values are translation keys; the words in English, Chinese and Malay are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.

const PASSPHRASE_DATA = {
  // The passphrase already saved when the demo starts
  saved: [
    { who: "pp.saved.grandson", word: "ondeh" }
  ],

  // The choices for "Who is it for?"
  who: ["pp.who.son", "pp.who.daughter", "pp.who.grandchild", "pp.who.spouse", "pp.who.other"],

  minLength: 3,   // the shortest passphrase allowed, in letters

  text: {
    en: {
      "pp.saved.grandson": "Grandson (Jun Hao)",
      "pp.who.son": "Son",
      "pp.who.daughter": "Daughter",
      "pp.who.grandchild": "Grandchild",
      "pp.who.spouse": "Husband or wife",
      "pp.who.other": "Someone else",
      "pp.hidden": "hidden",
      "pp.show": "Show",
      "pp.hide": "Hide",
      "pp.forWho": " the passphrase for {who}",
      "pp.title": "Family passphrase",
      "pp.lead": "Agree on a secret word with your family. If someone calls saying they are your family and need money, ask for the word. An AI copy of their voice will not know it.",
      "pp.listTitle": "Your passphrases",
      "pp.addTitle": "Add a new one",
      "pp.whoLabel": "Who is it for?",
      "pp.wordLabel": "Secret word",
      "pp.placeholder": "For example: the name of your first pet",
      "pp.hint": "Pick something only your family knows. Never post it online.",
      "pp.save": "Save passphrase",
      "pp.err.short": "Please type a word with at least {min} letters.",
      "pp.saved": "Passphrase saved"
    },
    zh: {
      "pp.saved.grandson": "孙子（俊豪）",
      "pp.who.son": "儿子",
      "pp.who.daughter": "女儿",
      "pp.who.grandchild": "孙子或孙女",
      "pp.who.spouse": "丈夫或妻子",
      "pp.who.other": "其他人",
      "pp.hidden": "已隐藏",
      "pp.show": "显示",
      "pp.hide": "隐藏",
      "pp.forWho": "{who}的暗号",
      "pp.title": "家人暗号",
      "pp.lead": "和家人约好一个秘密词。如果有人打电话说是你的家人，又要钱，就问他这个词。用 AI 模仿的声音不会知道。",
      "pp.listTitle": "你的暗号",
      "pp.addTitle": "加一个新的",
      "pp.whoLabel": "这是给谁的？",
      "pp.wordLabel": "秘密词",
      "pp.placeholder": "例如：你第一只宠物的名字",
      "pp.hint": "选一个只有你家人知道的词。千万不要放上网。",
      "pp.save": "保存暗号",
      "pp.err.short": "请输入至少 {min} 个字母的词。",
      "pp.saved": "暗号已保存"
    },
    ms: {
      "pp.saved.grandson": "Cucu lelaki (Jun Hao)",
      "pp.who.son": "Anak lelaki",
      "pp.who.daughter": "Anak perempuan",
      "pp.who.grandchild": "Cucu",
      "pp.who.spouse": "Suami atau isteri",
      "pp.who.other": "Orang lain",
      "pp.hidden": "tersembunyi",
      "pp.show": "Tunjuk",
      "pp.hide": "Sembunyi",
      "pp.forWho": " kata laluan untuk {who}",
      "pp.title": "Kata laluan keluarga",
      "pp.lead": "Setuju satu perkataan rahsia dengan keluarga anda. Jika ada orang telefon kata dia keluarga anda dan perlukan wang, tanya perkataan itu. Suara tiruan AI tidak akan tahu.",
      "pp.listTitle": "Kata laluan anda",
      "pp.addTitle": "Tambah yang baharu",
      "pp.whoLabel": "Untuk siapa?",
      "pp.wordLabel": "Perkataan rahsia",
      "pp.placeholder": "Contohnya: nama haiwan peliharaan pertama anda",
      "pp.hint": "Pilih sesuatu yang hanya keluarga anda tahu. Jangan sekali-kali letak dalam talian.",
      "pp.save": "Simpan kata laluan",
      "pp.err.short": "Sila taip perkataan dengan sekurang-kurangnya {min} huruf.",
      "pp.saved": "Kata laluan disimpan"
    }
  }
};
