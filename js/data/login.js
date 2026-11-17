"use strict";

// Made-up data for: Sign in.
// Owner: Jiliana
// The details "Fill in demo details" types in. They are real accounts: the same ones as in
// database/02-seed-users.sql (customer01 to 03, staff01 to 03). Any other ID or password is refused.
// text: the screen's words in English, Chinese and Malay (see "How to translate your screen" in
// TEAM-FILES.md). The Chinese and Malay are AI-drafted and still need a native speaker to check them.

const LOGIN_DATA = {
  demoIds: { customer: "customer01", staff: "staff01" },
  demoPasswords: { customer: "Demo#Cust01", staff: "Demo#Staff01" },

  text: {
    en: {
      "login.about": "About Verify the Caller",
      "login.kicker": "Anti-scam help, in one place",
      "login.tagline": "Pause. Check the caller.",
      "login.taglineEnd": "Stay safe.",
      "login.point.voice": "Check if a voice could be made by AI",
      "login.point.bank": "Find out if the bank is really calling",
      "login.point.report": "Report a scam in a few steps",
      "login.title": "Sign in",
      "login.sub": "Choose who you are, then sign in.",
      "login.iAm": "I am",
      "login.customer": "A customer",
      "login.customerSub": "Check calls and get help",
      "login.staff": "Bank staff",
      "login.staffSub": "Review reports and trends",
      "login.userId": "User ID",
      "login.staffId": "Staff ID",
      "login.password": "Password",
      "login.show": "Show",
      "login.hide": "Hide",
      "login.passwordHidden": " password",
      "login.submit": "Sign in",
      "login.demoFill": "Fill in demo details",
      "login.note": "Demo accounts only. Use \"Fill in demo details\", and never type a real password here.",
      "login.err.empty": "Type your ID and password, or choose \"Fill in demo details\".",
      "login.err.wrong": "That ID or password is not right. Please try again.",
      "login.err.locked": "Too many wrong tries. Please wait {minutes} minutes, then try again.",
      "login.err.server": "We can't reach the sign-in server right now. Please try again in a moment.",
      "login.err.database": "Sign in is not working right now. Please try again later."
    },
    zh: {
      "login.about": "关于 Verify the Caller",
      "login.kicker": "防诈骗帮助，全部在这里",
      "login.tagline": "停一停。查清楚是谁打来。",
      "login.taglineEnd": "保护好自己。",
      "login.point.voice": "检查声音是不是 AI 做的",
      "login.point.bank": "看看是不是真的银行打来",
      "login.point.report": "几个步骤就能举报诈骗",
      "login.title": "登录",
      "login.sub": "先选你是谁，然后登录。",
      "login.iAm": "我是",
      "login.customer": "客户",
      "login.customerSub": "检查电话，获得帮助",
      "login.staff": "银行职员",
      "login.staffSub": "查看举报和趋势",
      "login.userId": "用户名",
      "login.staffId": "职员编号",
      "login.password": "密码",
      "login.show": "显示",
      "login.hide": "隐藏",
      "login.passwordHidden": "密码",
      "login.submit": "登录",
      "login.demoFill": "填入示范资料",
      "login.note": "只限示范账户。可以选“填入示范资料”，千万不要在这里输入真的密码。",
      "login.err.empty": "请输入用户名和密码，或者选“填入示范资料”。",
      "login.err.wrong": "用户名或密码不对，请再试一次。",
      "login.err.locked": "输错太多次了，请等 {minutes} 分钟后再试。",
      "login.err.server": "暂时连不上登录服务器，请稍后再试。",
      "login.err.database": "登录暂时无法使用，请稍后再试。"
    },
    ms: {
      "login.about": "Tentang Verify the Caller",
      "login.kicker": "Bantuan anti-penipuan, di satu tempat",
      "login.tagline": "Berhenti. Semak pemanggil.",
      "login.taglineEnd": "Kekal selamat.",
      "login.point.voice": "Semak sama ada suara mungkin dibuat oleh AI",
      "login.point.bank": "Ketahui betulkah bank yang telefon",
      "login.point.report": "Laporkan penipuan dalam beberapa langkah",
      "login.title": "Log masuk",
      "login.sub": "Pilih siapa anda, kemudian log masuk.",
      "login.iAm": "Saya",
      "login.customer": "Pelanggan",
      "login.customerSub": "Semak panggilan dan dapatkan bantuan",
      "login.staff": "Kakitangan bank",
      "login.staffSub": "Semak laporan dan trend",
      "login.userId": "ID pengguna",
      "login.staffId": "ID kakitangan",
      "login.password": "Kata laluan",
      "login.show": "Tunjuk",
      "login.hide": "Sembunyi",
      "login.passwordHidden": " kata laluan",
      "login.submit": "Log masuk",
      "login.demoFill": "Isi butiran demo",
      "login.note": "Akaun demo sahaja. Gunakan \"Isi butiran demo\", dan jangan sekali-kali taip kata laluan sebenar di sini.",
      "login.err.empty": "Taip ID dan kata laluan anda, atau pilih \"Isi butiran demo\".",
      "login.err.wrong": "ID atau kata laluan tidak betul. Sila cuba lagi.",
      "login.err.locked": "Terlalu banyak percubaan salah. Sila tunggu {minutes} minit, kemudian cuba lagi.",
      "login.err.server": "Kami tidak dapat menghubungi pelayan log masuk buat masa ini. Sila cuba sebentar lagi.",
      "login.err.database": "Log masuk tidak berfungsi buat masa ini. Sila cuba lagi nanti."
    }
  }
};
