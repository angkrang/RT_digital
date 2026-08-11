import React, { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LayoutDashboard, Wallet, ArrowDownCircle, ArrowUpCircle, Users, Coins,
  Gift, HeartHandshake, FileBarChart, CalendarDays, UserCog, Settings,
  Menu, X, LogOut, Plus, Search, Filter as FilterIcon, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, Paperclip, Banknote, Landmark, CreditCard, CheckCircle2,
  AlertTriangle, Info, ChevronDown, Building2, ReceiptText, Shuffle, Trophy,
  Printer, FileSpreadsheet, Save, LogIn, ArrowLeft, Home, Users2, FileText,
  Phone, MapPin, ExternalLink,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const C = {
  navy: "#14304D",
  navyDark: "#0C2136",
  navyMid: "#1D4066",
  navySoft: "#2C5680",
  navyFaint: "#EAF0F6",
  green: "#1F8A57",
  greenSoft: "#E7F6EE",
  red: "#D2483E",
  redSoft: "#FBEAE9",
  orange: "#D98A2B",
  orangeSoft: "#FBF0DE",
  bg: "#F2F4F7",
  card: "#FFFFFF",
  border: "#E2E6EC",
  text: "#1A2433",
  textMuted: "#68727F",
  textFaint: "#9AA3AF",
};

const FONT_STACK = `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif`;

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@500;600;700&display=swap');
    .rtd-root, .rtd-root * { font-family: ${FONT_STACK}; box-sizing: border-box; }
    .rtd-display { font-family: 'Lexend', ${FONT_STACK}; }
    .rtd-root ::-webkit-scrollbar { height: 8px; width: 8px; }
    .rtd-root ::-webkit-scrollbar-thumb { background: #C7CEDA; border-radius: 8px; }
    .rtd-root ::-webkit-scrollbar-track { background: transparent; }
    .rtd-focus:focus-visible { outline: 2px solid ${C.navyMid}; outline-offset: 2px; }
    .rtd-ledger-tab::before {
      content: "";
      position: absolute;
      left: 0; top: 14px; bottom: 14px; width: 5px;
      background: repeating-linear-gradient(180deg, rgba(255,255,255,0.85) 0 6px, transparent 6px 12px);
      border-radius: 3px;
    }
    @keyframes rtdIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1; transform:translateY(0);} }
    .rtd-anim { animation: rtdIn .18s ease-out; }
    @media print {
      .no-print { display: none !important; }
      .rtd-root { background: #fff !important; }
      main { padding: 0 !important; }
    }
  `}</style>
);

/* ============================================================
   KONEKSI BACKEND (Google Apps Script + Google Spreadsheet)
   ------------------------------------------------------------
   1. Deploy Code.gs sebagai Web App (Deploy > New deployment > Web app,
      Execute as: Me, Who has access: Anyone).
   2. Tempel URL hasil deploy (diakhiri /exec) ke bawah ini.
   ============================================================ */
const API_URL = "https://script.google.com/macros/s/AKfycbxse55nZ354Rp58E9joi0OfH8_FQI1BimZPc_Ry7pS-xI7MIP1h2fuMyzVYzbORXOb6zg/exec";
const API_TOKEN = "Mocacino3in1kopiku"; // harus SAMA PERSIS dengan API_TOKEN di Code.gs

async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, token: API_TOKEN, ...params }).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Gagal memuat data dari server.");
  return json.data;
}

async function apiPost(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: API_TOKEN, payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Gagal menyimpan data ke server.");
  return json.data;
}

/* ============================================================
   CONSTANTS / MOCK "SERVICE LAYER"
   Data referensi (kategori, daftar warga, dsb.) tetap disimpan
   di sini. Data transaksional (kas, pembayaran, jimpitan, arisan,
   pengaturan, akun login) sekarang diambil & disimpan lewat
   Google Spreadsheet melalui fungsi apiGet/apiPost di atas.
   ============================================================ */
const INCOME_CATEGORIES = ["Iuran Warga", "Jimpitan", "Arisan", "Dana Sosial", "Donasi", "Bantuan", "Lainnya"];
const EXPENSE_CATEGORIES = ["Kegiatan RT", "Kebersihan", "Keamanan", "Sosial", "Administrasi", "Inventaris", "Konsumsi", "Perawatan", "Lainnya"];
const PAYMENT_METHODS = ["Tunai", "Transfer Bank", "E-Wallet"];
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const TODAY = new Date("2026-08-11T00:00:00");
const SALDO_AWAL = 2000000;

const EXPENSE_COLORS = {
  "Kegiatan RT": C.navy, "Kebersihan": C.navySoft, "Keamanan": C.navyDark,
  "Sosial": C.green, "Administrasi": "#5B84AC", "Inventaris": "#8B6F47",
  "Konsumsi": C.orange, "Perawatan": "#B8935F", "Lainnya": C.textFaint,
};

const DEMO_ACCOUNTS = [
  { email: "admin@rtdigital.id", password: "admin123", role: "Admin", name: "Pak Joko Susanto" },
  { email: "bendahara@rtdigital.id", password: "bendahara123", role: "Bendahara", name: "Ibu Wulan Ningsih" },
];

const RAW_DEMO_TX = [
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

function buildDemoTransactions() {
  const counters = {};
  return RAW_DEMO_TX.map((row, i) => {
    const [date, type, category, description, amount, party, method] = row;
    counters[date] = (counters[date] || 0) + 1;
    const code = `TRX-${date.replaceAll("-", "")}-${String(counters[date]).padStart(3, "0")}`;
    return {
      id: `tx-${i + 1}`,
      transaction_code: code,
      transaction_date: date,
      type,
      category,
      description,
      amount,
      source: party,
      payment_method: method,
      attachment: i % 4 === 0 ? "bukti-transaksi.jpg" : null,
      notes: "",
      created_by: "Ibu Wulan Ningsih",
    };
  });
}

const RESIDENTS = [
  { id: "r1", house: "Rumah No. 1", name: "Bpk. Rudi Hartono" },
  { id: "r2", house: "Rumah No. 3", name: "Bpk. Anton Prasetyo" },
  { id: "r3", house: "Rumah No. 5", name: "Bpk. Ahmad Zainuri" },
  { id: "r4", house: "Rumah No. 6", name: "Ibu Nur Halimah" },
  { id: "r5", house: "Rumah No. 8", name: "Ibu Siti Aminah" },
  { id: "r6", house: "Rumah No. 9", name: "Bpk. Bambang Setyawan" },
  { id: "r7", house: "Rumah No. 11", name: "Ibu Melati Putri" },
  { id: "r8", house: "Rumah No. 12", name: "Bpk. Eko Prabowo" },
  { id: "r9", house: "Rumah No. 15", name: "Bpk. Yusuf Hakim" },
  { id: "r10", house: "Rumah No. 16", name: "Ibu Dewi Lestari" },
  { id: "r11", house: "Rumah No. 18", name: "Bpk. Iwan Setiadi" },
  { id: "r12", house: "Rumah No. 20", name: "Bpk. Karto Wijoyo" },
  { id: "r13", house: "Rumah No. 21", name: "Ibu Ani Suryani" },
  { id: "r14", house: "Rumah No. 22", name: "Ibu Ratna Sari" },
  { id: "r15", house: "Rumah No. 24", name: "Bpk. Fajar Nugroho" },
  { id: "r16", house: "Rumah No. 25", name: "Ibu Farah Diba" },
  { id: "r17", house: "Rumah No. 27", name: "Bpk. Hendra Wijaya" },
  { id: "r18", house: "Rumah No. 28", name: "Ibu Wahyuni" },
  { id: "r19", house: "Rumah No. 30", name: "Bpk. Dedi Kurniawan" },
  { id: "r20", house: "Rumah No. 32", name: "Bpk. Yanto Kurnia" },
];
const RESIDENT_MAP = Object.fromEntries(RESIDENTS.map((r) => [r.id, r]));

/* -- Nominal default (dapat diubah Bendahara lewat menu Pengaturan) -- */
const DEFAULT_SETTINGS = {
  iuranAmount: 150000,
  arisanAmount: 100000,
  sosialWajibAmount: 20000,
};

/* ============================================================
   PHASE 2 — MASTER DATA WARGA + RUMAH + IURAN
   Data rumah (Households) & warga (Residents) sekarang berasal dari
   Google Spreadsheet (bukan hard-coded), diambil lewat bootstrap().
   Konstanta di bawah ini hanya opsi pilihan untuk form.
   ============================================================ */
const HOUSEHOLD_STATUS_OPTIONS = ["Aktif", "Pindah", "Nonaktif"];
const RESIDENT_STATUS_OPTIONS = ["Tetap", "Pendatang", "Kontrak", "Kos", "Pindah", "Meninggal"];
const RELATIONSHIP_OPTIONS = ["Kepala Keluarga", "Istri", "Suami", "Anak", "Kos", "Famili Lain"];
const GENDER_OPTIONS = [{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }];
const DUES_STATUS_LABEL = { belum: "Belum Bayar", sebagian: "Sebagian", lunas: "Lunas" };
const DUES_STATUS_TONE = { belum: "red", sebagian: "orange", lunas: "green" };

/* -- Jimpitan -- */
const JIMPITAN_PETUGAS = ["Bpk. Slamet", "Bpk. Rohman", "Ibu Yanti"];
const JIMPITAN_MONTHS = ["2026-08", "2026-07"];

function buildJimpitanDemo() {
  const rows = [];
  let n = 1;
  RESIDENTS.forEach((r, i) => {
    if (i % 4 !== 3) {
      rows.push({
        id: `jmp-${n++}`,
        date: `2026-08-${String(2 + (i % 9)).padStart(2, "0")}`,
        resident_id: r.id,
        amount: i % 2 === 0 ? 5000 : 10000,
        collector: JIMPITAN_PETUGAS[i % JIMPITAN_PETUGAS.length],
      });
    }
  });
  RESIDENTS.slice(0, 12).forEach((r, i) => {
    rows.push({
      id: `jmp-${n++}`,
      date: `2026-07-${String(18 + (i % 10)).padStart(2, "0")}`,
      resident_id: r.id,
      amount: 5000,
      collector: JIMPITAN_PETUGAS[i % JIMPITAN_PETUGAS.length],
    });
  });
  return rows;
}

/* -- Arisan -- */
const ARISAN_PERIOD = "2026-08";
const ARISAN_MEMBER_IDS = RESIDENTS.slice(0, 15).map((r) => r.id);

function buildArisanDemo() {
  return {
    riwayat: [
      { period: "2026-05", winner_id: ARISAN_MEMBER_IDS[2] },
      { period: "2026-06", winner_id: ARISAN_MEMBER_IDS[7] },
      { period: "2026-07", winner_id: ARISAN_MEMBER_IDS[11] },
    ],
  };
}

/* -- Pembayaran Warga (satu pintu: Iuran + Arisan + Dana Sosial wajib) --
   Bendahara mencatat SATU kali pembayaran per warga. Sistem otomatis
   membagi nominal ke kategori Iuran Warga / Arisan / Dana Sosial di Kas RT
   sesuai urutan prioritas (iuran dulu, lalu arisan, lalu dana sosial). */
const PEMBAYARAN_PERIOD = "2026-08";

const isArisanMember = (residentId) => ARISAN_MEMBER_IDS.includes(residentId);

function computeObligation(residentId, settings) {
  const member = isArisanMember(residentId);
  const iuran = settings.iuranAmount;
  const arisan = member ? settings.arisanAmount : 0;
  const sosial = member ? settings.sosialWajibAmount : 0;
  return { iuran, arisan, sosial, total: iuran + arisan + sosial, isArisanMember: member };
}

// Bagi nominal yang dibayarkan ke kategori Iuran -> Arisan -> Dana Sosial,
// dengan memperhitungkan porsi yang sudah tertutup dari pembayaran sebelumnya.
function allocatePayment(paidBefore, amountNow, ob) {
  const buckets = [["iuran", ob.iuran], ["arisan", ob.arisan], ["sosial", ob.sosial]];
  let remainingBefore = paidBefore;
  let remainingNow = amountNow;
  const result = { iuran: 0, arisan: 0, sosial: 0 };
  for (const [key, cap] of buckets) {
    const coveredBefore = Math.min(remainingBefore, cap);
    remainingBefore -= coveredBefore;
    const capLeft = cap - coveredBefore;
    const applyHere = Math.min(remainingNow, capLeft);
    result[key] = applyHere;
    remainingNow -= applyHere;
  }
  return result;
}

const paymentStatusOf = (paid, total) => (paid <= 0 ? "Belum Bayar" : paid < total ? "Sebagian" : "Lunas");

function buildPembayaranDemo(settings) {
  return RESIDENTS.map((r, i) => {
    const ob = computeObligation(r.id, settings);
    const seed = i % 5;
    const paid_amount = seed === 0 ? 0 : seed === 1 ? Math.round(ob.total * 0.45) : ob.total;
    return {
      id: `pay-${r.id}`,
      resident_id: r.id,
      period: PEMBAYARAN_PERIOD,
      paid_amount,
      payment_date: paid_amount > 0 ? `2026-08-${String(3 + (i % 8)).padStart(2, "0")}` : null,
    };
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
const formatRupiah = (n) => `Rp${Math.round(Math.abs(n)).toLocaleString("id-ID")}`;
const parseDate = (s) => new Date(s + "T00:00:00");
const formatDateLong = (s) => {
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};
const formatDateShort = (s) => {
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
};
const generateCode = (date, existing) => {
  const n = existing.filter((t) => t.transaction_date === date).length + 1;
  return `TRX-${date.replaceAll("-", "")}-${String(n).padStart(3, "0")}`;
};

function buildArusKasData(transactions, rangeDays) {
  const start = new Date(TODAY);
  start.setDate(start.getDate() - rangeDays);
  const groupByMonth = rangeDays > 31;
  const map = {};
  transactions
    .filter((t) => parseDate(t.transaction_date) >= start)
    .forEach((t) => {
      const d = parseDate(t.transaction_date);
      const key = groupByMonth
        ? `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { name: key, Pemasukan: 0, Pengeluaran: 0, sortKey: d.getTime() };
      if (t.type === "masuk") map[key].Pemasukan += t.amount;
      else map[key].Pengeluaran += t.amount;
    });
  return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
}

function buildExpensePie(transactions) {
  const map = {};
  transactions.filter((t) => t.type === "keluar").forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/* ============================================================
   REUSABLE UI COMPONENTS
   ============================================================ */
const Badge = ({ tone = "muted", children }) => {
  const tones = {
    green: { bg: C.greenSoft, fg: C.green },
    red: { bg: C.redSoft, fg: C.red },
    orange: { bg: C.orangeSoft, fg: C.orange },
    navy: { bg: C.navyFaint, fg: C.navy },
    muted: { bg: "#EEF0F3", fg: C.textMuted },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: tones.bg, color: tones.fg }}
    >
      {children}
    </span>
  );
};

const Btn = ({ variant = "primary", size = "md", className = "", children, ...props }) => {
  const base = "rtd-focus inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { md: "px-4 py-2.5 text-sm", sm: "px-3 py-1.5 text-xs" };
  const variants = {
    primary: { background: C.navy, color: "#fff" },
    danger: { background: C.red, color: "#fff" },
    ghost: { background: "transparent", color: C.navy, border: `1px solid ${C.border}` },
    subtle: { background: C.navyFaint, color: C.navy },
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={variants[variant]}
      onMouseDown={(e) => e.currentTarget.style.opacity = "0.88"}
      onMouseUp={(e) => e.currentTarget.style.opacity = "1"}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ className = "", style = {}, children }) => (
  <div className={`rounded-2xl ${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, ...style }}>
    {children}
  </div>
);

const Field = ({ label, required, error, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold" style={{ color: C.text }}>
      {label} {required && <span style={{ color: C.red }}>*</span>}
    </span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs" style={{ color: C.textFaint }}>{hint}</span>}
    {error && <span className="mt-1 flex items-center gap-1 text-xs font-medium" style={{ color: C.red }}><AlertTriangle size={12} />{error}</span>}
  </label>
);

const inputBase = "rtd-focus w-full rounded-lg px-3 py-2.5 text-sm";
const inputStyle = (hasError) => ({ background: "#fff", border: `1px solid ${hasError ? C.red : C.border}`, color: C.text });

const TextInput = (props) => <input {...props} className={`${inputBase} ${props.className || ""}`} style={inputStyle(props["aria-invalid"])} />;
const TextArea = (props) => <textarea {...props} className={`${inputBase} ${props.className || ""}`} style={inputStyle(props["aria-invalid"])} />;

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select {...props} className={`${inputBase} appearance-none pr-9`} style={inputStyle(props["aria-invalid"])}>
      {children}
    </select>
    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
  </div>
);

const CurrencyInput = ({ value, onChange, error }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: C.textMuted }}>Rp</span>
    <input
      inputMode="numeric"
      value={value ? Number(value).toLocaleString("id-ID") : ""}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
      placeholder="0"
      className={`${inputBase} pl-9 tabular-nums`}
      style={inputStyle(error)}
    />
  </div>
);

const PaymentIcon = ({ method, size = 14 }) => {
  if (method === "Tunai") return <Banknote size={size} />;
  if (method === "Transfer Bank") return <Landmark size={size} />;
  return <CreditCard size={size} />;
};

const Modal = ({ title, subtitle, onClose, children, width = 560 }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,33,54,0.45)" }} onMouseDown={onClose}>
    <div
      className="rtd-anim w-full overflow-hidden rounded-2xl"
      style={{ maxWidth: width, background: C.card, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between border-b px-6 py-4" style={{ borderColor: C.border }}>
        <div>
          <h3 className="rtd-display text-lg font-semibold" style={{ color: C.text }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm" style={{ color: C.textMuted }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }}><X size={18} /></button>
      </div>
      <div className="overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
);

const ConfirmDialog = ({ title, message, onConfirm, onCancel, tone = "danger" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,33,54,0.45)" }} onMouseDown={onCancel}>
    <div className="rtd-anim w-full max-w-sm rounded-2xl p-6" style={{ background: C.card }} onMouseDown={(e) => e.stopPropagation()}>
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: tone === "danger" ? C.redSoft : C.orangeSoft, color: tone === "danger" ? C.red : C.orange }}
      >
        <AlertTriangle size={20} />
      </div>
      <h3 className="rtd-display text-base font-semibold" style={{ color: C.text }}>{title}</h3>
      <p className="mt-1.5 text-sm" style={{ color: C.textMuted }}>{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>Ya, Lanjutkan</Btn>
      </div>
    </div>
  </div>
);

const Toasts = ({ toasts, remove }) => (
  <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2" style={{ maxWidth: 340 }}>
    {toasts.map((t) => (
      <div
        key={t.id}
        className="rtd-anim flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg"
        style={{ background: C.navyDark, color: "#fff" }}
      >
        {t.tone === "error" ? <AlertTriangle size={17} style={{ color: "#F3A5A0", flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={17} style={{ color: "#7FDDAA", flexShrink: 0, marginTop: 1 }} />}
        <span className="text-sm leading-snug">{t.message}</span>
        <button onClick={() => remove(t.id)} className="ml-auto flex-shrink-0" style={{ color: "#B9C4D1" }}><X size={14} /></button>
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon = Search, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.navyFaint, color: C.navy }}>
      <Icon size={20} />
    </div>
    <p className="text-sm font-semibold" style={{ color: C.text }}>{title}</p>
    {subtitle && <p className="mt-1 max-w-xs text-xs" style={{ color: C.textMuted }}>{subtitle}</p>}
  </div>
);

const Pagination = ({ page, totalPages, onChange, totalItems, pageSize }) => {
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: C.border }}>
      <span className="text-xs" style={{ color: C.textMuted }}>Menampilkan {from}–{to} dari {totalItems} data</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="rtd-focus flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.navy }}><ChevronLeft size={15} /></button>
        <span className="px-2 text-xs font-semibold" style={{ color: C.text }}>{page} / {totalPages || 1}</span>
        <button disabled={page === totalPages || totalPages === 0} onClick={() => onChange(page + 1)} className="rtd-focus flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.navy }}><ChevronRight size={15} /></button>
      </div>
    </div>
  );
};

const RangeFilterButtons = ({ value, onChange }) => {
  const opts = [["7", "7 Hari"], ["30", "30 Hari"], ["90", "3 Bulan"], ["180", "6 Bulan"], ["365", "1 Tahun"]];
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="rtd-focus rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          style={value === v ? { background: C.navy, color: "#fff" } : { background: C.navyFaint, color: C.navy }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

/* ============================================================
   SIDEBAR / TOPBAR
   ============================================================ */
const NAV_SECTIONS = [
  { label: "DASHBOARD", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "ADMINISTRASI",
    items: [
      { id: "rumah", label: "Data Rumah", icon: Home },
      { id: "warga", label: "Data Warga", icon: Users2 },
    ],
  },
  {
    label: "KEUANGAN",
    items: [
      { id: "kas", label: "Kas RT", icon: Wallet },
      { id: "pemasukan", label: "Pemasukan", icon: ArrowUpCircle },
      { id: "pengeluaran", label: "Pengeluaran", icon: ArrowDownCircle },
      { id: "iuran", label: "Iuran Warga", icon: FileText },
      { id: "pembayaran", label: "Pembayaran Warga", icon: CreditCard },
      { id: "jimpitan", label: "Jimpitan", icon: Coins },
      { id: "arisan", label: "Arisan", icon: Gift },
      { id: "sosial", label: "Dana Sosial", icon: HeartHandshake },
    ],
  },
  {
    label: "LAPORAN",
    items: [
      { id: "laporan", label: "Laporan Keuangan", icon: FileBarChart },
    ],
  },
  {
    label: "SISTEM",
    items: [
      { id: "pengguna", label: "Pengguna", icon: UserCog, soon: true },
      { id: "pengaturan", label: "Pengaturan Nominal", icon: Settings },
    ],
  },
];

const Sidebar = ({ page, setPage, mobileOpen, setMobileOpen, notify }) => {
  const go = (item) => {
    if (item.soon) { notify(`${item.label} akan hadir pada versi berikutnya.`, "info"); return; }
    setPage(item.id);
    setMobileOpen(false);
  };
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(12,33,54,0.45)" }} onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: C.navyDark }}
        >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: C.navyMid }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div>
            <p className="rtd-display text-base font-bold leading-none" style={{ color: "#fff" }}>RT DIGITAL</p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "#93A3B8" }}>Administrasi RT</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} style={{ color: "#93A3B8" }}><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold tracking-wider" style={{ color: "#5E7290" }}>{section.label}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item)}
                    className="rtd-focus mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition"
                    style={{
                      background: active ? C.navyMid : "transparent",
                      color: active ? "#fff" : item.soon ? "#5E7290" : "#C7D2E0",
                    }}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{item.label}</span>
                    {item.soon && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "#8CA0BB" }}>SEGERA</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

const PAGE_TITLES = {
  dashboard: "Dashboard Keuangan", kas: "Kas RT", pemasukan: "Pemasukan", pengeluaran: "Pengeluaran",
  pembayaran: "Pembayaran Warga", jimpitan: "Jimpitan", arisan: "Arisan", sosial: "Dana Sosial",
  laporan: "Laporan Keuangan", pengaturan: "Pengaturan Nominal",
  rumah: "Data Rumah", warga: "Data Warga", iuran: "Iuran Warga",
};

const Topbar = ({ page, user, onLogout, onMenu, onAdd }) => (
  <header className="sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 lg:px-6" style={{ background: C.card, borderColor: C.border }}>
    <button className="rtd-focus rounded-lg p-1.5 lg:hidden" style={{ color: C.navy }} onClick={onMenu}><Menu size={20} /></button>
    <div className="min-w-0">
      <h1 className="rtd-display truncate text-base font-bold lg:text-lg" style={{ color: C.text }}>{PAGE_TITLES[page] || "RT Digital"}</h1>
      <p className="hidden text-xs sm:block" style={{ color: C.textMuted }}>Selamat bertugas, {user.name.split(" ")[0]}</p>
    </div>
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <Btn size="sm" onClick={onAdd} className="!px-3"><Plus size={15} /> <span className="hidden sm:inline">Tambah Transaksi</span></Btn>
      <div className="hidden items-center gap-2 border-l pl-3 sm:flex" style={{ borderColor: C.border }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: C.navyFaint, color: C.navy }}>
          {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold" style={{ color: C.text }}>{user.name}</p>
          <p className="text-[11px]" style={{ color: C.textMuted }}>{user.role}</p>
        </div>
      </div>
      <button onClick={onLogout} className="rtd-focus flex h-9 w-9 items-center justify-center rounded-lg" style={{ color: C.textMuted, border: `1px solid ${C.border}` }} title="Keluar">
        <LogOut size={15} />
      </button>
    </div>
  </header>
);

/* ============================================================
   LOGIN PAGE
   ============================================================ */
const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async (loginEmail, loginPassword) => {
    setError(""); setBusy(true);
    try {
      const acc = await apiPost("login", { email: loginEmail.trim().toLowerCase(), password: loginPassword });
      onLogin(acc);
    } catch (err) {
      setError(err.message || "Email atau kata sandi tidak sesuai.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const quickLogin = (acc) => { setEmail(acc.email); setPassword(acc.password); doLogin(acc.email, acc.password); };

  return (
    <div className="rtd-root flex min-h-screen items-center justify-center px-4 py-10" style={{ background: C.bg }}>
      <GlobalStyle />
      <div className="w-full max-w-sm">
        {onBack && (
          <button onClick={onBack} className="rtd-focus mb-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.textMuted }}>
            <ArrowLeft size={14} /> Kembali ke kondisi keuangan
          </button>
        )}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: C.navy }}>
            <Building2 size={22} color="#fff" />
          </div>
          <h1 className="rtd-display text-xl font-bold" style={{ color: C.text }}>RT DIGITAL</h1>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>Sistem Administrasi RT Berbasis Web</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Username / Email" required>
              <TextInput type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@rtdigital.id" aria-invalid={!!error} />
            </Field>
            <Field label="Password" required error={error}>
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" aria-invalid={!!error} />
            </Field>
            <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Memeriksa..." : "Masuk"}</Btn>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: C.border }} />
            <span className="text-[11px] font-semibold" style={{ color: C.textFaint }}>AKUN DEMO</span>
            <div className="h-px flex-1" style={{ background: C.border }} />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => quickLogin(acc)}
                className="rtd-focus flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left transition"
                style={{ border: `1px solid ${C.border}` }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{acc.name}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>{acc.email}</p>
                </div>
                <Badge tone="navy">{acc.role}</Badge>
              </button>
            ))}
          </div>
        </Card>
        <p className="mt-5 text-center text-xs" style={{ color: C.textFaint }}>DATA DEMO — semua transaksi pada aplikasi ini adalah data contoh.</p>
      </div>
    </div>
  );
};

/* ============================================================
   PUBLIC HOME (tampilan publik — tanpa perlu login)
   Menyajikan kondisi keuangan (saldo, pemasukan, pengeluaran) dan
   status arisan langsung saat sistem dibuka. Aksi admin (tambah/
   edit/hapus transaksi, undi arisan, dll) hanya tersedia setelah
   login lewat tombol "Masuk".
   ============================================================ */
const PublicHome = ({ transactions, payments, settings, arisan, onLoginClick }) => {
  const readOnlyNotify = { view: () => {}, edit: () => {}, del: () => {} };
  return (
    <div className="rtd-root min-h-screen" style={{ background: C.bg }}>
      <GlobalStyle />
      <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 lg:px-6" style={{ borderColor: C.border, background: "#fff" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: C.navy }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div className="leading-tight">
            <p className="rtd-display text-sm font-bold" style={{ color: C.text }}>RT DIGITAL</p>
            <p className="text-[11px]" style={{ color: C.textMuted }}>Kondisi Keuangan &amp; Arisan RT</p>
          </div>
        </div>
        <Btn size="sm" onClick={onLoginClick}><LogIn size={14} /> Masuk</Btn>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
        <div className="no-print mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: C.orangeSoft, color: C.orange }}>
          <Info size={13} /> DATA DEMO — seluruh data di bawah ini adalah data contoh untuk keperluan simulasi. Login sebagai pengurus untuk mengelola data.
        </div>

        <section className="mb-8">
          <h2 className="rtd-display mb-3 text-base font-bold" style={{ color: C.text }}>Kondisi Keuangan</h2>
          <Dashboard transactions={transactions} payments={payments} settings={settings} notify={readOnlyNotify} readOnly />
        </section>

        <section>
          <h2 className="rtd-display mb-3 text-base font-bold" style={{ color: C.text }}>Arisan</h2>
          <ArisanPage arisan={arisan} payments={payments} settings={settings} readOnly />
        </section>
      </main>
    </div>
  );
};

/* ============================================================
   TRANSACTION FORM (used by Add/Edit modal)
   ============================================================ */
const emptyForm = () => ({
  type: "masuk", transaction_date: "2026-08-11", category: INCOME_CATEGORIES[0],
  amount: 0, description: "", source: "", payment_method: "Tunai", attachment: null, notes: "",
});

const TransactionForm = ({ initial, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial || emptyForm());
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const categories = form.type === "masuk" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const setType = (type) => setForm((f) => ({ ...f, type, category: (type === "masuk" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }));

  const validate = () => {
    const e = {};
    if (!form.transaction_date) e.transaction_date = "Tanggal wajib diisi.";
    if (!form.amount || form.amount <= 0) e.amount = "Nominal harus lebih dari 0.";
    if (!form.description.trim()) e.description = "Keterangan wajib diisi.";
    if (!form.source.trim()) e.source = form.type === "masuk" ? "Sumber wajib diisi." : "Penerima wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Jenis Transaksi" required>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("masuk")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={form.type === "masuk" ? { background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowUpCircle size={16} /> Pemasukan
          </button>
          <button type="button" onClick={() => setType("keluar")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={form.type === "keluar" ? { background: C.redSoft, color: C.red, border: `1px solid ${C.red}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowDownCircle size={16} /> Pengeluaran
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required error={errors.transaction_date}>
          <TextInput type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} aria-invalid={!!errors.transaction_date} />
        </Field>
        <Field label="Kategori" required>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Nominal" required error={errors.amount}>
        <CurrencyInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} error={errors.amount} />
      </Field>

      <Field label="Keterangan" required error={errors.description}>
        <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Iuran warga bulan Agustus" aria-invalid={!!errors.description} />
      </Field>

      <Field label={form.type === "masuk" ? "Sumber" : "Penerima"} required error={errors.source}>
        <TextInput value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder={form.type === "masuk" ? "Nama warga / pihak pemberi" : "Nama penerima / vendor"} aria-invalid={!!errors.source} />
      </Field>

      <Field label="Metode Pembayaran" required>
        <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>

      <Field label="Bukti Transaksi" hint="Format JPG, PNG, atau PDF, maksimal 5MB.">
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => setForm({ ...form, attachment: e.target.files[0]?.name || null })} />
        <button type="button" onClick={() => fileRef.current.click()} className="rtd-focus flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ border: `1px dashed ${C.border}`, color: C.textMuted }}>
          <Paperclip size={15} />
          {form.attachment ? <span style={{ color: C.text }}>{form.attachment}</span> : "Pilih file bukti transaksi"}
        </button>
      </Field>

      <Field label="Catatan">
        <TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan (opsional)" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Simpan Transaksi</Btn>
      </div>
    </form>
  );
};

/* ============================================================
   TRANSACTION DETAIL VIEW
   ============================================================ */
const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="text-xs font-medium" style={{ color: C.textMuted }}>{label}</span>
    <span className="text-right text-sm font-semibold" style={{ color: C.text }}>{children}</span>
  </div>
);

const TransactionDetail = ({ tx, onEdit, onDelete, onClose, households, residents, duesTypes, dues, onViewIuranDetail }) => {
  const iuranMatch = /^iuran_dues_id:(.+)$/.exec(String(tx.notes || "").trim());
  let iuranInfo = null;
  if (iuranMatch && dues) {
    const due = dues.find((d) => String(d.id) === iuranMatch[1]);
    if (due) {
      const house = (households || []).find((h) => h.id === due.household_id);
      const head = house ? (residents || []).find((r) => r.id === house.head_resident_id) : null;
      const duesType = (duesTypes || []).find((d) => d.id === due.dues_type_id);
      iuranInfo = {
        houseLabel: house ? `No. ${house.house_number}` : "-",
        headName: head ? head.name : "-",
        period: due.period,
        duesTypeName: duesType ? duesType.name : "-",
      };
    }
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl p-4" style={{ background: tx.type === "masuk" ? C.greenSoft : C.redSoft }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: C.textMuted }}>{tx.transaction_code}</p>
          <p className="rtd-display mt-1 text-xl font-bold tabular-nums" style={{ color: tx.type === "masuk" ? C.green : C.red }}>
            {tx.type === "masuk" ? "+" : "-"}{formatRupiah(tx.amount)}
          </p>
        </div>
        <Badge tone={tx.type === "masuk" ? "green" : "red"}>{tx.type === "masuk" ? "Pemasukan" : "Pengeluaran"}</Badge>
      </div>
      <div className="divide-y" style={{ borderColor: C.border }}>
        <DetailRow label="Tanggal">{formatDateLong(tx.transaction_date)}</DetailRow>
        <DetailRow label="Kategori">{tx.category}</DetailRow>
        <DetailRow label="Keterangan">{tx.description}</DetailRow>
        <DetailRow label={tx.type === "masuk" ? "Sumber" : "Penerima"}>{tx.source}</DetailRow>
        <DetailRow label="Metode"><span className="inline-flex items-center gap-1.5"><PaymentIcon method={tx.payment_method} />{tx.payment_method}</span></DetailRow>
        <DetailRow label="Bukti">{tx.attachment ? <span className="inline-flex items-center gap-1" style={{ color: C.navy }}><Paperclip size={13} />{tx.attachment}</span> : "—"}</DetailRow>
        <DetailRow label="Catatan">{iuranInfo ? "—" : (tx.notes || "—")}</DetailRow>
        <DetailRow label="Dicatat oleh">{tx.created_by}</DetailRow>
      </div>
      {iuranInfo && (
        <div className="mt-4 rounded-lg p-3.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
          <p className="mb-2 flex items-center gap-1.5 font-bold"><FileText size={13} /> Sumber: Iuran Warga</p>
          <div className="grid grid-cols-3 gap-2">
            <div><p className="opacity-70">Warga</p><p className="font-semibold">{iuranInfo.headName}</p></div>
            <div><p className="opacity-70">Rumah</p><p className="font-semibold">{iuranInfo.houseLabel}</p></div>
            <div><p className="opacity-70">Periode</p><p className="font-semibold">{formatPeriodLabel(iuranInfo.period)}</p></div>
          </div>
          {onViewIuranDetail && (
            <button onClick={onViewIuranDetail} className="rtd-focus mt-2.5 flex items-center gap-1 font-semibold underline">
              <ExternalLink size={12} /> Lihat Detail Iuran
            </button>
          )}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="danger" size="sm" onClick={() => onDelete(tx)}><Trash2 size={13} /> Hapus</Btn>
        <Btn variant="ghost" size="sm" onClick={() => onEdit(tx)}><Pencil size={13} /> Edit</Btn>
        <Btn variant="subtle" size="sm" onClick={onClose}>Tutup</Btn>
      </div>
    </div>
  );
};

/* ============================================================
   TRANSACTION TABLE (shared by Kas RT / Pemasukan / Pengeluaran)
   ============================================================ */
const TxTable = ({ rows, showRunning, hideActions, onView, onEdit, onDelete, emptyTitle }) => {
  if (rows.length === 0) return <EmptyState icon={ReceiptText} title={emptyTitle || "Belum ada transaksi"} subtitle="Transaksi yang cocok dengan filter akan muncul di sini." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Keterangan</th>
            <th className="px-4 py-3">Kategori</th>
            <th className="px-4 py-3">Metode</th>
            <th className="px-4 py-3 text-right">{showRunning ? "Masuk" : "Nominal"}</th>
            {showRunning && <th className="px-4 py-3 text-right">Keluar</th>}
            {showRunning && <th className="px-4 py-3 text-right">Saldo</th>}
            {!hideActions && <th className="px-4 py-3 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.id} className="border-b transition hover:bg-slate-50" style={{ borderColor: C.border }}>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: C.text }}>{formatDateShort(t.transaction_date)}</td>
              <td className="px-4 py-3">
                <p className="font-medium" style={{ color: C.text }}>{t.description}</p>
                <p className="text-xs" style={{ color: C.textFaint }}>{t.transaction_code} · {t.source}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="muted">{t.category}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>
                <span className="inline-flex items-center gap-1.5"><PaymentIcon method={t.payment_method} size={13} />{t.payment_method}</span>
              </td>
              {showRunning ? (
                <>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.green }}>{t.type === "masuk" ? formatRupiah(t.amount) : ""}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.red }}>{t.type === "keluar" ? formatRupiah(t.amount) : ""}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold" style={{ color: C.navy }}>{formatRupiah(t.runningBalance)}</td>
                </>
              ) : (
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: t.type === "masuk" ? C.green : C.red }}>
                  {t.type === "masuk" ? "🟢" : "🔴"} {formatRupiah(t.amount)}
                </td>
              )}
              {!hideActions && (
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onView(t)} className="rtd-focus rounded-lg p-1.5" style={{ color: C.navy }} title="Detail"><Eye size={15} /></button>
                    <button onClick={() => onEdit(t)} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }} title="Edit"><Pencil size={15} /></button>
                    <button onClick={() => onDelete(t)} className="rtd-focus rounded-lg p-1.5" style={{ color: C.red }} title="Hapus"><Trash2 size={15} /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ============================================================
   DASHBOARD PAGE
   ============================================================ */
const StatCard = ({ label, value, tone, icon: Icon, ledger }) => (
  <Card className="relative overflow-hidden p-5" style={ledger ? { background: `linear-gradient(135deg, ${C.navy}, ${C.navyDark})`, border: "none" } : {}}>
    {ledger && <div className="rtd-ledger-tab absolute inset-0" />}
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold" style={{ color: ledger ? "#B9CBE0" : C.textMuted }}>{label}</p>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: ledger ? "rgba(255,255,255,0.12)" : tone + "20", color: ledger ? "#fff" : tone }}>
        <Icon size={15} />
      </div>
    </div>
    <p className="rtd-display mt-3 text-2xl font-bold tabular-nums" style={{ color: ledger ? "#fff" : C.text }}>{formatRupiah(value)}</p>
  </Card>
);

const Dashboard = ({ transactions, payments, settings, notify, readOnly }) => {
  const [range, setRange] = useState("30");

  const totals = useMemo(() => {
    const saldoAkhir = SALDO_AWAL + transactions.reduce((s, t) => s + (t.type === "masuk" ? t.amount : -t.amount), 0);
    const inMonth = transactions.filter((t) => t.transaction_date.startsWith("2026-08"));
    const pemasukanBulanIni = inMonth.filter((t) => t.type === "masuk").reduce((s, t) => s + t.amount, 0);
    const pengeluaranBulanIni = inMonth.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0);
    const piutang = payments.reduce((s, p) => {
      const ob = computeObligation(p.resident_id, settings);
      return s + Math.max(0, ob.total - p.paid_amount);
    }, 0);
    return { saldoAkhir, pemasukanBulanIni, pengeluaranBulanIni, piutang };
  }, [transactions, payments, settings]);

  const arusKas = useMemo(() => buildArusKasData(transactions, Number(range)), [transactions, range]);
  const pieData = useMemo(() => buildExpensePie(transactions), [transactions]);
  const recent = useMemo(() => [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).slice(0, 6), [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="SALDO KAS" value={totals.saldoAkhir} icon={Wallet} ledger />
        <StatCard label="PEMASUKAN BULAN INI" value={totals.pemasukanBulanIni} tone={C.green} icon={ArrowUpCircle} />
        <StatCard label="PENGELUARAN BULAN INI" value={totals.pengeluaranBulanIni} tone={C.red} icon={ArrowDownCircle} />
        <StatCard label="PIUTANG WARGA" value={totals.piutang} tone={C.orange} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Arus Kas</h3>
            <RangeFilterButtons value={range} onChange={setRange} />
          </div>
          {arusKas.length === 0 ? <EmptyState title="Belum ada data pada periode ini" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={arusKas} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.35} /><stop offset="100%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={0.3} /><stop offset="100%" stopColor={C.red} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} width={46} />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Area type="monotone" dataKey="Pemasukan" stroke={C.green} fill="url(#gMasuk)" strokeWidth={2} />
                <Area type="monotone" dataKey="Pengeluaran" stroke={C.red} fill="url(#gKeluar)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="rtd-display mb-4 text-sm font-bold" style={{ color: C.text }}>Grafik Pengeluaran</h3>
          {pieData.length === 0 ? <EmptyState title="Belum ada pengeluaran" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={EXPENSE_COLORS[d.name] || C.textFaint} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Transaksi Terbaru</h3>
        </div>
        <TxTable
          rows={recent}
          hideActions={readOnly}
          onView={(t) => notify.view(t)}
          onEdit={(t) => notify.edit(t)}
          onDelete={(t) => notify.del(t)}
        />
      </Card>
    </div>
  );
};

/* ============================================================
   KAS RT PAGE
   ============================================================ */
const KasRT = ({ transactions, actions }) => {
  const sorted = useMemo(() => [...transactions].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date) || a.id.localeCompare(b.id)), [transactions]);
  const withRunning = useMemo(() => {
    let bal = SALDO_AWAL;
    return sorted.map((t) => { bal += t.type === "masuk" ? t.amount : -t.amount; return { ...t, runningBalance: bal }; }).reverse();
  }, [sorted]);

  const totalMasuk = transactions.filter((t) => t.type === "masuk").reduce((s, t) => s + t.amount, 0);
  const totalKeluar = transactions.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0);
  const saldoAkhir = SALDO_AWAL + totalMasuk - totalKeluar;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 divide-x sm:grid-cols-4" style={{ "--tw-divide-opacity": 1 }}>
          {[
            ["Saldo Awal", SALDO_AWAL, C.text],
            ["Total Pemasukan", totalMasuk, C.green],
            ["Total Pengeluaran", totalKeluar, C.red],
            ["Saldo Akhir", saldoAkhir, C.navy],
          ].map(([label, val, color], i) => (
            <div key={label} className={i === 0 ? "" : "pl-4"} style={{ borderColor: C.border }}>
              <p className="text-xs font-medium" style={{ color: C.textMuted }}>{label}</p>
              <p className="rtd-display mt-1 text-lg font-bold tabular-nums lg:text-xl" style={{ color }}>{formatRupiah(val)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Buku Kas RT</h3>
          <Badge tone="navy">{withRunning.length} transaksi</Badge>
        </div>
        <TxTable rows={withRunning} showRunning onView={actions.view} onEdit={actions.edit} onDelete={actions.del} />
      </Card>
    </div>
  );
};

/* ============================================================
   PEMASUKAN / PENGELUARAN PAGE (shared component)
   ============================================================ */
const FilterBar = ({ search, setSearch, category, setCategory, method, setMethod, categories, placeholder }) => (
  <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3" style={{ borderColor: C.border }}>
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
      <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="">Semua Kategori</option>
      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
    </Select>
    <Select value={method} onChange={(e) => setMethod(e.target.value)}>
      <option value="">Semua Metode</option>
      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
    </Select>
  </div>
);

const ListPage = ({ type, transactions, actions }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const categories = type === "masuk" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.type === type)
      .filter((t) => !category || t.category === category)
      .filter((t) => !method || t.payment_method === method)
      .filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.source.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  }, [transactions, type, category, method, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const total = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <Card className="p-5" style={{ background: type === "masuk" ? C.greenSoft : C.redSoft, border: "none" }}>
        <p className="text-xs font-semibold" style={{ color: type === "masuk" ? C.green : C.red }}>{type === "masuk" ? "TOTAL PEMASUKAN" : "TOTAL PENGELUARAN"} (SESUAI FILTER)</p>
        <p className="rtd-display mt-1 text-2xl font-bold tabular-nums" style={{ color: type === "masuk" ? C.green : C.red }}>{formatRupiah(total)}</p>
      </Card>

      <Card className="p-0">
        <FilterBar
          search={search} setSearch={(v) => { setSearch(v); setPage(1); }}
          category={category} setCategory={(v) => { setCategory(v); setPage(1); }}
          method={method} setMethod={(v) => { setMethod(v); setPage(1); }}
          categories={categories}
          placeholder={type === "masuk" ? "Cari berdasarkan keterangan / sumber" : "Cari berdasarkan keterangan / penerima"}
        />
        <TxTable rows={pageRows} onView={actions.view} onEdit={actions.edit} onDelete={actions.del} emptyTitle="Tidak ada transaksi yang cocok" />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={pageSize} />
      </Card>
    </div>
  );
};

/* ============================================================
   IURAN WARGA PAGE
   ============================================================ */
const PaymentStatusBadge = ({ status }) => {
  const map = {
    "Lunas": { tone: "green", dot: "🟢" },
    "Sebagian": { tone: "orange", dot: "🟡" },
    "Belum Bayar": { tone: "red", dot: "🔴" },
  }[status];
  return <Badge tone={map.tone}>{map.dot} {status}</Badge>;
};

const PembayaranForm = ({ resident, payment, settings, onCancel, onSubmit }) => {
  const ob = computeObligation(resident.id, settings);
  const sisa = Math.max(0, ob.total - payment.paid_amount);
  const [amount, setAmount] = useState(sisa);
  const [date, setDate] = useState("2026-08-11");
  const [method, setMethod] = useState("Tunai");
  const [error, setError] = useState("");

  const kembalian = Math.max(0, amount - sisa);

  const submit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) { setError("Nominal harus lebih dari 0."); return; }
    onSubmit({ amount, date, method });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg p-3.5" style={{ background: C.navyFaint }}>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{resident.name}</p>
        <p className="text-xs" style={{ color: C.textMuted }}>{resident.house} · Periode {PEMBAYARAN_PERIOD}</p>
      </div>

      <div className="space-y-1.5 rounded-lg border p-3.5" style={{ borderColor: C.border }}>
        <p className="mb-1 text-xs font-semibold" style={{ color: C.textMuted }}>RINCIAN KEWAJIBAN BULAN INI</p>
        <div className="flex justify-between text-sm">
          <span style={{ color: C.textMuted }}>Iuran Warga</span>
          <span className="tabular-nums font-medium" style={{ color: C.text }}>{formatRupiah(ob.iuran)}</span>
        </div>
        {ob.isArisanMember && (
          <>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.textMuted }}>Arisan</span>
              <span className="tabular-nums font-medium" style={{ color: C.text }}>{formatRupiah(ob.arisan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.textMuted }}>Dana Sosial (wajib)</span>
              <span className="tabular-nums font-medium" style={{ color: C.text }}>{formatRupiah(ob.sosial)}</span>
            </div>
          </>
        )}
        <div className="mt-1.5 flex justify-between border-t pt-1.5 text-sm font-bold" style={{ borderColor: C.border }}>
          <span style={{ color: C.text }}>Total Kewajiban</span>
          <span className="tabular-nums" style={{ color: C.navy }}>{formatRupiah(ob.total)}</span>
        </div>
        {payment.paid_amount > 0 && (
          <div className="flex justify-between text-xs">
            <span style={{ color: C.textMuted }}>Sudah dibayar sebelumnya</span>
            <span className="tabular-nums font-medium" style={{ color: C.green }}>{formatRupiah(payment.paid_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span style={{ color: C.textMuted }}>Sisa Tagihan</span>
          <span className="tabular-nums font-semibold" style={{ color: sisa > 0 ? C.red : C.textFaint }}>{formatRupiah(sisa)}</span>
        </div>
      </div>

      <Field label="Uang Diterima" required error={error}>
        <CurrencyInput value={amount} onChange={(v) => { setAmount(v); setError(""); }} error={error} />
      </Field>

      {kembalian > 0 && (
        <div className="rounded-lg p-3.5" style={{ background: C.greenSoft }}>
          <p className="text-xs font-semibold" style={{ color: C.green }}>KEMBALIAN YANG HARUS DIKELUARKAN BENDAHARA</p>
          <p className="rtd-display mt-1 text-xl font-bold tabular-nums" style={{ color: C.green }}>{formatRupiah(kembalian)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Metode" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
        </Field>
      </div>

      <p className="text-xs" style={{ color: C.textFaint }}>Nominal akan otomatis tercatat sebagai transaksi Iuran Warga{ob.isArisanMember ? ", Arisan, dan Dana Sosial" : ""} di Kas RT sesuai urutan prioritas.</p>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Catat Pembayaran</Btn>
      </div>
    </form>
  );
};

const PembayaranWargaPage = ({ payments, settings, onRecordPayment }) => {
  const [search, setSearch] = useState("");
  const [payRow, setPayRow] = useState(null);

  const rows = useMemo(() => {
    return payments
      .map((p) => {
        const resident = RESIDENT_MAP[p.resident_id];
        const ob = computeObligation(p.resident_id, settings);
        return { ...p, resident, ob, status: paymentStatusOf(p.paid_amount, ob.total) };
      })
      .filter((r) => !search || r.resident.name.toLowerCase().includes(search.toLowerCase()) || r.resident.house.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.resident.house.localeCompare(b.resident.house, "id", { numeric: true }));
  }, [payments, settings, search]);

  const summary = useMemo(() => {
    const tagihan = rows.reduce((s, r) => s + r.ob.total, 0);
    const dibayar = rows.reduce((s, r) => s + r.paid_amount, 0);
    const lunas = rows.filter((r) => r.status === "Lunas").length;
    return { tagihan, dibayar, kekurangan: tagihan - dibayar, lunas, total: rows.length };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>Satu pintu pembayaran warga ke bendahara — mencakup Iuran Warga, Arisan, dan Dana Sosial wajib periode {PEMBAYARAN_PERIOD} sekaligus. Jimpitan dicatat terpisah oleh petugas jimpitan.</span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>TOTAL TAGIHAN</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.text }}>{formatRupiah(summary.tagihan)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>SUDAH DIBAYAR</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.green }}>{formatRupiah(summary.dibayar)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>PIUTANG</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.red }}>{formatRupiah(summary.kekurangan)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>RUMAH LUNAS</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{summary.lunas} / {summary.total}</p></Card>
      </div>

      <Card className="p-0">
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3" style={{ borderColor: C.border }}>
          <div className="relative sm:col-span-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama warga / nomor rumah" className="pl-9" />
          </div>
        </div>

        {rows.length === 0 ? <EmptyState icon={CreditCard} title="Tidak ada data yang cocok" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Warga</th>
                  <th className="px-4 py-3">Rumah</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Tagihan</th>
                  <th className="px-4 py-3 text-right">Dibayar</th>
                  <th className="px-4 py-3 text-right">Kekurangan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{r.resident.name}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{r.resident.house}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={r.ob.isArisanMember ? "navy" : "muted"}>{r.ob.isArisanMember ? "Iuran+Arisan+Sosial" : "Iuran Warga"}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: C.text }}>{formatRupiah(r.ob.total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: C.green }}>{formatRupiah(r.paid_amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: r.ob.total - r.paid_amount > 0 ? C.red : C.textFaint }}>{formatRupiah(r.ob.total - r.paid_amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><PaymentStatusBadge status={r.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {r.status === "Lunas" ? (
                        <span className="text-xs" style={{ color: C.textFaint }}>—</span>
                      ) : (
                        <Btn size="sm" variant="subtle" onClick={() => setPayRow(r)}>Catat Pembayaran</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {payRow && (
        <Modal title="Catat Pembayaran Warga" subtitle="Iuran, Arisan &amp; Dana Sosial dicatat sekaligus di Kas RT" onClose={() => setPayRow(null)} width={480}>
          <PembayaranForm resident={payRow.resident} payment={payRow} settings={settings} onCancel={() => setPayRow(null)} onSubmit={(data) => { onRecordPayment(payRow, payRow.resident, data); setPayRow(null); }} />
        </Modal>
      )}
    </div>
  );
};

/* ============================================================
   JIMPITAN PAGE
   ============================================================ */
const JimpitanForm = ({ onCancel, onSubmit }) => {
  const [date, setDate] = useState("2026-08-11");
  const [residentId, setResidentId] = useState(RESIDENTS[0].id);
  const [amount, setAmount] = useState(5000);
  const [collector, setCollector] = useState(JIMPITAN_PETUGAS[0]);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) { setError("Nominal harus lebih dari 0."); return; }
    onSubmit({ date, resident_id: residentId, amount, collector });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Rumah" required>
        <Select value={residentId} onChange={(e) => setResidentId(e.target.value)}>
          {RESIDENTS.map((r) => <option key={r.id} value={r.id}>{r.house} — {r.name}</option>)}
        </Select>
      </Field>
      <Field label="Nominal" required error={error}><CurrencyInput value={amount} onChange={setAmount} error={error} /></Field>
      <Field label="Petugas" required>
        <Select value={collector} onChange={(e) => setCollector(e.target.value)}>
          {JIMPITAN_PETUGAS.map((p) => <option key={p}>{p}</option>)}
        </Select>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Simpan</Btn>
      </div>
    </form>
  );
};

const JimpitanPage = ({ jimpitan, onAddJimpitan }) => {
  const [month, setMonth] = useState("2026-08");
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(
    () => jimpitan.filter((j) => j.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)),
    [jimpitan, month]
  );
  const sudahSetor = useMemo(() => new Set(rows.map((r) => r.resident_id)), [rows]);
  const belumSetor = RESIDENTS.filter((r) => !sudahSetor.has(r.id));
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="!w-auto">
          {JIMPITAN_MONTHS.map((m) => <option key={m} value={m}>Bulan {m}</option>)}
        </Select>
        <Btn size="sm" onClick={() => setShowForm(true)}><Plus size={15} /> Catat Jimpitan</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>TOTAL JIMPITAN BULAN INI</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{formatRupiah(total)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>JUMLAH RUMAH</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.text }}>{RESIDENTS.length}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>SUDAH SETOR</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.green }}>{sudahSetor.size}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>BELUM SETOR</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.red }}>{belumSetor.length}</p></Card>
      </div>

      {belumSetor.length > 0 && (
        <Card className="p-4">
          <p className="mb-2.5 text-xs font-semibold" style={{ color: C.textMuted }}>RUMAH YANG BELUM SETOR BULAN INI</p>
          <div className="flex flex-wrap gap-1.5">
            {belumSetor.map((r) => <Badge key={r.id} tone="red">{r.house}</Badge>)}
          </div>
        </Card>
      )}

      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Riwayat Setoran Jimpitan</h3>
          <Badge tone="navy">{rows.length} setoran</Badge>
        </div>
        {rows.length === 0 ? <EmptyState icon={Coins} title="Belum ada setoran pada bulan ini" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3">Petugas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.text }}>{formatDateShort(r.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.text }}>{RESIDENT_MAP[r.resident_id].house}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{RESIDENT_MAP[r.resident_id].name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.green }}>{formatRupiah(r.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{r.collector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title="Catat Jimpitan" subtitle="Setoran akan tercatat otomatis sebagai Pemasukan" onClose={() => setShowForm(false)} width={460}>
          <JimpitanForm onCancel={() => setShowForm(false)} onSubmit={(data) => { onAddJimpitan(data); setShowForm(false); }} />
        </Modal>
      )}
    </div>
  );
};

/* ============================================================
   ARISAN PAGE
   ============================================================ */
const ArisanPage = ({ arisan, payments, settings, onDraw, goToPembayaran, readOnly }) => {
  const members = ARISAN_MEMBER_IDS.map((id) => RESIDENT_MAP[id]);
  const paymentByResident = useMemo(() => Object.fromEntries(payments.map((p) => [p.resident_id, p])), [payments]);
  const sudahSetor = (id) => {
    const p = paymentByResident[id];
    const ob = computeObligation(id, settings);
    return !!p && p.paid_amount >= ob.total;
  };
  const sudahCount = ARISAN_MEMBER_IDS.filter(sudahSetor).length;
  const terkumpul = sudahCount * settings.arisanAmount;
  const winnerIds = new Set(arisan.riwayat.map((r) => r.winner_id));
  const eligible = ARISAN_MEMBER_IDS.filter((id) => sudahSetor(id) && !winnerIds.has(id));
  const thisMonthWinner = arisan.riwayat.find((r) => r.period === ARISAN_PERIOD);

  return (
    <div className="space-y-5">
      {!readOnly && (
        <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <span>Setoran arisan &amp; dana sosial kini dicatat lewat menu <button onClick={goToPembayaran} className="font-semibold underline">Pembayaran Warga</button>. Halaman ini menampilkan status setoran dan pengundian pemenang.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>PESERTA ARISAN</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.text }}>{members.length} warga</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>SUDAH SETOR</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.green }}>{sudahCount} / {members.length}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>TERKUMPUL PERIODE INI</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{formatRupiah(terkumpul)}</p></Card>
        <Card className="p-4" style={{ background: thisMonthWinner ? C.greenSoft : C.orangeSoft, border: "none" }}>
          <p className="text-xs font-semibold" style={{ color: thisMonthWinner ? C.green : C.orange }}>PEMENANG {ARISAN_PERIOD}</p>
          <p className="rtd-display mt-1.5 truncate text-sm font-bold" style={{ color: thisMonthWinner ? C.green : C.orange }}>
            {thisMonthWinner ? RESIDENT_MAP[thisMonthWinner.winner_id].name : "Belum diundi"}
          </p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <div>
            <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Peserta &amp; Setoran — Periode {ARISAN_PERIOD}</h3>
            <p className="text-xs" style={{ color: C.textMuted }}>Total kewajiban bulanan {formatRupiah(settings.arisanAmount + settings.sosialWajibAmount)} / warga (Arisan {formatRupiah(settings.arisanAmount)} + Dana Sosial {formatRupiah(settings.sosialWajibAmount)})</p>
          </div>
          {!readOnly && (
            <Btn size="sm" variant="subtle" onClick={onDraw} disabled={!!thisMonthWinner || eligible.length === 0}>
              <Shuffle size={14} /> Undi Pemenang
            </Btn>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Status Setoran</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const sudah = sudahSetor(m.id);
                const isWinner = thisMonthWinner?.winner_id === m.id;
                return (
                  <tr key={m.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>
                      {m.name} {isWinner && <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.orange }}><Trophy size={12} /> Pemenang</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{m.house}</td>
                    <td className="whitespace-nowrap px-4 py-3">{sudah ? <Badge tone="green">🟢 Sudah Setor</Badge> : <Badge tone="red">🔴 Belum Setor</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Riwayat Pemenang</h3>
        </div>
        {arisan.riwayat.length === 0 ? <EmptyState icon={Trophy} title="Belum ada riwayat pemenang" /> : (
          <div className="divide-y" style={{ borderColor: C.border }}>
            {[...arisan.riwayat].reverse().map((r) => (
              <div key={r.period} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.orangeSoft, color: C.orange }}><Trophy size={14} /></div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{RESIDENT_MAP[r.winner_id].name}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>{RESIDENT_MAP[r.winner_id].house}</p>
                  </div>
                </div>
                <Badge tone="navy">Periode {r.period}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ============================================================
   PHASE 2 — MASTER DATA WARGA + RUMAH + IURAN TERINTEGRASI
   ============================================================ */
const PERIOD_MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const formatPeriodLabel = (period) => {
  if (!period) return "-";
  const [y, m] = period.split("-");
  return `${PERIOD_MONTHS_ID[Number(m) - 1] || m} ${y}`;
};

/* -- Statistik ringkas Rumah & Warga (dihitung dari data live, bukan hard-coded) -- */
const AdminStatsBar = ({ households, residents }) => {
  const totalRumah = households.length;
  const totalWarga = residents.length;
  const kepalaKeluarga = residents.filter((r) => r.relationship === "Kepala Keluarga").length;
  const wargaTetap = residents.filter((r) => r.resident_status === "Tetap").length;
  const pendatang = residents.filter((r) => r.resident_status === "Pendatang").length;
  const stats = [
    ["TOTAL RUMAH", totalRumah, Home, C.navy],
    ["TOTAL WARGA", totalWarga, Users2, C.navy],
    ["KEPALA KELUARGA", kepalaKeluarga, CreditCard, C.navy],
    ["WARGA TETAP", wargaTetap, CheckCircle2, C.green],
    ["PENDATANG", pendatang, Users, C.orange],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(([label, value, Icon, color]) => (
        <Card key={label} className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: C.navyFaint, color }}>
              <Icon size={15} />
            </div>
            <p className="text-[11px] font-semibold" style={{ color: C.textMuted }}>{label}</p>
          </div>
          <p className="rtd-display mt-2 text-xl font-bold tabular-nums" style={{ color: C.text }}>{value}</p>
        </Card>
      ))}
    </div>
  );
};

/* -- Form Tambah/Edit Rumah -- */
const HouseholdForm = ({ initial, residents, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial || { house_number: "", address: "", status: "Aktif", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!String(form.house_number).trim()) { setError("Nomor rumah wajib diisi."); return; }
    setBusy(true); setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Gagal menyimpan data rumah.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nomor Rumah" required error={error}>
        <TextInput value={form.house_number} onChange={(e) => set("house_number", e.target.value)} placeholder="mis. 21" />
      </Field>
      <Field label="Alamat">
        <TextInput value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Jl. Melati No. 21" />
      </Field>
      <Field label="Status Rumah" required>
        <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {HOUSEHOLD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Catatan">
        <TextArea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Rumah"}</Btn>
      </div>
    </form>
  );
};

/* -- Form Tambah/Edit Warga -- */
const ResidentForm = ({ initial, households, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial || {
    name: "", nik: "", kk_number: "", gender: "L", birth_place: "", birth_date: "",
    phone: "", relationship: RELATIONSHIP_OPTIONS[0], occupation: "", resident_status: "Tetap",
    household_id: households[0]?.id || "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!String(form.name).trim()) e.name = "Nama wajib diisi.";
    if (!/^\d{16}$/.test(String(form.nik || ""))) e.nik = "NIK harus 16 digit angka.";
    if (form.kk_number && !/^\d{16}$/.test(String(form.kk_number))) e.kk_number = "Nomor KK harus 16 digit angka.";
    if (!form.household_id) e.household_id = "Rumah wajib dipilih.";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setErrors({ form: err.message || "Gagal menyimpan data warga." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {errors.form && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: C.redSoft, color: C.red }}>
          <AlertTriangle size={13} /> {errors.form}
        </div>
      )}
      <Field label="Nama Lengkap" required error={errors.name}>
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="NIK" required error={errors.nik} hint="16 digit angka">
          <TextInput inputMode="numeric" maxLength={16} value={form.nik} onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.nik} />
        </Field>
        <Field label="Nomor KK" error={errors.kk_number} hint="16 digit angka">
          <TextInput inputMode="numeric" maxLength={16} value={form.kk_number} onChange={(e) => set("kk_number", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.kk_number} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jenis Kelamin" required>
          <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </Select>
        </Field>
        <Field label="Tempat Lahir">
          <TextInput value={form.birth_place} onChange={(e) => set("birth_place", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal Lahir">
          <TextInput type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
        </Field>
        <Field label="Nomor HP">
          <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812xxxxxxx" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hubungan dalam Keluarga" required>
          <Select value={form.relationship} onChange={(e) => set("relationship", e.target.value)}>
            {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Pekerjaan">
          <TextInput value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status Warga" required>
          <Select value={form.resident_status} onChange={(e) => set("resident_status", e.target.value)}>
            {RESIDENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Rumah" required error={errors.household_id}>
          <Select value={form.household_id} onChange={(e) => set("household_id", e.target.value)} aria-invalid={!!errors.household_id}>
            {households.map((h) => <option key={h.id} value={h.id}>Rumah No. {h.house_number}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Warga"}</Btn>
      </div>
    </form>
  );
};

/* -- Detail Rumah: kepala keluarga + anggota keluarga -- */
const HouseholdDetail = ({ household, residents, onEdit, onAddResident, onEditResident }) => {
  const members = residents.filter((r) => r.household_id === household.id);
  const head = members.find((m) => m.id === household.head_resident_id) || members.find((m) => m.relationship === "Kepala Keluarga");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Kepala Keluarga</p><p className="font-medium" style={{ color: C.text }}>{head ? head.name : "—"}</p></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Status Rumah</p><Badge tone={household.status === "Aktif" ? "green" : "muted"}>{household.status}</Badge></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Alamat</p><p className="font-medium" style={{ color: C.text }}>{household.address || "—"}</p></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Nomor KK</p><p className="font-medium" style={{ color: C.text }}>{members[0]?.kk_number || "—"}</p></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Nomor HP</p><p className="font-medium" style={{ color: C.text }}>{head?.phone || "—"}</p></div>
      </div>

      <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: C.border }}>
        <h4 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Anggota Keluarga ({members.length})</h4>
        <Btn size="sm" variant="subtle" onClick={onAddResident}><Plus size={13} /> Tambah Warga</Btn>
      </div>
      <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
              <th className="px-3 py-2">Nama</th><th className="px-3 py-2">Hubungan</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: C.textFaint }}>Belum ada anggota keluarga.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="border-b" style={{ borderColor: C.border }}>
                <td className="px-3 py-2 font-medium" style={{ color: C.text }}>{m.name}</td>
                <td className="px-3 py-2" style={{ color: C.textMuted }}>{m.relationship}</td>
                <td className="px-3 py-2"><Badge tone="muted">{m.resident_status}</Badge></td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => onEditResident(m)} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }} title="Edit"><Pencil size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t pt-4" style={{ borderColor: C.border }}>
        <Btn size="sm" variant="ghost" onClick={onEdit}><Pencil size={13} /> Edit Rumah</Btn>
      </div>
    </div>
  );
};

/* -- DATA RUMAH PAGE -- */
const DataRumahPage = ({ households, residents, onAddHousehold, onUpdateHousehold, onAddResident, onUpdateResident }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'detail', household? }

  const residentsByHousehold = useMemo(() => {
    const map = {};
    residents.forEach((r) => { (map[r.household_id] ||= []).push(r); });
    return map;
  }, [residents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return households;
    return households.filter((h) => {
      const members = residentsByHousehold[h.id] || [];
      return (
        String(h.house_number).toLowerCase().includes(q) ||
        String(h.address).toLowerCase().includes(q) ||
        members.some((m) => String(m.name).toLowerCase().includes(q) || String(m.nik).includes(q) || String(m.kk_number).includes(q) || String(m.phone).includes(q))
      );
    });
  }, [households, residentsByHousehold, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true })), [filtered]);

  return (
    <div className="space-y-5">
      <AdminStatsBar households={households} residents={residents} />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor rumah, nama, NIK, KK, HP..." className="pl-9" />
          </div>
          <Btn size="sm" onClick={() => setModal({ type: "add" })}><Plus size={14} /> Tambah Rumah</Btn>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <Card className="p-0"><EmptyState icon={Home} title="Belum ada data rumah" subtitle="Klik Tambah Rumah untuk mulai mendata." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((h) => {
            const members = residentsByHousehold[h.id] || [];
            const head = members.find((m) => m.id === h.head_resident_id) || members.find((m) => m.relationship === "Kepala Keluarga");
            return (
              <Card key={h.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-wide" style={{ color: C.textMuted }}>RUMAH {h.house_number}</p>
                    <p className="rtd-display mt-0.5 text-base font-bold" style={{ color: C.text }}>{head ? head.name : "Belum ada kepala keluarga"}</p>
                  </div>
                  <Badge tone={h.status === "Aktif" ? "green" : "muted"}>{h.status}</Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-xs" style={{ color: C.textMuted }}>
                  <p className="flex items-center gap-1.5"><Users2 size={13} /> {members.length} anggota keluarga</p>
                  {head?.phone && <p className="flex items-center gap-1.5"><Phone size={13} /> {head.phone}</p>}
                  {h.address && <p className="flex items-center gap-1.5"><MapPin size={13} /> {h.address}</p>}
                </div>
                <Btn size="sm" variant="subtle" className="mt-4 w-full" onClick={() => setModal({ type: "detail", household: h })}>Lihat Detail</Btn>
              </Card>
            );
          })}
        </div>
      )}

      {modal?.type === "add" && (
        <Modal title="Tambah Rumah" subtitle="Data rumah menjadi induk untuk anggota keluarga" onClose={() => setModal(null)} width={480}>
          <HouseholdForm
            residents={residents}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onAddHousehold(form); setModal(null); }}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Edit Rumah" subtitle={`Rumah No. ${modal.household.house_number}`} onClose={() => setModal(null)} width={480}>
          <HouseholdForm
            initial={modal.household}
            residents={residents}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onUpdateHousehold({ ...form, id: modal.household.id }); setModal(null); }}
          />
        </Modal>
      )}

      {modal?.type === "detail" && (
        <Modal title={`Rumah No. ${modal.household.house_number}`} subtitle="Detail rumah & anggota keluarga" onClose={() => setModal(null)} width={620}>
          <HouseholdDetail
            household={households.find((h) => h.id === modal.household.id) || modal.household}
            residents={residents}
            onEdit={() => setModal({ type: "edit", household: modal.household })}
            onAddResident={() => setModal({ type: "addResident", household: modal.household })}
            onEditResident={(resident) => setModal({ type: "editResident", household: modal.household, resident })}
          />
        </Modal>
      )}

      {modal?.type === "addResident" && (
        <Modal title="Tambah Warga" subtitle={`Anggota keluarga Rumah No. ${modal.household.house_number}`} onClose={() => setModal(null)}>
          <ResidentForm
            initial={{ name: "", nik: "", kk_number: "", gender: "L", birth_place: "", birth_date: "", phone: "", relationship: "Anak", occupation: "", resident_status: "Tetap", household_id: modal.household.id }}
            households={households}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onAddResident(form); setModal({ type: "detail", household: modal.household }); }}
          />
        </Modal>
      )}

      {modal?.type === "editResident" && (
        <Modal title="Edit Warga" subtitle={modal.resident.name} onClose={() => setModal(null)}>
          <ResidentForm
            initial={modal.resident}
            households={households}
            onCancel={() => setModal(null)}
            onSubmit={async (form) => { await onUpdateResident({ ...form, id: modal.resident.id }); setModal({ type: "detail", household: modal.household }); }}
          />
        </Modal>
      )}
    </div>
  );
};

/* -- DATA WARGA PAGE -- */
const DataWargaPage = ({ households, residents, onAddResident, onUpdateResident }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const householdMap = useMemo(() => Object.fromEntries(households.map((h) => [h.id, h])), [households]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) => {
      const house = householdMap[r.household_id];
      return (
        String(r.name).toLowerCase().includes(q) ||
        String(r.nik).includes(q) ||
        String(r.kk_number).includes(q) ||
        String(r.phone).includes(q) ||
        String(house?.house_number || "").toLowerCase().includes(q)
      );
    });
  }, [residents, householdMap, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => String(a.name).localeCompare(b.name, "id")), [filtered]);

  return (
    <div className="space-y-5">
      <AdminStatsBar households={households} residents={residents} />

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.border }}>
          <div className="relative sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIK, KK, HP, nomor rumah..." className="pl-9" />
          </div>
          <Btn size="sm" onClick={() => setModal({ type: "add" })} disabled={households.length === 0}><Plus size={14} /> Tambah Warga</Btn>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={Users2} title="Belum ada data warga" subtitle="Tambahkan rumah terlebih dahulu, lalu tambahkan warga." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Rumah</th><th className="px-4 py-3">NIK</th>
                  <th className="px-4 py-3">Hubungan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">HP</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{r.name}</td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>No. {householdMap[r.household_id]?.house_number || "-"}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: C.textMuted }}>{r.nik}</td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>{r.relationship}</td>
                    <td className="px-4 py-3"><Badge tone={r.resident_status === "Tetap" ? "green" : r.resident_status === "Pindah" || r.resident_status === "Meninggal" ? "muted" : "orange"}>{r.resident_status}</Badge></td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>{r.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setModal({ type: "edit", resident: r })} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }} title="Edit"><Pencil size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal?.type === "add" && (
        <Modal title="Tambah Warga" onClose={() => setModal(null)}>
          <ResidentForm households={households} onCancel={() => setModal(null)} onSubmit={async (form) => { await onAddResident(form); setModal(null); }} />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title="Edit Warga" subtitle={modal.resident.name} onClose={() => setModal(null)}>
          <ResidentForm initial={modal.resident} households={households} onCancel={() => setModal(null)} onSubmit={async (form) => { await onUpdateResident({ ...form, id: modal.resident.id }); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
};

/* -- Kelola Jenis Iuran (nominal per jenis) -- */
const DuesTypesForm = ({ duesTypes, onCancel, onSubmit }) => {
  const [rows, setRows] = useState(duesTypes.map((d) => ({ ...d })));
  const [busy, setBusy] = useState(false);
  const setRow = (i, k, v) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSubmit(rows); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs" style={{ color: C.textMuted }}>Admin dapat menentukan nominal setiap jenis iuran. Tidak semua jenis wajib dipakai — nonaktifkan jika tidak digunakan.</p>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.id || i} className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Jenis Iuran">
                <TextInput value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} />
              </Field>
            </div>
            <div className="w-36">
              <Field label="Nominal / bulan">
                <CurrencyInput value={r.amount} onChange={(v) => setRow(i, "amount", v)} />
              </Field>
            </div>
            <label className="mb-2.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.textMuted }}>
              <input type="checkbox" checked={r.active !== false} onChange={(e) => setRow(i, "active", e.target.checked)} /> Aktif
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Jenis Iuran"}</Btn>
      </div>
    </form>
  );
};

/* -- Generate Tagihan Bulanan -- */
const GenerateDuesForm = ({ duesTypes, onCancel, onSubmit }) => {
  const [period, setPeriod] = useState("2026-08");
  const [duesTypeId, setDuesTypeId] = useState(duesTypes.find((d) => d.active !== false)?.id || duesTypes[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await onSubmit({ period, dues_type_id: duesTypeId });
      setResult(res);
    } catch (err) {
      setError(err.message || "Gagal membuat tagihan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Bulan" required>
        <TextInput type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </Field>
      <Field label="Jenis Iuran" required>
        <Select value={duesTypeId} onChange={(e) => setDuesTypeId(e.target.value)}>
          {duesTypes.map((d) => <option key={d.id} value={d.id}>{d.name} — {formatRupiah(d.amount)}</option>)}
        </Select>
      </Field>
      {error && <p className="text-xs font-medium" style={{ color: C.red }}>{error}</p>}
      {result && (
        <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: C.greenSoft, color: C.green }}>
          {result.created} tagihan baru dibuat untuk periode {formatPeriodLabel(period)}
          {result.skipped > 0 ? `, ${result.skipped} rumah dilewati karena tagihan periode ini sudah pernah dibuat.` : "."}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Tutup</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Membuat..." : "Generate Iuran Bulanan"}</Btn>
      </div>
    </form>
  );
};

/* -- Catat Pembayaran Iuran -- */
const RecordDuesPaymentForm = ({ due, household, headName, duesTypeName, onCancel, onSubmit }) => {
  const sisa = Math.max(0, Number(due.amount) - Number(due.paid_amount));
  const [amount, setAmount] = useState(sisa);
  const [date, setDate] = useState("2026-08-11");
  const [method, setMethod] = useState("Tunai");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (amount <= 0) { setError("Nominal pembayaran harus lebih dari 0."); return; }
    if (amount > sisa) { setError(`Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(sisa)}).`); return; }
    setBusy(true); setError("");
    try {
      await onSubmit({ dues_id: due.id, amount, date, method });
      onCancel();
    } catch (err) {
      setError(err.message || "Gagal menyimpan pembayaran.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-lg p-3 text-sm" style={{ background: C.navyFaint }}>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Rumah</p><p className="font-semibold" style={{ color: C.text }}>No. {household?.house_number}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Kepala Keluarga</p><p className="font-semibold" style={{ color: C.text }}>{headName}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Jenis Iuran</p><p className="font-semibold" style={{ color: C.text }}>{duesTypeName} — {formatPeriodLabel(due.period)}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Tagihan</p><p className="font-semibold tabular-nums" style={{ color: C.text }}>{formatRupiah(due.amount)}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Sudah Dibayar</p><p className="font-semibold tabular-nums" style={{ color: C.green }}>{formatRupiah(due.paid_amount)}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Sisa</p><p className="font-semibold tabular-nums" style={{ color: C.orange }}>{formatRupiah(sisa)}</p></div>
      </div>
      <Field label="Pembayaran" required error={error}>
        <CurrencyInput value={amount} onChange={setAmount} error={!!error} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Metode" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Pembayaran"}</Btn>
      </div>
    </form>
  );
};

/* -- IURAN WARGA PAGE (master rumah/warga + tagihan generate + bayar, terintegrasi Kas) -- */
const IuranWargaPage = ({ households, residents, duesTypes, dues, onGenerateDues, onRecordPayment, onSaveDuesTypes, userRole }) => {
  const periods = useMemo(() => {
    const set = new Set(dues.map((d) => d.period));
    set.add("2026-08");
    return [...set].sort().reverse();
  }, [dues]);
  const [period, setPeriod] = useState(periods[0] || "2026-08");
  const [duesTypeFilter, setDuesTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const householdMap = useMemo(() => Object.fromEntries(households.map((h) => [h.id, h])), [households]);
  const residentMap = useMemo(() => Object.fromEntries(residents.map((r) => [r.id, r])), [residents]);
  const duesTypeMap = useMemo(() => Object.fromEntries(duesTypes.map((d) => [d.id, d])), [duesTypes]);

  const periodDues = useMemo(() => dues.filter((d) => d.period === period), [dues, period]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodDues.filter((d) => {
      if (duesTypeFilter && d.dues_type_id !== duesTypeFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (!q) return true;
      const house = householdMap[d.household_id];
      const head = house ? residentMap[house.head_resident_id] : null;
      return String(house?.house_number || "").toLowerCase().includes(q) || String(head?.name || "").toLowerCase().includes(q);
    });
  }, [periodDues, duesTypeFilter, statusFilter, search, householdMap, residentMap]);

  const totals = useMemo(() => {
    const totalTagihan = filtered.reduce((s, d) => s + Number(d.amount), 0);
    const totalDibayar = filtered.reduce((s, d) => s + Number(d.paid_amount), 0);
    return { totalTagihan, totalDibayar, belum: totalTagihan - totalDibayar, persen: totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 100) : 0 };
  }, [filtered]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const ha = householdMap[a.household_id]?.house_number || "";
    const hb = householdMap[b.household_id]?.house_number || "";
    return String(ha).localeCompare(String(hb), "id", { numeric: true });
  }), [filtered, householdMap]);

  return (
    <div className="space-y-5">
      <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>Tagihan iuran dibuat per rumah dari Data Rumah &amp; Data Warga. Setiap pembayaran otomatis tercatat sebagai transaksi pemasukan di Kas RT.</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Field label="Periode">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="!w-40">
            {periods.map((p) => <option key={p} value={p}>{formatPeriodLabel(p)}</option>)}
          </Select>
        </Field>
        <div className="ml-auto flex flex-wrap gap-2 self-end">
          {userRole !== "Bendahara" && (
            <Btn size="sm" variant="ghost" onClick={() => setModal({ type: "duesTypes" })}><Settings size={13} /> Kelola Jenis Iuran</Btn>
          )}
          <Btn size="sm" variant="subtle" onClick={() => setModal({ type: "generate" })}><FileText size={13} /> Generate Iuran Bulanan</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="TOTAL TAGIHAN" value={totals.totalTagihan} tone={C.navy} icon={FileText} />
        <StatCard label="SUDAH DIBAYAR" value={totals.totalDibayar} tone={C.green} icon={CheckCircle2} />
        <StatCard label="BELUM DIBAYAR" value={totals.belum} tone={C.red} icon={AlertTriangle} />
        <Card className="p-4">
          <p className="text-xs font-semibold" style={{ color: C.textMuted }}>PERSENTASE PEMBAYARAN</p>
          <p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{totals.persen}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: C.border }}>
            <div className="h-1.5 rounded-full" style={{ width: `${totals.persen}%`, background: C.navy }} />
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-4" style={{ borderColor: C.border }}>
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari rumah / kepala keluarga..." className="pl-9" />
          </div>
          <Select value={duesTypeFilter} onChange={(e) => setDuesTypeFilter(e.target.value)}>
            <option value="">Semua Jenis Iuran</option>
            {duesTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="sebagian">Sebagian</option>
            <option value="belum">Belum Bayar</option>
          </Select>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada tagihan pada periode ini" subtitle="Klik Generate Iuran Bulanan untuk membuat tagihan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th><th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3 text-right">Tagihan</th><th className="px-4 py-3 text-right">Dibayar</th>
                  <th className="px-4 py-3 text-right">Kekurangan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => {
                  const house = householdMap[d.household_id];
                  const head = house ? residentMap[house.head_resident_id] : null;
                  const kurang = Number(d.amount) - Number(d.paid_amount);
                  return (
                    <tr key={d.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                      <td className="px-4 py-3 font-medium" style={{ color: C.text }}>No. {house?.house_number || "-"}</td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>{head?.name || "-"}</td>
                      <td className="px-4 py-3"><Badge tone="muted">{duesTypeMap[d.dues_type_id]?.name || "-"}</Badge></td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.text }}>{formatRupiah(d.amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.green }}>{formatRupiah(d.paid_amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: kurang > 0 ? C.red : C.textFaint }}>{kurang > 0 ? formatRupiah(kurang) : "Rp0"}</td>
                      <td className="px-4 py-3"><Badge tone={DUES_STATUS_TONE[d.status] || "muted"}>{DUES_STATUS_LABEL[d.status] || d.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Btn size="sm" variant="subtle" disabled={d.status === "lunas"} onClick={() => setModal({ type: "pay", due: d })}>Bayar</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal?.type === "generate" && (
        <Modal title="Generate Iuran Bulanan" subtitle="Buat tagihan untuk seluruh rumah aktif" onClose={() => setModal(null)} width={440}>
          <GenerateDuesForm duesTypes={duesTypes} onCancel={() => setModal(null)} onSubmit={onGenerateDues} />
        </Modal>
      )}

      {modal?.type === "duesTypes" && (
        <Modal title="Kelola Jenis Iuran" subtitle="Admin dapat menentukan nominal setiap jenis iuran" onClose={() => setModal(null)} width={520}>
          <DuesTypesForm duesTypes={duesTypes} onCancel={() => setModal(null)} onSubmit={async (rows) => { await onSaveDuesTypes(rows); setModal(null); }} />
        </Modal>
      )}

      {modal?.type === "pay" && (() => {
        const house = householdMap[modal.due.household_id];
        const head = house ? residentMap[house.head_resident_id] : null;
        return (
          <Modal title="Catat Pembayaran Iuran" subtitle="Tagihan, pembayaran &amp; kas RT tercatat sekaligus" onClose={() => setModal(null)} width={480}>
            <RecordDuesPaymentForm
              due={modal.due}
              household={house}
              headName={head?.name || "-"}
              duesTypeName={duesTypeMap[modal.due.dues_type_id]?.name || "-"}
              onCancel={() => setModal(null)}
              onSubmit={onRecordPayment}
            />
          </Modal>
        );
      })()}
    </div>
  );
};

/* ============================================================
   DANA SOSIAL PAGE
   ============================================================ */
const SosialForm = ({ onCancel, onSubmit }) => {
  const [type, setType] = useState("masuk");
  const [date, setDate] = useState("2026-08-11");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [party, setParty] = useState("");
  const [method, setMethod] = useState("Tunai");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!amount || amount <= 0) e.amount = "Nominal harus lebih dari 0.";
    if (!description.trim()) e.description = "Keterangan wajib diisi.";
    if (!party.trim()) e.party = type === "masuk" ? "Sumber wajib diisi." : "Penerima wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ type, date, amount, description, party, method });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Jenis" required>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("masuk")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={type === "masuk" ? { background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowUpCircle size={16} /> Dana Masuk
          </button>
          <button type="button" onClick={() => setType("keluar")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={type === "keluar" ? { background: C.redSoft, color: C.red, border: `1px solid ${C.red}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowDownCircle size={16} /> Penyaluran Bantuan
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Nominal" required error={errors.amount}><CurrencyInput value={amount} onChange={setAmount} error={errors.amount} /></Field>
      </div>

      <Field label="Keterangan" required error={errors.description}>
        <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "masuk" ? "Contoh: Sumbangan dana sosial warga" : "Contoh: Bantuan sosial warga terdampak"} aria-invalid={!!errors.description} />
      </Field>

      <Field label={type === "masuk" ? "Sumber" : "Penerima"} required error={errors.party}>
        <TextInput value={party} onChange={(e) => setParty(e.target.value)} placeholder={type === "masuk" ? "Nama warga / donatur" : "Nama warga penerima bantuan"} aria-invalid={!!errors.party} />
      </Field>

      <Field label="Metode" required>
        <Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Simpan</Btn>
      </div>
    </form>
  );
};

const SosialPage = ({ transactions, onAddSosial }) => {
  const [showForm, setShowForm] = useState(false);
  const masuk = useMemo(() => transactions.filter((t) => t.type === "masuk" && t.category === "Dana Sosial"), [transactions]);
  const keluar = useMemo(() => transactions.filter((t) => t.type === "keluar" && t.category === "Sosial"), [transactions]);
  const totalMasuk = masuk.reduce((s, t) => s + t.amount, 0);
  const totalKeluar = keluar.reduce((s, t) => s + t.amount, 0);
  const saldo = totalMasuk - totalKeluar;
  const rows = useMemo(() => [...masuk, ...keluar].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)), [masuk, keluar]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>DANA TERKUMPUL</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.green }}>{formatRupiah(totalMasuk)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>TERSALURKAN</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.red }}>{formatRupiah(totalKeluar)}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>SALDO DANA SOSIAL</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{formatRupiah(saldo)}</p></Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <div>
            <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Riwayat Dana Sosial</h3>
            <p className="text-xs" style={{ color: C.textMuted }}>Sumbangan masuk &amp; penyaluran bantuan tercatat otomatis di Kas RT</p>
          </div>
          <Btn size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> Catat Dana Sosial</Btn>
        </div>
        {rows.length === 0 ? <EmptyState icon={HeartHandshake} title="Belum ada data dana sosial" subtitle="Sumbangan dan penyaluran bantuan akan muncul di sini." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3">Pihak</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.text }}>{formatDateShort(t.transaction_date)}</td>
                    <td className="px-4 py-3" style={{ color: C.text }}>{t.description}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{t.source}</td>
                    <td className="whitespace-nowrap px-4 py-3">{t.type === "masuk" ? <Badge tone="green">Dana Masuk</Badge> : <Badge tone="red">Penyaluran</Badge>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: t.type === "masuk" ? C.green : C.red }}>{t.type === "masuk" ? "+" : "-"}{formatRupiah(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title="Catat Dana Sosial" subtitle="Tercatat otomatis sebagai transaksi Kas RT" onClose={() => setShowForm(false)} width={460}>
          <SosialForm onCancel={() => setShowForm(false)} onSubmit={(data) => { onAddSosial(data); setShowForm(false); }} />
        </Modal>
      )}
    </div>
  );
};

/* ============================================================
   PENGATURAN NOMINAL (Bendahara)
   ============================================================ */
const PengaturanPage = ({ settings, onSave, userRole }) => {
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const fields = [
    { key: "iuranAmount", label: "Iuran Warga / bulan", hint: "Ditagih ke seluruh warga setiap bulan." },
    { key: "arisanAmount", label: "Arisan / bulan", hint: "Ditagih ke warga peserta arisan." },
    { key: "sosialWajibAmount", label: "Dana Sosial Wajib / bulan", hint: "Ditagih bersamaan dengan arisan ke peserta arisan." },
  ];

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    fields.forEach((f) => { if (!form[f.key] || form[f.key] <= 0) errs[f.key] = "Nominal harus lebih dari 0."; });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>Nominal ini menentukan tagihan warga di menu <strong>Pembayaran Warga</strong> &amp; <strong>Arisan</strong>. Perubahan berlaku untuk sisa tagihan periode berjalan dan periode berikutnya.{userRole && userRole !== "Bendahara" && " Disarankan hanya Bendahara yang mengubah nominal ini."}</span>
      </div>

      <Card className="max-w-lg p-6">
        <h3 className="rtd-display mb-4 text-sm font-bold" style={{ color: C.text }}>Nominal Wajib Bulanan</h3>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} required error={errors[f.key]} hint={f.hint}>
              <CurrencyInput
                value={form[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                error={errors[f.key]}
              />
            </Field>
          ))}
          <div className="flex items-center justify-between gap-2 pt-2">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.green }}><CheckCircle2 size={14} /> Nominal tersimpan</span>
            ) : <span />}
            <Btn type="submit"><Save size={15} /> Simpan Nominal</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
};

/* ============================================================
   LAPORAN KEUANGAN PAGE
   ============================================================ */
const monthKey = (s) => s.slice(0, 7);
const yearKey = (s) => s.slice(0, 4);

function computeReportRange(mode, monthVal, yearVal, fromVal, toVal) {
  if (mode === "bulanan") {
    const [y, m] = monthVal.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { start: `${monthVal}-01`, end: `${monthVal}-${String(lastDay).padStart(2, "0")}` };
  }
  if (mode === "tahunan") return { start: `${yearVal}-01-01`, end: `${yearVal}-12-31` };
  return { start: fromVal, end: toVal };
}

const ReportPage = ({ transactions }) => {
  const availableMonths = useMemo(() => [...new Set(transactions.map((t) => monthKey(t.transaction_date)))].sort().reverse(), [transactions]);
  const availableYears = useMemo(() => [...new Set(transactions.map((t) => yearKey(t.transaction_date)))].sort().reverse(), [transactions]);

  const [mode, setMode] = useState("bulanan");
  const [month, setMonth] = useState(availableMonths[0] || "2026-08");
  const [year, setYear] = useState(availableYears[0] || "2026");
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState(TODAY.toISOString().slice(0, 10));

  const { start, end } = useMemo(() => computeReportRange(mode, month, year, from, to), [mode, month, year, from, to]);

  const inRange = useMemo(
    () => transactions.filter((t) => t.transaction_date >= start && t.transaction_date <= end).sort((a, b) => a.transaction_date.localeCompare(b.transaction_date)),
    [transactions, start, end]
  );

  const saldoAwal = useMemo(
    () => SALDO_AWAL + transactions.filter((t) => t.transaction_date < start).reduce((s, t) => s + (t.type === "masuk" ? t.amount : -t.amount), 0),
    [transactions, start]
  );
  const totalMasuk = inRange.filter((t) => t.type === "masuk").reduce((s, t) => s + t.amount, 0);
  const totalKeluar = inRange.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0);
  const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

  const rekapMasuk = useMemo(() => {
    const map = {};
    inRange.filter((t) => t.type === "masuk").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [inRange]);
  const rekapKeluar = useMemo(() => {
    const map = {};
    inRange.filter((t) => t.type === "keluar").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [inRange]);

  const periodLabel = mode === "bulanan"
    ? `${MONTHS_ID[Number(month.split("-")[1]) - 1]} ${month.split("-")[0]}`
    : mode === "tahunan" ? `Tahun ${year}` : `${formatDateLong(from)} — ${formatDateLong(to)}`;

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN KEUANGAN RT DIGITAL"],
      [`Periode: ${periodLabel}`],
      [],
      ["Saldo Awal", saldoAwal],
      ["Total Pemasukan", totalMasuk],
      ["Total Pengeluaran", totalKeluar],
      ["Saldo Akhir", saldoAkhir],
      [],
      ["Rekap Pemasukan per Kategori"],
      ["Kategori", "Nominal"], ...rekapMasuk,
      [],
      ["Rekap Pengeluaran per Kategori"],
      ["Kategori", "Nominal"], ...rekapKeluar,
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Ringkasan");
    const detailSheet = XLSX.utils.json_to_sheet(inRange.map((t) => ({
      Tanggal: t.transaction_date, Kode: t.transaction_code, Jenis: t.type === "masuk" ? "Pemasukan" : "Pengeluaran",
      Kategori: t.category, Keterangan: t.description, "Sumber/Penerima": t.source, Metode: t.payment_method, Nominal: t.amount,
    })));
    XLSX.utils.book_append_sheet(wb, detailSheet, "Detail Transaksi");
    XLSX.writeFile(wb, `Laporan-Keuangan-RT-${mode === "bulanan" ? month : mode === "tahunan" ? year : `${from}_${to}`}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[["bulanan", "Bulanan"], ["tahunan", "Tahunan"], ["custom", "Custom Periode"]].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} className="rtd-focus rounded-lg px-3 py-1.5 text-xs font-semibold transition" style={mode === v ? { background: C.navy, color: "#fff" } : { background: C.navyFaint, color: C.navy }}>{l}</button>
          ))}
          {mode === "bulanan" && (
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="!w-auto">
              {(availableMonths.length ? availableMonths : [month]).map((m) => <option key={m} value={m}>{MONTHS_ID[Number(m.split("-")[1]) - 1]} {m.split("-")[0]}</option>)}
            </Select>
          )}
          {mode === "tahunan" && (
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="!w-auto">
              {(availableYears.length ? availableYears : [year]).map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          )}
          {mode === "custom" && (
            <>
              <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-auto" />
              <span className="text-xs" style={{ color: C.textMuted }}>s/d</span>
              <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-auto" />
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => window.print()}><Printer size={14} /> Cetak / Export PDF</Btn>
          <Btn size="sm" variant="subtle" onClick={exportExcel}><FileSpreadsheet size={14} /> Export Excel</Btn>
        </div>
      </div>

      <p className="hidden text-sm font-semibold print:block" style={{ color: C.text }}>Laporan Keuangan RT Digital — Periode {periodLabel}</p>

      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold" style={{ color: C.textMuted }}>RINGKASAN — {periodLabel}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[["Saldo Awal", saldoAwal, C.text], ["Pemasukan", totalMasuk, C.green], ["Pengeluaran", totalKeluar, C.red], ["Saldo Akhir", saldoAkhir, C.navy]].map(([label, val, color]) => (
            <div key={label}>
              <p className="text-xs font-medium" style={{ color: C.textMuted }}>{label}</p>
              <p className="rtd-display mt-1 text-lg font-bold tabular-nums" style={{ color }}>{formatRupiah(val)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <div className="border-b px-5 py-3" style={{ borderColor: C.border }}><h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Rekap Pemasukan</h3></div>
          {rekapMasuk.length === 0 ? <EmptyState title="Tidak ada pemasukan" /> : (
            <div className="divide-y" style={{ borderColor: C.border }}>
              {rekapMasuk.map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span style={{ color: C.text }}>{cat}</span>
                  <span className="font-semibold tabular-nums" style={{ color: C.green }}>{formatRupiah(val)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-0">
          <div className="border-b px-5 py-3" style={{ borderColor: C.border }}><h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Rekap Pengeluaran</h3></div>
          {rekapKeluar.length === 0 ? <EmptyState title="Tidak ada pengeluaran" /> : (
            <div className="divide-y" style={{ borderColor: C.border }}>
              {rekapKeluar.map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span style={{ color: C.text }}>{cat}</span>
                  <span className="font-semibold tabular-nums" style={{ color: C.red }}>{formatRupiah(val)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Detail Transaksi</h3>
          <Badge tone="navy">{inRange.length} transaksi</Badge>
        </div>
        <TxTable rows={inRange} hideActions emptyTitle="Tidak ada transaksi pada periode ini" />
      </Card>
    </div>
  );
};

/* ============================================================
   APP SHELL
   ============================================================ */
export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [payments, setPayments] = useState([]);
  const [jimpitan, setJimpitan] = useState([]);
  const [arisan, setArisan] = useState({ riwayat: [] });
  const [households, setHouseholds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [duesTypes, setDuesTypes] = useState([]);
  const [dues, setDues] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [confirmTx, setConfirmTx] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  const notify = (message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };

  const loadFromSheet = () => {
    setLoadingData(true);
    setLoadError("");
    return apiGet("bootstrap")
      .then((data) => {
        setTransactions(data.transactions || []);
        setSettings(data.settings || DEFAULT_SETTINGS);
        setPayments(data.payments || []);
        setJimpitan(data.jimpitan || []);
        setArisan({ riwayat: data.arisanRiwayat || [] });
        setHouseholds(data.households || []);
        setResidents(data.residents || []);
        setDuesTypes(data.duesTypes || []);
        setDues(data.dues || []);
      })
      .catch((err) => setLoadError(err.message || "Gagal memuat data dari Google Spreadsheet."))
      .finally(() => setLoadingData(false));
  };

  // Data kondisi keuangan & arisan dimuat begitu sistem dibuka, tanpa
  // menunggu login — supaya pengunjung langsung melihat saldo,
  // pemasukan, pengeluaran, dan status arisan.
  useEffect(() => {
    loadFromSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = {
    view: (tx) => setModal({ type: "detail", tx }),
    edit: (tx) => setModal({ type: "edit", tx }),
    del: (tx) => setConfirmTx(tx),
  };

  // Menyimpan transaksi ke Google Spreadsheet lalu memasukkan hasilnya ke state lokal.
  const addTransaction = async (partial) => {
    const { transaction } = await apiPost("addTransaction", { ...partial, created_by: user.name });
    setTransactions((prev) => [...prev, transaction]);
    return transaction;
  };

  const handleRecordPembayaran = async (payment, resident, { amount, date, method }) => {
    try {
      const ob = computeObligation(resident.id, settings);
      const sisa = Math.max(0, ob.total - payment.paid_amount);
      const applied = Math.min(amount, sisa);
      const kembalian = Math.max(0, amount - sisa);
      const alloc = allocatePayment(payment.paid_amount, applied, ob);
      const newPaidAmount = Math.min(ob.total, payment.paid_amount + applied);

      const { payment: savedPayment } = await apiPost("upsertPayment", {
        id: payment.id, resident_id: resident.id, period: payment.period,
        paid_amount: newPaidAmount, payment_date: date,
      });
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? savedPayment : p)));

      if (alloc.iuran > 0) {
        await addTransaction({
          transaction_date: date, type: "masuk", category: "Iuran Warga", amount: alloc.iuran,
          description: `Iuran warga periode ${PEMBAYARAN_PERIOD} - ${resident.house}`, source: resident.name, payment_method: method,
        });
      }
      if (alloc.arisan > 0) {
        await addTransaction({
          transaction_date: date, type: "masuk", category: "Arisan", amount: alloc.arisan,
          description: `Setoran arisan periode ${ARISAN_PERIOD} - ${resident.house}`, source: resident.name, payment_method: method,
        });
      }
      if (alloc.sosial > 0) {
        await addTransaction({
          transaction_date: date, type: "masuk", category: "Dana Sosial", amount: alloc.sosial,
          description: `Setoran dana sosial wajib periode ${ARISAN_PERIOD} - ${resident.house}`, source: resident.name, payment_method: method,
        });
      }

      notify(
        kembalian > 0
          ? `Pembayaran tercatat. Kembalikan ${formatRupiah(kembalian)} kepada ${resident.name}.`
          : "Pembayaran warga berhasil dicatat."
      );
    } catch (err) {
      notify(err.message || "Gagal menyimpan pembayaran.", "error");
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const { settings: saved } = await apiPost("saveSettings", newSettings);
      setSettings(saved);
      notify("Nominal pembayaran warga berhasil diperbarui.");
    } catch (err) {
      notify(err.message || "Gagal menyimpan pengaturan.", "error");
    }
  };

  const handleAddJimpitan = async (entry) => {
    try {
      const resident = RESIDENT_MAP[entry.resident_id];
      const { jimpitan: saved } = await apiPost("addJimpitan", entry);
      setJimpitan((prev) => [...prev, saved]);
      await addTransaction({
        transaction_date: entry.date, type: "masuk", category: "Jimpitan", amount: entry.amount,
        description: `Jimpitan - ${resident.house}`, source: entry.collector, payment_method: "Tunai",
      });
      notify("Setoran jimpitan berhasil dicatat.");
    } catch (err) {
      notify(err.message || "Gagal menyimpan setoran jimpitan.", "error");
    }
  };

  const handleAddSosial = async ({ type, date, amount, description, party, method }) => {
    try {
      await addTransaction({
        transaction_date: date, type, category: type === "masuk" ? "Dana Sosial" : "Sosial",
        amount, description, source: party, payment_method: method,
      });
      notify(type === "masuk" ? "Sumbangan dana sosial berhasil dicatat." : "Penyaluran bantuan sosial berhasil dicatat.");
    } catch (err) {
      notify(err.message || "Gagal menyimpan data dana sosial.", "error");
    }
  };

  const handleArisanDraw = async () => {
    const winnerIds = new Set(arisan.riwayat.map((r) => r.winner_id));
    const paymentByResident = Object.fromEntries(payments.map((p) => [p.resident_id, p]));
    const eligible = ARISAN_MEMBER_IDS.filter((id) => {
      const p = paymentByResident[id];
      const ob = computeObligation(id, settings);
      return p && p.paid_amount >= ob.total && !winnerIds.has(id);
    });
    if (eligible.length === 0) { notify("Belum ada peserta yang memenuhi syarat untuk diundi.", "error"); return; }
    const winnerId = eligible[Math.floor(Math.random() * eligible.length)];
    try {
      const { arisan: saved } = await apiPost("addArisanWinner", { period: ARISAN_PERIOD, winner_id: winnerId });
      setArisan((prev) => ({ ...prev, riwayat: [...prev.riwayat, saved] }));
      notify(`${RESIDENT_MAP[winnerId].name} terpilih sebagai pemenang arisan periode ${ARISAN_PERIOD}.`);
    } catch (err) {
      notify(err.message || "Gagal menyimpan hasil undian arisan.", "error");
    }
  };

  /* -- Phase 2: Master Data Rumah + Warga -- */
  const handleAddHousehold = async (form) => {
    try {
      const { household } = await apiPost("addHousehold", form);
      setHouseholds((prev) => [...prev, household]);
      notify(`Rumah No. ${household.house_number} berhasil ditambahkan.`);
      return household;
    } catch (err) {
      notify(err.message || "Gagal menambah data rumah.", "error");
      throw err;
    }
  };

  const handleUpdateHousehold = async (form) => {
    try {
      const { household } = await apiPost("updateHousehold", form);
      setHouseholds((prev) => prev.map((h) => (h.id === household.id ? household : h)));
      notify("Data rumah berhasil diperbarui.");
      return household;
    } catch (err) {
      notify(err.message || "Gagal memperbarui data rumah.", "error");
      throw err;
    }
  };

  const handleAddResident = async (form) => {
    try {
      const { resident } = await apiPost("addResident", form);
      setResidents((prev) => [...prev, resident]);
      if (resident.relationship === "Kepala Keluarga") {
        setHouseholds((prev) => prev.map((h) => (h.id === resident.household_id ? { ...h, head_resident_id: resident.id } : h)));
      }
      notify(`Warga "${resident.name}" berhasil ditambahkan.`);
      return resident;
    } catch (err) {
      notify(err.message || "Gagal menambah data warga.", "error");
      throw err;
    }
  };

  const handleUpdateResident = async (form) => {
    try {
      const { resident } = await apiPost("updateResident", form);
      setResidents((prev) => prev.map((r) => (r.id === resident.id ? resident : r)));
      if (resident.relationship === "Kepala Keluarga") {
        setHouseholds((prev) => prev.map((h) => (h.id === resident.household_id ? { ...h, head_resident_id: resident.id } : h)));
      }
      notify("Data warga berhasil diperbarui.");
      return resident;
    } catch (err) {
      notify(err.message || "Gagal memperbarui data warga.", "error");
      throw err;
    }
  };

  /* -- Phase 2: Master Jenis Iuran -- */
  const handleSaveDuesTypes = async (rows) => {
    try {
      const { duesTypes: saved } = await apiPost("saveDuesTypes", { duesTypes: rows });
      setDuesTypes(saved);
      notify("Jenis iuran berhasil diperbarui.");
      return saved;
    } catch (err) {
      notify(err.message || "Gagal menyimpan jenis iuran.", "error");
      throw err;
    }
  };

  /* -- Phase 2: Generate tagihan iuran bulanan -- */
  const handleGenerateDues = async ({ period, dues_type_id }) => {
    try {
      const res = await apiPost("generateDues", { period, dues_type_id });
      if (res.dues?.length) setDues((prev) => [...prev, ...res.dues]);
      if (res.created > 0) notify(`${res.created} tagihan iuran periode ${formatPeriodLabel(period)} berhasil dibuat.`);
      else notify("Tidak ada tagihan baru — seluruh rumah sudah memiliki tagihan untuk periode ini.", "info");
      return res;
    } catch (err) {
      notify(err.message || "Gagal membuat tagihan iuran.", "error");
      throw err;
    }
  };

  /* -- Phase 2: Catat pembayaran iuran (Dues + Payments + Transactions dalam satu operasi) -- */
  const handleRecordDuesPayment = async ({ dues_id, amount, date, method }) => {
    try {
      const res = await apiPost("recordPayment", { dues_id, amount, date, method, created_by: user.name });
      setDues((prev) => prev.map((d) => (d.id === res.dues.id ? res.dues : d)));
      setPayments((prev) => [...prev, res.payment]);
      setTransactions((prev) => [...prev, res.transaction]);
      notify("Pembayaran iuran berhasil dicatat & otomatis masuk Kas RT.");
      return res;
    } catch (err) {
      notify(err.message || "Gagal menyimpan pembayaran iuran.", "error");
      throw err;
    }
  };

  const handleSave = async (form) => {
    try {
      if (modal?.type === "edit") {
        const { transaction } = await apiPost("updateTransaction", { id: modal.tx.id, ...form });
        setTransactions((prev) => prev.map((t) => (t.id === modal.tx.id ? transaction : t)));
        notify("Transaksi berhasil diperbarui.");
      } else {
        await addTransaction(form);
        notify("Transaksi berhasil disimpan.");
      }
      setModal(null);
    } catch (err) {
      notify(err.message || "Gagal menyimpan transaksi.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiPost("deleteTransaction", { id: confirmTx.id });
      setTransactions((prev) => prev.filter((t) => t.id !== confirmTx.id));
      notify("Transaksi berhasil dihapus.");
      setConfirmTx(null);
      if (modal?.tx?.id === confirmTx.id) setModal(null);
    } catch (err) {
      notify(err.message || "Gagal menghapus transaksi.", "error");
    }
  };

  if (loadingData) {
    return (
      <div className="rtd-root flex min-h-screen items-center justify-center" style={{ background: C.bg }}>
        <GlobalStyle />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4" style={{ borderColor: C.navyFaint, borderTopColor: C.navy }} />
          <p className="text-sm font-semibold" style={{ color: C.text }}>Memuat data dari Google Spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rtd-root flex min-h-screen items-center justify-center px-4" style={{ background: C.bg }}>
        <GlobalStyle />
        <Card className="max-w-sm p-6 text-center">
          <AlertTriangle size={22} style={{ color: C.red, margin: "0 auto" }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: C.text }}>Gagal memuat data</p>
          <p className="mt-1 text-xs" style={{ color: C.textMuted }}>{loadError}</p>
          <Btn className="mt-4 w-full" onClick={loadFromSheet}>Coba Lagi</Btn>
        </Card>
      </div>
    );
  }

  // Belum login: pengunjung langsung disajikan kondisi keuangan &
  // arisan (PublicHome). Tombol "Masuk" membuka LoginPage untuk
  // pengurus/bendahara yang perlu akses kelola data.
  if (!user) {
    if (showLogin) {
      return <LoginPage onLogin={(acc) => { setUser(acc); setShowLogin(false); }} onBack={() => setShowLogin(false)} />;
    }
    return (
      <PublicHome
        transactions={transactions}
        payments={payments}
        settings={settings}
        arisan={arisan}
        onLoginClick={() => setShowLogin(true)}
      />
    );
  }

  const dashboardNotify = { view: actions.view, edit: actions.edit, del: actions.del };

  return (
    <div className="rtd-root flex min-h-screen" style={{ background: C.bg }}>
      <GlobalStyle />
      <div className="no-print contents">
        <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} notify={notify} />
      </div>
      <div className="flex min-h-screen flex-1 flex-col" style={{ minWidth: 0 }}>
        <div className="no-print contents">
          <Topbar page={page} user={user} onLogout={() => setUser(null)} onMenu={() => setMobileOpen(true)} onAdd={() => setModal({ type: "add" })} />
        </div>
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <div className="mx-auto max-w-6xl">
            <div className="no-print mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: C.orangeSoft, color: C.orange }}>
              <Info size={13} /> DATA DEMO — seluruh transaksi di bawah ini adalah data contoh untuk keperluan simulasi.
            </div>
            {page === "dashboard" && <Dashboard transactions={transactions} payments={payments} settings={settings} notify={dashboardNotify} />}
            {page === "rumah" && <DataRumahPage households={households} residents={residents} onAddHousehold={handleAddHousehold} onUpdateHousehold={handleUpdateHousehold} onAddResident={handleAddResident} onUpdateResident={handleUpdateResident} />}
            {page === "warga" && <DataWargaPage households={households} residents={residents} onAddResident={handleAddResident} onUpdateResident={handleUpdateResident} />}
            {page === "kas" && <KasRT transactions={transactions} actions={actions} />}
            {page === "pemasukan" && <ListPage type="masuk" transactions={transactions} actions={actions} />}
            {page === "pengeluaran" && <ListPage type="keluar" transactions={transactions} actions={actions} />}
            {page === "iuran" && <IuranWargaPage households={households} residents={residents} duesTypes={duesTypes} dues={dues} onGenerateDues={handleGenerateDues} onRecordPayment={handleRecordDuesPayment} onSaveDuesTypes={handleSaveDuesTypes} userRole={user.role} />}
            {page === "pembayaran" && <PembayaranWargaPage payments={payments} settings={settings} onRecordPayment={handleRecordPembayaran} />}
            {page === "jimpitan" && <JimpitanPage jimpitan={jimpitan} onAddJimpitan={handleAddJimpitan} />}
            {page === "arisan" && <ArisanPage arisan={arisan} payments={payments} settings={settings} onDraw={handleArisanDraw} goToPembayaran={() => setPage("pembayaran")} />}
            {page === "sosial" && <SosialPage transactions={transactions} onAddSosial={handleAddSosial} />}
            {page === "laporan" && <ReportPage transactions={transactions} />}
            {page === "pengaturan" && <PengaturanPage settings={settings} onSave={handleSaveSettings} userRole={user.role} />}
          </div>
        </main>
      </div>

      {(modal?.type === "add" || modal?.type === "edit") && (
        <Modal title={modal.type === "edit" ? "Edit Transaksi" : "Tambah Transaksi"} subtitle={modal.type === "edit" ? modal.tx.transaction_code : "Catat pemasukan atau pengeluaran kas RT"} onClose={() => setModal(null)}>
          <TransactionForm initial={modal.type === "edit" ? modal.tx : null} onCancel={() => setModal(null)} onSubmit={handleSave} />
        </Modal>
      )}

      {modal?.type === "detail" && (
        <Modal title="Detail Transaksi" subtitle={modal.tx.transaction_code} onClose={() => setModal(null)}>
          <TransactionDetail
            tx={modal.tx}
            onEdit={actions.edit}
            onDelete={actions.del}
            onClose={() => setModal(null)}
            households={households}
            residents={residents}
            duesTypes={duesTypes}
            dues={dues}
            onViewIuranDetail={() => { setPage("iuran"); setModal(null); }}
          />
        </Modal>
      )}

      {confirmTx && (
        <ConfirmDialog
          title="Hapus transaksi ini?"
          message={`Apakah Anda yakin ingin menghapus transaksi "${confirmTx.description}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTx(null)}
        />
      )}

      <Toasts toasts={toasts} remove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
