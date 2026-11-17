"use strict";

// Made-up data for: Sign in (customers) and Staff sign-in.
// Owner: Jiliana
// Customers sign in with one box for whatever they remember (user ID, mobile number or name)
// and one box for their password or PIN (changed on website-refresh, from the team's feedback).
// Staff keep a staff ID and password, on their own screen (#staff-login), linked from the
// bottom of the customer one.
// Any details work: this is a demo. "Fill in for me" types the made-up details below.
// text: the customer screen's words in English, Chinese and Malay (see "How to translate your
// screen" in TEAM-FILES.md). The Chinese and Malay are AI-drafted and still need a native
// speaker to check them. The staff screen is English only, like the rest of the staff side.

const LOGIN_DATA = {
  demoCustomer: { id: "Mdm Lim", secret: "123456" },
  demoStaff: { id: "demo.staff", password: "demo" },

  // The staff screen's words (English only)
  staff: {
    about: "About the staff side of Pause & Prove",
    kicker: "For OCBC fraud operations",
    tagline: "Review scam reports and act fast.",
    back: "Customer sign-in",
    title: "Staff sign-in",
    sub: "For bank staff who review scam reports and trends.",
    id: "Staff ID",
    password: "Password",
    show: "Show",
    hide: "Hide",
    passwordHidden: " password",
    submit: "Sign in",
    demoFill: "Fill in demo details",
    note: "Demo only: any staff ID and password work. Never type a real password here.",
    errEmpty: "Type your staff ID and password, or choose \"Fill in demo details\"."
  },

  text: {
    en: {
      "login.about": "About Pause & Prove",
      "login.kicker": "Anti-scam help from your bank",
      "login.tagline": "Pause. Check the caller.",
      "login.taglineEnd": "Stay safe.",
      "login.title": "Sign in",
      "login.sub": "Use your user ID, mobile number or name, and your password or PIN.",
      "login.id": "User ID, mobile number or name",
      "login.idHint": "Any one of these works.",
      "login.secret": "Password or PIN",
      "login.secretHint": "Your password, or your 6-digit PIN.",
      "login.show": "Show",
      "login.hide": "Hide",
      "login.secretHidden": " password or PIN",
      "login.submit": "Sign in",
      "login.demoFill": "Fill in for me (demo)",
      "login.note": "Demo only: any details work. Never type a real password or PIN here. Nothing is saved or sent.",
      "login.err.empty": "Type your user ID, mobile number or name, and your password or PIN.",
      "login.err.id": "Type your user ID, mobile number or name.",
      "login.err.secret": "Type your password or PIN.",
      "login.welcome": "Welcome, {name}.",
      "login.welcomeNoName": "You are signed in.",
      "login.hurry.title": "In a hurry?",
      "login.hurry.text": "You don't need to sign in for urgent help.",
      "login.hurry.calling": "Someone is calling me now",
      "login.hurry.bank": "Is the bank really calling?",
      "login.staffQ": "Bank staff?",
      "login.staffLink": "Staff sign-in",
      // Messages from access.js, shown once at the top of the card
      "login.msg.signInFirst": "Please sign in to use this. It only takes a moment.",
      "login.msg.customerOnly": "That page is for customers. Please sign in as a customer.",
      "login.msg.staffFirst": "Please sign in as bank staff first.",
      "login.msg.staffOnly": "That page is for bank staff only. Please sign in as bank staff."
    },
    zh: {
      "login.about": "关于 Pause & Prove",
      "login.kicker": "银行为您提供的防诈骗帮助",
      "login.tagline": "停一停。查清楚是谁打来。",
      "login.taglineEnd": "保护好自己。",
      "login.title": "登录",
      "login.sub": "用您的用户名、手机号码或名字，加上密码或 PIN 登录。",
      "login.id": "用户名、手机号码或名字",
      "login.idHint": "填其中一个就可以。",
      "login.secret": "密码或 PIN",
      "login.secretHint": "您的密码，或 6 位数 PIN。",
      "login.show": "显示",
      "login.hide": "隐藏",
      "login.secretHidden": "密码或 PIN",
      "login.submit": "登录",
      "login.demoFill": "帮我填写（示范）",
      "login.note": "只是示范：任何资料都可以。千万不要在这里输入真的密码或 PIN。这里的资料不会被保存或发送。",
      "login.err.empty": "请输入用户名、手机号码或名字，以及密码或 PIN。",
      "login.err.id": "请输入用户名、手机号码或名字。",
      "login.err.secret": "请输入密码或 PIN。",
      "login.welcome": "欢迎您，{name}。",
      "login.welcomeNoName": "您已登录。",
      "login.hurry.title": "很着急吗？",
      "login.hurry.text": "紧急帮助不需要登录。",
      "login.hurry.calling": "现在有人打电话给我",
      "login.hurry.bank": "真的是银行打来的吗？",
      "login.staffQ": "银行职员？",
      "login.staffLink": "职员登录",
      "login.msg.signInFirst": "请先登录才能使用。只需要一下子。",
      "login.msg.customerOnly": "这一页是给客户用的。请以客户身份登录。",
      "login.msg.staffFirst": "请先以银行职员身份登录。",
      "login.msg.staffOnly": "这一页只给银行职员用。请以银行职员身份登录。"
    },
    ms: {
      "login.about": "Tentang Pause & Prove",
      "login.kicker": "Bantuan anti-penipuan daripada bank anda",
      "login.tagline": "Berhenti. Semak pemanggil.",
      "login.taglineEnd": "Kekal selamat.",
      "login.title": "Log masuk",
      "login.sub": "Gunakan ID pengguna, nombor telefon bimbit atau nama anda, serta kata laluan atau PIN.",
      "login.id": "ID pengguna, nombor telefon bimbit atau nama",
      "login.idHint": "Mana-mana satu boleh digunakan.",
      "login.secret": "Kata laluan atau PIN",
      "login.secretHint": "Kata laluan anda, atau PIN 6 digit.",
      "login.show": "Tunjuk",
      "login.hide": "Sembunyi",
      "login.secretHidden": " kata laluan atau PIN",
      "login.submit": "Log masuk",
      "login.demoFill": "Isikan untuk saya (demo)",
      "login.note": "Demo sahaja: apa-apa butiran boleh digunakan. Jangan sekali-kali taip kata laluan atau PIN sebenar di sini. Tiada apa-apa disimpan atau dihantar.",
      "login.err.empty": "Taip ID pengguna, nombor telefon bimbit atau nama anda, serta kata laluan atau PIN.",
      "login.err.id": "Taip ID pengguna, nombor telefon bimbit atau nama anda.",
      "login.err.secret": "Taip kata laluan atau PIN anda.",
      "login.welcome": "Selamat datang, {name}.",
      "login.welcomeNoName": "Anda telah log masuk.",
      "login.hurry.title": "Tergesa-gesa?",
      "login.hurry.text": "Anda tidak perlu log masuk untuk bantuan segera.",
      "login.hurry.calling": "Ada orang sedang telefon saya",
      "login.hurry.bank": "Betulkah bank yang telefon?",
      "login.staffQ": "Kakitangan bank?",
      "login.staffLink": "Log masuk kakitangan",
      "login.msg.signInFirst": "Sila log masuk untuk menggunakan ini. Ia hanya mengambil masa sekejap.",
      "login.msg.customerOnly": "Halaman itu untuk pelanggan. Sila log masuk sebagai pelanggan.",
      "login.msg.staffFirst": "Sila log masuk sebagai kakitangan bank dahulu.",
      "login.msg.staffOnly": "Halaman itu untuk kakitangan bank sahaja. Sila log masuk sebagai kakitangan bank."
    }
  }
};
