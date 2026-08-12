import { PERIOD_MONTHS_ID } from "../utils/format";

/* -- Batch 3B: Modul Arisan — helper periode, status, dan opsi form --
   Tanggal "hari ini" memakai tanggal demo yang sama dengan modul lain
   (Jimpitan) agar konsisten di seluruh aplikasi. */
export const ARISAN_TODAY_STR = "2026-08-11";

export const ARISAN_FREQUENCY_OPTIONS = ["Bulanan", "Mingguan"];
export const ARISAN_STATUS_OPTIONS = ["Aktif", "Selesai", "Ditunda"];

export const ARISAN_STATUS_TONE = {
  Aktif: "green",
  Selesai: "navy",
  Ditunda: "orange",
};

export const ARISAN_PAYMENT_STATUS_TONE = {
  Lunas: "green",
  Sebagian: "orange",
  Belum: "red",
};

const pad2 = (n) => String(n).padStart(2, "0");

const shiftMonth = (year, month, n) => {
  const total = year * 12 + (month - 1) + n;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
};

/* Menghasilkan daftar periode {value, label} sesuai frekuensi arisan.
   - Bulanan: "2026-01" -> "Januari 2026", dari start_date sampai end_date
     (atau 12 bulan ke depan bila belum punya tanggal selesai).
   - Mingguan: "W01" -> "Minggu 1", dihitung sederhana dari selisih
     start_date - end_date (atau 52 minggu bila belum ada tanggal selesai).
   Sesuai catatan di spesifikasi: tidak perlu generator kalender kompleks. */
export const generateArisanPeriods = (arisan) => {
  if (!arisan?.start_date) return [];
  const periods = [];

  if (arisan.frequency === "Mingguan") {
    const start = new Date(`${arisan.start_date}T00:00:00`);
    const end = arisan.end_date
      ? new Date(`${arisan.end_date}T00:00:00`)
      : new Date(start.getTime() + 51 * 7 * 86400000);
    const totalWeeks = Math.max(1, Math.ceil((end - start) / (7 * 86400000)) + 1);
    for (let i = 0; i < totalWeeks; i += 1) {
      periods.push({ value: `W${pad2(i + 1)}`, label: `Minggu ${i + 1}` });
    }
    return periods;
  }

  const [sy, sm] = arisan.start_date.split("-").map(Number);
  let ey;
  let em;
  if (arisan.end_date) {
    [ey, em] = arisan.end_date.split("-").map(Number);
  } else {
    const ext = shiftMonth(sy, sm, 11);
    ey = ext.year;
    em = ext.month;
  }
  let y = sy;
  let m = sm;
  let guard = 0;
  while ((y < ey || (y === ey && m <= em)) && guard < 240) {
    periods.push({ value: `${y}-${pad2(m)}`, label: `${PERIOD_MONTHS_ID[m - 1]} ${y}` });
    const nxt = shiftMonth(y, m, 1);
    y = nxt.year;
    m = nxt.month;
    guard += 1;
  }
  return periods;
};

/* Periode "berjalan" saat ini — dipakai sebagai default filter pembayaran. */
export const currentArisanPeriod = (arisan) => {
  const periods = generateArisanPeriods(arisan);
  if (periods.length === 0) return "";

  if (arisan.frequency === "Mingguan") {
    const start = new Date(`${arisan.start_date}T00:00:00`);
    const today = new Date(`${ARISAN_TODAY_STR}T00:00:00`);
    const idx = Math.max(0, Math.floor((today - start) / (7 * 86400000)));
    return periods[Math.min(idx, periods.length - 1)].value;
  }

  const todayKey = ARISAN_TODAY_STR.slice(0, 7);
  const found = periods.find((p) => p.value === todayKey);
  return found ? found.value : periods[periods.length - 1].value;
};

/* Label rentang periode singkat untuk kartu daftar arisan, mis. "Jan–Des 2026". */
export const arisanPeriodRangeLabel = (arisan) => {
  const periods = generateArisanPeriods(arisan);
  if (periods.length === 0) return "-";
  const first = periods[0].label;
  const last = periods[periods.length - 1].label;
  if (first === last) return first;
  if (arisan.frequency === "Mingguan") return `${periods[0].label} – ${periods[periods.length - 1].label}`;
  const [firstMonth, firstYear] = first.split(" ");
  const [lastMonth, lastYear] = last.split(" ");
  const shortMonth = (mn) => mn.slice(0, 3);
  if (firstYear === lastYear) return `${shortMonth(firstMonth)}–${shortMonth(lastMonth)} ${lastYear}`;
  return `${shortMonth(firstMonth)} ${firstYear} – ${shortMonth(lastMonth)} ${lastYear}`;
};
