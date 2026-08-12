import React, { useState } from "react";
import { Badge, Btn, CurrencyInput, Field, Select, TextInput } from "../components/ui";
import { PAYMENT_METHODS, PEMBAYARAN_PERIOD } from "../constants/data";
import { C } from "../constants/theme";
import { computeObligation, isArisanMember } from "../utils/dues";
import { formatRupiah } from "../utils/format";

export const PaymentStatusBadge = ({ status }) => {
  const map = {
    "Lunas": { tone: "green", dot: "🟢" },
    "Sebagian": { tone: "orange", dot: "🟡" },
    "Belum Bayar": { tone: "red", dot: "🔴" },
  }[status];
  return <Badge tone={map.tone}>{map.dot} {status}</Badge>;
};

export const PembayaranForm = ({ resident, payment, settings, onCancel, onSubmit }) => {
  const ob = computeObligation(resident.id, settings);
  const sisa = Math.max(0, ob.total - payment.paid_amount);
  const [amount, setAmount] = useState(sisa);
  const [date, setDate] = useState("2026-08-11");
  const [method, setMethod] = useState("Tunai");
  const [error, setError] = useState("");

  const kembalian = Math.max(0, amount - sisa);

  const submit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) { setError("Nominal harus lebih dari 0."); return; }
    onSubmit({ amount, date, method });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg p-3.5" style={{ background: C.navyFaint }}>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{resident.name}</p>
        <p className="text-xs" style={{ color: C.textMuted }}>{resident.house} · Periode {PEMBAYARAN_PERIOD}</p>
      </div>

      <div className="space-y-1.5 rounded-lg border p-3.5" style={{ borderColor: C.border }}>
        <p className="mb-1 text-xs font-semibold" style={{ color: C.textMuted }}>RINCIAN KEWAJIBAN BULAN INI</p>
        <div className="flex justify-between text-sm">
          <span style={{ color: C.textMuted }}>Iuran Warga</span>
          <span className="tabular-nums font-medium" style={{ color: C.text }}>{formatRupiah(ob.iuran)}</span>
        </div>
        {ob.isArisanMember && (
          <>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.textMuted }}>Arisan</span>
              <span className="tabular-nums font-medium" style={{ color: C.text }}>{formatRupiah(ob.arisan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: C.textMuted }}>Dana Sosial (wajib)</span>
              <span className="tabular-nums font-medium" style={{ color: C.text }}>{formatRupiah(ob.sosial)}</span>
            </div>
          </>
        )}
        <div className="mt-1.5 flex justify-between border-t pt-1.5 text-sm font-bold" style={{ borderColor: C.border }}>
          <span style={{ color: C.text }}>Total Kewajiban</span>
          <span className="tabular-nums" style={{ color: C.navy }}>{formatRupiah(ob.total)}</span>
        </div>
        {payment.paid_amount > 0 && (
          <div className="flex justify-between text-xs">
            <span style={{ color: C.textMuted }}>Sudah dibayar sebelumnya</span>
            <span className="tabular-nums font-medium" style={{ color: C.green }}>{formatRupiah(payment.paid_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span style={{ color: C.textMuted }}>Sisa Tagihan</span>
          <span className="tabular-nums font-semibold" style={{ color: sisa > 0 ? C.red : C.textFaint }}>{formatRupiah(sisa)}</span>
        </div>
      </div>

      <Field label="Uang Diterima" required error={error}>
        <CurrencyInput value={amount} onChange={(v) => { setAmount(v); setError(""); }} error={error} />
      </Field>

      {kembalian > 0 && (
        <div className="rounded-lg p-3.5" style={{ background: C.greenSoft }}>
          <p className="text-xs font-semibold" style={{ color: C.green }}>KEMBALIAN YANG HARUS DIKELUARKAN BENDAHARA</p>
          <p className="rtd-display mt-1 text-xl font-bold tabular-nums" style={{ color: C.green }}>{formatRupiah(kembalian)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" required><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Metode" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
        </Field>
      </div>

      <p className="text-xs" style={{ color: C.textFaint }}>Nominal akan otomatis tercatat sebagai transaksi Iuran Warga{ob.isArisanMember ? ", Arisan, dan Dana Sosial" : ""} di Kas RT sesuai urutan prioritas.</p>

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn type="submit">Catat Pembayaran</Btn>
      </div>
    </form>
  );
};
