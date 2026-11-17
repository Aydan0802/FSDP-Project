"use strict";

// Made-up data for: Coming soon.
// Owner: Aydan
// The menu items that aren't part of this prototype. js/features/coming-soon.js makes one
// "Coming soon" screen for each. role says who may open it (see js/core/access.js).
// title and text are translation keys; the words in English, Chinese and Malay are in text below
// (see "How to translate your screen" in TEAM-FILES.md).
// The Chinese and Malay are AI-drafted and still need a native speaker to check them.
// Note: staff screens always show English (t() in js/core/i18n.js), so the staff pages' Chinese
// and Malay are only used if that rule changes.

const COMING_SOON_DATA = {
  pages: [
    { route: "my-reports", role: "customer", title: "soon.myReports.title", text: "soon.myReports.text" },
    { route: "help", role: "customer", title: "soon.help.title", text: "soon.help.text" },
    { route: "staff-trends", role: "staff", title: "soon.trends.title", text: "soon.trends.text" },
    { route: "staff-scam-types", role: "staff", title: "soon.scamTypes.title", text: "soon.scamTypes.text" },
    { route: "staff-settings", role: "staff", title: "soon.settings.title", text: "soon.settings.text" }
  ],

  text: {
    en: {
      "soon.withText": "Coming soon. {text}",
      "soon.backOverview": "Back to overview",
      "soon.myReports.title": "My reports",
      "soon.myReports.text": "See the scams you have reported and what the bank did about them.",
      "soon.help.title": "Help",
      "soon.help.text": "Answers to common questions, and how to reach the bank.",
      "soon.trends.title": "Trends",
      "soon.trends.text": "How scam reports change over weeks and months.",
      "soon.scamTypes.title": "Scam types",
      "soon.scamTypes.text": "The kinds of scams being reported, and how often.",
      "soon.settings.title": "Settings",
      "soon.settings.text": "Your staff account and alert settings."
    },
    zh: {
      "soon.withText": "即将推出。{text}",
      "soon.backOverview": "回到总览",
      "soon.myReports.title": "我的举报",
      "soon.myReports.text": "查看你举报过的诈骗，还有银行做了什么。",
      "soon.help.title": "帮助",
      "soon.help.text": "常见问题的答案，还有怎样联系银行。",
      "soon.trends.title": "趋势",
      "soon.trends.text": "诈骗举报在几个星期、几个月里怎样变化。",
      "soon.scamTypes.title": "诈骗种类",
      "soon.scamTypes.text": "被举报的诈骗有哪些种类，有多常见。",
      "soon.settings.title": "设置",
      "soon.settings.text": "你的职员户口和提醒设置。"
    },
    ms: {
      "soon.withText": "Akan datang. {text}",
      "soon.backOverview": "Kembali ke gambaran keseluruhan",
      "soon.myReports.title": "Laporan saya",
      "soon.myReports.text": "Lihat penipuan yang anda laporkan dan apa yang bank sudah buat.",
      "soon.help.title": "Bantuan",
      "soon.help.text": "Jawapan kepada soalan biasa, dan cara menghubungi bank.",
      "soon.trends.title": "Trend",
      "soon.trends.text": "Bagaimana laporan penipuan berubah dari minggu ke minggu dan bulan ke bulan.",
      "soon.scamTypes.title": "Jenis penipuan",
      "soon.scamTypes.text": "Jenis penipuan yang dilaporkan, dan berapa kerap.",
      "soon.settings.title": "Tetapan",
      "soon.settings.text": "Akaun kakitangan dan tetapan amaran anda."
    }
  }
};
