import React, { useState } from "react";
import { Btn, CurrencyInput, Field, Select, TextInput } from "../components/ui";
import { PAYMENT_METHODS } from "../constants/data";
import { C } from "../constants/theme";
import { formatPeriodLabel, formatRupiah } from "../utils/format";

export const RecordDuesPaymentForm = ({ due, household, headName, duesTypeName, onCancel, onSubmit }) => {
  const sisa = Math.max(0, Number(due.amount) - Number(due.paid_amount));
  const [amount, setAmount] = useState(sisa);
  const [date, setDate] = useState("2026-08-11");
  const [method, setMethod] = useState("Tunai");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (amount <= 0) { setError("Nominal pembayaran harus lebih dari 0."); return; }
    if (amount > sisa) { setError(`Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(sisa)}).`); return; }
    setBusy(true); setError("");
    try {
      await onSubmit({ dues_id: due.id, amount, date, method });
      onCancel();
    } catch (err) {
      setError(err.message || "Gagal menyimpan pembayaran.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-lg p-3 text-sm" style={{ background: C.navyFaint }}>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Rumah</p><p className="font-semibold" style={{ color: C.text }}>No. {household?.house_number}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Kepala Keluarga</p><p className="font-semibold" style={{ color: C.text }}>{headName}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Jenis Iuran</p><p className="font-semibold" style={{ color: C.text }}>{duesTypeName} — {formatPeriodLabel(due.period)}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Tagihan</p><p className="font-semibold tabular-nums" style={{ color: C.text }}>{formatRupiah(due.amount)}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Sudah Dibayar</p><p className="font-semibold tabular-nums" style={{ color: C.green }}>{formatRupiah(due.paid_amount)}</p></div>
        <div><p className="text-xs" style={{ color: C.textMuted }}>Sisa</p><p className="font-semibold tabular-nums" style={{ color: C.orange }}>{formatRupiah(sisa)}</p></div>
      </div>
      <Field label="Pembayaran" required error={error}>
        <CurrencyInput value={amount} onChange={setAmount} error={!!error} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Metode" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Pembayaran"}</Btn>
      </div>
    </form>
  );
};

/* -- IURAN WARGA PAGE (master rumah/warga + tagihan generate + bayar, terintegrasi Kas) -- */
