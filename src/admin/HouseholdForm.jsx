import React, { useState } from "react";
import { Btn, Field, Select, TextArea, TextInput } from "../components/ui";
import { HOUSEHOLD_STATUS_OPTIONS } from "../constants/data";
import { MapLocationPicker } from "../map/MapLocationPicker";

export const HouseholdForm = ({ initial, residents, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial || { house_number: "", address: "", status: "Aktif", notes: "", lat: "", lng: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!String(form.house_number).trim()) { setError("Nomor rumah wajib diisi."); return; }
    setBusy(true); setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Gagal menyimpan data rumah.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nomor Rumah" required error={error}>
        <TextInput value={form.house_number} onChange={(e) => set("house_number", e.target.value)} placeholder="mis. 21" />
      </Field>
      <Field label="Alamat">
        <TextInput value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Jl. Melati No. 21" />
      </Field>
      <Field label="Status Rumah" required>
        <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {HOUSEHOLD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Lokasi di Peta (opsional)" hint="Klik pada peta untuk menandai posisi rumah ini">
        <MapLocationPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
      </Field>
      <Field label="Catatan">
        <TextArea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Rumah"}</Btn>
      </div>
    </form>
  );
};

/* -- Form Tambah/Edit Warga -- */
