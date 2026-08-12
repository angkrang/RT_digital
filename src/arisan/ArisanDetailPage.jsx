import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Users2, Wallet, CheckCircle2, AlertTriangle, Trophy, Plus, UserMinus, Pencil,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState, Modal, Select } from "../components/ui";
import { C } from "../constants/theme";
import { formatDateShort, formatRupiah } from "../utils/format";
import {
  ARISAN_PAYMENT_STATUS_TONE, ARISAN_STATUS_TONE, currentArisanPeriod, generateArisanPeriods,
} from "./arisanUtils";
import { ArisanForm } from "./ArisanForm";
import { ArisanParticipantForm, ArisanPaymentForm, ArisanWinnerForm } from "./ArisanForms";

const MiniStat = ({ label, value, tone, icon: Icon }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold" style={{ color: C.textMuted }}>{label}</p>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: tone + "20", color: tone }}><Icon size={15} /></div>
    </div>
    <p className="rtd-display mt-3 truncate text-lg font-bold tabular-nums" style={{ color: C.text }}>{value}</p>
  </Card>
);

export const ArisanDetailPage = ({
  arisan, households, residents, participants, payments, winners,
  onBack, onUpdateArisan, onAddParticipant, onRemoveParticipant, onRecordPayment, onAddWinner,
}) => {
  const residentMap = useMemo(() => Object.fromEntries(residents.map((r) => [r.id, r])), [residents]);
  const householdMap = useMemo(() => Object.fromEntries(households.map((h) => [h.id, h])), [households]);

  const participantHouseholds = useMemo(
    () => participants
      .map((p) => householdMap[p.household_id])
      .filter(Boolean)
      .sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true })),
    [participants, householdMap]
  );
  const participantIds = useMemo(() => participants.map((p) => p.household_id), [participants]);

  const periods = useMemo(() => generateArisanPeriods(arisan), [arisan]);
  const [modal, setModal] = useState(null);
  const [paymentPeriod, setPaymentPeriod] = useState(currentArisanPeriod(arisan));
  const [histFilterPeriod, setHistFilterPeriod] = useState("");
  const [histFilterHousehold, setHistFilterHousehold] = useState("");
  const [histFilterStatus, setHistFilterStatus] = useState("");
  const [rekapYear, setRekapYear] = useState((currentArisanPeriod(arisan) || "2026").slice(0, 4));

  const paymentsThisPeriod = useMemo(
    () => participantHouseholds.map((h) => {
      const p = payments.find((pay) => pay.period === paymentPeriod && pay.household_id === h.id);
      const due = arisan.amount;
      const paid = p?.amount_paid || 0;
      return { household: h, due, paid, kurang: Math.max(0, due - paid), status: p?.status || "Belum" };
    }),
    [participantHouseholds, payments, paymentPeriod, arisan.amount]
  );

  const stats = useMemo(() => {
    const tagihan = participantHouseholds.length * arisan.amount;
    const sudah = paymentsThisPeriod.reduce((s, r) => s + r.paid, 0);
    const lastWinner = [...winners].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return {
      peserta: participantHouseholds.length,
      tagihan,
      sudah,
      belum: Math.max(0, tagihan - sudah),
      lastWinner: lastWinner ? householdMap[lastWinner.household_id] : null,
    };
  }, [participantHouseholds, arisan.amount, paymentsThisPeriod, winners, householdMap]);

  const filteredHistory = useMemo(() => {
    return [...payments]
      .filter((p) => (histFilterPeriod ? p.period === histFilterPeriod : true))
      .filter((p) => (histFilterHousehold ? p.household_id === histFilterHousehold : true))
      .filter((p) => (histFilterStatus ? p.status === histFilterStatus : true))
      .filter((p) => p.payment_date)
      .sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)));
  }, [payments, histFilterPeriod, histFilterHousehold, histFilterStatus]);

  const yearOptions = useMemo(() => {
    const set = new Set(periods.map((p) => p.value.slice(0, 4)));
    payments.forEach((p) => set.add(String(p.period).slice(0, 4)));
    return [...set].filter(Boolean).sort().reverse();
  }, [periods, payments]);

  const [rekapHousehold, setRekapHousehold] = useState("");
  const rekap = useMemo(() => {
    return participantHouseholds
      .filter((h) => (rekapHousehold ? h.id === rekapHousehold : true))
      .map((h) => {
        const rows = payments.filter((p) => p.household_id === h.id && (!rekapYear || String(p.period).startsWith(rekapYear)));
        const totalTagihan = rows.reduce((s, r) => s + (r.amount_due || 0), 0);
        const totalDibayar = rows.reduce((s, r) => s + (r.amount_paid || 0), 0);
        return {
          household: h, headName: residentMap[h.head_resident_id]?.name || "-",
          totalTagihan, totalDibayar, kekurangan: Math.max(0, totalTagihan - totalDibayar),
        };
      });
  }, [participantHouseholds, payments, rekapYear, rekapHousehold, residentMap]);

  const sortedWinners = useMemo(() => [...winners].sort((a, b) => String(b.date).localeCompare(String(a.date))), [winners]);

  const closeModal = () => setModal(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="rtd-focus flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.navy }}>
          <ArrowLeft size={15} /> Kembali ke Daftar Arisan
        </button>
        <Btn size="sm" variant="ghost" onClick={() => setModal({ type: "edit-arisan" })}><Pencil size={13} /> Ubah Arisan</Btn>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="rtd-display text-lg font-bold" style={{ color: C.text }}>{arisan.name}</h2>
              <Badge tone={ARISAN_STATUS_TONE[arisan.status] || "muted"}>{arisan.status}</Badge>
            </div>
            <p className="mt-1 text-xs" style={{ color: C.textMuted }}>
              Iuran {formatRupiah(arisan.amount)} / {arisan.frequency === "Mingguan" ? "minggu" : "bulan"} · {formatDateShort(arisan.start_date)}{arisan.end_date ? ` – ${formatDateShort(arisan.end_date)}` : " – berjalan"}
            </p>
            {arisan.notes && <p className="mt-1 text-xs" style={{ color: C.textFaint }}>{arisan.notes}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="PESERTA" value={`${stats.peserta} rumah`} tone={C.navy} icon={Users2} />
        <MiniStat label="TAGIHAN PERIODE" value={formatRupiah(stats.tagihan)} tone={C.navy} icon={Wallet} />
        <MiniStat label="SUDAH DIBAYAR" value={formatRupiah(stats.sudah)} tone={C.green} icon={CheckCircle2} />
        <MiniStat label="BELUM DIBAYAR" value={formatRupiah(stats.belum)} tone={C.red} icon={AlertTriangle} />
        <MiniStat label="PEMENANG TERAKHIR" value={stats.lastWinner ? `No. ${stats.lastWinner.house_number}` : "Belum ada"} tone={C.orange} icon={Trophy} />
      </div>

      {/* -- Peserta -- */}
      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Peserta</h3>
          <Btn size="sm" variant="subtle" onClick={() => setModal({ type: "add-participant" })}><Plus size={14} /> Tambah Peserta</Btn>
        </div>
        {participantHouseholds.length === 0 ? (
          <EmptyState icon={Users2} title="Belum ada peserta" subtitle="Tambahkan peserta dari Master Data Rumah." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  const h = householdMap[p.household_id];
                  return (
                    <tr key={p.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: C.text }}>No. {h?.house_number || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{residentMap[h?.head_resident_id]?.name || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge tone="green">{p.status}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Btn size="sm" variant="ghost" onClick={() => onRemoveParticipant(p)}><UserMinus size={13} /></Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* -- Pembayaran Periode Ini -- */}
      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Pembayaran Periode Ini</h3>
          <div className="flex items-center gap-2">
            <Select value={paymentPeriod} onChange={(e) => setPaymentPeriod(e.target.value)} className="!w-auto">
              {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
            <Btn size="sm" onClick={() => setModal({ type: "payment", period: paymentPeriod })}><Plus size={14} /> Bayar</Btn>
          </div>
        </div>
        {participantHouseholds.length === 0 ? (
          <EmptyState icon={Wallet} title="Belum ada peserta untuk ditagih" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th>
                  <th className="px-4 py-3 text-right">Tagihan</th><th className="px-4 py-3 text-right">Dibayar</th>
                  <th className="px-4 py-3 text-right">Kekurangan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paymentsThisPeriod.map((row) => (
                  <tr key={row.household.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: C.text }}>No. {row.household.house_number}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{residentMap[row.household.head_resident_id]?.name || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: C.text }}>{formatRupiah(row.due)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.green }}>{row.paid ? formatRupiah(row.paid) : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: row.kurang > 0 ? C.red : C.textFaint }}>{row.kurang ? formatRupiah(row.kurang) : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge tone={ARISAN_PAYMENT_STATUS_TONE[row.status] || "muted"}>{row.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.status !== "Lunas" && (
                        <Btn size="sm" variant="subtle" onClick={() => setModal({ type: "payment", period: paymentPeriod, householdId: row.household.id })}>Bayar</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* -- Pemenang -- */}
      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Pemenang</h3>
          <Btn size="sm" variant="subtle" onClick={() => setModal({ type: "winner" })} disabled={participantHouseholds.length === 0}><Plus size={14} /> Catat Pemenang</Btn>
        </div>
        {sortedWinners.length === 0 ? (
          <EmptyState icon={Trophy} title="Belum ada riwayat pemenang" />
        ) : (
          <div className="divide-y" style={{ borderColor: C.border }}>
            {sortedWinners.map((w) => {
              const h = householdMap[w.household_id];
              return (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.orangeSoft, color: C.orange }}><Trophy size={14} /></div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>No. {h?.house_number || "-"} — {residentMap[h?.head_resident_id]?.name || "-"}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{formatDateShort(w.date)} {w.notes ? `· ${w.notes}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: C.green }}>{formatRupiah(w.amount)}</span>
                    <Badge tone="navy">{periods.find((p) => p.value === w.period)?.label || w.period}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* -- Riwayat Pembayaran -- */}
      <Card className="p-0">
        <div className="border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Riwayat Pembayaran</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3" style={{ borderColor: C.border }}>
          <Select value={histFilterPeriod} onChange={(e) => setHistFilterPeriod(e.target.value)}>
            <option value="">Semua Periode</option>
            {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
          <Select value={histFilterHousehold} onChange={(e) => setHistFilterHousehold(e.target.value)}>
            <option value="">Semua Rumah</option>
            {participantHouseholds.map((h) => <option key={h.id} value={h.id}>No. {h.house_number}</option>)}
          </Select>
          <Select value={histFilterStatus} onChange={(e) => setHistFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Belum">Belum</option>
          </Select>
        </div>
        {filteredHistory.length === 0 ? (
          <EmptyState icon={Wallet} title="Tidak ada riwayat pembayaran" subtitle="Coba ubah filter, atau catat pembayaran baru." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Rumah</th>
                  <th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((p) => {
                  const h = householdMap[p.household_id];
                  return (
                    <tr key={p.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: C.text }}>{formatDateShort(p.payment_date)}</td>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{periods.find((pr) => pr.value === p.period)?.label || p.period}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: C.text }}>No. {h?.house_number || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.green }}>{formatRupiah(p.amount_paid)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge tone={ARISAN_PAYMENT_STATUS_TONE[p.status] || "muted"}>{p.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* -- Rekap -- */}
      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Rekap</h3>
          <div className="flex flex-wrap gap-2">
            <Select value={rekapYear} onChange={(e) => setRekapYear(e.target.value)} className="!w-auto">
              {yearOptions.length === 0 && <option value={rekapYear}>{rekapYear}</option>}
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select value={rekapHousehold} onChange={(e) => setRekapHousehold(e.target.value)} className="!w-auto">
              <option value="">Semua Rumah</option>
              {participantHouseholds.map((h) => <option key={h.id} value={h.id}>No. {h.house_number}</option>)}
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                <th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th><th className="px-4 py-3 text-right">Total Dibayar</th><th className="px-4 py-3 text-right">Kekurangan</th>
              </tr>
            </thead>
            <tbody>
              {rekap.map((r) => (
                <tr key={r.household.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: C.text }}>No. {r.household.house_number}</td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{r.headName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: C.text }}>{formatRupiah(r.totalTagihan)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.green }}>{formatRupiah(r.totalDibayar)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: r.kekurangan > 0 ? C.red : C.textFaint }}>{r.kekurangan ? formatRupiah(r.kekurangan) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal?.type === "edit-arisan" && (
        <Modal title="Ubah Arisan" onClose={closeModal}>
          <ArisanForm initial={arisan} onCancel={closeModal} onSubmit={async (payload) => { await onUpdateArisan({ id: arisan.id, ...payload }); closeModal(); }} />
        </Modal>
      )}

      {modal?.type === "add-participant" && (
        <Modal title="Tambah Peserta" subtitle="Pilih rumah dari Master Data Rumah" onClose={closeModal} width={480}>
          <ArisanParticipantForm
            households={households}
            residentMap={residentMap}
            excludeIds={participantIds}
            onCancel={closeModal}
            onSubmit={async (householdIds) => { await onAddParticipant(householdIds); closeModal(); }}
          />
        </Modal>
      )}

      {modal?.type === "payment" && (
        <Modal title="Catat Pembayaran" subtitle={arisan.name} onClose={closeModal}>
          <ArisanPaymentForm
            arisan={arisan}
            periods={periods}
            participantHouseholds={participantHouseholds}
            residentMap={residentMap}
            existingPayments={payments}
            defaultPeriod={modal.period}
            defaultHouseholdId={modal.householdId}
            onCancel={closeModal}
            onSubmit={async (payload) => { await onRecordPayment(payload); closeModal(); }}
          />
        </Modal>
      )}

      {modal?.type === "winner" && (
        <Modal title="Catat Pemenang" subtitle={arisan.name} onClose={closeModal}>
          <ArisanWinnerForm
            arisan={arisan}
            periods={periods}
            participantHouseholds={participantHouseholds}
            residentMap={residentMap}
            onCancel={closeModal}
            onSubmit={async (payload) => { await onAddWinner(payload); closeModal(); }}
          />
        </Modal>
      )}
    </div>
  );
};
