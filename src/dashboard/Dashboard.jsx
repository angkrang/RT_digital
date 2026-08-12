import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Users,
} from "lucide-react";
import { Card, EmptyState, RangeFilterButtons } from "../components/ui";
import { SALDO_AWAL } from "../constants/data";
import { C, EXPENSE_COLORS } from "../constants/theme";
import { TxTable } from "../transactions/TxTable";
import { buildArusKasData, buildExpensePie } from "../utils/charts";
import { computeObligation } from "../utils/dues";
import { formatRupiah } from "../utils/format";

export const StatCard = ({ label, value, tone, icon: Icon, ledger }) => (
  <Card className="relative overflow-hidden p-5" style={ledger ? { background: `linear-gradient(135deg, ${C.navy}, ${C.navyDark})`, border: "none" } : {}}>
    {ledger && <div className="rtd-ledger-tab absolute inset-0" />}
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold" style={{ color: ledger ? "#B9CBE0" : C.textMuted }}>{label}</p>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: ledger ? "rgba(255,255,255,0.12)" : tone + "20", color: ledger ? "#fff" : tone }}>
        <Icon size={15} />
      </div>
    </div>
    <p className="rtd-display mt-3 text-2xl font-bold tabular-nums" style={{ color: ledger ? "#fff" : C.text }}>{formatRupiah(value)}</p>
  </Card>
);

export const Dashboard = ({ transactions, payments, settings, notify, readOnly }) => {
  const [range, setRange] = useState("30");

  const totals = useMemo(() => {
    const saldoAkhir = SALDO_AWAL + transactions.reduce((s, t) => s + (t.type === "masuk" ? t.amount : -t.amount), 0);
    const inMonth = transactions.filter((t) => t.transaction_date.startsWith("2026-08"));
    const pemasukanBulanIni = inMonth.filter((t) => t.type === "masuk").reduce((s, t) => s + t.amount, 0);
    const pengeluaranBulanIni = inMonth.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0);
    const piutang = payments.reduce((s, p) => {
      const ob = computeObligation(p.resident_id, settings);
      return s + Math.max(0, ob.total - p.paid_amount);
    }, 0);
    return { saldoAkhir, pemasukanBulanIni, pengeluaranBulanIni, piutang };
  }, [transactions, payments, settings]);

  const arusKas = useMemo(() => buildArusKasData(transactions, Number(range)), [transactions, range]);
  const pieData = useMemo(() => buildExpensePie(transactions), [transactions]);
  const recent = useMemo(() => [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).slice(0, 6), [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="SALDO KAS" value={totals.saldoAkhir} icon={Wallet} ledger />
        <StatCard label="PEMASUKAN BULAN INI" value={totals.pemasukanBulanIni} tone={C.green} icon={ArrowUpCircle} />
        <StatCard label="PENGELUARAN BULAN INI" value={totals.pengeluaranBulanIni} tone={C.red} icon={ArrowDownCircle} />
        <StatCard label="PIUTANG WARGA" value={totals.piutang} tone={C.orange} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Arus Kas</h3>
            <RangeFilterButtons value={range} onChange={setRange} />
          </div>
          {arusKas.length === 0 ? <EmptyState title="Belum ada data pada periode ini" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={arusKas} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.35} /><stop offset="100%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={0.3} /><stop offset="100%" stopColor={C.red} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} width={46} />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Area type="monotone" dataKey="Pemasukan" stroke={C.green} fill="url(#gMasuk)" strokeWidth={2} />
                <Area type="monotone" dataKey="Pengeluaran" stroke={C.red} fill="url(#gKeluar)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="rtd-display mb-4 text-sm font-bold" style={{ color: C.text }}>Grafik Pengeluaran</h3>
          {pieData.length === 0 ? <EmptyState title="Belum ada pengeluaran" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={EXPENSE_COLORS[d.name] || C.textFaint} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Transaksi Terbaru</h3>
        </div>
        <TxTable
          rows={recent}
          hideActions={readOnly}
          onView={(t) => notify.view(t)}
          onEdit={(t) => notify.edit(t)}
          onDelete={(t) => notify.del(t)}
        />
      </Card>
    </div>
  );
};

/* ============================================================
   KAS RT PAGE
   ============================================================ */
