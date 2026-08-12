import React from "react";
import {
  Eye, Pencil, Trash2, ReceiptText,
} from "lucide-react";
import { Badge, EmptyState, PaymentIcon } from "../components/ui";
import { C } from "../constants/theme";
import { formatDateShort, formatRupiah } from "../utils/format";

export const TxTable = ({ rows, showRunning, hideActions, onView, onEdit, onDelete, emptyTitle }) => {
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
