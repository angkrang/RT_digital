import React, { useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import { Btn, CurrencyInput, Field, Select, TextInput } from "../components/ui";
import { PAYMENT_METHODS } from "../constants/data";
import { C } from "../constants/theme";

export const SosialForm = ({ onCancel, onSubmit }) => {
  const [type, setType] = useState("masuk");
  const [date, setDate] = useState("2026-08-11");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [party, setParty] = useState("");
  const [method, setMethod] = useState("Tunai");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!amount || amount <= 0) e.amount = "Nominal harus lebih dari 0.";
    if (!description.trim()) e.description = "Keterangan wajib diisi.";
    if (!party.trim()) e.party = type === "masuk" ? "Sumber wajib diisi." : "Penerima wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ type, date, amount, description, party, method });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Jenis" required>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("masuk")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={type === "masuk" ? { background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowUpCircle size={16} /> Dana Masuk
          </button>
          <button type="button" onClick={() => setType("keluar")} className="rtd-focus flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={type === "keluar" ? { background: C.redSoft, color: C.red, border: `1px solid ${C.red}` } : { border: `1px solid ${C.border}`, color: C.textMuted }}>
            <ArrowDownCircle size={16} /> Penyaluran Bantuan
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Nominal" required error={errors.amount}><CurrencyInput value={amount} onChange={setAmount} error={errors.amount} /></Field>
      </div>

      <Field label="Keterangan" required error={errors.description}>
        <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "masuk" ? "Contoh: Sumbangan dana sosial warga" : "Contoh: Bantuan sosial warga terdampak"} aria-invalid={!!errors.description} />
      </Field>

      <Field label={type === "masuk" ? "Sumber" : "Penerima"} required error={errors.party}>
        <TextInput value={party} onChange={(e) => setParty(e.target.value)} placeholder={type === "masuk" ? "Nama warga / donatur" : "Nama warga penerima bantuan"} aria-invalid={!!errors.party} />
      </Field>

      <Field label="Metode" required>
        <Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Simpan</Btn>
      </div>
    </form>
  );
};
