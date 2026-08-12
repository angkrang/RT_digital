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
const API_TOKEN = "Mocacino3in1kopiku";

const SHEET_NAMES = {
  USERS: "Users",
  TRANSACTIONS: "Transactions",
  PAYMENTS: "Payments",
  JIMPITAN: "Jimpitan",
  ARISAN: "Arisan",
  SETTINGS: "Settings",
  // -- Phase 2: Master Data Warga + Iuran --
  HOUSEHOLDS: "Households",
  RESIDENTS: "Residents",
  DUES_TYPES: "DuesTypes",
  DUES: "Dues",
};

const TX_HEADERS = [
  "id", "transaction_code", "transaction_date", "type", "category",
  "description", "amount", "source", "payment_method", "attachment",
  "notes", "created_by",
  // -- Batch 3A: Jimpitan (dan modul lain ke depannya) bisa melacak balik
  // transaksi otomatis ke data sumbernya lewat dua kolom ini. --
  "reference_type", "reference_id",
];
const USER_HEADERS = ["email", "password", "role", "name"];
const PAYMENT_HEADERS = ["id", "resident_id", "period", "paid_amount", "payment_date"];
// -- Batch 3A: Jimpitan sekarang memakai Master Data Rumah (household_id),
// bukan lagi resident_id demo lama, dan punya status setoran + audit trail. --
const JIMPITAN_HEADERS = [
  "id", "date", "household_id", "amount", "status", "collector", "notes",
  "created_by", "created_at", "updated_at",
];
const JIMPITAN_STATUS = {
  SUDAH: "Sudah Setor",
  BELUM: "Belum Setor",
  TIDAK_ADA: "Tidak Ada di Rumah",
};
const ARISAN_HEADERS = ["period", "winner_id"];
const SETTINGS_HEADERS = ["iuranAmount", "arisanAmount", "sosialWajibAmount"];

// -- Phase 2: Master Data Warga + Iuran --
const HOUSEHOLD_HEADERS = [
  "id", "house_number", "address", "head_resident_id", "status", "notes",
  "lat", "lng",
  "created_at", "updated_at",
];
const RESIDENT_HEADERS = [
  "id", "household_id", "nik", "kk_number", "name", "gender", "birth_place",
  "birth_date", "phone", "relationship", "occupation", "resident_status",
  "created_at", "updated_at",
];
const DUES_TYPE_HEADERS = ["id", "name", "amount", "active"];
const DUES_HEADERS = [
  "id", "household_id", "dues_type_id", "period", "amount", "paid_amount",
  "status", "payment_date", "created_at", "updated_at",
];

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
    if (action === "getHouseholds") {
      return jsonOut({ ok: true, data: { households: readAll_(SHEET_NAMES.HOUSEHOLDS) } });
    }
    if (action === "getResidents") {
      return jsonOut({ ok: true, data: { residents: readAll_(SHEET_NAMES.RESIDENTS) } });
    }
    if (action === "getDues") {
      return jsonOut({ ok: true, data: { dues: readAll_(SHEET_NAMES.DUES), duesTypes: readAll_(SHEET_NAMES.DUES_TYPES) } });
    }
    if (action === "getJimpitan") {
      return jsonOut({ ok: true, data: { jimpitan: readAllJimpitan_() } });
    }
    if (action === "getJimpitanSummary") {
      return jsonOut({ ok: true, data: getJimpitanSummary_(e.parameter.date, e.parameter.month) });
    }
    if (action === "getJimpitanMonthlyRecap") {
      return jsonOut({ ok: true, data: getJimpitanMonthlyRecap_(e.parameter.month) });
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
      updateJimpitan: apiUpdateJimpitan,
      addArisanWinner: apiAddArisanWinner,
      // -- Phase 2: Master Data Warga + Iuran --
      addHousehold: apiAddHousehold,
      updateHousehold: apiUpdateHousehold,
      addResident: apiAddResident,
      updateResident: apiUpdateResident,
      saveDuesTypes: apiSaveDuesTypes,
      generateDues: apiGenerateDues,
      recordPayment: apiRecordDuesPayment,
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
  const jimpitan = readAllJimpitan_();
  const arisanRiwayat = readAll_(SHEET_NAMES.ARISAN);

  const settingsRows = readAll_(SHEET_NAMES.SETTINGS);
  const settings = settingsRows[0]
    ? {
        iuranAmount: Number(settingsRows[0].iuranAmount) || 0,
        arisanAmount: Number(settingsRows[0].arisanAmount) || 0,
        sosialWajibAmount: Number(settingsRows[0].sosialWajibAmount) || 0,
      }
    : { iuranAmount: 150000, arisanAmount: 100000, sosialWajibAmount: 20000 };

  const households = readAll_(SHEET_NAMES.HOUSEHOLDS).map((h) => ({
    ...h,
    lat: h.lat === "" || h.lat === undefined ? null : Number(h.lat),
    lng: h.lng === "" || h.lng === undefined ? null : Number(h.lng),
  }));
  const residents = readAll_(SHEET_NAMES.RESIDENTS);
  const duesTypes = readAll_(SHEET_NAMES.DUES_TYPES).map((d) => ({
    ...d,
    amount: Number(d.amount) || 0,
    active: !(d.active === false || d.active === "FALSE" || d.active === "false"),
  }));
  const dues = readAll_(SHEET_NAMES.DUES).map((d) => ({
    ...d,
    amount: Number(d.amount) || 0,
    paid_amount: Number(d.paid_amount) || 0,
    payment_date: d.payment_date ? normalizeDate_(d.payment_date) : null,
  }));

  return { transactions, payments, jimpitan, arisanRiwayat, settings, households, residents, duesTypes, dues };
}

function nowIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd'T'HH:mm:ss");
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
   JIMPITAN (Batch 3A)
   Menggunakan Master Data Rumah (Households) yang sudah ada dari Batch 2.
   Setoran berstatus "Sudah Setor" dengan nominal > 0 otomatis membuat
   transaksi Pemasukan di Kas RT, dengan reference_type/reference_id yang
   menunjuk balik ke baris Jimpitan terkait.
   --------------------------------------------------------------------- */
function readAllJimpitan_() {
  return readAll_(SHEET_NAMES.JIMPITAN).map((j) => ({
    ...j,
    date: normalizeDate_(j.date),
    amount: Number(j.amount) || 0,
  }));
}

function householdLabel_(householdId) {
  const household = readAll_(SHEET_NAMES.HOUSEHOLDS).find((h) => String(h.id) === String(householdId));
  const head = household
    ? readAll_(SHEET_NAMES.RESIDENTS).find((r) => String(r.id) === String(household.head_resident_id))
    : null;
  const houseLabel = household ? household.house_number : "-";
  const headName = head ? head.name : "";
  return { houseLabel: houseLabel, headName: headName, label: "Rumah No. " + houseLabel + (headName ? " — " + headName : "") };
}

// Buat transaksi Pemasukan Kas RT untuk satu baris Jimpitan (dipanggil saat
// tambah baru maupun saat status diubah menjadi "Sudah Setor").
function createJimpitanTransaction_(jimpitanEntry) {
  const info = householdLabel_(jimpitanEntry.household_id);
  const txCode = generateTxCode_(jimpitanEntry.date);
  const tx = {
    id: "tx-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6),
    transaction_code: txCode,
    transaction_date: jimpitanEntry.date,
    type: "masuk",
    category: "Jimpitan",
    description: "Jimpitan - " + info.label,
    amount: Number(jimpitanEntry.amount) || 0,
    source: info.label,
    payment_method: "Tunai",
    attachment: null,
    notes: jimpitanEntry.notes || "",
    created_by: jimpitanEntry.created_by || "",
    reference_type: "JIMPITAN",
    reference_id: jimpitanEntry.id,
  };
  appendRow_(SHEET_NAMES.TRANSACTIONS, tx, TX_HEADERS);
  return tx;
}

function findJimpitanTransaction_(jimpitanId) {
  return readAll_(SHEET_NAMES.TRANSACTIONS).find(
    (t) => t.reference_type === "JIMPITAN" && String(t.reference_id) === String(jimpitanId)
  );
}

function updateTransactionRecord_(tx) {
  const sh = sheet_(SHEET_NAMES.TRANSACTIONS);
  const rowIdx = findRowIndexById_(sh, TX_HEADERS, "id", tx.id);
  if (rowIdx === -1) return null;
  const row = TX_HEADERS.map((h) => (tx[h] === undefined || tx[h] === null ? "" : tx[h]));
  sh.getRange(rowIdx, 1, 1, TX_HEADERS.length).setValues([row]);
  return tx;
}

function apiAddJimpitan(payload) {
  const date = normalizeDate_(String(payload.date || "").trim());
  const householdId = payload.household_id;
  if (!date) throw new Error("Tanggal wajib diisi.");
  if (!householdId) throw new Error("Rumah wajib dipilih.");
  const status = payload.status || JIMPITAN_STATUS.BELUM;
  const amount = status === JIMPITAN_STATUS.SUDAH ? (Number(payload.amount) || 0) : 0;

  // -- Anti duplikasi: kombinasi tanggal + rumah --
  const existing = readAll_(SHEET_NAMES.JIMPITAN);
  const isDuplicate = existing.some(
    (j) => normalizeDate_(j.date) === date && String(j.household_id) === String(householdId)
  );
  if (isDuplicate && !payload.force) {
    throw new Error("DUPLICATE: Rumah ini sudah memiliki pencatatan jimpitan pada tanggal tersebut.");
  }

  const now = nowIso_();
  const entry = {
    id: "jmp-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6),
    date: date,
    household_id: householdId,
    amount: amount,
    status: status,
    collector: payload.collector || "",
    notes: payload.notes || "",
    created_by: payload.created_by || "",
    created_at: now,
    updated_at: now,
  };
  appendRow_(SHEET_NAMES.JIMPITAN, entry, JIMPITAN_HEADERS);

  let transaction = null;
  if (status === JIMPITAN_STATUS.SUDAH && amount > 0) {
    transaction = createJimpitanTransaction_(entry);
  }

  return { jimpitan: entry, transaction: transaction };
}

function apiUpdateJimpitan(payload) {
  const sh = sheet_(SHEET_NAMES.JIMPITAN);
  const rowIdx = findRowIndexById_(sh, JIMPITAN_HEADERS, "id", payload.id);
  if (rowIdx === -1) throw new Error("Data jimpitan tidak ditemukan: " + payload.id);
  const current = {};
  const currentRow = sh.getRange(rowIdx, 1, 1, JIMPITAN_HEADERS.length).getValues()[0];
  JIMPITAN_HEADERS.forEach((h, i) => (current[h] = currentRow[i]));

  const merged = { ...current, ...payload, updated_at: nowIso_() };
  if (merged.status !== JIMPITAN_STATUS.SUDAH) merged.amount = 0;
  merged.amount = Number(merged.amount) || 0;
  merged.date = normalizeDate_(merged.date);

  const row = JIMPITAN_HEADERS.map((h) => (merged[h] === undefined || merged[h] === null ? "" : merged[h]));
  sh.getRange(rowIdx, 1, 1, JIMPITAN_HEADERS.length).setValues([row]);

  // Selaraskan transaksi Kas RT terkait (buat baru / perbarui / tidak ada
  // perubahan), tanpa pernah menghapus transaksi lama begitu saja.
  let transaction = findJimpitanTransaction_(merged.id) || null;
  if (merged.status === JIMPITAN_STATUS.SUDAH && merged.amount > 0) {
    if (transaction) {
      const info = householdLabel_(merged.household_id);
      transaction = updateTransactionRecord_({
        ...transaction,
        transaction_date: merged.date,
        amount: merged.amount,
        description: "Jimpitan - " + info.label,
        source: info.label,
        notes: merged.notes || "",
      });
    } else {
      transaction = createJimpitanTransaction_(merged);
    }
  }

  return { jimpitan: merged, transaction: transaction };
}

/* -- Statistik dashboard & rekap bulanan (dihitung juga di frontend dari
   data bootstrap; endpoint ini disediakan untuk akses langsung/laporan.) -- */
function getJimpitanSummary_(dateStr, monthStr) {
  const rows = readAllJimpitan_();
  const households = readAll_(SHEET_NAMES.HOUSEHOLDS).filter(
    (h) => String(h.status) !== "Pindah" && String(h.status) !== "Nonaktif"
  );
  const today = dateStr || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
  const month = monthStr || today.slice(0, 7);

  const sudahHariIni = rows.filter((j) => j.date === today && j.status === JIMPITAN_STATUS.SUDAH);
  const sudahBulanIni = rows.filter((j) => j.date.slice(0, 7) === month && j.status === JIMPITAN_STATUS.SUDAH);
  const setorSet = new Set(sudahBulanIni.map((j) => j.household_id));

  return {
    date: today,
    month: month,
    jimpitanHariIni: sudahHariIni.reduce((s, j) => s + j.amount, 0),
    jimpitanBulanIni: sudahBulanIni.reduce((s, j) => s + j.amount, 0),
    rumahSudahSetor: households.filter((h) => setorSet.has(h.id)).length,
    rumahBelumSetor: households.length - households.filter((h) => setorSet.has(h.id)).length,
  };
}

function getJimpitanMonthlyRecap_(monthStr) {
  const rows = readAllJimpitan_();
  const households = readAll_(SHEET_NAMES.HOUSEHOLDS);
  const residents = readAll_(SHEET_NAMES.RESIDENTS);
  const residentMap = {};
  residents.forEach((r) => (residentMap[r.id] = r));
  const month = monthStr || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM");

  return households.map((h) => {
    const entries = rows.filter((j) => j.household_id === h.id && j.date.slice(0, 7) === month && j.status === JIMPITAN_STATUS.SUDAH);
    const head = residentMap[h.head_resident_id];
    return {
      household_id: h.id,
      house_number: h.house_number,
      head_name: head ? head.name : "-",
      jumlah_setoran: entries.length,
      total: entries.reduce((s, j) => s + j.amount, 0),
    };
  });
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

/* ---------------------------------------------------------------------
   PHASE 2 — MASTER DATA RUMAH (Households)
   --------------------------------------------------------------------- */
function apiAddHousehold(payload) {
  const houseNumber = String(payload.house_number || "").trim();
  if (!houseNumber) throw new Error("Nomor rumah wajib diisi.");
  const existing = readAll_(SHEET_NAMES.HOUSEHOLDS);
  if (existing.some((h) => String(h.house_number).trim() === houseNumber)) {
    throw new Error("Nomor rumah " + houseNumber + " sudah terdaftar.");
  }
  const now = nowIso_();
  const rec = {
    id: "h-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6),
    house_number: houseNumber,
    address: payload.address || "",
    head_resident_id: payload.head_resident_id || "",
    status: payload.status || "Aktif",
    notes: payload.notes || "",
    lat: payload.lat || "",
    lng: payload.lng || "",
    created_at: now,
    updated_at: now,
  };
  appendRow_(SHEET_NAMES.HOUSEHOLDS, rec, HOUSEHOLD_HEADERS);
  return { household: rec };
}

function apiUpdateHousehold(payload) {
  const sh = sheet_(SHEET_NAMES.HOUSEHOLDS);
  const rowIdx = findRowIndexById_(sh, HOUSEHOLD_HEADERS, "id", payload.id);
  if (rowIdx === -1) throw new Error("Data rumah tidak ditemukan: " + payload.id);
  if (payload.house_number) {
    const houseNumber = String(payload.house_number).trim();
    const existing = readAll_(SHEET_NAMES.HOUSEHOLDS);
    if (existing.some((h) => String(h.house_number).trim() === houseNumber && String(h.id) !== String(payload.id))) {
      throw new Error("Nomor rumah " + houseNumber + " sudah dipakai rumah lain.");
    }
  }
  const current = {};
  const currentRow = sh.getRange(rowIdx, 1, 1, HOUSEHOLD_HEADERS.length).getValues()[0];
  HOUSEHOLD_HEADERS.forEach((h, i) => (current[h] = currentRow[i]));
  const merged = { ...current, ...payload, updated_at: nowIso_() };
  const row = HOUSEHOLD_HEADERS.map((h) => (merged[h] === undefined || merged[h] === null ? "" : merged[h]));
  sh.getRange(rowIdx, 1, 1, HOUSEHOLD_HEADERS.length).setValues([row]);
  return { household: merged };
}

/* ---------------------------------------------------------------------
   PHASE 2 — MASTER DATA WARGA (Residents)
   --------------------------------------------------------------------- */
function validateResidentPayload_(payload, excludeId) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Nama warga wajib diisi.");
  if (!payload.household_id) throw new Error("Rumah wajib dipilih.");
  const nik = String(payload.nik || "").trim();
  if (!/^\d{16}$/.test(nik)) throw new Error("NIK harus berupa 16 digit angka.");
  const kk = String(payload.kk_number || "").trim();
  if (kk && !/^\d{16}$/.test(kk)) throw new Error("Nomor KK harus berupa 16 digit angka.");
  const existing = readAll_(SHEET_NAMES.RESIDENTS);
  const dup = existing.some((r) => String(r.nik) === nik && String(r.id) !== String(excludeId || ""));
  if (dup) throw new Error("NIK " + nik + " sudah terdaftar untuk warga lain.");
  return { name, nik, kk };
}

function apiAddResident(payload) {
  const { name, nik, kk } = validateResidentPayload_(payload, null);
  const now = nowIso_();
  const rec = {
    id: "res-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6),
    household_id: payload.household_id,
    nik: nik,
    kk_number: kk,
    name: name,
    gender: payload.gender || "",
    birth_place: payload.birth_place || "",
    birth_date: payload.birth_date || "",
    phone: payload.phone || "",
    relationship: payload.relationship || "",
    occupation: payload.occupation || "",
    resident_status: payload.resident_status || "Tetap",
    created_at: now,
    updated_at: now,
  };
  appendRow_(SHEET_NAMES.RESIDENTS, rec, RESIDENT_HEADERS);

  // Jika ini anggota pertama & rumah belum punya kepala keluarga, jadikan
  // warga ini kepala keluarga secara otomatis.
  if (String(rec.relationship).toLowerCase() === "kepala keluarga") {
    const hh = sheet_(SHEET_NAMES.HOUSEHOLDS);
    const rowIdx = findRowIndexById_(hh, HOUSEHOLD_HEADERS, "id", payload.household_id);
    if (rowIdx !== -1) {
      const headCol = HOUSEHOLD_HEADERS.indexOf("head_resident_id") + 1;
      hh.getRange(rowIdx, headCol).setValue(rec.id);
      const updCol = HOUSEHOLD_HEADERS.indexOf("updated_at") + 1;
      hh.getRange(rowIdx, updCol).setValue(nowIso_());
    }
  }
  return { resident: rec };
}

function apiUpdateResident(payload) {
  const sh = sheet_(SHEET_NAMES.RESIDENTS);
  const rowIdx = findRowIndexById_(sh, RESIDENT_HEADERS, "id", payload.id);
  if (rowIdx === -1) throw new Error("Warga tidak ditemukan: " + payload.id);
  const current = {};
  const currentRow = sh.getRange(rowIdx, 1, 1, RESIDENT_HEADERS.length).getValues()[0];
  RESIDENT_HEADERS.forEach((h, i) => (current[h] = currentRow[i]));
  const merged = { ...current, ...payload };
  validateResidentPayload_(merged, payload.id);
  merged.updated_at = nowIso_();
  const row = RESIDENT_HEADERS.map((h) => (merged[h] === undefined || merged[h] === null ? "" : merged[h]));
  sh.getRange(rowIdx, 1, 1, RESIDENT_HEADERS.length).setValues([row]);

  if (String(merged.relationship).toLowerCase() === "kepala keluarga") {
    const hh = sheet_(SHEET_NAMES.HOUSEHOLDS);
    const hIdx = findRowIndexById_(hh, HOUSEHOLD_HEADERS, "id", merged.household_id);
    if (hIdx !== -1) {
      const headCol = HOUSEHOLD_HEADERS.indexOf("head_resident_id") + 1;
      hh.getRange(hIdx, headCol).setValue(merged.id);
    }
  }
  return { resident: merged };
}

/* ---------------------------------------------------------------------
   PHASE 2 — MASTER JENIS IURAN (DuesTypes)
   --------------------------------------------------------------------- */
function apiSaveDuesTypes(payload) {
  const list = payload.duesTypes || [];
  const rows = list.map((dt) => ({
    id: dt.id || ("dt-" + Utilities.getUuid().slice(0, 8)),
    name: String(dt.name || "").trim(),
    amount: Number(dt.amount) || 0,
    active: dt.active === false ? false : true,
  }));
  if (rows.some((r) => !r.name)) throw new Error("Nama jenis iuran wajib diisi.");
  const sh = getOrCreateSheet_(ss_(), SHEET_NAMES.DUES_TYPES, DUES_TYPE_HEADERS);
  writeRows_(sh, DUES_TYPE_HEADERS, rows);
  return { duesTypes: rows };
}

/* ---------------------------------------------------------------------
   PHASE 2 — GENERATE TAGIHAN IURAN BULANAN (Dues)
   --------------------------------------------------------------------- */
function apiGenerateDues(payload) {
  const period = String(payload.period || "").trim();
  const duesTypeId = payload.dues_type_id;
  if (!period) throw new Error("Periode wajib diisi.");
  if (!duesTypeId) throw new Error("Jenis iuran wajib dipilih.");

  const duesType = readAll_(SHEET_NAMES.DUES_TYPES).find((d) => String(d.id) === String(duesTypeId));
  if (!duesType) throw new Error("Jenis iuran tidak ditemukan.");
  const amount = Number(duesType.amount) || 0;

  // Hanya rumah berstatus aktif yang ditagih (rumah kosong/pindah dilewati).
  const households = readAll_(SHEET_NAMES.HOUSEHOLDS).filter(
    (h) => String(h.status) !== "Pindah" && String(h.status) !== "Nonaktif"
  );
  const existingKeys = new Set(
    readAll_(SHEET_NAMES.DUES).map((d) => d.household_id + "|" + d.dues_type_id + "|" + d.period)
  );

  const now = nowIso_();
  const newRows = [];
  households.forEach((h, i) => {
    const key = h.id + "|" + duesTypeId + "|" + period;
    if (existingKeys.has(key)) return; // sudah pernah dibuat -> jangan buat tagihan ganda
    newRows.push({
      id: "due-" + new Date().getTime() + "-" + i + "-" + Math.random().toString(36).slice(2, 5),
      household_id: h.id,
      dues_type_id: duesTypeId,
      period: period,
      amount: amount,
      paid_amount: 0,
      status: "belum",
      payment_date: "",
      created_at: now,
      updated_at: now,
    });
  });

  if (newRows.length > 0) {
    const sh = sheet_(SHEET_NAMES.DUES);
    const startRow = sh.getLastRow() + 1;
    const values = newRows.map((r) => DUES_HEADERS.map((h) => (r[h] === undefined || r[h] === null ? "" : r[h])));
    sh.getRange(startRow, 1, values.length, DUES_HEADERS.length).setValues(values);
  }

  return {
    created: newRows.length,
    skipped: households.length - newRows.length,
    dues: newRows,
  };
}

/* ---------------------------------------------------------------------
   PHASE 2 — CATAT PEMBAYARAN IURAN (Dues + Payments + Transactions)
   Operasi ini digabung jadi satu (atomik dengan LockService lewat doPost)
   supaya Dues, Payments, dan Transactions selalu konsisten:
     Payment + Dues update + Transaction  ->  satu operasi.
   --------------------------------------------------------------------- */
function apiRecordDuesPayment(payload) {
  const duesSh = sheet_(SHEET_NAMES.DUES);
  const rowIdx = findRowIndexById_(duesSh, DUES_HEADERS, "id", payload.dues_id);
  if (rowIdx === -1) throw new Error("Tagihan iuran tidak ditemukan: " + payload.dues_id);
  const currentRow = duesSh.getRange(rowIdx, 1, 1, DUES_HEADERS.length).getValues()[0];
  const dues = {};
  DUES_HEADERS.forEach((h, i) => (dues[h] = currentRow[i]));

  const amountToPay = Number(payload.amount) || 0;
  if (amountToPay <= 0) throw new Error("Nominal pembayaran harus lebih dari 0.");
  const total = Number(dues.amount) || 0;
  const alreadyPaid = Number(dues.paid_amount) || 0;
  const sisa = Math.max(0, total - alreadyPaid);
  if (sisa <= 0) throw new Error("Tagihan ini sudah lunas.");
  const applied = Math.min(amountToPay, sisa);
  const newPaid = alreadyPaid + applied;
  const newStatus = newPaid >= total ? "lunas" : "sebagian";
  const paymentDate = payload.date || normalizeDate_(new Date());

  // 1) Update baris Dues.
  const updatedDues = { ...dues, paid_amount: newPaid, status: newStatus, payment_date: paymentDate, updated_at: nowIso_() };
  const duesRow = DUES_HEADERS.map((h) => (updatedDues[h] === undefined || updatedDues[h] === null ? "" : updatedDues[h]));
  duesSh.getRange(rowIdx, 1, 1, DUES_HEADERS.length).setValues([duesRow]);

  // 2) Ambil data rumah / kepala keluarga / jenis iuran untuk keterangan transaksi.
  const household = readAll_(SHEET_NAMES.HOUSEHOLDS).find((h) => String(h.id) === String(dues.household_id));
  const head = household
    ? readAll_(SHEET_NAMES.RESIDENTS).find((r) => String(r.id) === String(household.head_resident_id))
    : null;
  const duesType = readAll_(SHEET_NAMES.DUES_TYPES).find((d) => String(d.id) === String(dues.dues_type_id));
  const houseLabel = household ? household.house_number : "-";
  const payerName = head ? head.name : household ? household.address || ("Rumah No. " + houseLabel) : "Warga";

  // 3) Catat di tabel Payments (histori pembayaran, konsisten dgn struktur lama).
  const paymentRecord = {
    id: "pay-due-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6),
    resident_id: dues.household_id,
    period: dues.period,
    paid_amount: applied,
    payment_date: paymentDate,
  };
  appendRow_(SHEET_NAMES.PAYMENTS, paymentRecord, PAYMENT_HEADERS);

  // 4) Buat transaksi pemasukan Kas RT secara otomatis (kategori "Iuran Warga").
  const txCode = generateTxCode_(paymentDate);
  const description = "Iuran " + (duesType ? duesType.name : "Warga") + " periode " + dues.period + " - Rumah No. " + houseLabel;
  const tx = {
    id: "tx-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 6),
    transaction_code: txCode,
    transaction_date: paymentDate,
    type: "masuk",
    category: "Iuran Warga",
    description: description,
    amount: applied,
    source: payerName,
    payment_method: payload.method || "Tunai",
    attachment: null,
    notes: "iuran_dues_id:" + dues.id,
    created_by: payload.created_by || "",
  };
  appendRow_(SHEET_NAMES.TRANSACTIONS, tx, TX_HEADERS);

  return { dues: updatedDues, payment: paymentRecord, transaction: tx };
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

  const arisanSheet = getOrCreateSheet_(ss, SHEET_NAMES.ARISAN, ARISAN_HEADERS);
  writeRows_(arisanSheet, ARISAN_HEADERS, [
    { period: "2026-05", winner_id: "r3" },
    { period: "2026-06", winner_id: "r8" },
    { period: "2026-07", winner_id: "r12" },
  ]);

  // -- Phase 2: Master Data Rumah + Warga + Jenis Iuran + Tagihan --
  const { households, residents } = buildDemoHouseholdsAndResidents_();
  const householdsSheet = getOrCreateSheet_(ss, SHEET_NAMES.HOUSEHOLDS, HOUSEHOLD_HEADERS);
  writeRows_(householdsSheet, HOUSEHOLD_HEADERS, households);

  const residentsSheet = getOrCreateSheet_(ss, SHEET_NAMES.RESIDENTS, RESIDENT_HEADERS);
  writeRows_(residentsSheet, RESIDENT_HEADERS, residents);

  const duesTypes = buildDemoDuesTypes_();
  const duesTypesSheet = getOrCreateSheet_(ss, SHEET_NAMES.DUES_TYPES, DUES_TYPE_HEADERS);
  writeRows_(duesTypesSheet, DUES_TYPE_HEADERS, duesTypes);

  const duesSheet = getOrCreateSheet_(ss, SHEET_NAMES.DUES, DUES_HEADERS);
  writeRows_(duesSheet, DUES_HEADERS, buildDemoDues_(households, duesTypes));

  // -- Batch 3A: Jimpitan (memakai rumah dari Master Data di atas) --
  const jimpitanSheet = getOrCreateSheet_(ss, SHEET_NAMES.JIMPITAN, JIMPITAN_HEADERS);
  writeRows_(jimpitanSheet, JIMPITAN_HEADERS, buildDemoJimpitan_(households));

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

/* ---------------------------------------------------------------------
   PHASE 2 — DATA DEMO: RUMAH + WARGA (20 rumah, 58 warga)
   --------------------------------------------------------------------- */
function buildDemoHouseholdsAndResidents_() {
  // [ no rumah, alamat, status rumah, [ [nama, hubungan, gender, status warga, pekerjaan], ... ] ]
  const raw = [
    ["01", "Jl. Melati No. 1", "Aktif", [
      ["Ahmad Zainuri", "Kepala Keluarga", "L", "Tetap", "Wiraswasta"],
      ["Siti Aminah", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Budi Zainuri", "Anak", "L", "Tetap", "Pelajar"],
    ]],
    ["02", "Jl. Melati No. 2", "Aktif", [
      ["Dedi Kurniawan", "Kepala Keluarga", "L", "Tetap", "Karyawan Swasta"],
      ["Rina Kurniawan", "Istri", "P", "Tetap", "Guru"],
    ]],
    ["03", "Jl. Melati No. 3", "Aktif", [
      ["Yusuf Hakim", "Kepala Keluarga", "L", "Tetap", "PNS"],
      ["Dewi Hakim", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Ani Hakim", "Anak", "P", "Tetap", "Mahasiswa"],
      ["Rizki Hakim", "Anak", "L", "Tetap", "Pelajar"],
    ]],
    ["04", "Jl. Melati No. 4", "Aktif", [
      ["Hendra Wijaya", "Kepala Keluarga", "L", "Tetap", "Pengusaha"],
      ["Maya Wijaya", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Fajar Wijaya", "Anak", "L", "Tetap", "Pelajar"],
    ]],
    ["05", "Jl. Melati No. 5", "Aktif", [
      ["Ratna Sari", "Kepala Keluarga", "P", "Tetap", "Wiraswasta"],
      ["Agus Santoso", "Suami", "L", "Tetap", "Karyawan Swasta"],
    ]],
    ["06", "Jl. Anggrek No. 6", "Aktif", [
      ["Slamet Riyadi", "Kepala Keluarga", "L", "Tetap", "Petugas Kebersihan"],
      ["Yanti Slamet", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Doni Slamet", "Anak", "L", "Tetap", "Pelajar"],
    ]],
    ["07", "Jl. Anggrek No. 7", "Aktif", [
      ["Rohman Hidayat", "Kepala Keluarga", "L", "Tetap", "Satpam"],
      ["Wulan Rohman", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
    ]],
    ["08", "Jl. Anggrek No. 8", "Aktif", [
      ["Joko Susanto", "Kepala Keluarga", "L", "Tetap", "PNS"],
      ["Fitri Susanto", "Istri", "P", "Tetap", "Bidan"],
      ["Nanda Susanto", "Anak", "P", "Tetap", "Mahasiswa"],
    ]],
    ["09", "Jl. Anggrek No. 9", "Aktif", [
      ["Bambang Setiawan", "Kepala Keluarga", "L", "Tetap", "Wiraswasta"],
      ["Lina Setiawan", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Tono Setiawan", "Anak", "L", "Tetap", "Pelajar"],
    ]],
    ["10", "Jl. Anggrek No. 10", "Aktif", [
      ["Hasan Basri", "Kepala Keluarga", "L", "Tetap", "Karyawan Swasta"],
      ["Sari Hasan", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Wati Hasan", "Anak", "P", "Tetap", "Pelajar"],
    ]],
    ["11", "Jl. Kenanga No. 11", "Aktif", [
      ["Eko Prasetyo", "Kepala Keluarga", "L", "Kontrak", "Karyawan Swasta"],
      ["Nur Prasetyo", "Istri", "P", "Kontrak", "Ibu Rumah Tangga"],
    ]],
    ["12", "Jl. Kenanga No. 12", "Aktif", [
      ["Andi Saputra", "Kepala Keluarga", "L", "Tetap", "Wiraswasta"],
      ["Dian Saputra", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
    ]],
    ["13", "Jl. Kenanga No. 13", "Aktif", [
      ["Karto Wijoyo", "Kepala Keluarga", "L", "Tetap", "Pensiunan"],
      ["Warsi Karto", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
    ]],
    ["14", "Jl. Kenanga No. 14", "Aktif", [
      ["Feri Irawan", "Kepala Keluarga", "L", "Pendatang", "Freelancer"],
      ["Sinta Irawan", "Istri", "P", "Pendatang", "Karyawan Swasta"],
    ]],
    ["15", "Jl. Kenanga No. 15", "Aktif", [
      ["Yudi Firmansyah", "Kepala Keluarga", "L", "Tetap", "Wiraswasta"],
      ["Ika Firmansyah", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
    ]],
    ["16", "Jl. Dahlia No. 16", "Aktif", [
      ["Wahyu Nugroho", "Kepala Keluarga", "L", "Kos", "Karyawan Swasta"],
      ["Putri Amelia", "Kos", "P", "Kos", "Karyawan Swasta"],
    ]],
    ["17", "Jl. Dahlia No. 17", "Aktif", [
      ["Sugianto", "Kepala Keluarga", "L", "Tetap", "Wiraswasta"],
      ["Ningsih Sugianto", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Bagus Sugianto", "Anak", "L", "Tetap", "Pelajar"],
      ["Ayu Sugianto", "Anak", "P", "Tetap", "Pelajar"],
    ]],
    ["18", "Jl. Dahlia No. 18", "Aktif", [
      ["Hendro Purnomo", "Kepala Keluarga", "L", "Tetap", "PNS"],
      ["Ratih Purnomo", "Istri", "P", "Tetap", "Guru"],
      ["Bima Purnomo", "Anak", "L", "Tetap", "Mahasiswa"],
      ["Citra Purnomo", "Anak", "P", "Tetap", "Pelajar"],
    ]],
    ["19", "Jl. Dahlia No. 19", "Aktif", [
      ["Ismail Marzuki", "Kepala Keluarga", "L", "Pendatang", "Pedagang"],
      ["Halimah Ismail", "Istri", "P", "Pendatang", "Ibu Rumah Tangga"],
      ["Umar Ismail", "Anak", "L", "Pendatang", "Pelajar"],
      ["Aisyah Ismail", "Anak", "P", "Pendatang", "Pelajar"],
    ]],
    ["20", "Jl. Dahlia No. 20", "Aktif", [
      ["Sutrisno", "Kepala Keluarga", "L", "Tetap", "Pensiunan"],
      ["Painem Sutrisno", "Istri", "P", "Tetap", "Ibu Rumah Tangga"],
      ["Kartika Sutrisno", "Anak", "P", "Tetap", "Karyawan Swasta"],
      ["Rendra Sutrisno", "Anak", "L", "Tetap", "Mahasiswa"],
    ]],
  ];

  const now = "2026-01-01T00:00:00";
  const households = [];
  const residents = [];

  raw.forEach((entry, hIdx) => {
    const [houseNumber, address, houseStatus, members] = entry;
    const householdId = "h-demo-" + houseNumber;
    const kkNumber = "3201" + String(1000000000 + hIdx * 37).slice(-12);

    let headResidentId = "";
    const houseResidents = members.map((m, mIdx) => {
      const [name, relation, gender, status, occupation] = m;
      const residentId = "res-demo-" + houseNumber + "-" + (mIdx + 1);
      if (String(relation) === "Kepala Keluarga") headResidentId = residentId;
      const nik = "3201" + String(houseNumber).padStart(2, "0") + "01" + "199" + String(mIdx) +
        String(1000 + hIdx * 7 + mIdx).slice(-4);
      return {
        id: residentId,
        household_id: householdId,
        nik: nik.padEnd(16, "0").slice(0, 16),
        kk_number: kkNumber,
        name: name,
        gender: gender,
        birth_place: "Yogyakarta",
        birth_date: "198" + (mIdx % 9) + "-0" + (((hIdx + mIdx) % 9) + 1) + "-1" + (mIdx % 9),
        phone: "0812" + String(3000000 + hIdx * 91 + mIdx * 13).slice(-7),
        relationship: relation,
        occupation: occupation,
        resident_status: status,
        created_at: now,
        updated_at: now,
      };
    });

    // Titik koordinat demo di sekitar Gang Sempit, Sidomulyo, Triharjo,
    // Sleman (lokasi RT sebenarnya), disusun per baris jalan (5 rumah /
    // jalan) supaya terlihat rapi saat ditampilkan di peta. Ganti dengan
    // koordinat asli per rumah lewat form Edit Rumah jika sudah tersedia.
    const CENTER_LAT = -7.674597, CENTER_LNG = 110.344724;
    const LAT_STEP = 0.0009, LNG_STEP = 0.0011;
    const row = Math.floor(hIdx / 5);
    const col = hIdx % 5;
    const lat = CENTER_LAT - row * LAT_STEP + (col % 2 === 0 ? 0.00015 : -0.00015);
    const lng = CENTER_LNG + col * LNG_STEP;

    households.push({
      id: householdId,
      house_number: houseNumber,
      address: address,
      head_resident_id: headResidentId,
      status: houseStatus,
      notes: "",
      lat: lat,
      lng: lng,
      created_at: now,
      updated_at: now,
    });
    houseResidents.forEach((r) => residents.push(r));
  });

  return { households, residents };
}

/* ---------------------------------------------------------------------
   PHASE 2 — DATA DEMO: JENIS IURAN + TAGIHAN AGUSTUS 2026
   --------------------------------------------------------------------- */
function buildDemoDuesTypes_() {
  return [
    { id: "dt-iuranrt", name: "Iuran RT", amount: 150000, active: true },
    { id: "dt-kebersihan", name: "Kebersihan", amount: 20000, active: true },
    { id: "dt-keamanan", name: "Keamanan", amount: 30000, active: true },
    { id: "dt-danasosial", name: "Dana Sosial", amount: 20000, active: true },
  ];
}

function buildDemoDues_(households, duesTypes) {
  const iuranRt = duesTypes.find((d) => d.id === "dt-iuranrt");
  const amount = iuranRt ? iuranRt.amount : 150000;
  const now = "2026-08-01T00:00:00";
  return households.map((h, i) => {
    const seed = i % 3; // 0 = belum, 1 = sebagian, 2 = lunas
    const paid = seed === 0 ? 0 : seed === 1 ? Math.round(amount * 0.5) : amount;
    const status = paid >= amount ? "lunas" : paid > 0 ? "sebagian" : "belum";
    return {
      id: "due-demo-" + h.house_number,
      household_id: h.id,
      dues_type_id: "dt-iuranrt",
      period: "2026-08",
      amount: amount,
      paid_amount: paid,
      status: status,
      payment_date: paid > 0 ? "2026-08-" + String(3 + (i % 20)).padStart(2, "0") : "",
      created_at: now,
      updated_at: now,
    };
  });
}

function buildDemoJimpitan_(households) {
  const petugas = ["Bpk. Slamet", "Bpk. Rohman", "Ibu Yanti"];
  const statusCycle = [
    JIMPITAN_STATUS.SUDAH, JIMPITAN_STATUS.SUDAH, JIMPITAN_STATUS.SUDAH,
    JIMPITAN_STATUS.BELUM, JIMPITAN_STATUS.TIDAK_ADA,
  ];
  const now = "2026-08-01T00:00:00";
  const createdBy = "Ibu Wulan Ningsih";
  const rows = [];
  let n = 1;

  const pushRow = (h, date, status, amount, i) => {
    rows.push({
      id: "jmp-" + n++,
      date: date,
      household_id: h.id,
      amount: status === JIMPITAN_STATUS.SUDAH ? amount : 0,
      status: status,
      collector: petugas[i % petugas.length],
      notes: "",
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    });
  };

  // Setoran bulan Agustus 2026 (bulan berjalan), sebagian besar rumah
  // sudah setor, sebagian belum, agar statistik dashboard tidak kosong.
  households.forEach((h, i) => {
    const status = statusCycle[i % statusCycle.length];
    const date = "2026-08-" + String(2 + (i % 9)).padStart(2, "0");
    pushRow(h, date, status, i % 2 === 0 ? 5000 : 10000, i);
  });

  // Beberapa setoran tertanggal hari ini (11 Agustus 2026) supaya kartu
  // "Jimpitan Hari Ini" pada dashboard punya data.
  households.slice(0, 8).forEach((h, i) => {
    const status = i === 7 ? JIMPITAN_STATUS.BELUM : JIMPITAN_STATUS.SUDAH;
    pushRow(h, "2026-08-11", status, i % 2 === 0 ? 5000 : 10000, i);
  });

  // Riwayat bulan Juli 2026 untuk mengisi filter bulan & rekap bulan lalu.
  households.slice(0, 12).forEach((h, i) => {
    const date = "2026-07-" + String(18 + (i % 10)).padStart(2, "0");
    pushRow(h, date, JIMPITAN_STATUS.SUDAH, 5000, i);
  });

  return rows;
}
