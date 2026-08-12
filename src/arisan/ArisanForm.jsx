import React, { useState } from "react";
import { Btn, CurrencyInput, Field, Select, TextArea, TextInput } from "../components/ui";
import { C } from "../constants/theme";
import { ARISAN_FREQUENCY_OPTIONS, ARISAN_STATUS_OPTIONS, ARISAN_TODAY_STR } from "./arisanUtils";

export const ArisanForm = ({ initial, onCancel, onSubmit }) => {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [amount, setAmount] = useState(initial?.amount || 50000);
  const [frequency, setFrequency] = useState(initial?.frequency || "Bulanan");
  const [startDate, setStartDate] = useState(initial?.start_date || ARISAN_TODAY_STR);
  const [endDate, setEndDate] = useState(initial?.end_date || "");
  const [status, setStatus] = useState(initial?.status || "Aktif");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Nama arisan wajib diisi."); return; }
    if (!amount || amount <= 0) { setError("Nominal iuran harus lebih dari 0."); return; }
    if (!startDate) { setError("Tanggal mulai wajib diisi."); return; }
    if (endDate && endDate < startDate) { setError("Tanggal selesai tidak boleh sebelum tanggal mulai."); return; }
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(), amount, frequency, start_date: startDate,
        end_date: endDate || "", status, notes,
      });
    } catch (err) {
      setError(err?.message || "Gagal menyimpan arisan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nama Arisan" required error={error && !name.trim() ? error : ""}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Arisan Warga 2026" />
      </Field>
      <Field label="Nominal Iuran" required error={error && (!amount || amount <= 0) ? error : ""}>
        <CurrencyInput value={amount} onChange={setAmount} />
      </Field>
      <Field label="Frekuensi" required>
        <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          {ARISAN_FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal Mulai" required>
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Tanggal Selesai" hint="Opsional">
          <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Status" required>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {ARISAN_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Catatan" hint="Opsional">
        <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)" />
      </Field>

      {error && amount > 0 && name.trim() && startDate && (
        <p className="text-xs font-medium" style={{ color: C.red }}>{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan"}</Btn>
      </div>
    </form>
  );
};
