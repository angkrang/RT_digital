import { MONTHS_ID, TODAY } from "../constants/data";
import { parseDate } from "./format";

export function buildArusKasData(transactions, rangeDays) {
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

export function buildExpensePie(transactions) {
  const map = {};
  transactions.filter((t) => t.type === "keluar").forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/* ============================================================
   REUSABLE UI COMPONENTS
   ============================================================ */
