import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Btn, Field, Select, TextArea, TextInput,
} from "../components/ui";
import { C } from "../constants/theme";
import { formatRupiah } from "../utils/format";
import { ARISAN_TODAY_STR } from "./arisanUtils";

/* -- Tambah Peserta — WAJIB pilih dari Master Data Rumah, tidak ada
   input nama warga secara manual. -- */
export const ArisanParticipantForm = ({ households, residentMap, excludeIds, onCancel, onSubmit }) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const available = useMemo(
    () => households
      .filter((h) => !excludeIds.includes(h.id))
      .filter((h) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const headName = residentMap[h.head_resident_id]?.name || "";
        return String(h.house_number).toLowerCase().includes(q) || headName.toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true })),
    [households, excludeIds, query, residentMap]
  );

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (selected.length === 0) { setError("Pilih minimal satu rumah."); return; }
    setBusy(true);
    try {
      await onSubmit(selected);
    } catch (err) {
      setError(err?.message || "Gagal menambahkan peserta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nomor rumah atau nama kepala keluarga..."
          className="!pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border" style={{ borderColor: C.border }}>
        {available.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs" style={{ color: C.textMuted }}>Tidak ada rumah yang tersedia.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: C.border }}>
            {available.map((h) => {
              const checked = selected.includes(h.id);
              return (
                <label key={h.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                  <input type="checkbox" checked={checked} onChange={() => toggle(h.id)} className="h-4 w-4 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: C.text }}>No. {h.house_number}</p>
                    <p className="truncate text-xs" style={{ color: C.textMuted }}>{residentMap[h.head_resident_id]?.name || "-"}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium" style={{ color: C.red }}>{error}</p>}
      <p className="text-xs" style={{ color: C.textMuted }}>{selected.length} rumah dipilih</p>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Tambah Peserta"}</Btn>
      </div>
    </form>
  );
};

/* -- Catat Pembayaran — mendukung pembayaran sebagian, status dihitung
   otomatis oleh backend berdasarkan total dibayar vs tagihan. -- */
export const ArisanPaymentForm = ({
  arisan, periods, participantHouseholds, residentMap, existingPayments,
  defaultPeriod, defaultHouseholdId, onCancel, onSubmit,
}) => {
  const [period, setPeriod] = useState(defaultPeriod || periods[0]?.value || "");
  const [householdId, setHouseholdId] = useState(defaultHouseholdId || participantHouseholds[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(ARISAN_TODAY_STR);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const household = participantHouseholds.find((h) => h.id === householdId);
  const existing = existingPayments.find((p) => p.period === period && p.household_id === householdId);
  const due = arisan.amount;
  const alreadyPaid = existing?.amount_paid || 0;
  const remaining = Math.max(0, due - alreadyPaid);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const amt = Number(amount);
    if (!period) { setError("Periode wajib dipilih."); return; }
    if (!householdId) { setError("Rumah wajib dipilih."); return; }
    if (!amt || amt <= 0) { setError("Nominal pembayaran harus lebih dari 0."); return; }
    setBusy(true);
    try {
      await onSubmit({
        arisan_id: arisan.id, period, household_id: householdId, amount: amt, date, notes,
      });
    } catch (err) {
      setError(err?.message || "Gagal menyimpan pembayaran.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Arisan"><TextInput value={arisan.name} disabled /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Periode" required>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        </Field>
        <Field label="Rumah" required>
          <Select value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
            {participantHouseholds.map((h) => (
              <option key={h.id} value={h.id}>No. {h.house_number} — {residentMap[h.head_resident_id]?.name || "-"}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <div><p className="font-semibold">Tagihan</p><p className="mt-0.5">{formatRupiah(due)}</p></div>
        <div><p className="font-semibold">Sudah Dibayar</p><p className="mt-0.5">{formatRupiah(alreadyPaid)} (kurang {formatRupiah(remaining)})</p></div>
      </div>

      <Field label="Pembayaran" required error={error && (!amount || Number(amount) <= 0) ? error : ""}>
        <TextInput
          type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder={`Contoh: ${remaining || due}`}
        />
      </Field>
      <Field label="Tanggal" required>
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Catatan" hint="Opsional">
        <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {error && amount && Number(amount) > 0 && (
        <p className="text-xs font-medium" style={{ color: C.red }}>{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Pembayaran"}</Btn>
      </div>
    </form>
  );
};

/* -- Catat Pemenang — HANYA pencatatan histori manual, tidak ada
   pengundian/algoritma otomatis di sini. -- */
export const ArisanWinnerForm = ({
  arisan, periods, participantHouseholds, residentMap, onCancel, onSubmit,
}) => {
  const [period, setPeriod] = useState(periods[0]?.value || "");
  const [householdId, setHouseholdId] = useState(participantHouseholds[0]?.id || "");
  const [amount, setAmount] = useState(arisan.amount ? String(arisan.amount * (participantHouseholds.length || 1)) : "");
  const [date, setDate] = useState(ARISAN_TODAY_STR);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const headName = residentMap[participantHouseholds.find((h) => h.id === householdId)?.head_resident_id]?.name || "-";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!period) { setError("Periode wajib dipilih."); return; }
    if (!householdId) { setError("Rumah wajib dipilih."); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Nominal hadiah harus lebih dari 0."); return; }
    setBusy(true);
    try {
      await onSubmit({
        arisan_id: arisan.id, period, household_id: householdId, amount: amt, date, notes,
      });
    } catch (err) {
      setError(err?.message || "Gagal menyimpan pemenang.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Periode" required>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
      </Field>
      <Field label="Rumah" required>
        <Select value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
          {participantHouseholds.map((h) => <option key={h.id} value={h.id}>No. {h.house_number}</option>)}
        </Select>
      </Field>
      <Field label="Kepala Keluarga"><TextInput value={headName} disabled /></Field>
      <Field label="Nominal" required>
        <TextInput type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Tanggal" required>
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Catatan" hint="Opsional">
        <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {error && <p className="text-xs font-medium" style={{ color: C.red }}>{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Pemenang"}</Btn>
      </div>
    </form>
  );
};
