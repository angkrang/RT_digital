import React, { useState, useMemo } from "react";
import {
  Search, CreditCard, Info,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState, Modal, TextInput } from "../components/ui";
import { PEMBAYARAN_PERIOD, RESIDENT_MAP } from "../constants/data";
import { C } from "../constants/theme";
import { PaymentStatusBadge, PembayaranForm } from "./PembayaranForm";
import { computeObligation, isArisanMember, paymentStatusOf } from "../utils/dues";
import { formatRupiah } from "../utils/format";

export const PembayaranWargaPage = ({ payments, settings, onRecordPayment }) => {
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
   JIMPITAN PAGE (Batch 3A)
   Memakai Master Data Rumah (Households) & Warga (Residents) dari Batch 2.
   Setoran "Sudah Setor" otomatis tercatat sebagai Pemasukan di Kas RT.
   ============================================================ */
