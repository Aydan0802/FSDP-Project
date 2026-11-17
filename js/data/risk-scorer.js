"use strict";

// Made-up data and settings for: Transfer risk scorer.
// Owner: Jose
//
// RISK_SCORER_DATA.config is the ONE place the risk weights, rule limits and score bands live
// (Jira FSDP-130 R-1 and FSDP-133 R-4). The scorer (browser and server) reads them from here,
// so changing a number here changes it everywhere. Nothing else should hard-code them.
// Documented for the team in docs/risk-scorer.md.
//
// STATUS: working weights, approved by Jose on 12 Nov 2026. They may change after team review.

const RISK_SCORER_DATA = {
  config: {
    // ---------- Signals (R-1) ----------
    // Each signal: an id, a weight (points added to the score when it fires), the rule that
    // makes it fire, and a plain-English reason shown to the customer and to staff.
    // The weights add up to more than 100 on purpose: the score is capped at 100, so a transfer
    // that shows most of the warning signs lands at the top.
    // Listed strongest first. When two signals have the same weight, this order breaks the tie,
    // so the "top reasons" are always the same for the same transfer.
    signals: [
      {
        id: "flaggedPayee",
        label: "Flagged payee",
        weight: 45,
        rule: "The payee's account has been reported for scams before.",
        reason: "This account has been reported for scams by other people."
      },
      {
        id: "amountVsUsual",
        label: "Amount vs usual",
        weight: 25,
        rule: "The amount is at least 3 times the customer's usual transfer.",
        reason: "This is much more money than you usually send."
      },
      {
        id: "recentlyAddedPayee",
        label: "Recently added payee",
        weight: 20,
        rule: "The payee was added in the last 24 hours.",
        reason: "You added this payee less than a day ago."
      },
      {
        id: "rapidRepeat",
        label: "Rapid repeat transfers",
        weight: 20,
        rule: "This is the 3rd or later transfer in the last 30 minutes.",
        reason: "You have made several transfers in a short time."
      },
      {
        id: "newPayee",
        label: "New payee",
        weight: 15,
        rule: "The customer has never sent money to this payee before.",
        reason: "You have never sent money to this person before."
      },
      {
        id: "oddHour",
        label: "Odd hour",
        weight: 10,
        rule: "The transfer is made between midnight and 5:59 am.",
        reason: "It is very late at night, when scammers often call."
      }
    ],

    // The numbers the rules above use
    limits: {
      amountMultiple: 3,            // amountVsUsual fires at 3x the usual amount or more
      recentPayeeHours: 24,         // recentlyAddedPayee fires if the payee is younger than this
      rapidRepeatCount: 3,          // rapidRepeat fires from the 3rd transfer...
      rapidRepeatWindowMinutes: 30, // ...within this many minutes
      oddHourStart: 0,              // oddHour fires from 00:00...
      oddHourEnd: 5                 // ...up to and including 05:59
    },

    // ---------- Bands and actions (R-4) ----------
    // A score belongs to the first band whose "below" it is under. Low < 40, Medium 40-69, High 70+.
    bands: [
      { id: "low", label: "Low risk", below: 40, action: "proceed",
        actionText: "The transfer can go ahead." },
      { id: "medium", label: "Medium risk", below: 70, action: "pause-verify",
        actionText: "Pause the transfer and check the caller first." },
      { id: "high", label: "High risk", below: Infinity, action: "pause-and-case",
        actionText: "Pause the transfer. A bank officer will review it before any money leaves." }
    ],

    maxScore: 100,  // the score is capped here
    topReasons: 3   // how many reasons to show (R-3)
  },

  // ---------- Sample transfers for the demo screen ----------
  // Each transfer has the same fields the scorer and POST /api/risk/score take:
  //   payeeName             who the money goes to (shown only, not scored)
  //   amount                dollars being sent now
  //   usualAmount           the customer's typical transfer in dollars (0 if there is no history)
  //   hour                  hour of day the transfer is made, 0-23 (Singapore time)
  //   isNewPayee            true if the customer has never paid this payee before
  //   payeeAddedHoursAgo    how long ago the payee was added, in hours
  //   payeeFlagged          true if the payee's account has been reported for scams
  //   recentTransferMinutes how many minutes ago each of the customer's other recent transfers was made
  // "expect" is the band we designed each sample to land in. The tests check it.
  samples: [
    {
      id: "allowance",
      title: "Monthly allowance to my daughter",
      story: "Mdm Lim sends her daughter Rachel the usual $300 after dinner, like every month.",
      expect: "low",
      transfer: { payeeName: "Rachel Lim", amount: 300, usualAmount: 300, hour: 19,
        isNewPayee: false, payeeAddedHoursAgo: 9000, payeeFlagged: false, recentTransferMinutes: [] }
    },
    {
      id: "bill-split",
      title: "Paying friends back after a late dinner",
      story: "After a birthday supper, Mdm Lim pays three friends back $40 each, just after 1 am.",
      expect: "low",
      transfer: { payeeName: "Mrs Goh", amount: 40, usualAmount: 150, hour: 1,
        isNewPayee: false, payeeAddedHoursAgo: 5000, payeeFlagged: false, recentTransferMinutes: [4, 2] }
    },
    {
      id: "renovation",
      title: "Deposit for kitchen renovation",
      story: "Mdm Lim pays a $5,000 deposit to a contractor she added 3 days ago, after signing the quote.",
      expect: "medium",
      transfer: { payeeName: "Kim Seng Renovation", amount: 5000, usualAmount: 400, hour: 14,
        isNewPayee: true, payeeAddedHoursAgo: 72, payeeFlagged: false, recentTransferMinutes: [] }
    },
    {
      id: "marketplace",
      title: "Buying a used phone online",
      story: "Mdm Lim pays $150 to a seller on an online marketplace. Other people have reported this account.",
      expect: "medium",
      transfer: { payeeName: "J. Tan (marketplace seller)", amount: 150, usualAmount: 300, hour: 20,
        isNewPayee: true, payeeAddedHoursAgo: 48, payeeFlagged: true, recentTransferMinutes: [] }
    },
    {
      id: "grandma-scam",
      title: "\"Grandson\" in trouble with the police",
      story: "At 1 am a voice that sounds like her grandson says he is in police trouble and needs $8,000 now. " +
        "Mdm Lim moves money in from her savings twice, adds the new payee he gives her, and sends it.",
      expect: "high",
      transfer: { payeeName: "Lawyer Ong & Co", amount: 8000, usualAmount: 300, hour: 1,
        isNewPayee: true, payeeAddedHoursAgo: 0.2, payeeFlagged: false, recentTransferMinutes: [14, 6] }
    }
  ],

  // ---------- The screen's words in English, Chinese and Malay (see js/core/i18n.js) ----------
  // The Chinese and Malay are AI-drafted and still need a native speaker to check them.
  //
  // Why the English signal, band and sample words appear twice (in config/samples above AND here):
  // the server and the API answer in English using config above, and the staff console shows
  // those English reasons. The customer's screen looks words up here by id instead
  // ("rs.signal.newPayee.reason"), so it can show them in any language. A test
  // (server/test/i18n.test.js) checks the two English copies are exactly the same.
  text: {
    en: {
      "rs.eyebrow": "Before you send money",
      "rs.title": "Check a transfer before you send it",
      "rs.lead": "Pick a transfer to see how risky it looks. Scammers often rush people into sending money.",
      "rs.pickTitle": "Pick a transfer",
      "rs.to": "To",
      "rs.amount": "Amount",
      "rs.time": "Time",
      "rs.checkRisk": "Check the risk",
      "rs.checking": "Checking this transfer…",
      "rs.comparing": "Comparing with how you usually send money",
      "rs.usual": "You usually send",
      "rs.noHistory": "No history yet",
      "rs.payeeAdded": "Payee added",
      "rs.paidBefore": "Paid them before?",
      "rs.firstTime": "No, first time",
      "rs.reported": "Reported for scams?",
      "rs.recent": "Recent transfers",
      "rs.recentList": "Others: {list} minutes ago",
      "rs.none": "None",
      "rs.yes": "Yes",
      "rs.no": "No",
      "rs.overYear": "over a year ago",
      "rs.hour.midnight": "12 midnight",
      "rs.hour.night": "{h} am",
      "rs.hour.morning": "{h} am",
      "rs.hour.noon": "12 noon",
      "rs.hour.afternoon": "{h} pm",
      "rs.hour.evening": "{h} pm",
      "rs.seeAll": "See every check we made",
      "rs.tableCaption": "Every risk check and the points it added",
      "rs.colCheck": "Check",
      "rs.colFound": "Found?",
      "rs.colPoints": "Points",
      "rs.pointsCap": "Points add up to the score, which stops at {max}.",
      "rs.scale.low": "Low",
      "rs.scale.medium": "Medium",
      "rs.scale.high": "High",
      "rs.noSigns": "We found no warning signs in this transfer.",
      "rs.andMore": "And {count} more. See every check we made, below.",
      "rs.usualLooks": "This looks like your usual transfers.",
      "rs.send": "Send {amount}",
      "rs.paused": "We paused this transfer.",
      "rs.notLeft": "Your money has not left your account.",
      "rs.checkTrusted": "Check with someone you trust before you send. A new person asking for a big amount is a common scam.",
      "rs.caseSent": "We sent this to the bank's fraud team as case {ref}.",
      "rs.kopi": "Take a kopi break and check",
      "rs.cancel": "Cancel this transfer",
      "rs.again": "Try another transfer",
      "rs.whatToDo": "What to do now",
      "rs.headline": "{amount} to {payee}",
      "rs.outOf": "out of {max}",
      "rs.nextLabel": "What happens next:",
      "rs.madeScore": "What made the score",
      "rs.transfer": "The transfer",
      "rs.source.server": "Scored by the bank's server.",
      "rs.source.device": "Scored on this device, because the server isn't running. The result is the same.",
      "rs.done.sent": "Your transfer is on its way",
      "rs.done.cancelled": "Your transfer is cancelled",
      "rs.done.sentNote": "This is a demo, so no real money was sent.",
      "rs.done.cancelledNote": "No money has left your account.",
      "rs.reportScam": "Report a scam",

      "rs.band.low.label": "Low risk",
      "rs.band.low.action": "The transfer can go ahead.",
      "rs.band.medium.label": "Medium risk",
      "rs.band.medium.action": "Pause the transfer and check the caller first.",
      "rs.band.high.label": "High risk",
      "rs.band.high.action": "Pause the transfer. A bank officer will review it before any money leaves.",

      "rs.signal.flaggedPayee.label": "Flagged payee",
      "rs.signal.flaggedPayee.rule": "The payee's account has been reported for scams before.",
      "rs.signal.flaggedPayee.reason": "This account has been reported for scams by other people.",
      "rs.signal.amountVsUsual.label": "Amount vs usual",
      "rs.signal.amountVsUsual.rule": "The amount is at least 3 times the customer's usual transfer.",
      "rs.signal.amountVsUsual.reason": "This is much more money than you usually send.",
      "rs.signal.recentlyAddedPayee.label": "Recently added payee",
      "rs.signal.recentlyAddedPayee.rule": "The payee was added in the last 24 hours.",
      "rs.signal.recentlyAddedPayee.reason": "You added this payee less than a day ago.",
      "rs.signal.rapidRepeat.label": "Rapid repeat transfers",
      "rs.signal.rapidRepeat.rule": "This is the 3rd or later transfer in the last 30 minutes.",
      "rs.signal.rapidRepeat.reason": "You have made several transfers in a short time.",
      "rs.signal.newPayee.label": "New payee",
      "rs.signal.newPayee.rule": "The customer has never sent money to this payee before.",
      "rs.signal.newPayee.reason": "You have never sent money to this person before.",
      "rs.signal.oddHour.label": "Odd hour",
      "rs.signal.oddHour.rule": "The transfer is made between midnight and 5:59 am.",
      "rs.signal.oddHour.reason": "It is very late at night, when scammers often call.",

      // The same signals written about the customer, for bank staff (the staff case screen)
      "rs.signal.flaggedPayee.staff": "Other people have reported this payee's account for scams.",
      "rs.signal.amountVsUsual.staff": "Much more than this customer usually sends.",
      "rs.signal.recentlyAddedPayee.staff": "The customer added this payee less than a day ago.",
      "rs.signal.rapidRepeat.staff": "The customer made several transfers in a short time.",
      "rs.signal.newPayee.staff": "The customer has never paid this payee before.",
      "rs.signal.oddHour.staff": "Sent very late at night, when scam calls are common.",

      "rs.sample.allowance.title": "Monthly allowance to my daughter",
      "rs.sample.allowance.story": "Mdm Lim sends her daughter Rachel the usual $300 after dinner, like every month.",
      "rs.sample.bill-split.title": "Paying friends back after a late dinner",
      "rs.sample.bill-split.story": "After a birthday supper, Mdm Lim pays three friends back $40 each, just after 1 am.",
      "rs.sample.renovation.title": "Deposit for kitchen renovation",
      "rs.sample.renovation.story": "Mdm Lim pays a $5,000 deposit to a contractor she added 3 days ago, after signing the quote.",
      "rs.sample.marketplace.title": "Buying a used phone online",
      "rs.sample.marketplace.story": "Mdm Lim pays $150 to a seller on an online marketplace. Other people have reported this account.",
      "rs.sample.grandma-scam.title": "\"Grandson\" in trouble with the police",
      "rs.sample.grandma-scam.story": "At 1 am a voice that sounds like her grandson says he is in police trouble and needs $8,000 now. " +
        "Mdm Lim moves money in from her savings twice, adds the new payee he gives her, and sends it."
    },
    zh: {
      "rs.eyebrow": "转账之前",
      "rs.title": "转账前，先检查一下",
      "rs.lead": "选一笔转账，看看它有多危险。骗子常常催人赶快转钱。",
      "rs.pickTitle": "选一笔转账",
      "rs.to": "收款人",
      "rs.amount": "金额",
      "rs.time": "时间",
      "rs.checkRisk": "检查风险",
      "rs.checking": "正在检查这笔转账…",
      "rs.comparing": "正在和你平时的转账比较",
      "rs.usual": "你平时转账",
      "rs.noHistory": "还没有记录",
      "rs.payeeAdded": "收款人加入时间",
      "rs.paidBefore": "以前转过钱给他们吗？",
      "rs.firstTime": "没有，第一次",
      "rs.reported": "被举报过诈骗吗？",
      "rs.recent": "最近的转账",
      "rs.recentList": "其他转账：{list}分钟前",
      "rs.none": "没有",
      "rs.yes": "是",
      "rs.no": "否",
      "rs.overYear": "一年多以前",
      "rs.hour.midnight": "半夜12点",
      "rs.hour.night": "凌晨{h}点",
      "rs.hour.morning": "早上{h}点",
      "rs.hour.noon": "中午12点",
      "rs.hour.afternoon": "下午{h}点",
      "rs.hour.evening": "晚上{h}点",
      "rs.seeAll": "查看我们做过的所有检查",
      "rs.tableCaption": "每一项风险检查和加的分数",
      "rs.colCheck": "检查项目",
      "rs.colFound": "有发现吗？",
      "rs.colPoints": "分数",
      "rs.pointsCap": "分数加起来就是总分，最高 {max} 分。",
      "rs.scale.low": "低",
      "rs.scale.medium": "中",
      "rs.scale.high": "高",
      "rs.noSigns": "这笔转账没有发现危险迹象。",
      "rs.andMore": "还有 {count} 项。请看下面的所有检查。",
      "rs.usualLooks": "这和你平时的转账差不多。",
      "rs.send": "转 {amount}",
      "rs.paused": "我们暂停了这笔转账。",
      "rs.notLeft": "你的钱还没有转出去。",
      "rs.checkTrusted": "转账之前，先问问你信任的人。陌生人要一大笔钱，是常见的骗局。",
      "rs.caseSent": "我们已经把这件事交给银行的防诈骗团队，案件号码是 {ref}。",
      "rs.kopi": "先休息一下，喝杯咖啡再确认",
      "rs.cancel": "取消这笔转账",
      "rs.again": "试另一笔转账",
      "rs.whatToDo": "现在该怎么做",
      "rs.headline": "转 {amount} 给 {payee}",
      "rs.outOf": "（满分 {max}）",
      "rs.nextLabel": "接下来：",
      "rs.madeScore": "分数是怎么来的",
      "rs.transfer": "转账详情",
      "rs.source.server": "由银行的服务器评分。",
      "rs.source.device": "服务器没有运行，所以在这部设备上评分。结果是一样的。",
      "rs.done.sent": "你的转账正在处理中",
      "rs.done.cancelled": "你的转账已经取消",
      "rs.done.sentNote": "这只是示范，没有真的转钱。",
      "rs.done.cancelledNote": "你户口里的钱没有转出去。",
      "rs.reportScam": "举报诈骗",

      "rs.band.low.label": "低风险",
      "rs.band.low.action": "这笔转账可以继续。",
      "rs.band.medium.label": "中风险",
      "rs.band.medium.action": "先暂停转账，确认打电话来的人是谁。",
      "rs.band.high.label": "高风险",
      "rs.band.high.action": "暂停转账。在钱转出去之前，银行职员会先检查。",

      "rs.signal.flaggedPayee.label": "被举报的收款人",
      "rs.signal.flaggedPayee.rule": "收款人的户口以前被举报过诈骗。",
      "rs.signal.flaggedPayee.reason": "其他人举报过这个户口和诈骗有关。",
      "rs.signal.amountVsUsual.label": "金额比平时多",
      "rs.signal.amountVsUsual.rule": "金额至少是客户平时转账的 3 倍。",
      "rs.signal.amountVsUsual.reason": "这比你平时转的钱多很多。",
      "rs.signal.recentlyAddedPayee.label": "刚加入的收款人",
      "rs.signal.recentlyAddedPayee.rule": "收款人是在过去 24 小时内加入的。",
      "rs.signal.recentlyAddedPayee.reason": "你加这个收款人还不到一天。",
      "rs.signal.rapidRepeat.label": "短时间内多次转账",
      "rs.signal.rapidRepeat.rule": "这是 30 分钟内的第 3 笔或更多的转账。",
      "rs.signal.rapidRepeat.reason": "你在很短的时间内转了好几次钱。",
      "rs.signal.newPayee.label": "新收款人",
      "rs.signal.newPayee.rule": "客户以前从来没有转钱给这个收款人。",
      "rs.signal.newPayee.reason": "你以前从来没有转钱给这个人。",
      "rs.signal.oddHour.label": "深夜时间",
      "rs.signal.oddHour.rule": "转账时间在半夜 12 点到早上 5 点 59 分之间。",
      "rs.signal.oddHour.reason": "现在是深夜，骗子常常在这个时候打电话。",

      "rs.signal.flaggedPayee.staff": "其他人举报过这个收款人的户口和诈骗有关。",
      "rs.signal.amountVsUsual.staff": "比这位客户平时转的钱多很多。",
      "rs.signal.recentlyAddedPayee.staff": "客户加这个收款人还不到一天。",
      "rs.signal.rapidRepeat.staff": "客户在很短的时间内转了好几次钱。",
      "rs.signal.newPayee.staff": "客户以前从来没有转钱给这个收款人。",
      "rs.signal.oddHour.staff": "在深夜转账，这是诈骗电话常见的时间。",

      "rs.sample.allowance.title": "每月给女儿的零用钱",
      "rs.sample.allowance.story": "林女士像每个月一样，吃完晚饭后把平时的 $300 转给女儿 Rachel。",
      "rs.sample.bill-split.title": "宵夜后还钱给朋友",
      "rs.sample.bill-split.story": "生日宵夜后，林女士在凌晨 1 点多还钱给三个朋友，每人 $40。",
      "rs.sample.renovation.title": "厨房装修的订金",
      "rs.sample.renovation.story": "林女士签了报价单后，付 $5,000 订金给 3 天前加入的装修师傅。",
      "rs.sample.marketplace.title": "在网上买二手手机",
      "rs.sample.marketplace.story": "林女士在网上买卖平台付 $150 给一个卖家。其他人举报过这个户口。",
      "rs.sample.grandma-scam.title": "“孙子”惹上警察麻烦",
      "rs.sample.grandma-scam.story": "凌晨 1 点，一个听起来像她孙子的声音说他惹上警察麻烦，马上需要 $8,000。" +
        "林女士从储蓄户口转了两次钱进来，加了他给的新收款人，然后把钱转出去。"
    },
    ms: {
      "rs.eyebrow": "Sebelum anda hantar wang",
      "rs.title": "Semak pindahan wang sebelum anda hantar",
      "rs.lead": "Pilih satu pindahan untuk lihat betapa berisikonya. Penipu selalu mendesak orang supaya cepat hantar wang.",
      "rs.pickTitle": "Pilih satu pindahan",
      "rs.to": "Kepada",
      "rs.amount": "Jumlah",
      "rs.time": "Masa",
      "rs.checkRisk": "Semak risiko",
      "rs.checking": "Sedang menyemak pindahan ini…",
      "rs.comparing": "Membandingkan dengan cara anda biasa hantar wang",
      "rs.usual": "Anda biasa hantar",
      "rs.noHistory": "Belum ada rekod",
      "rs.payeeAdded": "Penerima ditambah",
      "rs.paidBefore": "Pernah bayar mereka sebelum ini?",
      "rs.firstTime": "Tidak, kali pertama",
      "rs.reported": "Pernah dilaporkan sebagai penipuan?",
      "rs.recent": "Pindahan baru-baru ini",
      "rs.recentList": "Pindahan lain: {list} minit yang lalu",
      "rs.none": "Tiada",
      "rs.yes": "Ya",
      "rs.no": "Tidak",
      "rs.overYear": "lebih setahun yang lalu",
      "rs.hour.midnight": "12 tengah malam",
      "rs.hour.night": "{h} pagi",
      "rs.hour.morning": "{h} pagi",
      "rs.hour.noon": "12 tengah hari",
      "rs.hour.afternoon": "{h} petang",
      "rs.hour.evening": "{h} malam",
      "rs.seeAll": "Lihat semua semakan kami",
      "rs.tableCaption": "Setiap semakan risiko dan mata yang ditambah",
      "rs.colCheck": "Semakan",
      "rs.colFound": "Dijumpai?",
      "rs.colPoints": "Mata",
      "rs.pointsCap": "Mata dijumlahkan menjadi skor, paling tinggi {max}.",
      "rs.scale.low": "Rendah",
      "rs.scale.medium": "Sederhana",
      "rs.scale.high": "Tinggi",
      "rs.noSigns": "Kami tidak jumpa tanda amaran dalam pindahan ini.",
      "rs.andMore": "Dan {count} lagi. Lihat semua semakan kami di bawah.",
      "rs.usualLooks": "Ini sama seperti pindahan biasa anda.",
      "rs.send": "Hantar {amount}",
      "rs.paused": "Kami telah tangguhkan pindahan ini.",
      "rs.notLeft": "Wang anda belum keluar dari akaun anda.",
      "rs.checkTrusted": "Tanya orang yang anda percayai sebelum hantar. Orang baharu yang minta jumlah besar ialah penipuan biasa.",
      "rs.caseSent": "Kami telah hantar ini kepada pasukan penipuan bank sebagai kes {ref}.",
      "rs.kopi": "Rehat minum kopi dan semak dahulu",
      "rs.cancel": "Batalkan pindahan ini",
      "rs.again": "Cuba pindahan lain",
      "rs.whatToDo": "Apa perlu dibuat sekarang",
      "rs.headline": "{amount} kepada {payee}",
      "rs.outOf": "daripada {max}",
      "rs.nextLabel": "Apa yang berlaku seterusnya:",
      "rs.madeScore": "Apa yang membentuk skor",
      "rs.transfer": "Butiran pindahan",
      "rs.source.server": "Skor dikira oleh pelayan bank.",
      "rs.source.device": "Skor dikira pada peranti ini kerana pelayan tidak berjalan. Hasilnya sama.",
      "rs.done.sent": "Pindahan anda sedang dihantar",
      "rs.done.cancelled": "Pindahan anda sudah dibatalkan",
      "rs.done.sentNote": "Ini demo sahaja, jadi tiada wang sebenar dihantar.",
      "rs.done.cancelledNote": "Tiada wang keluar dari akaun anda.",
      "rs.reportScam": "Laporkan penipuan",

      "rs.band.low.label": "Risiko rendah",
      "rs.band.low.action": "Pindahan ini boleh diteruskan.",
      "rs.band.medium.label": "Risiko sederhana",
      "rs.band.medium.action": "Tangguhkan pindahan dan semak pemanggil dahulu.",
      "rs.band.high.label": "Risiko tinggi",
      "rs.band.high.action": "Tangguhkan pindahan. Pegawai bank akan menyemaknya sebelum wang keluar.",

      "rs.signal.flaggedPayee.label": "Penerima yang dilaporkan",
      "rs.signal.flaggedPayee.rule": "Akaun penerima pernah dilaporkan sebagai penipuan.",
      "rs.signal.flaggedPayee.reason": "Akaun ini pernah dilaporkan sebagai penipuan oleh orang lain.",
      "rs.signal.amountVsUsual.label": "Jumlah berbanding biasa",
      "rs.signal.amountVsUsual.rule": "Jumlahnya sekurang-kurangnya 3 kali ganda pindahan biasa pelanggan.",
      "rs.signal.amountVsUsual.reason": "Ini jauh lebih banyak daripada jumlah yang biasa anda hantar.",
      "rs.signal.recentlyAddedPayee.label": "Penerima yang baru ditambah",
      "rs.signal.recentlyAddedPayee.rule": "Penerima ditambah dalam 24 jam yang lalu.",
      "rs.signal.recentlyAddedPayee.reason": "Anda tambah penerima ini kurang daripada sehari yang lalu.",
      "rs.signal.rapidRepeat.label": "Pindahan berulang dengan cepat",
      "rs.signal.rapidRepeat.rule": "Ini pindahan ke-3 atau lebih dalam 30 minit yang lalu.",
      "rs.signal.rapidRepeat.reason": "Anda sudah buat beberapa pindahan dalam masa yang singkat.",
      "rs.signal.newPayee.label": "Penerima baharu",
      "rs.signal.newPayee.rule": "Pelanggan tidak pernah hantar wang kepada penerima ini.",
      "rs.signal.newPayee.reason": "Anda tidak pernah hantar wang kepada orang ini sebelum ini.",
      "rs.signal.oddHour.label": "Waktu luar biasa",
      "rs.signal.oddHour.rule": "Pindahan dibuat antara tengah malam dan 5:59 pagi.",
      "rs.signal.oddHour.reason": "Sekarang sudah lewat malam, waktu penipu selalu menelefon.",

      "rs.signal.flaggedPayee.staff": "Orang lain pernah melaporkan akaun penerima ini sebagai penipuan.",
      "rs.signal.amountVsUsual.staff": "Jauh lebih banyak daripada jumlah biasa yang pelanggan ini hantar.",
      "rs.signal.recentlyAddedPayee.staff": "Pelanggan menambah penerima ini kurang daripada sehari yang lalu.",
      "rs.signal.rapidRepeat.staff": "Pelanggan membuat beberapa pindahan dalam masa yang singkat.",
      "rs.signal.newPayee.staff": "Pelanggan tidak pernah membayar penerima ini sebelum ini.",
      "rs.signal.oddHour.staff": "Dihantar lewat malam, waktu panggilan penipuan biasa berlaku.",

      "rs.sample.allowance.title": "Elaun bulanan untuk anak perempuan saya",
      "rs.sample.allowance.story": "Puan Lim hantar $300 seperti biasa kepada anaknya Rachel selepas makan malam, sama seperti setiap bulan.",
      "rs.sample.bill-split.title": "Bayar balik kawan selepas makan lewat malam",
      "rs.sample.bill-split.story": "Selepas makan malam hari jadi, Puan Lim bayar balik tiga orang kawan $40 seorang, selepas pukul 1 pagi.",
      "rs.sample.renovation.title": "Deposit untuk ubah suai dapur",
      "rs.sample.renovation.story": "Puan Lim bayar deposit $5,000 kepada kontraktor yang dia tambah 3 hari lalu, selepas tandatangan sebut harga.",
      "rs.sample.marketplace.title": "Beli telefon terpakai dalam talian",
      "rs.sample.marketplace.story": "Puan Lim bayar $150 kepada penjual di pasaran dalam talian. Orang lain pernah melaporkan akaun ini.",
      "rs.sample.grandma-scam.title": "\"Cucu\" ada masalah dengan polis",
      "rs.sample.grandma-scam.story": "Pada pukul 1 pagi, satu suara yang macam cucunya kata dia ada masalah dengan polis dan perlukan $8,000 sekarang. " +
        "Puan Lim pindahkan wang dari akaun simpanan dua kali, tambah penerima baharu yang dia beri, dan hantar wang itu."
    }
  }
};

// Lets the Node server (server/) read the same settings. Browsers skip this line.
if (typeof module !== "undefined" && module.exports) module.exports = RISK_SCORER_DATA;
