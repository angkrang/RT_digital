import {
  Wallet,
} from "lucide-react";

export const INCOME_CATEGORIES = ["Iuran Warga", "Jimpitan", "Arisan", "Dana Sosial", "Donasi", "Bantuan", "Lainnya"];

export const EXPENSE_CATEGORIES = ["Kegiatan RT", "Kebersihan", "Keamanan", "Sosial", "Administrasi", "Inventaris", "Konsumsi", "Perawatan", "Lainnya"];

export const PAYMENT_METHODS = ["Tunai", "Transfer Bank", "E-Wallet"];

export const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const TODAY = new Date("2026-08-11T00:00:00");

export const SALDO_AWAL = 2000000;

export const RESIDENTS = [
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

export const RESIDENT_MAP = Object.fromEntries(RESIDENTS.map((r) => [r.id, r]));

/* -- Nominal default (dapat diubah Bendahara lewat menu Pengaturan) -- */

export const DEFAULT_SETTINGS = {
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

export const HOUSEHOLD_STATUS_OPTIONS = ["Aktif", "Pindah", "Nonaktif"];

export const RESIDENT_STATUS_OPTIONS = ["Tetap", "Pendatang", "Kontrak", "Kos", "Pindah", "Meninggal"];

export const RELATIONSHIP_OPTIONS = ["Kepala Keluarga", "Istri", "Suami", "Anak", "Kos", "Famili Lain"];

export const GENDER_OPTIONS = [{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }];

export const DUES_STATUS_LABEL = { belum: "Belum Bayar", sebagian: "Sebagian", lunas: "Lunas" };

export const DUES_STATUS_TONE = { belum: "red", sebagian: "orange", lunas: "green" };

/* -- Jimpitan (Batch 3A) --
   Data rumah/warga sekarang berasal dari Master Data (Households/Residents,
   lihat PHASE 2 di bawah) yang dimuat dari Google Spreadsheet lewat
   bootstrap(). Konstanta di sini hanya opsi bantu untuk form. */

export const JIMPITAN_PETUGAS = ["Bpk. Slamet", "Bpk. Rohman", "Ibu Yanti"];

export const JIMPITAN_STATUS_OPTIONS = ["Sudah Setor", "Belum Setor", "Tidak Ada di Rumah"];

export const JIMPITAN_STATUS_TONE = { "Sudah Setor": "green", "Belum Setor": "red", "Tidak Ada di Rumah": "orange" };

/* -- Arisan -- */

export const ARISAN_PERIOD = "2026-08";

export const ARISAN_MEMBER_IDS = RESIDENTS.slice(0, 15).map((r) => r.id);

export const PEMBAYARAN_PERIOD = "2026-08";
