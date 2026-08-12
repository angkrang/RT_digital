import React, { useState } from "react";
import { Btn, Field, Select, TextInput } from "../components/ui";
import { C } from "../constants/theme";
import { formatPeriodLabel, formatRupiah } from "../utils/format";

export const GenerateDuesForm = ({ duesTypes, onCancel, onSubmit }) => {
  const [period, setPeriod] = useState("2026-08");
  const [duesTypeId, setDuesTypeId] = useState(duesTypes.find((d) => d.active !== false)?.id || duesTypes[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await onSubmit({ period, dues_type_id: duesTypeId });
      setResult(res);
    } catch (err) {
      setError(err.message || "Gagal membuat tagihan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Bulan" required>
        <TextInput type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </Field>
      <Field label="Jenis Iuran" required>
        <Select value={duesTypeId} onChange={(e) => setDuesTypeId(e.target.value)}>
          {duesTypes.map((d) => <option key={d.id} value={d.id}>{d.name} — {formatRupiah(d.amount)}</option>)}
        </Select>
      </Field>
      {error && <p className="text-xs font-medium" style={{ color: C.red }}>{error}</p>}
      {result && (
        <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: C.greenSoft, color: C.green }}>
          {result.created} tagihan baru dibuat untuk periode {formatPeriodLabel(period)}
          {result.skipped > 0 ? `, ${result.skipped} rumah dilewati karena tagihan periode ini sudah pernah dibuat.` : "."}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Tutup</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Membuat..." : "Generate Iuran Bulanan"}</Btn>
      </div>
    </form>
  );
};

/* -- Catat Pembayaran Iuran -- */
