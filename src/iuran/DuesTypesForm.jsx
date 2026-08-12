import React, { useState } from "react";
import { Btn, CurrencyInput, Field, TextInput } from "../components/ui";
import { C } from "../constants/theme";

export const DuesTypesForm = ({ duesTypes, onCancel, onSubmit }) => {
  const [rows, setRows] = useState(duesTypes.map((d) => ({ ...d })));
  const [busy, setBusy] = useState(false);
  const setRow = (i, k, v) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSubmit(rows); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs" style={{ color: C.textMuted }}>Admin dapat menentukan nominal setiap jenis iuran. Tidak semua jenis wajib dipakai — nonaktifkan jika tidak digunakan.</p>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.id || i} className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Jenis Iuran">
                <TextInput value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} />
              </Field>
            </div>
            <div className="w-36">
              <Field label="Nominal / bulan">
                <CurrencyInput value={r.amount} onChange={(v) => setRow(i, "amount", v)} />
              </Field>
            </div>
            <label className="mb-2.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.textMuted }}>
              <input type="checkbox" checked={r.active !== false} onChange={(e) => setRow(i, "active", e.target.checked)} /> Aktif
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Jenis Iuran"}</Btn>
      </div>
    </form>
  );
};

/* -- Generate Tagihan Bulanan -- */
