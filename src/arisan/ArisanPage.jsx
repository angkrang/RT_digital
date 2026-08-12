import React, { useMemo } from "react";
import {
  Info, Shuffle, Trophy,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState } from "../components/ui";
import { ARISAN_MEMBER_IDS, ARISAN_PERIOD, RESIDENT_MAP } from "../constants/data";
import { C } from "../constants/theme";
import { computeObligation } from "../utils/dues";
import { formatRupiah } from "../utils/format";

export const ArisanPage = ({ arisan, payments, settings, onDraw, goToPembayaran, readOnly }) => {
  const members = ARISAN_MEMBER_IDS.map((id) => RESIDENT_MAP[id]);
  const paymentByResident = useMemo(() => Object.fromEntries(payments.map((p) => [p.resident_id, p])), [payments]);
  const sudahSetor = (id) => {
    const p = paymentByResident[id];
    const ob = computeObligation(id, settings);
    return !!p && p.paid_amount >= ob.total;
  };
  const sudahCount = ARISAN_MEMBER_IDS.filter(sudahSetor).length;
  const terkumpul = sudahCount * settings.arisanAmount;
  const winnerIds = new Set(arisan.riwayat.map((r) => r.winner_id));
  const eligible = ARISAN_MEMBER_IDS.filter((id) => sudahSetor(id) && !winnerIds.has(id));
  const thisMonthWinner = arisan.riwayat.find((r) => r.period === ARISAN_PERIOD);

  return (
    <div className="space-y-5">
      {!readOnly && (
        <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <span>Setoran arisan &amp; dana sosial kini dicatat lewat menu <button onClick={goToPembayaran} className="font-semibold underline">Pembayaran Warga</button>. Halaman ini menampilkan status setoran dan pengundian pemenang.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>PESERTA ARISAN</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.text }}>{members.length} warga</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>SUDAH SETOR</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.green }}>{sudahCount} / {members.length}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold" style={{ color: C.textMuted }}>TERKUMPUL PERIODE INI</p><p className="rtd-display mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.navy }}>{formatRupiah(terkumpul)}</p></Card>
        <Card className="p-4" style={{ background: thisMonthWinner ? C.greenSoft : C.orangeSoft, border: "none" }}>
          <p className="text-xs font-semibold" style={{ color: thisMonthWinner ? C.green : C.orange }}>PEMENANG {ARISAN_PERIOD}</p>
          <p className="rtd-display mt-1.5 truncate text-sm font-bold" style={{ color: thisMonthWinner ? C.green : C.orange }}>
            {thisMonthWinner ? RESIDENT_MAP[thisMonthWinner.winner_id].name : "Belum diundi"}
          </p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <div>
            <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Peserta &amp; Setoran — Periode {ARISAN_PERIOD}</h3>
            <p className="text-xs" style={{ color: C.textMuted }}>Total kewajiban bulanan {formatRupiah(settings.arisanAmount + settings.sosialWajibAmount)} / warga (Arisan {formatRupiah(settings.arisanAmount)} + Dana Sosial {formatRupiah(settings.sosialWajibAmount)})</p>
          </div>
          {!readOnly && (
            <Btn size="sm" variant="subtle" onClick={onDraw} disabled={!!thisMonthWinner || eligible.length === 0}>
              <Shuffle size={14} /> Undi Pemenang
            </Btn>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Status Setoran</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const sudah = sudahSetor(m.id);
                const isWinner = thisMonthWinner?.winner_id === m.id;
                return (
                  <tr key={m.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>
                      {m.name} {isWinner && <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.orange }}><Trophy size={12} /> Pemenang</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{m.house}</td>
                    <td className="whitespace-nowrap px-4 py-3">{sudah ? <Badge tone="green">🟢 Sudah Setor</Badge> : <Badge tone="red">🔴 Belum Setor</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Riwayat Pemenang</h3>
        </div>
        {arisan.riwayat.length === 0 ? <EmptyState icon={Trophy} title="Belum ada riwayat pemenang" /> : (
          <div className="divide-y" style={{ borderColor: C.border }}>
            {[...arisan.riwayat].reverse().map((r) => (
              <div key={r.period} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.orangeSoft, color: C.orange }}><Trophy size={14} /></div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{RESIDENT_MAP[r.winner_id].name}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>{RESIDENT_MAP[r.winner_id].house}</p>
                  </div>
                </div>
                <Badge tone="navy">Periode {r.period}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ============================================================
   PHASE 2 — MASTER DATA WARGA + RUMAH + IURAN TERINTEGRASI
   ============================================================ */
