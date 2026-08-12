import React from "react";
import {
  LayoutDashboard, Wallet, ArrowDownCircle, ArrowUpCircle, Coins, Gift, HeartHandshake, FileBarChart, UserCog, Settings, X, CreditCard, Building2, Home, Users2, FileText,
} from "lucide-react";
import { C } from "../constants/theme";
import { Dashboard } from "../dashboard/Dashboard";

export const NAV_SECTIONS = [
  { label: "DASHBOARD", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "ADMINISTRASI",
    items: [
      { id: "rumah", label: "Data Rumah", icon: Home },
      { id: "warga", label: "Data Warga", icon: Users2 },
    ],
  },
  {
    label: "KEUANGAN",
    items: [
      { id: "kas", label: "Kas RT", icon: Wallet },
      { id: "pemasukan", label: "Pemasukan", icon: ArrowUpCircle },
      { id: "pengeluaran", label: "Pengeluaran", icon: ArrowDownCircle },
      { id: "iuran", label: "Iuran Warga", icon: FileText },
      { id: "pembayaran", label: "Pembayaran Warga", icon: CreditCard },
      { id: "jimpitan", label: "Jimpitan", icon: Coins },
      { id: "arisan", label: "Arisan", icon: Gift },
      { id: "sosial", label: "Dana Sosial", icon: HeartHandshake },
    ],
  },
  {
    label: "LAPORAN",
    items: [
      { id: "laporan", label: "Laporan Keuangan", icon: FileBarChart },
    ],
  },
  {
    label: "SISTEM",
    items: [
      { id: "pengguna", label: "Pengguna", icon: UserCog, soon: true },
      { id: "pengaturan", label: "Pengaturan Nominal", icon: Settings },
    ],
  },
];

export const Sidebar = ({ page, setPage, mobileOpen, setMobileOpen, notify }) => {
  const go = (item) => {
    if (item.soon) { notify(`${item.label} akan hadir pada versi berikutnya.`, "info"); return; }
    setPage(item.id);
    setMobileOpen(false);
  };
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(12,33,54,0.45)" }} onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: C.navyDark }}
        >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: C.navyMid }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div>
            <p className="rtd-display text-base font-bold leading-none" style={{ color: "#fff" }}>RT DIGITAL</p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "#93A3B8" }}>Administrasi RT</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} style={{ color: "#93A3B8" }}><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold tracking-wider" style={{ color: "#5E7290" }}>{section.label}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item)}
                    className="rtd-focus mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition"
                    style={{
                      background: active ? C.navyMid : "transparent",
                      color: active ? "#fff" : item.soon ? "#5E7290" : "#C7D2E0",
                    }}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{item.label}</span>
                    {item.soon && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "#8CA0BB" }}>SEGERA</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
