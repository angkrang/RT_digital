import {
  Wallet,
} from "lucide-react";
import { ARISAN_MEMBER_IDS, PEMBAYARAN_PERIOD, RESIDENTS } from "../constants/data";
import { computeObligation } from "./dues";

export const DEMO_ACCOUNTS = [
  { email: "admin@rtdigital.id", password: "admin123", role: "Admin", name: "Pak Joko Susanto" },
  { email: "bendahara@rtdigital.id", password: "bendahara123", role: "Bendahara", name: "Ibu Wulan Ningsih" },
];

export const RAW_DEMO_TX = [
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

export function buildDemoTransactions() {
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

export function buildArisanDemo() {
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

export function buildPembayaranDemo(settings) {
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
