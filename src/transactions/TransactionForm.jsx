import React, { useState, useRef } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, Paperclip,
} from "lucide-react";
import { Btn, CurrencyInput, Field, Select, TextArea, TextInput } from "../components/ui";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "../constants/data";
import { C } from "../constants/theme";

export const emptyForm = () => ({
  type: "masuk", transaction_date: "2026-08-11", category: INCOME_CATEGORIES[0],
  amount: 0, description: "", source: "", payment_method: "Tunai", attachment: null, notes: "",
});

export const TransactionForm = ({ initial, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial || emptyForm());
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const categories = form.type === "masuk" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const setType = (type) => setForm((f) => ({ ...f, type, category: (type === "masuk" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }));

  const validate = () => {
    const e = {};
    if (!form.transaction_date) e.transaction_date = "Tanggal wajib diisi.";
    if (!form.amount || form.amount <= 0) e.amount = "Nominal harus lebih dari 0.";
    if (!form.description.trim()) e.description = "Keterangan wajib diisi.";
    if (!form.source.trim()) e.source = form.type === "masuk" ? "Sumber wajib diisi." : "Penerima wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Jenis Transaksi" required>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("masuk")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={form.type === "masuk" ? { background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowUpCircle size={16} /> Pemasukan
          </button>
          <button type="button" onClick={() => setType("keluar")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={form.type === "keluar" ? { background: C.redSoft, color: C.red, border: `1px solid ${C.red}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowDownCircle size={16} /> Pengeluaran
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required error={errors.transaction_date}>
          <TextInput type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} aria-invalid={!!errors.transaction_date} />
        </Field>
        <Field label="Kategori" required>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Nominal" required error={errors.amount}>
        <CurrencyInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} error={errors.amount} />
      </Field>

      <Field label="Keterangan" required error={errors.description}>
        <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Iuran warga bulan Agustus" aria-invalid={!!errors.description} />
      </Field>

      <Field label={form.type === "masuk" ? "Sumber" : "Penerima"} required error={errors.source}>
        <TextInput value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder={form.type === "masuk" ? "Nama warga / pihak pemberi" : "Nama penerima / vendor"} aria-invalid={!!errors.source} />
      </Field>

      <Field label="Metode Pembayaran" required>
        <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>

      <Field label="Bukti Transaksi" hint="Format JPG, PNG, atau PDF, maksimal 5MB.">
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => setForm({ ...form, attachment: e.target.files[0]?.name || null })} />
        <button type="button" onClick={() => fileRef.current.click()} className="rtd-focus flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ border: `1px dashed ${C.border}`, color: C.textMuted }}>
          <Paperclip size={15} />
          {form.attachment ? <span style={{ color: C.text }}>{form.attachment}</span> : "Pilih file bukti transaksi"}
        </button>
      </Field>

      <Field label="Catatan">
        <TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan (opsional)" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Simpan Transaksi</Btn>
      </div>
    </form>
  );
};

/* ============================================================
   TRANSACTION DETAIL VIEW
   ============================================================ */
