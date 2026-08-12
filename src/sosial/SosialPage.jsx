import React, { useState, useMemo } from "react";
import {
  HeartHandshake, Plus,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState, Modal } from "../components/ui";
import { C } from "../constants/theme";
import { SosialForm } from "./SosialForm";
import { formatDateShort, formatRupiah } from "../utils/format";

export const SosialPage = ({ transactions, onAddSosial }) => {
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
