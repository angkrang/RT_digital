import React from "react";
import {
  Pencil, Trash2, Paperclip, FileText, ExternalLink,
} from "lucide-react";
import { Badge, Btn, PaymentIcon } from "../components/ui";
import { C } from "../constants/theme";
import { formatDateLong, formatPeriodLabel, formatRupiah } from "../utils/format";

export const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="text-xs font-medium" style={{ color: C.textMuted }}>{label}</span>
    <span className="text-right text-sm font-semibold" style={{ color: C.text }}>{children}</span>
  </div>
);

export const TransactionDetail = ({ tx, onEdit, onDelete, onClose, households, residents, duesTypes, dues, onViewIuranDetail }) => {
  const iuranMatch = /^iuran_dues_id:(.+)$/.exec(String(tx.notes || "").trim());
  let iuranInfo = null;
  if (iuranMatch && dues) {
    const due = dues.find((d) => String(d.id) === iuranMatch[1]);
    if (due) {
      const house = (households || []).find((h) => h.id === due.household_id);
      const head = house ? (residents || []).find((r) => r.id === house.head_resident_id) : null;
      const duesType = (duesTypes || []).find((d) => d.id === due.dues_type_id);
      iuranInfo = {
        houseLabel: house ? `No. ${house.house_number}` : "-",
        headName: head ? head.name : "-",
        period: due.period,
        duesTypeName: duesType ? duesType.name : "-",
      };
    }
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl p-4" style={{ background: tx.type === "masuk" ? C.greenSoft : C.redSoft }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: C.textMuted }}>{tx.transaction_code}</p>
          <p className="rtd-display mt-1 text-xl font-bold tabular-nums" style={{ color: tx.type === "masuk" ? C.green : C.red }}>
            {tx.type === "masuk" ? "+" : "-"}{formatRupiah(tx.amount)}
          </p>
        </div>
        <Badge tone={tx.type === "masuk" ? "green" : "red"}>{tx.type === "masuk" ? "Pemasukan" : "Pengeluaran"}</Badge>
      </div>
      <div className="divide-y" style={{ borderColor: C.border }}>
        <DetailRow label="Tanggal">{formatDateLong(tx.transaction_date)}</DetailRow>
        <DetailRow label="Kategori">{tx.category}</DetailRow>
        <DetailRow label="Keterangan">{tx.description}</DetailRow>
        <DetailRow label={tx.type === "masuk" ? "Sumber" : "Penerima"}>{tx.source}</DetailRow>
        <DetailRow label="Metode"><span className="inline-flex items-center gap-1.5"><PaymentIcon method={tx.payment_method} />{tx.payment_method}</span></DetailRow>
        <DetailRow label="Bukti">{tx.attachment ? <span className="inline-flex items-center gap-1" style={{ color: C.navy }}><Paperclip size={13} />{tx.attachment}</span> : "—"}</DetailRow>
        <DetailRow label="Catatan">{iuranInfo ? "—" : (tx.notes || "—")}</DetailRow>
        <DetailRow label="Dicatat oleh">{tx.created_by}</DetailRow>
      </div>
      {iuranInfo && (
        <div className="mt-4 rounded-lg p-3.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
          <p className="mb-2 flex items-center gap-1.5 font-bold"><FileText size={13} /> Sumber: Iuran Warga</p>
          <div className="grid grid-cols-3 gap-2">
            <div><p className="opacity-70">Warga</p><p className="font-semibold">{iuranInfo.headName}</p></div>
            <div><p className="opacity-70">Rumah</p><p className="font-semibold">{iuranInfo.houseLabel}</p></div>
            <div><p className="opacity-70">Periode</p><p className="font-semibold">{formatPeriodLabel(iuranInfo.period)}</p></div>
          </div>
          {onViewIuranDetail && (
            <button onClick={onViewIuranDetail} className="rtd-focus mt-2.5 flex items-center gap-1 font-semibold underline">
              <ExternalLink size={12} /> Lihat Detail Iuran
            </button>
          )}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="danger" size="sm" onClick={() => onDelete(tx)}><Trash2 size={13} /> Hapus</Btn>
        <Btn variant="ghost" size="sm" onClick={() => onEdit(tx)}><Pencil size={13} /> Edit</Btn>
        <Btn variant="subtle" size="sm" onClick={onClose}>Tutup</Btn>
      </div>
    </div>
  );
};

/* ============================================================
   TRANSACTION TABLE (shared by Kas RT / Pemasukan / Pengeluaran)
   ============================================================ */
