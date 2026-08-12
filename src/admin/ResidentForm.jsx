import React, { useState } from "react";
import {
  AlertTriangle,
} from "lucide-react";
import { Btn, Field, Select, TextInput } from "../components/ui";
import { GENDER_OPTIONS, RELATIONSHIP_OPTIONS, RESIDENT_STATUS_OPTIONS } from "../constants/data";
import { C } from "../constants/theme";

export const ResidentForm = ({ initial, households, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial || {
    name: "", nik: "", kk_number: "", gender: "L", birth_place: "", birth_date: "",
    phone: "", relationship: RELATIONSHIP_OPTIONS[0], occupation: "", resident_status: "Tetap",
    household_id: households[0]?.id || "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!String(form.name).trim()) e.name = "Nama wajib diisi.";
    if (!/^\d{16}$/.test(String(form.nik || ""))) e.nik = "NIK harus 16 digit angka.";
    if (form.kk_number && !/^\d{16}$/.test(String(form.kk_number))) e.kk_number = "Nomor KK harus 16 digit angka.";
    if (!form.household_id) e.household_id = "Rumah wajib dipilih.";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setErrors({ form: err.message || "Gagal menyimpan data warga." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {errors.form && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: C.redSoft, color: C.red }}>
          <AlertTriangle size={13} /> {errors.form}
        </div>
      )}
      <Field label="Nama Lengkap" required error={errors.name}>
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="NIK" required error={errors.nik} hint="16 digit angka">
          <TextInput inputMode="numeric" maxLength={16} value={form.nik} onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.nik} />
        </Field>
        <Field label="Nomor KK" error={errors.kk_number} hint="16 digit angka">
          <TextInput inputMode="numeric" maxLength={16} value={form.kk_number} onChange={(e) => set("kk_number", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.kk_number} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jenis Kelamin" required>
          <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </Select>
        </Field>
        <Field label="Tempat Lahir">
          <TextInput value={form.birth_place} onChange={(e) => set("birth_place", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal Lahir">
          <TextInput type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
        </Field>
        <Field label="Nomor HP">
          <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812xxxxxxx" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hubungan dalam Keluarga" required>
          <Select value={form.relationship} onChange={(e) => set("relationship", e.target.value)}>
            {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Pekerjaan">
          <TextInput value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status Warga" required>
          <Select value={form.resident_status} onChange={(e) => set("resident_status", e.target.value)}>
            {RESIDENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Rumah" required error={errors.household_id}>
          <Select value={form.household_id} onChange={(e) => set("household_id", e.target.value)} aria-invalid={!!errors.household_id}>
            {households.map((h) => <option key={h.id} value={h.id}>Rumah No. {h.house_number}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Warga"}</Btn>
      </div>
    </form>
  );
};

/* -- Detail Rumah: kepala keluarga + anggota keluarga -- */
