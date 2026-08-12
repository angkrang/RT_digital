import React, { useState } from "react";
import {
  CheckCircle2, Info, Save,
} from "lucide-react";
import { Btn, Card, CurrencyInput, Field } from "../components/ui";
import { C } from "../constants/theme";

export const PengaturanPage = ({ settings, onSave, userRole }) => {
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const fields = [
    { key: "iuranAmount", label: "Iuran Warga / bulan", hint: "Ditagih ke seluruh warga setiap bulan." },
    { key: "arisanAmount", label: "Arisan / bulan", hint: "Ditagih ke warga peserta arisan." },
    { key: "sosialWajibAmount", label: "Dana Sosial Wajib / bulan", hint: "Ditagih bersamaan dengan arisan ke peserta arisan." },
  ];

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    fields.forEach((f) => { if (!form[f.key] || form[f.key] <= 0) errs[f.key] = "Nominal harus lebih dari 0."; });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="no-print flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>Nominal ini menentukan tagihan warga di menu <strong>Pembayaran Warga</strong> &amp; <strong>Arisan</strong>. Perubahan berlaku untuk sisa tagihan periode berjalan dan periode berikutnya.{userRole && userRole !== "Bendahara" && " Disarankan hanya Bendahara yang mengubah nominal ini."}</span>
      </div>

      <Card className="max-w-lg p-6">
        <h3 className="rtd-display mb-4 text-sm font-bold" style={{ color: C.text }}>Nominal Wajib Bulanan</h3>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} required error={errors[f.key]} hint={f.hint}>
              <CurrencyInput
                value={form[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                error={errors[f.key]}
              />
            </Field>
          ))}
          <div className="flex items-center justify-between gap-2 pt-2">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.green }}><CheckCircle2 size={14} /> Nominal tersimpan</span>
            ) : <span />}
            <Btn type="submit"><Save size={15} /> Simpan Nominal</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
};

/* ============================================================
   LAPORAN KEUANGAN PAGE
   ============================================================ */
