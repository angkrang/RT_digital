import React, { useState } from "react";
import {
  Building2, ArrowLeft,
} from "lucide-react";
import { apiPost } from "../api/client";
import { GlobalStyle } from "../components/GlobalStyle";
import { Badge, Btn, Card, Field, TextInput } from "../components/ui";
import { C } from "../constants/theme";
import { DEMO_ACCOUNTS } from "../utils/demoData";

export const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async (loginEmail, loginPassword) => {
    setError(""); setBusy(true);
    try {
      const acc = await apiPost("login", { email: loginEmail.trim().toLowerCase(), password: loginPassword });
      onLogin(acc);
    } catch (err) {
      setError(err.message || "Email atau kata sandi tidak sesuai.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const quickLogin = (acc) => { setEmail(acc.email); setPassword(acc.password); doLogin(acc.email, acc.password); };

  return (
    <div className="rtd-root flex min-h-screen items-center justify-center px-4 py-10" style={{ background: C.bg }}>
      <GlobalStyle />
      <div className="w-full max-w-sm">
        {onBack && (
          <button onClick={onBack} className="rtd-focus mb-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.textMuted }}>
            <ArrowLeft size={14} /> Kembali ke kondisi keuangan
          </button>
        )}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: C.navy }}>
            <Building2 size={22} color="#fff" />
          </div>
          <h1 className="rtd-display text-xl font-bold" style={{ color: C.text }}>RT DIGITAL</h1>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>Sistem Administrasi RT Berbasis Web</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Username / Email" required>
              <TextInput type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@rtdigital.id" aria-invalid={!!error} />
            </Field>
            <Field label="Password" required error={error}>
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" aria-invalid={!!error} />
            </Field>
            <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Memeriksa..." : "Masuk"}</Btn>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: C.border }} />
            <span className="text-[11px] font-semibold" style={{ color: C.textFaint }}>AKUN DEMO</span>
            <div className="h-px flex-1" style={{ background: C.border }} />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => quickLogin(acc)}
                className="rtd-focus flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left transition"
                style={{ border: `1px solid ${C.border}` }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{acc.name}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>{acc.email}</p>
                </div>
                <Badge tone="navy">{acc.role}</Badge>
              </button>
            ))}
          </div>
        </Card>
        <p className="mt-5 text-center text-xs" style={{ color: C.textFaint }}>DATA DEMO — semua transaksi pada aplikasi ini adalah data contoh.</p>
      </div>
    </div>
  );
};

/* ============================================================
   PUBLIC HOME (tampilan publik — tanpa perlu login)
   Menyajikan kondisi keuangan (saldo, pemasukan, pengeluaran) dan
   status arisan langsung saat sistem dibuka. Aksi admin (tambah/
   edit/hapus transaksi, undi arisan, dll) hanya tersedia setelah
   login lewat tombol "Masuk".
   ============================================================ */
