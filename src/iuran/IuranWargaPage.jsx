import React, { useState, useMemo } from "react";
import {
  Settings, Search, CheckCircle2, AlertTriangle, Info, FileText,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState, Field, Modal, Select, TextInput } from "../components/ui";
import { DUES_STATUS_LABEL, DUES_STATUS_TONE } from "../constants/data";
import { C } from "../constants/theme";
import { StatCard } from "../dashboard/Dashboard";
import { DuesTypesForm } from "./DuesTypesForm";
import { GenerateDuesForm } from "./GenerateDuesForm";
import { RecordDuesPaymentForm } from "./RecordDuesPaymentForm";
import { formatPeriodLabel, formatRupiah } from "../utils/format";

export const IuranWargaPage = ({ households, residents, duesTypes, dues, onGenerateDues, onRecordPayment, onSaveDuesTypes, userRole }) => {
  const periods = useMemo(() => {
    const set = new Set(dues.map((d) => d.period));
    set.add("2026-08");
    return [...set].sort().reverse();
  }, [dues]);
  const [period, setPeriod] = useState(periods[0] || "2026-08");
  const [duesTypeFilter, setDuesTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const householdMap = useMemo(() => Object.fromEntries(households.map((h) => [h.id, h])), [households]);
  const residentMap = useMemo(() => Object.fromEntries(residents.map((r) => [r.id, r])), [residents]);
  const duesTypeMap = useMemo(() => Object.fromEntries(duesTypes.map((d) => [d.id, d])), [duesTypes]);

  const periodDues = useMemo(() => dues.filter((d) => d.period === period), [dues, period]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodDues.filter((d) => {
      if (duesTypeFilter && d.dues_type_id !== duesTypeFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (!q) return true;
      const house = householdMap[d.household_id];
      const head = house ? residentMap[house.head_resident_id] : null;
      return String(house?.house_number || "").toLowerCase().includes(q) || String(head?.name || "").toLowerCase().includes(q);
    });
  }, [periodDues, duesTypeFilter, statusFilter, search, householdMap, residentMap]);

  const totals = useMemo(() => {
    const totalTagihan = filtered.reduce((s, d) => s + Number(d.amount), 0);
    const totalDibayar = filtered.reduce((s, d) => s + Number(d.paid_amount), 0);
    return { totalTagihan, totalDibayar, belum: totalTagihan - totalDibayar, persen: totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 100) : 0 };
  }, [filtered]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const ha = householdMap[a.household_id]?.house_number || "";
    const hb = householdMap[b.household_id]?.house_number || "";
    return String(ha).localeCompare(String(hb), "id", { numeric: true });
  }), [filtered, householdMap]);

  return (
    <div className="space-y-5">
      <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>Tagihan iuran dibuat per rumah dari Data Rumah &amp; Data Warga. Setiap pembayaran otomatis tercatat sebagai transaksi pemasukan di Kas RT.</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Field label="Periode">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="!w-40">
            {periods.map((p) => <option key={p} value={p}>{formatPeriodLabel(p)}</option>)}
          </Select>
        </Field>
        <div className="ml-auto flex flex-wrap gap-2 self-end">
          {userRole !== "Bendahara" && (
            <Btn size="sm" variant="ghost" onClick={() => setModal({ type: "duesTypes" })}><Settings size={13} /> Kelola Jenis Iuran</Btn>
          )}
          <Btn size="sm" variant="subtle" onClick={() => setModal({ type: "generate" })}><FileText size={13} /> Generate Iuran Bulanan</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="TOTAL TAGIHAN" value={totals.totalTagihan} tone={C.navy} icon={FileText} />
        <StatCard label="SUDAH DIBAYAR" value={totals.totalDibayar} tone={C.green} icon={CheckCircle2} />
        <StatCard label="BELUM DIBAYAR" value={totals.belum} tone={C.red} icon={AlertTriangle} />
        <Card className="p-4">
          <p className="text-xs font-semibold" style={{ color: C.textMuted }}>PERSENTASE PEMBAYARAN</p>
          <p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{totals.persen}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: C.border }}>
            <div className="h-1.5 rounded-full" style={{ width: `${totals.persen}%`, background: C.navy }} />
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-4" style={{ borderColor: C.border }}>
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari rumah / kepala keluarga..." className="pl-9" />
          </div>
          <Select value={duesTypeFilter} onChange={(e) => setDuesTypeFilter(e.target.value)}>
            <option value="">Semua Jenis Iuran</option>
            {duesTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="sebagian">Sebagian</option>
            <option value="belum">Belum Bayar</option>
          </Select>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada tagihan pada periode ini" subtitle="Klik Generate Iuran Bulanan untuk membuat tagihan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th><th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3 text-right">Tagihan</th><th className="px-4 py-3 text-right">Dibayar</th>
                  <th className="px-4 py-3 text-right">Kekurangan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => {
                  const house = householdMap[d.household_id];
                  const head = house ? residentMap[house.head_resident_id] : null;
                  const kurang = Number(d.amount) - Number(d.paid_amount);
                  return (
                    <tr key={d.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                      <td className="px-4 py-3 font-medium" style={{ color: C.text }}>No. {house?.house_number || "-"}</td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>{head?.name || "-"}</td>
                      <td className="px-4 py-3"><Badge tone="muted">{duesTypeMap[d.dues_type_id]?.name || "-"}</Badge></td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.text }}>{formatRupiah(d.amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.green }}>{formatRupiah(d.paid_amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: kurang > 0 ? C.red : C.textFaint }}>{kurang > 0 ? formatRupiah(kurang) : "Rp0"}</td>
                      <td className="px-4 py-3"><Badge tone={DUES_STATUS_TONE[d.status] || "muted"}>{DUES_STATUS_LABEL[d.status] || d.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Btn size="sm" variant="subtle" disabled={d.status === "lunas"} onClick={() => setModal({ type: "pay", due: d })}>Bayar</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal?.type === "generate" && (
        <Modal title="Generate Iuran Bulanan" subtitle="Buat tagihan untuk seluruh rumah aktif" onClose={() => setModal(null)} width={440}>
          <GenerateDuesForm duesTypes={duesTypes} onCancel={() => setModal(null)} onSubmit={onGenerateDues} />
        </Modal>
      )}

      {modal?.type === "duesTypes" && (
        <Modal title="Kelola Jenis Iuran" subtitle="Admin dapat menentukan nominal setiap jenis iuran" onClose={() => setModal(null)} width={520}>
          <DuesTypesForm duesTypes={duesTypes} onCancel={() => setModal(null)} onSubmit={async (rows) => { await onSaveDuesTypes(rows); setModal(null); }} />
        </Modal>
      )}

      {modal?.type === "pay" && (() => {
        const house = householdMap[modal.due.household_id];
        const head = house ? residentMap[house.head_resident_id] : null;
        return (
          <Modal title="Catat Pembayaran Iuran" subtitle="Tagihan, pembayaran &amp; kas RT tercatat sekaligus" onClose={() => setModal(null)} width={480}>
            <RecordDuesPaymentForm
              due={modal.due}
              household={house}
              headName={head?.name || "-"}
              duesTypeName={duesTypeMap[modal.due.dues_type_id]?.name || "-"}
              onCancel={() => setModal(null)}
              onSubmit={onRecordPayment}
            />
          </Modal>
        );
      })()}
    </div>
  );
};

/* ============================================================
   DANA SOSIAL PAGE
   ============================================================ */
