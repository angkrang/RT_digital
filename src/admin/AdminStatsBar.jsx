import React from "react";
import {
  Users, CreditCard, CheckCircle2, Home, Users2,
} from "lucide-react";
import { Card } from "../components/ui";
import { C } from "../constants/theme";

export const AdminStatsBar = ({ households, residents }) => {
  const totalRumah = households.length;
  const totalWarga = residents.length;
  const kepalaKeluarga = residents.filter((r) => r.relationship === "Kepala Keluarga").length;
  const wargaTetap = residents.filter((r) => r.resident_status === "Tetap").length;
  const pendatang = residents.filter((r) => r.resident_status === "Pendatang").length;
  const stats = [
    ["TOTAL RUMAH", totalRumah, Home, C.navy],
    ["TOTAL WARGA", totalWarga, Users2, C.navy],
    ["KEPALA KELUARGA", kepalaKeluarga, CreditCard, C.navy],
    ["WARGA TETAP", wargaTetap, CheckCircle2, C.green],
    ["PENDATANG", pendatang, Users, C.orange],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(([label, value, Icon, color]) => (
        <Card key={label} className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: C.navyFaint, color }}>
              <Icon size={15} />
            </div>
            <p className="text-[11px] font-semibold" style={{ color: C.textMuted }}>{label}</p>
          </div>
          <p className="rtd-display mt-2 text-xl font-bold tabular-nums" style={{ color: C.text }}>{value}</p>
        </Card>
      ))}
    </div>
  );
};

/* -- Form Tambah/Edit Rumah -- */
