/*  =====================================================================
    RT DIGITAL — BACKEND (Google Apps Script + Google Spreadsheet)
    =====================================================================
    Cara pakai singkat:
    1. Buat Google Spreadsheet baru (boleh kosong).
    2. Menu Extensions > Apps Script.
    3. Hapus isi Code.gs bawaan, tempel SELURUH isi file ini.
    4. Jalankan fungsi SETUP() sekali (menu "Jalankan" / Run > pilih SETUP)
       untuk membuat semua sheet + data demo secara otomatis.
       -> Saat pertama kali run, Google akan minta izin akses, klik Izinkan.
    5. GANTI nilai API_TOKEN di bawah ini dengan string rahasia Anda sendiri
       (bebas, contoh: hasil generate password panjang & acak).
    6. Deploy > New deployment > pilih tipe "Web app".
       - Execute as: Me
       - Who has access: Anyone
       Klik Deploy, salin URL Web App yang muncul (diakhiri /exec).
    7. Tempel URL tersebut ke API_URL, dan token yang sama ke API_TOKEN,
       di file React (rt-digital / App.jsx).
    ===================================================================== */

/* ---------------------------------------------------------------------
   KEAMANAN
   - GANTI token di bawah ini dengan string rahasia milik Anda sendiri
     (bebas, misalnya hasil generate password acak yang panjang).
   - Token yang sama harus ditempel di variabel API_TOKEN pada file
     React (rt-digital / App.jsx).
   - Semua request (GET & POST) yang tidak menyertakan token yang cocok
     akan ditolak.
   --------------------------------------------------------------------- */
const API_TOKEN = "GANTI_DENGAN_TOKEN_RAHASIA_ANDA_SENDIRI";

const SHEET_NAMES = {
  USERS: "Users",
  TRANSACTIONS: "Transactions",
  PAYMENTS: "Payments",
  JIMPITAN: "Jimpitan",
  ARISAN: "Arisan",
  SETTINGS: "Settings",
};

const TX_HEADERS = [
  "id", "transaction_code", "transaction_date", "type", "category",
  "description", "amount", "source", "payment_method", "attachment",
  "notes", "created_by",
];
const USER_HEADERS = ["email", "password", "role", "name"];
const PAYMENT_HEADERS = ["id", "resident_id", "period", "paid_amount", "payment_date"];
const JIMPITAN_HEADERS = ["id", "date", "resident_id", "amount", "collector"];
const ARISAN_HEADERS = ["period", "winner_id"];
const SETTINGS_HEADERS = ["iuranAmount", "arisanAmount", "sosialWajibAmount"];

/* ---------------------------------------------------------------------
   ENTRY POINTS
   --------------------------------------------------------------------- */
function doGet(e) {
  try {
    if (!checkToken_(e.parameter.token)) return jsonOut({ ok: false, error: "Token tidak valid." });
    const action = e.parameter.action;
    if (action === "bootstrap") {
      return jsonOut({ ok: true, data: bootstrap() });
    }
    return jsonOut({ ok: false, error: "Unknown GET action: " + action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (!checkToken_(body.token)) return jsonOut({ ok: false, error: "Token tidak valid." });
    const action = body.action;
    const payload = body.payload || {};
    const handlers = {
      login: apiLogin,
      addTransaction: apiAddTransaction,
      updateTransaction: apiUpdateTransaction,
      deleteTransaction: apiDeleteTransaction,
      upsertPayment: apiUpsertPayment,
      saveSettings: apiSaveSettings,
      addJimpitan: apiAddJimpitan,
      addArisanWinner: apiAddArisanWinner,
    };
    const handler = handlers[action];
    if (!handler) return jsonOut({ ok: false, error: "Unknown POST action: " + action });

    // Semua aksi tulis (selain login) dikunci agar tidak terjadi
    // tabrakan saat beberapa orang menyimpan data bersamaan.
    let data;
    if (action === "login") {
      data = handler(payload);
    } else {
      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        data = handler(payload);
      } finally {
        lock.releaseLock();
      }
    }
    return jsonOut({ ok: true, data: data });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function checkToken_(token) {
  return API_TOKEN && String(token) === String(API_TOKEN);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------------------------------------------------------------
   SHEET HELPERS
   --------------------------------------------------------------------- */
function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error("Sheet tidak ditemukan: " + name + ". Jalankan SETUP() terlebih dahulu.");
  return sh;
}

function readAll_(name) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter((row) => row.some((cell) => cell !== "" && cell !== null))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

function appendRow_(name, obj, headers) {
  const sh = sheet_(name);
  const row = headers.map((h) => (obj[h] === undefined || obj[h] === null ? "" : obj[h]));
  sh.appendRow(row);
  return obj;
}

function findRowIndexById_(sh, headers, idField, idValue) {
  const values = sh.getDataRange().getValues();
  const idCol = headers.indexOf(idField);
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(idValue)) return r + 1; // 1-based sheet row
  }
  return -1;
}

function normalizeDate_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
  }
  return v;
}

/* ---------------------------------------------------------------------
   BOOTSTRAP — data awal yang dipanggil setelah login
   --------------------------------------------------------------------- */
function bootstrap() {
  const transactions = readAll_(SHEET_NAMES.TRANSACTIONS).map((t) => ({
    ...t,
    transaction_date: normalizeDate_(t.transaction_date),
    amount: Number(t.amount) || 0,
    attachment: t.attachment || null,
  }));
  const payments = readAll_(SHEET_NAMES.PAYMENTS).map((p) => ({
    ...p,
    paid_amount: Number(p.paid_amount) || 0,
    payment_date: p.payment_date ? normalizeDate_(p.payment_date) : null,
  }));
  const jimpitan = readAll_(SHEET_NAMES.JIMPITAN).map((j) => ({
    ...j,
    date: normalizeDate_(j.date),
    amount: Number(j.amount) || 0,
  }));
  const arisanRiwayat = readAll_(SHEET_NAMES.ARISAN);

  const settingsRows = readAll_(SHEET_NAMES.SETTINGS);
  const settings = settingsRows[0]
    ? {
        iuranAmount: Number(settingsRows[0].iuranAmount) || 0,
        arisanAmount: Number(settingsRows[0].arisanAmount) || 0,
        sosialWajibAmount: Number(settingsRows[0].sosialWajibAmount) || 0,
      }
    : { iuranAmount: 150000, arisanAmount: 100000, sosialWajibAmount: 20000 };

  return { transactions, payments, jimpitan, arisanRiwayat, settings };
}

/* ---------------------------------------------------------------------
   AUTH
   --------------------------------------------------------------------- */
function hashPassword_(plain) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(plain), Utilities.Charset.UTF_8);
  return bytes.map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function apiLogin(payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const hashed = hashPassword_(password);
  const users = readAll_(SHEET_NAMES.USERS);
  const found = users.find(
    (u) => String(u.email).toLowerCase() === email && String(u.password) === hashed
  );
  if (!found) throw new Error("Email atau kata sandi tidak sesuai.");
  return { email: found.email, role: found.role, name: found.name };
}

/* ---------------------------------------------------------------------
   TRANSACTIONS (Kas RT / Pemasukan / Pengeluaran)
   --------------------------------------------------------------------- */
function generateTxCode_(date) {
  const existing = readAll_(SHEET_NAMES.TRANSACTIONS);
  const dateStr = normalizeDate_(date);
  const count = existing.filter((t) => normalizeDate_(t.transaction_date) === dateStr).length + 1;
  return "TRX-" + String(dateStr).replaceAll("-", "") + "-" + String(count).padStart(3, "0");
}

function apiAddTransaction(payload) {
  const id = "tx-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6);
  const code = payload.transaction_code || generateTxCode_(payload.transaction_date);
  const tx = {
    id: id,
    transaction_code: code,
    transaction_date: payload.transaction_date,
    type: payload.type,
    category: payload.category,
    description: payload.description || "",
    amount: Number(payload.amount) || 0,
    source: payload.source || "",
    payment_method: payload.payment_method || "Tunai",
    attachment: payload.attachment || null,
    notes: payload.notes || "",
    created_by: payload.created_by || "",
  };
  appendRow_(SHEET_NAMES.TRANSACTIONS, tx, TX_HEADERS);
  return { transaction: tx };
}

function apiUpdateTransaction(payload) {
  const sh = sheet_(SHEET_NAMES.TRANSACTIONS);
  const rowIdx = findRowIndexById_(sh, TX_HEADERS, "id", payload.id);
  if (rowIdx === -1) throw new Error("Transaksi tidak ditemukan: " + payload.id);
  const current = {};
  const currentRow = sh.getRange(rowIdx, 1, 1, TX_HEADERS.length).getValues()[0];
  TX_HEADERS.forEach((h, i) => (current[h] = currentRow[i]));
  const merged = { ...current, ...payload };
  const row = TX_HEADERS.map((h) => (merged[h] === undefined || merged[h] === null ? "" : merged[h]));
  sh.getRange(rowIdx, 1, 1, TX_HEADERS.length).setValues([row]);
  return { transaction: merged };
}

function apiDeleteTransaction(payload) {
  const sh = sheet_(SHEET_NAMES.TRANSACTIONS);
  const rowIdx = findRowIndexById_(sh, TX_HEADERS, "id", payload.id);
  if (rowIdx === -1) throw new Error("Transaksi tidak ditemukan: " + payload.id);
  sh.deleteRow(rowIdx);
  return { id: payload.id };
}

/* ---------------------------------------------------------------------
   PEMBAYARAN WARGA (Iuran / Arisan / Dana Sosial)
   --------------------------------------------------------------------- */
function apiUpsertPayment(payload) {
  const sh = sheet_(SHEET_NAMES.PAYMENTS);
  const rowIdx = findRowIndexById_(sh, PAYMENT_HEADERS, "id", payload.id);
  const record = {
    id: payload.id,
    resident_id: payload.resident_id,
    period: payload.period,
    paid_amount: Number(payload.paid_amount) || 0,
    payment_date: payload.payment_date || "",
  };
  if (rowIdx === -1) {
    appendRow_(SHEET_NAMES.PAYMENTS, record, PAYMENT_HEADERS);
  } else {
    const row = PAYMENT_HEADERS.map((h) => (record[h] === undefined || record[h] === null ? "" : record[h]));
    sh.getRange(rowIdx, 1, 1, PAYMENT_HEADERS.length).setValues([row]);
  }
  return { payment: record };
}

/* ---------------------------------------------------------------------
   JIMPITAN
   --------------------------------------------------------------------- */
function apiAddJimpitan(payload) {
  const id = "jmp-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6);
  const entry = {
    id: id,
    date: payload.date,
    resident_id: payload.resident_id,
    amount: Number(payload.amount) || 0,
    collector: payload.collector || "",
  };
  appendRow_(SHEET_NAMES.JIMPITAN, entry, JIMPITAN_HEADERS);
  return { jimpitan: entry };
}

/* ---------------------------------------------------------------------
   ARISAN
   --------------------------------------------------------------------- */
function apiAddArisanWinner(payload) {
  const entry = { period: payload.period, winner_id: payload.winner_id };
  appendRow_(SHEET_NAMES.ARISAN, entry, ARISAN_HEADERS);
  return { arisan: entry };
}

/* ---------------------------------------------------------------------
   SETTINGS (nominal iuran / arisan / dana sosial wajib)
   --------------------------------------------------------------------- */
function apiSaveSettings(payload) {
  const sh = sheet_(SHEET_NAMES.SETTINGS);
  const settings = {
    iuranAmount: Number(payload.iuranAmount) || 0,
    arisanAmount: Number(payload.arisanAmount) || 0,
    sosialWajibAmount: Number(payload.sosialWajibAmount) || 0,
  };
  const row = SETTINGS_HEADERS.map((h) => settings[h]);
  if (sh.getLastRow() < 2) {
    sh.appendRow(row);
  } else {
    sh.getRange(2, 1, 1, SETTINGS_HEADERS.length).setValues([row]);
  }
  return { settings: settings };
}

/*  =====================================================================
    SETUP — jalankan sekali untuk membuat sheet + data demo
    ===================================================================== */
function SETUP() {
  const ss = ss_();

  const usersSheet = getOrCreateSheet_(ss, SHEET_NAMES.USERS, USER_HEADERS);
  writeRows_(usersSheet, USER_HEADERS, [
    { email: "admin@rtdigital.id", password: hashPassword_("admin123"), role: "Admin", name: "Pak Joko Susanto" },
    { email: "bendahara@rtdigital.id", password: hashPassword_("bendahara123"), role: "Bendahara", name: "Ibu Wulan Ningsih" },
  ]);

  const settingsSheet = getOrCreateSheet_(ss, SHEET_NAMES.SETTINGS, SETTINGS_HEADERS);
  writeRows_(settingsSheet, SETTINGS_HEADERS, [
    { iuranAmount: 150000, arisanAmount: 100000, sosialWajibAmount: 20000 },
  ]);

  const txSheet = getOrCreateSheet_(ss, SHEET_NAMES.TRANSACTIONS, TX_HEADERS);
  writeRows_(txSheet, TX_HEADERS, buildDemoTransactions_());

  const paymentsSheet = getOrCreateSheet_(ss, SHEET_NAMES.PAYMENTS, PAYMENT_HEADERS);
  writeRows_(paymentsSheet, PAYMENT_HEADERS, buildDemoPayments_());

  const jimpitanSheet = getOrCreateSheet_(ss, SHEET_NAMES.JIMPITAN, JIMPITAN_HEADERS);
  writeRows_(jimpitanSheet, JIMPITAN_HEADERS, buildDemoJimpitan_());

  const arisanSheet = getOrCreateSheet_(ss, SHEET_NAMES.ARISAN, ARISAN_HEADERS);
  writeRows_(arisanSheet, ARISAN_HEADERS, [
    { period: "2026-05", winner_id: "r3" },
    { period: "2026-06", winner_id: "r8" },
    { period: "2026-07", winner_id: "r12" },
  ]);

  SpreadsheetApp.getUi().alert(
    "Setup selesai! Semua sheet & data demo sudah dibuat. Sekarang lakukan Deploy > New deployment > Web app."
  );
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function writeRows_(sh, headers, rows) {
  if (rows.length === 0) return;
  const values = rows.map((obj) => headers.map((h) => (obj[h] === undefined || obj[h] === null ? "" : obj[h])));
  sh.getRange(2, 1, values.length, headers.length).setValues(values);
}

/* ---- generator data demo (identik dengan data contoh di aplikasi React) ---- */
function buildDemoTransactions_() {
  const raw = [
    ["2026-07-02", "masuk", "Iuran Warga", "Iuran warga bulan Juli - Rumah No. 5", 150000, "Bpk. Ahmad Zainuri", "Tunai"],
    ["2026-07-03", "masuk", "Jimpitan", "Jimpitan mingguan RT 03", 125000, "Petugas Jimpitan", "Tunai"],
    ["2026-07-05", "keluar", "Kebersihan", "Upah petugas kebersihan bulan Juli", 300000, "Pak Slamet (Petugas Kebersihan)", "Transfer Bank"],
    ["2026-07-07", "masuk", "Iuran Warga", "Iuran warga bulan Juli - Rumah No. 8", 150000, "Ibu Siti Aminah", "Tunai"],
    ["2026-07-08", "keluar", "Keamanan", "Honor satpam bulan Juli", 400000, "Satpam RT Digital", "Transfer Bank"],
    ["2026-07-10", "masuk", "Donasi", "Donasi persiapan HUT RI dari warga", 500000, "Bpk. Hendra Wijaya", "Transfer Bank"],
    ["2026-07-11", "masuk", "Dana Sosial", "Setoran dana sosial bulanan warga RT", 400000, "Kolektor Dana Sosial", "Tunai"],
    ["2026-07-12", "keluar", "Kegiatan RT", "Konsumsi rapat koordinasi RT", 250000, "Warung Bu Sri", "Tunai"],
    ["2026-07-14", "masuk", "Iuran Warga", "Iuran warga bulan Juli - Rumah No. 15", 150000, "Bpk. Yusuf Hakim", "Tunai"],
    ["2026-07-15", "keluar", "Administrasi", "Pembelian ATK sekretariat", 75000, "Toko ATK Sejahtera", "Tunai"],
    ["2026-07-17", "masuk", "Jimpitan", "Jimpitan mingguan RT 03", 128000, "Petugas Jimpitan", "Tunai"],
    ["2026-07-18", "keluar", "Sosial", "Bantuan duka cita warga Rumah No. 20", 350000, "Keluarga Bpk. Karto", "Tunai"],
    ["2026-07-20", "masuk", "Iuran Warga", "Iuran warga bulan Juli - Rumah No. 22", 150000, "Ibu Ratna Sari", "Transfer Bank"],
    ["2026-07-22", "keluar", "Inventaris", "Pembelian tenda untuk kegiatan warga", 600000, "CV Sewa Perlengkapan Jaya", "Transfer Bank"],
    ["2026-07-24", "masuk", "Jimpitan", "Jimpitan mingguan RT 03", 132000, "Petugas Jimpitan", "Tunai"],
    ["2026-07-27", "keluar", "Konsumsi", "Konsumsi kerja bakti bulanan", 150000, "Warung Bu Sri", "Tunai"],
    ["2026-07-31", "masuk", "Iuran Warga", "Iuran warga bulan Juli - Rumah No. 30", 150000, "Bpk. Dedi Kurniawan", "Tunai"],
    ["2026-08-03", "masuk", "Jimpitan", "Jimpitan mingguan RT 03", 125000, "Petugas Jimpitan", "Tunai"],
    ["2026-08-05", "keluar", "Perawatan", "Perbaikan lampu jalan lingkungan", 275000, "Toko Listrik Terang", "Tunai"],
    ["2026-08-09", "masuk", "Iuran Warga", "Iuran warga bulan Agustus - beberapa rumah", 500000, "Kolektor Iuran RT", "E-Wallet"],
    ["2026-08-11", "keluar", "Kegiatan RT", "Konsumsi rapat persiapan Agustus", 150000, "Warung Bu Sri", "Tunai"],
  ];
  const counters = {};
  return raw.map((row, i) => {
    const [date, type, category, description, amount, party, method] = row;
    counters[date] = (counters[date] || 0) + 1;
    const code = "TRX-" + date.replaceAll("-", "") + "-" + String(counters[date]).padStart(3, "0");
    return {
      id: "tx-" + (i + 1),
      transaction_code: code,
      transaction_date: date,
      type: type,
      category: category,
      description: description,
      amount: amount,
      source: party,
      payment_method: method,
      attachment: i % 4 === 0 ? "bukti-transaksi.jpg" : "",
      notes: "",
      created_by: "Ibu Wulan Ningsih",
    };
  });
}

function demoResidentIds_() {
  const ids = [];
  for (let i = 1; i <= 20; i++) ids.push("r" + i);
  return ids;
}

function buildDemoPayments_() {
  const ids = demoResidentIds_();
  const total = 150000 + 100000 + 20000; // iuran + arisan + sosial (untuk 15 warga pertama)
  const totalNonArisan = 150000; // warga di luar 15 pertama tidak wajib arisan/sosial
  return ids.map((id, i) => {
    const isArisanMember = i < 15;
    const ob = isArisanMember ? total : totalNonArisan;
    const seed = i % 5;
    const paid = seed === 0 ? 0 : seed === 1 ? Math.round(ob * 0.45) : ob;
    return {
      id: "pay-" + id,
      resident_id: id,
      period: "2026-08",
      paid_amount: paid,
      payment_date: paid > 0 ? "2026-08-" + String(3 + (i % 8)).padStart(2, "0") : "",
    };
  });
}

function buildDemoJimpitan_() {
  const ids = demoResidentIds_();
  const petugas = ["Bpk. Slamet", "Bpk. Rohman", "Ibu Yanti"];
  const rows = [];
  let n = 1;
  ids.forEach((id, i) => {
    if (i % 4 !== 3) {
      rows.push({
        id: "jmp-" + n++,
        date: "2026-08-" + String(2 + (i % 9)).padStart(2, "0"),
        resident_id: id,
        amount: i % 2 === 0 ? 5000 : 10000,
        collector: petugas[i % petugas.length],
      });
    }
  });
  ids.slice(0, 12).forEach((id, i) => {
    rows.push({
      id: "jmp-" + n++,
      date: "2026-07-" + String(18 + (i % 10)).padStart(2, "0"),
      resident_id: id,
      amount: 5000,
      collector: petugas[i % petugas.length],
    });
  });
  return rows;
}
