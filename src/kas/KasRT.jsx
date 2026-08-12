import React, { useMemo } from "react";
import { Badge, Card } from "../components/ui";
import { SALDO_AWAL } from "../constants/data";
import { C } from "../constants/theme";
import { TxTable } from "../transactions/TxTable";
import { formatRupiah } from "../utils/format";

export const KasRT = ({ transactions, actions }) => {
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
