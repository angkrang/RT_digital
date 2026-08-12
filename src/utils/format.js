import { MONTHS_ID } from "../constants/data";

export const formatRupiah = (n) => `Rp${Math.round(Math.abs(n)).toLocaleString("id-ID")}`;

export const parseDate = (s) => new Date(s + "T00:00:00");

export const formatDateLong = (s) => {
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateShort = (s) => {
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
};

export const generateCode = (date, existing) => {
  const n = existing.filter((t) => t.transaction_date === date).length + 1;
  return `TRX-${date.replaceAll("-", "")}-${String(n).padStart(3, "0")}`;
};

export const monthKey = (s) => s.slice(0, 7);

export const yearKey = (s) => s.slice(0, 4);

export function computeReportRange(mode, monthVal, yearVal, fromVal, toVal) {
  if (mode === "bulanan") {
    const [y, m] = monthVal.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { start: `${monthVal}-01`, end: `${monthVal}-${String(lastDay).padStart(2, "0")}` };
  }
  if (mode === "tahunan") return { start: `${yearVal}-01-01`, end: `${yearVal}-12-31` };
  return { start: fromVal, end: toVal };
}

export const PERIOD_MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export const formatPeriodLabel = (period) => {
  if (!period) return "-";
  const [y, m] = period.split("-");
  return `${PERIOD_MONTHS_ID[Number(m) - 1] || m} ${y}`;
};

/* -- Statistik ringkas Rumah & Warga (dihitung dari data live, bukan hard-coded) -- */

export const parseStreetName = (address) => {
  if (!address) return "Lainnya";
  const idx = address.search(/No\.?\s*\d+/i);
  const name = (idx > -1 ? address.slice(0, idx) : address).trim().replace(/,$/, "");
  return name || "Lainnya";
};
