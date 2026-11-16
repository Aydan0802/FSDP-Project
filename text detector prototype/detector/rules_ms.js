"use strict";

// Malay (ms) red flags. Owner: Aydan. NEEDS A TEAMMATE WHO READS MALAY TO CHECK IT.
// Same layout as rules_zh.js. Added after English and Chinese.

const RULES_MS = {
  claims_bank: { reason: "Mengaku sebagai bank anda", patterns: [
    /\b(?:Maybank|CIMB|Public Bank|RHB|Bank Islam|BSN|Hong Leong|AmBank|Bank Rakyat)\b/,
    /\b(?:pasukan|jabatan|unit)\s+keselamatan\s+bank\b|\b(?:makluman|notis)\s+bank\b/i
  ] },
  claims_government: { reason: "Mengaku sebagai polis atau kerajaan", patterns: [
    /\b(?:polis|PDRM|kerajaan|mahkamah|LHDN|Bank Negara|pegawai kastam|jabatan kastam|imigresen)\b/i
  ] },
  claims_courier: { reason: "Mengaku sebagai syarikat penghantaran", patterns: [/\b(?:Pos Malaysia|Poslaju|syarikat kurier)\b/i] },
  no_name: { reason: "Tidak menggunakan nama anda", patterns: [/\b(?:pelanggan|pengguna|pemegang kad)\s+(?:yang\s+)?(?:dihormati|dikasihi)\b/i] },
  account_problem: { reason: "Mengatakan ada masalah dengan akaun anda", patterns: [
    /\b(?:log masuk|transaksi|aktiviti|akses)\s+(?:yang\s+)?(?:luar biasa|mencurigakan|tidak sah|tidak dibenarkan)\b/i,
    /\bakaun\s+anda\s+(?:telah\s+)?(?:digodam|dikompromi|disyaki)\b/i
  ] },
  threat: { reason: "Ugutan yang menakutkan supaya anda bertindak cepat", patterns: [
    // Malay passive verbs start with "di": dibekukan (frozen), digantung (suspended), disekat (blocked)
    /\b(?:akaun|kad|talian|nombor|perkhidmatan)\s+(?:anda\s+)?(?:akan|telah|sedang)\s+(?:di)?(?:bekukan|gantung|sekat|tutup|nyahaktifkan|batalkan)\b/i,
    /\b(?:akan|boleh)\s+(?:di)?tangkap\b|\btindakan undang-undang\b|\bwaran tangkap\b/i
  ] },
  urgency: { reason: "Mendesak anda", patterns: [
    /\bdalam (?:masa )?\d+\s*(?:minit|jam|hari)\b/i,
    /\b(?:segera|serta-merta|dengan segera|tempat terhad|masa terhad|peluang terakhir|hari ini sahaja)\b/i
  ] },
  secrecy: { reason: "Meminta anda merahsiakannya", patterns: [
    /\b(?:jangan|tolong jangan)\s+(?:beritahu|bagitahu|maklumkan)\s+(?:sesiapa|orang lain|keluarga|ahli keluarga|kawan|pihak bank|polis)\b/i,
    /\b(?:rahsiakan|simpan rahsia)\b/i
  ] },
  asks_code: { reason: "Meminta kata laluan sekali guna (OTP), PIN atau kata laluan anda", patterns: [
    /\b(?:balas|hantar|kongsi|berikan|beri|masukkan|nyatakan|sahkan)\b[^.!?\n]{0,30}?\b(?:otp|tac|pin|kata laluan|kod pengesahan|kod keselamatan|kod sekali guna)\b/i
  ] },
  asks_details: { reason: "Meminta anda memasukkan butiran peribadi atau bank", patterns: [
    /\b(?:sahkan|mengesahkan|kemas kini|kemaskini|mengemas kini|aktifkan semula)\s+(?:\w+\s+){0,2}?(?:butiran|maklumat|akaun|identiti|kad|data peribadi)\b/i,
    /\b(?:nombor kad|butiran bank|nombor akaun bank|MyKad)\b/i
  ] },
  tap_link: { reason: "Mendesak anda menekan pautan", patterns: [/\b(?:klik|tekan|layari|buka|log masuk)\b[^.!?\n]{0,25}?\b(?:pautan|link|di sini|laman web|url)\b/i] },
  pay_fee: { reason: "Meminta anda membayar yuran dahulu", patterns: [
    /\b(?:yuran|caj|bayaran)\s+(?:penghantaran(?:\s+semula)?|pendaftaran|pemprosesan|pentadbiran|kastam|pengaktifan|keahlian)\b/i,
    // "sila bayar ..." asks you to pay; "saya dah bayar yuran sekolah" (I've paid) is normal
    /\b(?:sila|perlu|mesti|harus)\s+bayar\b(?:[^.!?\n]|\.\d){0,25}?\b(?:yuran|caj|deposit|cukai)\b/i
  ] },
  send_money: { reason: "Meminta anda menghantar wang", patterns: [
    /\b(?:pindahkan|pindah|hantar|kirim)\s+(?:wang|duit|dana|RM\s?\d|S?\$\s?\d)/i,
    /\bperlukan\s+(?:RM|S?\$)\s?\d[\d,]*/i
  ] },
  safe_account: { reason: "Meminta anda memindahkan wang ke “akaun selamat”. Bank sebenar tidak pernah berbuat begini", patterns: [
    /\bakaun\s+(?:selamat|keselamatan|perlindungan|simpanan sementara)\b/i
  ] },
  gift_card: { reason: "Meminta kad hadiah, yang disukai penipu kerana tidak dapat dikesan", patterns: [/\bkad\s+(?:hadiah|tambah nilai|top-?up)\b/i] },
  install_app: { reason: "Meminta anda memasang aplikasi, yang boleh membolehkan penipu mengawal telefon anda", patterns: [
    /\b(?:muat turun|pasang)\b[^.!?\n]{0,30}?\b(?:apk|aplikasi)\b[^.!?\n]{0,15}?\b(?:pautan|link)\b/i
  ] },
  private_chat: { reason: "Memindahkan anda ke aplikasi sembang peribadi", patterns: [
    /\b(?:whatsapp|telegram|wechat)\s+(?:kami|saya|ejen kami)\b/i,
    /\b(?:hubungi|tambah|sertai)\s+(?:kami\s+)?(?:di|melalui)\s+(?:whatsapp|telegram|wechat)\b/i
  ] },
  call_or_text: { reason: "Meminta anda menelefon nombor yang diberikannya", patterns: [/\b(?:hubungi|telefon|panggil)\b[^.!?\n]{0,40}?\+?\d[\d -]{6,}\d/i] },
  prize: { reason: "Mengatakan anda menang sesuatu, terlalu bagus untuk menjadi kenyataan", patterns: [
    /\b(?:anda|tuan|puan)\s+(?:telah\s+)?(?:menang|memenangi|terpilih|dipilih)\b/i,
    /\btahniah\b[^.!?\n]{0,30}?\b(?:menang|hadiah|terpilih)\b/i,
    /\b(?:tuntut|tebus)\s+(?:hadiah|ganjaran|wang tunai|baucar)\b|\bhadiah\s+(?:wang tunai|bernilai)\b/i
  ] },
  refund: { reason: "Menjanjikan wang yang anda tidak minta", patterns: [
    /\b(?:layak|berhak)\s+(?:untuk\s+)?(?:menerima|mendapat)\b[^.!?\n]{0,20}?\b(?:bayaran balik|pulangan cukai|bantuan|geran|wang)\b/i
  ] },
  job_offer: { reason: "Tawaran kerja yang anda tidak minta", patterns: [/\b(?:kerja|jawatan)\s+(?:sambilan|dari rumah|separuh masa|dalam talian|online)\b/i] },
  job_lure: { reason: "Menjanjikan wang mudah untuk kerja yang sedikit", patterns: [
    /\b(?:dapat|jana|raih|untung)\b[^.!?\n]{0,10}?(?:RM|S?\$)\s?\d[\d,]*\s*(?:sehari|seminggu|sejam|sebulan|setiap hari)\b/i,
    /\b(?:tiada|tanpa|tak perlu)\s+pengalaman\b/i
  ] },
  task_job: { reason: "Membayar anda untuk tugasan mudah dalam talian, satu penipuan kerja yang biasa", patterns: [
    /'like'\s+video|\b(?:like|follow|ikuti|ulas|nilai)\s+(?:video|produk|hantaran|aplikasi)\b/i
  ] },
  investment_lure: { reason: "Menjanjikan untung besar, yang tidak mungkin bagi pelaburan sebenar", patterns: [
    /\b(?:pulangan|keuntungan|untung)\s+(?:\w+\s+)?(?:dijamin|terjamin)\b|\b(?:dijamin|jaminan)\s+(?:pulangan|keuntungan|untung)\b/i,
    /\b\d{1,3}\s?%\s+(?:pulangan|keuntungan|faedah)\b/i,
    /\b(?:pelaburan|dagangan)\s+(?:kripto|bitcoin|forex|saham)\b|\bkumpulan\s+(?:VIP|pelaburan|kripto)\b/i,
    /\btanpa risiko\b/i
  ] },
  love_words: { reason: "Menggunakan kata-kata sayang untuk memenangi kepercayaan anda", patterns: [/\b(?:sayangku|kekasihku|cintaku|buah hati|sayang)\b/i] },
  sad_story: { reason: "Cerita tersekat, supaya anda berasa kasihan", patterns: [
    /\b(?:tersekat|terkandas|ditahan)\s+(?:di|dalam)\s+(?:lapangan terbang|kastam|hospital|sempadan|luar negara)\b/i
  ] },
  notice_bait: { reason: "Notis yang samar supaya anda ingin tahu dan membalas", patterns: [
    /\banda (?:ada|mempunyai) (?:satu|1|\d+) (?:mesej|pesanan suara|bungkusan|notifikasi)\b/i
  ] },
  parcel_problem: { reason: "Mengatakan ada masalah dengan penghantaran", patterns: [
    /\b(?:bungkusan|parsel|pakej|penghantaran)\b[^.!?\n]{0,30}?\b(?:tidak dapat|gagal|tertangguh|ditahan|dikembalikan)\b(?:\s+(?:di)?hantar)?/i,
    /\bpenghantaran semula\b/i
  ] },
  has_link: { reason: "Ada pautan. Semak ke mana ia sebenarnya pergi sebelum anda tekan" },
  suspicious_link: { reason: "Pautan yang tidak kelihatan seperti laman web rasmi" }
};

// Works in the browser (as a global) and in Node (with require)
if (typeof module === "object" && module.exports) {
  module.exports = RULES_MS;
} else {
  globalThis.TEXT_DETECTOR_RULES_MS = RULES_MS;
}
