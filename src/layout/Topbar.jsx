import React from "react";
import {
  Menu, LogOut, Plus,
} from "lucide-react";
import { Btn } from "../components/ui";
import { C } from "../constants/theme";
import { Dashboard } from "../dashboard/Dashboard";

export const PAGE_TITLES = {
  dashboard: "Dashboard Keuangan", kas: "Kas RT", pemasukan: "Pemasukan", pengeluaran: "Pengeluaran",
  pembayaran: "Pembayaran Warga", jimpitan: "Jimpitan", arisan: "Arisan", sosial: "Dana Sosial",
  laporan: "Laporan Keuangan", pengaturan: "Pengaturan Nominal",
  rumah: "Data Rumah", warga: "Data Warga", iuran: "Iuran Warga",
};

export const Topbar = ({ page, user, onLogout, onMenu, onAdd }) => (
  <header className="sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 lg:px-6" style={{ background: C.card, borderColor: C.border }}>
    <button className="rtd-focus rounded-lg p-1.5 lg:hidden" style={{ color: C.navy }} onClick={onMenu}><Menu size={20} /></button>
    <div className="min-w-0">
      <h1 className="rtd-display truncate text-base font-bold lg:text-lg" style={{ color: C.text }}>{PAGE_TITLES[page] || "RT Digital"}</h1>
      <p className="hidden text-xs sm:block" style={{ color: C.textMuted }}>Selamat bertugas, {user.name.split(" ")[0]}</p>
    </div>
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <Btn size="sm" onClick={onAdd} className="!px-3"><Plus size={15} /> <span className="hidden sm:inline">Tambah Transaksi</span></Btn>
      <div className="hidden items-center gap-2 border-l pl-3 sm:flex" style={{ borderColor: C.border }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: C.navyFaint, color: C.navy }}>
          {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold" style={{ color: C.text }}>{user.name}</p>
          <p className="text-[11px]" style={{ color: C.textMuted }}>{user.role}</p>
        </div>
      </div>
      <button onClick={onLogout} className="rtd-focus flex h-9 w-9 items-center justify-center rounded-lg" style={{ color: C.textMuted, border: `1px solid ${C.border}` }} title="Keluar">
        <LogOut size={15} />
      </button>
    </div>
  </header>
);

/* ============================================================
   LOGIN PAGE
   ============================================================ */
