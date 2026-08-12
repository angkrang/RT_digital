import React from "react";
import {
  Info, Building2, LogIn,
} from "lucide-react";
import { ArisanPage } from "../arisan/ArisanPage";
import { GlobalStyle } from "../components/GlobalStyle";
import { Btn } from "../components/ui";
import { C } from "../constants/theme";
import { Dashboard } from "../dashboard/Dashboard";

export const PublicHome = ({ transactions, payments, settings, arisan, onLoginClick }) => {
  const readOnlyNotify = { view: () => {}, edit: () => {}, del: () => {} };
  return (
    <div className="rtd-root min-h-screen" style={{ background: C.bg }}>
      <GlobalStyle />
      <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 lg:px-6" style={{ borderColor: C.border, background: "#fff" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: C.navy }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div className="leading-tight">
            <p className="rtd-display text-sm font-bold" style={{ color: C.text }}>RT DIGITAL</p>
            <p className="text-[11px]" style={{ color: C.textMuted }}>Kondisi Keuangan &amp; Arisan RT</p>
          </div>
        </div>
        <Btn size="sm" onClick={onLoginClick}><LogIn size={14} /> Masuk</Btn>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
        <div className="no-print mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: C.orangeSoft, color: C.orange }}>
          <Info size={13} /> DATA DEMO — seluruh data di bawah ini adalah data contoh untuk keperluan simulasi. Login sebagai pengurus untuk mengelola data.
        </div>

        <section className="mb-8">
          <h2 className="rtd-display mb-3 text-base font-bold" style={{ color: C.text }}>Kondisi Keuangan</h2>
          <Dashboard transactions={transactions} payments={payments} settings={settings} notify={readOnlyNotify} readOnly />
        </section>

        <section>
          <h2 className="rtd-display mb-3 text-base font-bold" style={{ color: C.text }}>Arisan</h2>
          <ArisanPage arisan={arisan} payments={payments} settings={settings} readOnly />
        </section>
      </main>
    </div>
  );
};

/* ============================================================
   TRANSACTION FORM (used by Add/Edit modal)
   ============================================================ */
