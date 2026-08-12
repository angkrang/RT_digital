import React, { useMemo, useState } from "react";
import { Gift, Plus } from "lucide-react";
import {
  Badge, Btn, Card, EmptyState, Modal,
} from "../components/ui";
import { C } from "../constants/theme";
import { formatRupiah } from "../utils/format";
import { ArisanDetailPage } from "./ArisanDetailPage";
import { ArisanForm } from "./ArisanForm";
import { ARISAN_STATUS_TONE, arisanPeriodRangeLabel } from "./arisanUtils";

/* -- Batch 3B: Modul Arisan — halaman daftar arisan + navigasi ke detail.
   Peserta selalu berasal dari Master Data Rumah (households), pemenang
   hanya dicatat manual (tidak ada undian otomatis di sini). -- */
export const ArisanModule = ({
  households, residents, arisanGroups, arisanParticipants, arisanPayments, arisanWinners,
  onAddArisan, onUpdateArisan, onAddArisanParticipant, onRemoveArisanParticipant,
  onRecordArisanPayment, onAddArisanWinner,
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const participantCountByArisan = useMemo(() => {
    const map = {};
    arisanParticipants.forEach((p) => { map[p.arisan_id] = (map[p.arisan_id] || 0) + 1; });
    return map;
  }, [arisanParticipants]);

  const selected = arisanGroups.find((a) => a.id === selectedId) || null;

  if (selected) {
    const participants = arisanParticipants.filter((p) => p.arisan_id === selected.id);
    const payments = arisanPayments.filter((p) => p.arisan_id === selected.id);
    const winners = arisanWinners.filter((w) => w.arisan_id === selected.id);
    return (
      <ArisanDetailPage
        arisan={selected}
        households={households}
        residents={residents}
        participants={participants}
        payments={payments}
        winners={winners}
        onBack={() => setSelectedId(null)}
        onUpdateArisan={onUpdateArisan}
        onAddParticipant={(householdIds) => onAddArisanParticipant(selected.id, householdIds)}
        onRemoveParticipant={onRemoveArisanParticipant}
        onRecordPayment={onRecordArisanPayment}
        onAddWinner={onAddArisanWinner}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="rtd-display text-lg font-bold" style={{ color: C.text }}>Arisan</h2>
          <p className="text-xs" style={{ color: C.textMuted }}>Kelola peserta, pembayaran, periode, dan pemenang arisan warga.</p>
        </div>
        <Btn onClick={() => setShowCreate(true)}><Plus size={15} /> Buat Arisan</Btn>
      </div>

      {arisanGroups.length === 0 ? (
        <EmptyState icon={Gift} title="Belum ada arisan" subtitle="Buat arisan baru untuk mulai mengelola peserta dan pembayaran." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {arisanGroups.map((a) => (
            <Card key={a.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>{a.name}</h3>
                <Badge tone={ARISAN_STATUS_TONE[a.status] || "muted"}>{a.status}</Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: C.textMuted }}>Iuran</span>
                  <span className="font-semibold tabular-nums" style={{ color: C.text }}>{formatRupiah(a.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.textMuted }}>Peserta</span>
                  <span className="font-semibold" style={{ color: C.text }}>{participantCountByArisan[a.id] || 0} rumah</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.textMuted }}>Periode</span>
                  <span className="font-semibold" style={{ color: C.text }}>{arisanPeriodRangeLabel(a)}</span>
                </div>
              </div>
              <Btn size="sm" variant="subtle" className="mt-4 self-start" onClick={() => setSelectedId(a.id)}>Lihat Detail</Btn>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Buat Arisan" onClose={() => setShowCreate(false)}>
          <ArisanForm
            onCancel={() => setShowCreate(false)}
            onSubmit={async (payload) => {
              const saved = await onAddArisan(payload);
              setShowCreate(false);
              if (saved?.id) setSelectedId(saved.id);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
