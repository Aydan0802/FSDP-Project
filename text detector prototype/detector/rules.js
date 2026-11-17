"use strict";

// The red flags the message checker looks for.
// Owner: Aydan. Used by detector/checker.js (in the browser and in Node).
//
// Each rule:
//   id        a short name
//   points    how much it adds to the risk score: 1 = small sign, 2 = clear sign, 3 = strong sign
//   ask       true if it asks you to DO something risky (tap a link, reply, pay, call, share a code).
//             A message can only be "high risk" if at least one of these is found.
//   votes     which kind of scam it points to, and how strongly (the kinds are in words.js)
//   reason    what the screen says about the flagged phrase, in each language
//   patterns  regular expressions for each language. The words a pattern matches are the
//             phrase that gets highlighted, so patterns try to catch a readable phrase.
//   skipIfNegated  ignore a match when "never" / "do not" comes just before it.
//             "We will never ask for your OTP" is advice from a real bank, not a scam.
//
// Links (web addresses) are checked separately in checker.js, because a web address needs a
// closer look than a phrase (is it shortened? does it have words like "verify" in it?).
//
// English rules come first. Chinese (zh) and Malay (ms) patterns are added to the same rules,
// so a mixed-language message is still caught, and the reason is shown in the message's language.
// Sources for the warning signs: SPF / ScamShield advice and the scam types on the analyser screen
// (see CITATIONS.md). Rules are written by hand, so they miss new wording: they are warning signs, not proof.

const RULES = [
  // ---------- Pretending to be someone you trust ----------
  {
    id: "claims_bank",
    points: 1, ask: false,
    votes: { impersonation: 3 },
    reason: { en: "Claims to be your bank" },
    patterns: {
      en: [
        /\b(?:bank|banking|card|account)\s+(?:security|fraud|alert|support|verification)(?:\s+(?:team|department|centre|center|unit))?\b/i,
        // Bank names are matched case-sensitively, so "chase him" is not read as the bank Chase
        /\b(?:DBS|POSB|OCBC|UOB|HSBC|Citibank|Standard Chartered|Maybank|Barclays|Lloyds|NatWest|Santander|Chase|Wells Fargo|Bank of America|SBI|HDFC|ICICI)\b/
      ]
    }
  },
  {
    id: "claims_government",
    points: 1, ask: false,
    votes: { impersonation: 3 },
    reason: { en: "Claims to be the police or the government" },
    patterns: {
      en: [
        /\b(?:IRAS|CPF|ICA|MOM|MOH|MAS|SPF|HMRC|IRS)\b/,
        /\bSingpass\b/i,
        /\b(?:police|government|ministry of \w+|customs (?:officer|department|office)|immigration (?:officer|department)|court (?:order|summons|case|hearing)|interpol|tax (?:office|department|authority))\b/i
      ]
    }
  },
  {
    id: "claims_courier",
    points: 1, ask: false,
    votes: { parcel: 2 },
    reason: { en: "Claims to be a delivery company" },
    patterns: {
      en: [/\b(?:SingPost|Ninja ?Van|DHL|FedEx|UPS|USPS|Royal Mail|J&T Express|Qxpress)\b/]
    }
  },
  {
    id: "no_name",
    points: 1, ask: false,
    votes: { phishing: 1, impersonation: 1 },
    reason: { en: "Doesn't use your name" },
    patterns: {
      // up to two words may come between, as in "Dear PAYTM customer" or "Dear valued bank customer"
      en: [/\bdear\s+(?:[\w-]+\s+){0,2}?(?:customer|client|user|member|account ?holder|card ?holder|subscriber|voucher holder|sir\/madam|sir or madam)\b/i]
    }
  },
  {
    id: "account_problem",
    points: 1, ask: false,
    votes: { impersonation: 2, phishing: 1 },
    reason: { en: "Says something is wrong with your account" },
    patterns: {
      en: [
        /\b(?:unusual|suspicious|unauthori[sz]ed|irregular|abnormal)\s+(?:log-?in|sign-?in|activit(?:y|ies)|transactions?|access|attempts?|charges?|payments?)\b/i,
        /\b(?:account|card|payment|profile)\s+(?:has been|have been|was|is)\s+(?:compromised|hacked|flagged|charged|debited|on hold)\b/i,
        /\b(?:kyc|account|card|password|subscription|membership|verification)\s+(?:has|have|is|will be)\s+(?:expired|expiring|pending|incomplete)\b/i,
        /\b(?:payment|bill|invoice|account)\s+(?:is|is now|has become)\s+(?:overdue|past due|outstanding)\b/i,
        /\bif (?:this|it) (?:was|is) not (?:done by )?you\b|\bif you did(?: not|n'?t) (?:make|authori[sz]e|request|do|initiate) (?:this|it)\b/i
      ]
    }
  },

  // ---------- Pressure ----------
  {
    id: "threat",
    points: 2, ask: false,
    votes: { impersonation: 1, phishing: 1 },
    reason: { en: "A scary threat to make you act fast" },
    patterns: {
      en: [
        // "will be blocked", and also the broken English "will block" that scam messages often use
        /\b(?:account|a\/c|card|kyc|access|service|number|line|profile|wallet|sim)s?\s+(?:will be|will|has been|have been|is being|is|was|may be)\s+(?:temporarily\s+|permanently\s+)?(?:frozen|freezed?|suspend(?:ed)?|block(?:ed)?|lock(?:ed)?|de-?activated?|terminated?|closed|restricted|disabled|cancell?ed|barred)\b/i,
        // a threat to YOU ("you will be arrested"), not a story ("I got arrested")
        /\b(?:will be|may be|could be|to be|face being)\s+(?:arrested|prosecuted|jailed|fined|charged in court)\b/i,
        /\b(?:legal action|arrest warrant|warrant (?:of|for) (?:your )?arrest|money laundering)\b/i,
        /\bwill (?:hold|freeze|block|seize)\s+your\s+(?:\w+\s+)?(?:amount|money|funds|account|balance|savings)\b/i
      ]
    }
  },
  {
    id: "urgency",
    points: 1, ask: false,
    votes: {},
    reason: { en: "Rushes you" },
    patterns: {
      en: [
        /\bwithin\s+(?:the\s+next\s+)?\d+\s*(?:minutes?|mins?|hours?|hrs?|days?)\b/i,
        /\b(?:immediately|urgent(?:ly)?|act now|right away|as soon as possible|last chance|final (?:notice|reminder|warning)|expires? (?:today|tonight|soon|in \d+ \w+)|today only|limited (?:time|slots?|offer|places)|before it'?s too late)\b/i
      ]
    }
  },
  {
    id: "secrecy",
    points: 2, ask: false,
    votes: { love: 1, impersonation: 1 },
    reason: { en: "Asks you to keep it a secret" },
    patterns: {
      en: [
        /\b(?:please don'?t|pls don'?t|don'?t|do not|never)\s+(?:tell|inform|let)\s+(?:anyone|anybody|others|dad|mum|mom|your (?:family|friends|wife|husband|children|kids|parents|dad|mum|mom|bank)|the (?:bank|police))\b/i,
        /\b(?:keep\s+(?:this|it)\s+(?:a\s+)?(?:secret|confidential|private|between us)|between you and me)\b/i,
        // Phone-call scripts (from KakiGuard): keep you on the call so nobody can warn you
        /\b(?:stay on the line|don'?t (?:hang up|end the call)|do not (?:hang up|end the call)|confidential investigation)\b/i
      ]
    }
  },

  // ---------- Asks you to do something risky ----------
  {
    id: "asks_code",
    points: 3, ask: true, skipIfNegated: true,
    votes: { impersonation: 2, phishing: 1 },
    reason: { en: "Asks for your one-time password (OTP), PIN or password" },
    patterns: {
      en: [/\b(?:reply|send|share|give|provide|tell|forward|key in|enter|type in|confirm|submit|ask(?:ing)? for|need)\b[^.!?\n]{0,30}?\b(?:[o0]tp|pin|password|passcode|cvv|tac|verification code|security code|one[- ]time (?:password|passcode|pin|code))\b/i]
    }
  },
  {
    id: "asks_details",
    points: 2, ask: true, skipIfNegated: true,
    votes: { phishing: 2 },
    reason: { en: "Asks you to type in your personal or bank details" },
    patterns: {
      en: [
        // "particulars" is the usual Singapore word for personal details (from KakiGuard)
        /\b(?:verify|confirm|update|validate|re-?activate|unlock|restore|review)\s+(?:your\s+)?(?:account|identity|details|particulars|information|info|personal (?:data|details|information)|bank (?:details|account)|card(?: details)?|log-?in(?: details)?|payment (?:details|information|method)|billing)\b/i,
        /\b(?:card number|bank details|NRIC|passport (?:number|details)|login details|credentials|date of birth)\b/i,
        /\bcomplete\s+(?:your\s+)?(?:\w+\s+)?(?:e-?kyc|kyc|verification|account update)\b/i
      ]
    }
  },
  {
    id: "tap_link",
    points: 1, ask: true, skipIfNegated: true,
    votes: { phishing: 1 },
    reason: { en: "Pushes you to tap a link" },
    patterns: {
      en: [/\b(?:click(?:ing)?|tap(?:ping)?|follow|visit|go to|log ?in(?:to)?|sign ?in)\b[^.!?\n]{0,25}?\b(?:link|here|below|website|site|url|portal)\b/i]
    }
  },
  {
    id: "pay_fee",
    points: 2, ask: true,
    votes: { parcel: 1, job: 1 },
    reason: { en: "Asks you to pay a fee first" },
    patterns: {
      en: [
        // (?:[^.!?\n]|\.\d) = any character in the same sentence; a dot only counts inside a
        // number like $1.99, so "Pay a $1.99 redelivery fee" is caught as one phrase
        /\b(?:pay|settle|make (?:a )?payment(?: of)?)\b(?:[^.!?\n]|\.\d){0,25}?\b(?:fees?|charges?|deposit|duty|duties|tax(?:es)?)\b/i,
        /\b(?:re-?delivery|delivery|shipping|customs|clearance|registration|processing|admin(?:istration)?|release|handling|activation|unlock(?:ing)?|membership|joining)\s+(?:fee|charge|cost|payment)s?\b/i,
        // Job scams (from KakiGuard): "Small deposit required to unlock tasks", "pay upfront"
        /\b(?:deposit|pay|top[- ]?up)\b(?:[^.!?\n]|\.\d){0,30}?\bto unlock\b|\b(?:pay|payment|deposit)\b[^.!?\n]{0,15}?\bupfront\b/i
      ]
    }
  },
  {
    id: "send_money",
    points: 2, ask: true, skipIfNegated: true,
    votes: { impersonation: 1, investment: 1, love: 1 },
    reason: { en: "Asks you to send money" },
    patterns: {
      en: [
        // (?!\s+of\b): "a transfer of $25 was successful" describes a payment already made (a receipt)
        /\b(?:transfer|send|wire|remit|lend)\b(?!\s+of\b)[^.!?\n]{0,20}?(?:money|funds|cash|S?\$\s?\d|£\s?\d|USD|SGD|bitcoin|crypto|USDT)/i,
        // PayNow is Singapore's instant transfer (from KakiGuard): "PayNow me $600"
        /\bPayNow\b(?:\s+(?:me|us))?(?:\s+S?\$\s?\d[\d,]*)?/i,
        /\btransfer\s+(?:today|now|immediately)\b/i,
        /\bneed\s+(?:S?\$|£|USD|SGD)\s?\d[\d,]*/i
      ]
    }
  },
  {
    id: "safe_account",
    points: 3, ask: true,
    votes: { impersonation: 3 },
    reason: { en: "Asks you to move money to a “safe account”. A real bank never does this" },
    patterns: {
      en: [/\b(?:safe|safety|secure|protected|holding)\s+(?:bank\s+)?accounts?\b/i]
    }
  },
  {
    id: "gift_card",
    points: 2, ask: true,
    votes: { love: 1, impersonation: 1 },
    reason: { en: "Asks for gift cards, which scammers like because they can't be traced" },
    patterns: {
      en: [/\b(?:(?:google play|itunes|apple|steam|amazon|razer gold)\s+(?:gift\s+)?cards?|gift\s?cards?)\b/i]
    }
  },
  {
    id: "install_app",
    points: 2, ask: true, skipIfNegated: true,
    votes: { impersonation: 2 },
    reason: { en: "Asks you to install an app, which could let scammers control your phone" },
    patterns: {
      // Not "did you download the app?": only app files (.apk), apps from a link, or remote-control apps
      en: [
        /\b[\w-]+\.apk\b|\b(?:download|install)\b[^.!?\n]{0,30}?\bapk\b/i,
        /\b(?:download|install)\b[^.!?\n]{0,30}?\b(?:app|application)\b[^.!?\n]{0,15}?\b(?:from|via|using|at)\s+(?:this|the|our)?\s*(?:link|url|website|site)\b/i,
        /\b(?:AnyDesk|TeamViewer|QuickSupport)\b/i,
        /\bscreen ?shar(?:e|ing)\b/i
      ]
    }
  },
  {
    id: "private_chat",
    points: 1, ask: true,
    votes: { job: 1, investment: 1 },
    reason: { en: "Moves you to a private chat app" },
    patterns: {
      en: [
        /\b(?:contact|add|message|chat with|reach|text|join)\s+(?:us|our\s+\w+)\s+(?:on|via|at|through)\s+(?:whatsapp|telegram|wechat|line|signal)\b/i,
        /\b(?:whatsapp|telegram|wechat)\s+(?:us|our (?:agent|team|hr|manager|admin|group))\b/i,
        /\b(?:wa\.me|t\.me)\/\S+/i
      ]
    }
  },
  {
    id: "call_or_text",
    points: 1, ask: true,
    votes: { phishing: 1 },
    reason: { en: "Asks you to call or text a number it gives you" },
    patterns: {
      en: [
        /\b(?:call|ring|dial|phone|contact)\b[^.!?\n]{0,40}?\+?\d[\d -]{6,}\d/i,
        /\b(?:text|txt|sms|send|reply)\b[^.!?\n]{0,20}?\bto\s+\+?\d{4,}\b/i
      ]
    }
  },

  // ---------- Too good to be true ----------
  {
    id: "prize",
    points: 2, ask: false,
    votes: { phishing: 1 },
    reason: { en: "Says you've won something, which is too good to be true" },
    patterns: {
      // w[o0]n also catches "W0N" written with a zero to get past filters.
      // (?!['’]) stops "you won't" from being read as "you won".
      en: [
        /\b(?:you(?:'ve|’ve| have| are| r)?|u (?:have|r|are)|ur|u've|u’ve)\s+(?:been\s+)?(?:\w+\s+)?(?:w[o0]n|selected|chosen|picked|awarded|a winner|the winner)\b(?!['’])/i,
        /\b(?:number|mobile|phone|e-?mail|ticket|account|sim)s?\s+(?:has|have)\s+(?:w[o0]n|been selected|been chosen)\b(?!['’])/i,
        /\b(?:selected|chosen)\s+to\s+(?:receive|win|get|claim)\b/i,
        /\b(?:a|the|lucky|prize|cash)\s+w[i1]nner\b|\bw[i1]nner\s+of\b/i,
        /\b(?:congratulations|congrats)\b[^.!?\n]{0,30}?\b(?:w[o0]n|winner|selected|prize|reward)\b(?!['’])/i,
        /\b(?:claim|collect|redeem)\s+(?:your\s+|this\s+|the\s+)?(?:free\s+)?(?:prize|reward|cash|gift|bonus|voucher|award|money|winnings)\b/i,
        /\bguaranteed\s+(?:cash\s+)?(?:prize|award|reward|gift)\b/i,
        /\blucky draw\b/i,
        /\b(?:await(?:s|ing)?|waiting for)\s+(?:your\s+)?collection\b/i,
        /\b(?:randomly|specially)\s+(?:picked|selected|chosen)\b/i,
        /\b(?:reward|prize|gift|cash|bonus|voucher)s?\s+(?:is|are)\s+waiting\b/i,
        /\b(?:cash|prize|reward|award|bonus)\s+(?:of\s+)?(?:S?\$|£|€|USD|SGD|Rs\.?|₹)\s?\d/i,
        /\bfree\s+(?:entry|gift|iphone|ipad|cash|prize|voucher|holiday|trip|ringtones?|camera|phone)\b/i
      ]
    }
  },
  {
    id: "refund",
    points: 2, ask: false,
    votes: { impersonation: 1, phishing: 1 },
    reason: { en: "Promises you money you didn't ask for" },
    patterns: {
      en: [
        /\b(?:entitled|eligible|qualified)\s+(?:to|for)\b[^.!?\n]{0,20}?\b(?:refund|rebate|payout|grant|compensation|cash|payment|bonus|subsidy)\b/i,
        /\b(?:tax|overpayment)\s+refund\b/i,
        /\bunclaimed\b/i
      ]
    }
  },
  {
    // On its own, "a part-time job" is normal ("I had a part time job"), so this is a small sign
    id: "job_offer",
    points: 1, ask: false,
    votes: { job: 2 },
    reason: { en: "An unasked-for job offer" },
    patterns: {
      en: [/\b(?:part[- ]?time|work[- ]from[- ]home|home[- ]based|online|remote|easy)\s+(?:jobs?|work|positions?|opportunit(?:y|ies)|income)\b/i]
    }
  },
  {
    id: "job_lure",
    points: 2, ask: false,
    votes: { job: 3 },
    reason: { en: "Promises easy money for little work" },
    patterns: {
      en: [
        /\bearn\b[^.!?\n]{0,15}?(?:S?\$|£|€|RM|₹|Rs\.?)\s?\d[\d,]*(?:\s?k)?\s*(?:a|per|each|every|\/)\s*(?:day|daily|week|hour|hr|month)\b/i,
        /\bno experience (?:needed|required|necessary)\b/i
      ]
    }
  },
  {
    id: "task_job",
    points: 2, ask: false,
    votes: { job: 3 },
    reason: { en: "Pays you for simple online tasks, a common job scam" },
    patterns: {
      en: [/\b(?:liking|like|rating|rate|reviewing|review|following|watching)\s+(?:videos?|products?|posts?|apps?|hotels?|items?|youtube)\b/i]
    }
  },
  {
    id: "investment_lure",
    points: 2, ask: false,
    votes: { investment: 3 },
    reason: { en: "Promises big profits, which no real investment can" },
    patterns: {
      en: [
        /\bguarantee(?:d|s)?\b[^.!?\n]{0,20}?\b(?:returns?|profits?|income|earnings|payouts?|interest)\b/i,
        /\b\d{1,3}(?:\.\d+)?\s?%\s+(?:returns?|profits?|interest|gains?)\b/i,
        /\b(?:crypto|bitcoin|btc|forex|fx|usdt|stock|trading)\s+(?:group|signals?|platform|investment|opportunit(?:y|ies)|mentor|expert|tips)\b/i,
        /\b(?:double|triple)\s+your\s+(?:money|investment|income|savings)\b/i,
        /\brisk[- ]free\b/i,
        /\bhigh returns?\b|\binvestment (?:group|opportunit(?:y|ies))\b/i,
        /\bVIP\s+(?:group|club|member(?:ship)?|channel)\b/i
      ]
    }
  },
  {
    id: "love_words",
    points: 1, ask: false,
    votes: { love: 3 },
    reason: { en: "Uses loving words to win your trust" },
    patterns: {
      en: [/\bmy\s+(?:dear(?:est)?|darling|love|honey|sweetheart|sweetie|babe|baby)\b/i]
    }
  },
  {
    id: "sad_story",
    points: 1, ask: false,
    votes: { love: 2 },
    reason: { en: "A story about being stuck, to make you feel sorry" },
    patterns: {
      en: [/\b(?:stuck|stranded|detained|trapped|held)\s+(?:at|in)\s+(?:the\s+)?(?:airport|customs|hospital|border|abroad|overseas)\b/i]
    }
  },
  {
    // The "Hi Mum, this is my new number" scam (from KakiGuard's examples): pretends to be family.
    // Only a small sign on its own (friends really do change numbers); it matters with a money ask.
    id: "new_number",
    points: 1, ask: false,
    votes: { impersonation: 2 },
    reason: { en: "Says it's someone you know on a new number. Call their old number to check" },
    patterns: {
      en: [/\b(?:this is my new (?:number|phone|no\.?)|(?:changed|changing) my (?:number|phone number)|(?:lost|dropped|broke|spoilt) my phone)\b/i]
    }
  },
  {
    // "You have a new voicemail / a delivery waiting": bait to make you call or tap
    id: "notice_bait",
    points: 1, ask: false,
    votes: { phishing: 1 },
    reason: { en: "A vague notice to make you curious enough to respond" },
    patterns: {
      en: [/\byou have (?:a|an|1|one|\d+) (?:new |important |missed |pending |unread )*(?:voicemail|voice message|message|delivery|parcel|package|customer service announcement|notification)s?\b(?:\s+(?:waiting|pending))?/i]
    }
  },
  {
    id: "parcel_problem",
    points: 2, ask: false,
    votes: { parcel: 3 },
    reason: { en: "Says there's a problem with a delivery" },
    patterns: {
      en: [
        /\b(?:parcel|package|delivery|shipment|courier)s?\b[^.!?\n]{0,30}?\b(?:could not|couldn'?t|cannot|can'?t|failed|unable|was not|wasn'?t|on hold|held|pending|returned|undeliverable|suspended)\b(?:\s+(?:be\s+)?(?:delivered|deliver|shipped|processed))?/i,
        /\bre-?deliver(?:y|ed)?\b/i,
        /\b(?:update|confirm|verify)\s+(?:your\s+)?(?:delivery|shipping|postal|home)\s+(?:address|details|information)\b/i
      ]
    }
  }
];

// How links are scored (used by checker.js). A plain link is a small sign; a link that looks
// fake is a clear one.
const LINK_RULES = {
  plain: {
    id: "has_link", points: 1, ask: true, votes: { phishing: 1 },
    reason: { en: "Has a link. Check where it really goes before you tap" }
  },
  suspicious: {
    id: "suspicious_link", points: 2, ask: true, votes: { phishing: 2 },
    reason: { en: "A link that doesn't look like an official website" }
  },
  // A link that uses a real brand's name but is not that brand's website, like dbs-sg-secure.com
  // (idea and lists from KakiGuard, a teammate's project, reused with permission)
  lookalike: {
    id: "lookalike_link", points: 3, ask: true, votes: { phishing: 2, impersonation: 1 },
    reason: { en: "This link copies a real brand name but is not the official website" }
  },
  // Official websites: a link to one of these (or a sub-address like www.ocbc.com) is not flagged.
  // Keep this list short and check every entry: a wrong entry would hide a scam link.
  official: ["gov.sg", "dbs.com.sg", "dbs.com", "posb.com.sg", "ocbc.com", "uob.com.sg", "singpost.com",
    "shopee.sg", "lazada.sg", "carousell.sg", "carousell.com", "grab.com", "fairprice.com.sg"],
  // Brand names scammers copy. Matched as a whole part of the address (split at dots and dashes),
  // so "dbs-sg-secure.com" matches "dbs" but "unicasa.com" does not match "ica".
  brands: ["dbs", "posb", "ocbc", "uob", "singpost", "singpass", "cpf", "iras", "ica", "gov", "police", "spf",
    "mom", "moh", "hdb", "shopee", "lazada", "carousell", "grab", "paynow", "paylah", "ntuc", "fairprice",
    "ninjavan", "maybank", "citibank", "hsbc"],
  // Link shorteners hide where a link really goes
  shorteners: ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "ow.ly", "rb.gy", "shorturl.at", "tiny.cc", "rebrand.ly", "s.id"],
  // Web address endings that are cheap and often used for scam sites
  riskyEndings: ["xyz", "top", "club", "online", "site", "live", "shop", "vip", "icu", "info", "biz", "link", "click", "buzz", "cc"],
  // Words scammers put in fake web addresses to look official
  riskyWords: /verify|secure|login|log-in|signin|update|account|confirm|support|service|redeliver|delivery|parcel|refund|claim|bonus|prize|gift|reward|wallet|unlock|auth/i
};

// ---------- Add the Chinese and Malay patterns ----------
// They live in one file per language (rules_zh.js, rules_ms.js), so a teammate who speaks the
// language can check them without touching the English. Each file gives a reason and patterns
// for rule ids from this file. In the browser, load rules_zh.js and rules_ms.js before this file.
const inNode = typeof module === "object" && module.exports;
const LANGUAGE_FILES = inNode
  ? { zh: require("./rules_zh.js"), ms: require("./rules_ms.js") }
  : { zh: globalThis.TEXT_DETECTOR_RULES_ZH, ms: globalThis.TEXT_DETECTOR_RULES_MS };
const ALL_RULES = [...RULES, LINK_RULES.plain, LINK_RULES.suspicious, LINK_RULES.lookalike];
for (const [lang, extra] of Object.entries(LANGUAGE_FILES)) {
  if (!extra) throw new Error(`rules_${lang}.js is not loaded`);
  for (const [id, add] of Object.entries(extra)) {
    const rule = ALL_RULES.find(r => r.id === id);
    if (!rule) throw new Error(`rules_${lang}.js: there is no rule called "${id}"`);   // catches typos
    rule.reason[lang] = add.reason;
    if (add.patterns) rule.patterns[lang] = add.patterns;   // links have no patterns of their own
  }
}

// Works in the browser (as a global) and in Node (with require)
if (inNode) {
  module.exports = { RULES, LINK_RULES };
} else {
  globalThis.TEXT_DETECTOR_RULES = { RULES, LINK_RULES };
}
