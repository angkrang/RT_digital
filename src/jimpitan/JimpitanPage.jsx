import React, { useState, useMemo } from "react";
import {
  Coins, Plus, Search, Pencil, CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import { Badge, Btn, Card, EmptyState, Modal, Select, TextInput } from "../components/ui";
import { JIMPITAN_STATUS_OPTIONS, JIMPITAN_STATUS_TONE } from "../constants/data";
import { C } from "../constants/theme";
import { StatCard } from "../dashboard/Dashboard";
import { JimpitanForm } from "./JimpitanForm";
import { formatDateShort, formatPeriodLabel, formatRupiah } from "../utils/format";

export const JimpitanPage = ({ households, residents, jimpitan, onAddJimpitan, onUpdateJimpitan }) => {
  const residentMap = useMemo(() => Object.fromEntries(residents.map((r) => [r.id, r])), [residents]);
  const householdMap = useMemo(() => Object.fromEntries(households.map((h) => [h.id, h])), [households]);
  const activeHouseholds = useMemo(
    () => households.filter((h) => h.status !== "Pindah" && h.status !== "Nonaktif"),
    [households]
  );

  const TODAY_STR = "2026-08-11";
  const CURRENT_MONTH = "2026-08";

  const [modal, setModal] = useState(null); // { mode: "add" } | { mode: "edit", row }
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterHousehold, setFilterHousehold] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [rekapMonth, setRekapMonth] = useState(CURRENT_MONTH);

  const monthOptions = useMemo(() => {
    const set = new Set(jimpitan.map((j) => String(j.date).slice(0, 7)));
    set.add(CURRENT_MONTH);
    return [...set].sort().reverse();
  }, [jimpitan]);

  const stats = useMemo(() => {
    const sudahHariIni = jimpitan.filter((j) => j.date === TODAY_STR && j.status === "Sudah Setor");
    const sudahBulanIni = jimpitan.filter((j) => String(j.date).startsWith(CURRENT_MONTH) && j.status === "Sudah Setor");
    const setorSet = new Set(sudahBulanIni.map((j) => j.household_id));
    const sudah = activeHouseholds.filter((h) => setorSet.has(h.id)).length;
    return {
      hariIni: sudahHariIni.reduce((s, j) => s + Number(j.amount || 0), 0),
      bulanIni: sudahBulanIni.reduce((s, j) => s + Number(j.amount || 0), 0),
      rumahSudah: sudah,
      rumahBelum: activeHouseholds.length - sudah,
    };
  }, [jimpitan, activeHouseholds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jimpitan.filter((j) => {
      if (filterDate && j.date !== filterDate) return false;
      if (filterMonth && !String(j.date).startsWith(filterMonth)) return false;
      if (filterHousehold && j.household_id !== filterHousehold) return false;
      if (filterStatus && j.status !== filterStatus) return false;
      if (!q) return true;
      const house = householdMap[j.household_id];
      const head = house ? residentMap[house.head_resident_id] : null;
      return (
        String(house?.house_number || "").toLowerCase().includes(q) ||
        String(head?.name || "").toLowerCase().includes(q) ||
        String(j.collector || "").toLowerCase().includes(q)
      );
    });
  }, [jimpitan, search, filterDate, filterMonth, filterHousehold, filterStatus, householdMap, residentMap]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => String(b.date).localeCompare(String(a.date))), [filtered]);

  const rekap = useMemo(() => {
    return activeHouseholds
      .map((h) => {
        const entries = jimpitan.filter(
          (j) => j.household_id === h.id && String(j.date).startsWith(rekapMonth) && j.status === "Sudah Setor"
        );
        return {
          household: h,
          headName: residentMap[h.head_resident_id]?.name || "-",
          jumlah: entries.length,
          total: entries.reduce((s, j) => s + Number(j.amount || 0), 0),
        };
      })
      .sort((a, b) => String(a.household.house_number).localeCompare(String(b.household.house_number), "id", { numeric: true }));
  }, [activeHouseholds, jimpitan, rekapMonth, residentMap]);

  const rekapTotal = useMemo(() => rekap.reduce((s, r) => s + r.total, 0), [rekap]);

  const closeModal = () => setModal(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-xl items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <span>Setoran berstatus "Sudah Setor" otomatis tercatat sebagai Pemasukan di Kas RT, dan rumah diambil dari Data Rumah.</span>
        </div>
        <Btn size="sm" onClick={() => setModal({ mode: "add" })}><Plus size={15} /> Catat Jimpitan</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="JIMPITAN HARI INI" value={stats.hariIni} tone={C.navy} icon={Coins} />
        <StatCard label="JIMPITAN BULAN INI" value={stats.bulanIni} tone={C.navy} icon={Coins} />
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold" style={{ color: C.textMuted }}>RUMAH SUDAH SETOR</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: C.green + "20", color: C.green }}><CheckCircle2 size={15} /></div>
          </div>
          <p className="rtd-display mt-3 text-2xl font-bold tabular-nums" style={{ color: C.text }}>{stats.rumahSudah}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold" style={{ color: C.textMuted }}>RUMAH BELUM SETOR</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: C.red + "20", color: C.red }}><AlertTriangle size={15} /></div>
          </div>
          <p className="rtd-display mt-3 text-2xl font-bold tabular-nums" style={{ color: C.text }}>{stats.rumahBelum}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Riwayat Jimpitan</h3>
          <Badge tone="navy">{sorted.length} data</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-5" style={{ borderColor: C.border }}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari rumah / nama / petugas..." className="pl-9" />
          </div>
          <TextInput type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); if (e.target.value) setFilterMonth(""); }} />
          <Select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); if (e.target.value) setFilterDate(""); }}>
            <option value="">Semua Bulan</option>
            {monthOptions.map((m) => <option key={m} value={m}>{formatPeriodLabel(m)}</option>)}
          </Select>
          <Select value={filterHousehold} onChange={(e) => setFilterHousehold(e.target.value)}>
            <option value="">Semua Rumah</option>
            {[...households].sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true })).map((h) => (
              <option key={h.id} value={h.id}>No. {h.house_number}</option>
            ))}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            {JIMPITAN_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={Coins} title="Tidak ada data jimpitan" subtitle="Coba ubah filter, atau catat setoran baru." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                  <th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th>
                  <th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3">Petugas</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((j) => {
                  const house = householdMap[j.household_id];
                  const head = house ? residentMap[house.head_resident_id] : null;
                  return (
                    <tr key={j.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: C.text }}>{formatDateShort(j.date)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: C.text }}>No. {house?.house_number || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{head?.name || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: j.status === "Sudah Setor" ? C.green : C.textFaint }}>
                        {j.amount ? formatRupiah(j.amount) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{j.collector || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge tone={JIMPITAN_STATUS_TONE[j.status] || "muted"}>{j.status}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Btn size="sm" variant="ghost" onClick={() => setModal({ mode: "edit", row: j })}><Pencil size={13} /></Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Rekap Bulanan</h3>
          <Select value={rekapMonth} onChange={(e) => setRekapMonth(e.target.value)} className="!w-auto">
            {monthOptions.map((m) => <option key={m} value={m}>{formatPeriodLabel(m)}</option>)}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
                <th className="px-4 py-3">Rumah</th><th className="px-4 py-3">Kepala Keluarga</th>
                <th className="px-4 py-3 text-right">Jumlah Setoran</th><th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rekap.map((r) => (
                <tr key={r.household.id} className="border-b hover:bg-slate-50" style={{ borderColor: C.border }}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: C.text }}>No. {r.household.house_number}</td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: C.textMuted }}>{r.headName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" style={{ color: C.text }}>{r.jumlah}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold" style={{ color: C.green }}>{r.total ? formatRupiah(r.total) : "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: C.textMuted }}>TOTAL</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold" style={{ color: C.navy }}>{formatRupiah(rekapTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal
          title={modal.mode === "edit" ? "Ubah Pencatatan Jimpitan" : "Catat Jimpitan"}
          subtitle={modal.mode === "edit" ? `Rumah No. ${householdMap[modal.row.household_id]?.house_number || "-"}` : "Setoran akan tercatat otomatis sebagai Pemasukan"}
          onClose={closeModal}
          width={480}
        >
          <JimpitanForm
            households={households}
            residentMap={residentMap}
            initial={modal.mode === "edit" ? modal.row : null}
            onCancel={closeModal}
            onSubmit={async (payload, force) => {
              if (modal.mode === "edit") {
                await onUpdateJimpitan({ ...payload, id: modal.row.id });
              } else {
                await onAddJimpitan(payload, force);
              }
              closeModal();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

/* ============================================================
   ARISAN PAGE
   ============================================================ */
