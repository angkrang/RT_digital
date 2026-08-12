import React, { useState, useMemo } from "react";
import {
  Search, AlertTriangle,
} from "lucide-react";
import { Btn, CurrencyInput, Field, Select, TextArea, TextInput } from "../components/ui";
import { JIMPITAN_PETUGAS, JIMPITAN_STATUS_OPTIONS } from "../constants/data";
import { C } from "../constants/theme";

export const jimpitanHouseholdLabel = (household, residentMap) => {
  if (!household) return "-";
  const head = residentMap[household.head_resident_id];
  return `${household.house_number} — ${head?.name || "-"}`;
};

/* -- Dropdown + search sederhana untuk memilih Rumah dari Master Data -- */

export const HouseholdPickerField = ({ households, residentMap, value, onChange }) => {
  const [search, setSearch] = useState("");
  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return households
      .filter((h) => {
        if (!q) return true;
        const head = residentMap[h.head_resident_id];
        return String(h.house_number).toLowerCase().includes(q) || String(head?.name || "").toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true }));
  }, [households, residentMap, search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor rumah / nama kepala keluarga..." className="pl-8" />
      </div>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.length === 0 && <option value="">Rumah tidak ditemukan</option>}
        {options.map((h) => (
          <option key={h.id} value={h.id}>{jimpitanHouseholdLabel(h, residentMap)}</option>
        ))}
      </Select>
    </div>
  );
};

export const JimpitanForm = ({ households, residentMap, initial, onCancel, onSubmit }) => {
  const isEdit = !!initial;
  const [date, setDate] = useState(initial?.date || "2026-08-11");
  const [householdId, setHouseholdId] = useState(initial?.household_id || households[0]?.id || "");
  const [status, setStatus] = useState(initial?.status || "Sudah Setor");
  const [amount, setAmount] = useState(initial?.amount || 5000);
  const [collector, setCollector] = useState(initial?.collector || JIMPITAN_PETUGAS[0]);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dupWarning, setDupWarning] = useState("");

  const runSubmit = async (force) => {
    setError("");
    if (!householdId) { setError("Rumah wajib dipilih."); return; }
    if (status === "Sudah Setor" && (!amount || amount <= 0)) {
      setError("Nominal harus lebih dari 0 untuk status Sudah Setor.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(
        { date, household_id: householdId, status, amount: status === "Sudah Setor" ? amount : 0, collector, notes },
        force
      );
      setDupWarning("");
    } catch (err) {
      const msg = err?.message || "Gagal menyimpan.";
      if (msg.startsWith("DUPLICATE:")) {
        setDupWarning(msg.replace("DUPLICATE:", "").trim());
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => { e.preventDefault(); runSubmit(false); };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Rumah" required error={!householdId ? error : ""}>
        {isEdit ? (
          <Select value={householdId} disabled>
            <option value={householdId}>{jimpitanHouseholdLabel(households.find((h) => h.id === householdId), residentMap)}</option>
          </Select>
        ) : (
          <HouseholdPickerField households={households} residentMap={residentMap} value={householdId} onChange={setHouseholdId} />
        )}
      </Field>
      <Field label="Status" required>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {JIMPITAN_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field
        label="Nominal"
        required={status === "Sudah Setor"}
        hint={status !== "Sudah Setor" ? "Tidak perlu diisi untuk status ini." : ""}
        error={status === "Sudah Setor" ? error : ""}
      >
        <CurrencyInput value={amount} onChange={setAmount} error={status === "Sudah Setor" && !!error} disabled={status !== "Sudah Setor"} />
      </Field>
      <Field label="Petugas" required>
        <TextInput list="jimpitan-petugas-options" value={collector} onChange={(e) => setCollector(e.target.value)} placeholder="Nama petugas" />
        <datalist id="jimpitan-petugas-options">
          {JIMPITAN_PETUGAS.map((p) => <option key={p} value={p} />)}
        </datalist>
      </Field>
      <Field label="Catatan" hint="Opsional">
        <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)" />
      </Field>

      {dupWarning ? (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.orangeSoft, color: C.orange }}>
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{dupWarning}</p>
            <p className="mt-1">Tetap simpan sebagai pencatatan baru untuk rumah &amp; tanggal yang sama?</p>
            <div className="mt-2 flex gap-2">
              <Btn type="button" size="sm" variant="subtle" onClick={() => runSubmit(true)} disabled={busy}>Tetap Simpan</Btn>
              <Btn type="button" size="sm" variant="ghost" onClick={() => setDupWarning("")}>Batal</Btn>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
          <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Btn>
        </div>
      )}
    </form>
  );
};
