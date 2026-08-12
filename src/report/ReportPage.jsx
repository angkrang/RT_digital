import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Printer, FileSpreadsheet,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState, Select, TextInput } from "../components/ui";
import { MONTHS_ID, SALDO_AWAL, TODAY } from "../constants/data";
import { C } from "../constants/theme";
import { TxTable } from "../transactions/TxTable";
import { computeReportRange, formatDateLong, formatRupiah, monthKey, yearKey } from "../utils/format";

export const ReportPage = ({ transactions }) => {
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
