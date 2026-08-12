import React, { useMemo } from "react";
import {
  Home, MapPin,
} from "lucide-react";
import { EmptyState } from "../components/ui";
import { C } from "../constants/theme";
import { formatPeriodLabel, parseStreetName } from "../utils/format";

export const DENAH_STATUS_COLOR = { lunas: C.green, sebagian: C.orange, belum: C.red, none: "#C7CDD6" };

export const DENAH_STATUS_LABEL = { lunas: "Lunas", sebagian: "Sebagian", belum: "Belum Bayar", none: "Belum ada tagihan" };

export const LegendDot = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
    {label}
  </span>
);

export const HouseBlock = ({ household, headName, status, onClick }) => (
  <button
    onClick={onClick}
    title={`Rumah No. ${household.house_number}${headName ? " — " + headName : ""} (${DENAH_STATUS_LABEL[status]})`}
    className="rtd-focus flex w-[76px] flex-col items-center gap-1 rounded-lg border-2 bg-white px-2 py-2.5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
    style={{ borderColor: DENAH_STATUS_COLOR[status] }}
  >
    <Home size={16} style={{ color: DENAH_STATUS_COLOR[status] }} />
    <span className="text-[11px] font-bold leading-tight" style={{ color: C.text }}>No. {household.house_number}</span>
    <span className="truncate text-[9px] leading-tight" style={{ color: C.textFaint, maxWidth: "68px" }}>{headName || "—"}</span>
  </button>
);

export const DenahRT = ({ households, residents, dues, onSelect }) => {
  const residentMap = useMemo(() => Object.fromEntries(residents.map((r) => [r.id, r])), [residents]);

  const latestPeriod = useMemo(() => {
    const periods = [...new Set(dues.map((d) => d.period))].sort();
    return periods[periods.length - 1] || null;
  }, [dues]);

  const statusFor = (householdId) => {
    if (!latestPeriod) return "none";
    const rows = dues.filter((d) => d.household_id === householdId && d.period === latestPeriod);
    if (rows.length === 0) return "none";
    const total = rows.reduce((s, d) => s + Number(d.amount), 0);
    const paid = rows.reduce((s, d) => s + Number(d.paid_amount), 0);
    if (total === 0) return "none";
    if (paid >= total) return "lunas";
    if (paid > 0) return "sebagian";
    return "belum";
  };

  const streets = useMemo(() => {
    const map = {};
    households.forEach((h) => { (map[parseStreetName(h.address)] ||= []).push(h); });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => String(a.house_number).localeCompare(String(b.house_number), "id", { numeric: true }))
    );
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [households]);

  if (households.length === 0) {
    return <EmptyState icon={MapPin} title="Belum ada data rumah" subtitle="Tambahkan data rumah untuk melihat denah RT." />;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
        <span className="font-semibold">
          {latestPeriod ? `Status iuran periode ${formatPeriodLabel(latestPeriod)}:` : "Warna menunjukkan status iuran:"}
        </span>
        <LegendDot color={DENAH_STATUS_COLOR.lunas} label="Lunas" />
        <LegendDot color={DENAH_STATUS_COLOR.sebagian} label="Sebagian" />
        <LegendDot color={DENAH_STATUS_COLOR.belum} label="Belum Bayar" />
        <LegendDot color={DENAH_STATUS_COLOR.none} label="Belum ada tagihan" />
      </div>

      {streets.map(([street, list]) => {
        const kiri = list.filter((_, i) => i % 2 === 0);
        const kanan = list.filter((_, i) => i % 2 === 1);
        return (
          <div key={street}>
            <p className="rtd-display mb-3 flex items-center gap-1.5 text-sm font-bold" style={{ color: C.text }}>
              <MapPin size={14} style={{ color: C.textMuted }} /> {street}
            </p>
            <div className="rounded-xl p-4" style={{ background: "#EEF1F5" }}>
              <div className="flex flex-wrap gap-3 pb-3">
                {kiri.map((h) => {
                  const head = residentMap[h.head_resident_id];
                  return <HouseBlock key={h.id} household={h} headName={head?.name} status={statusFor(h.id)} onClick={() => onSelect(h)} />;
                })}
              </div>
              <div className="h-2 rounded-full" style={{ background: "#C7CDD6" }} />
              {kanan.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-3">
                  {kanan.map((h) => {
                    const head = residentMap[h.head_resident_id];
                    return <HouseBlock key={h.id} household={h} headName={head?.name} status={statusFor(h.id)} onClick={() => onSelect(h)} />;
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* -- PETA RT: peta sungguhan (OpenStreetMap via Leaflet, gratis tanpa API key) -- */
