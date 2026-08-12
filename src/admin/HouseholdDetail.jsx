import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus, Pencil, Info,
} from "lucide-react";
import { Badge, Btn } from "../components/ui";
import { C } from "../constants/theme";
import { MapAutoResize, houseMarkerIcon } from "../map/MapHelpers";
import { MAP_LAYERS } from "../map/mapConfig";

export const HouseholdDetail = ({ household, residents, onEdit, onAddResident, onEditResident }) => {
  const members = residents.filter((r) => r.household_id === household.id);
  const head = members.find((m) => m.id === household.head_resident_id) || members.find((m) => m.relationship === "Kepala Keluarga");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Kepala Keluarga</p><p className="font-medium" style={{ color: C.text }}>{head ? head.name : "—"}</p></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Status Rumah</p><Badge tone={household.status === "Aktif" ? "green" : "muted"}>{household.status}</Badge></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Alamat</p><p className="font-medium" style={{ color: C.text }}>{household.address || "—"}</p></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Nomor KK</p><p className="font-medium" style={{ color: C.text }}>{members[0]?.kk_number || "—"}</p></div>
        <div><p className="text-xs font-semibold" style={{ color: C.textMuted }}>Nomor HP</p><p className="font-medium" style={{ color: C.text }}>{head?.phone || "—"}</p></div>
      </div>

      <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: C.border }}>
        <h4 className="rtd-display text-sm font-bold" style={{ color: C.text }}>Anggota Keluarga ({members.length})</h4>
        <Btn size="sm" variant="subtle" onClick={onAddResident}><Plus size={13} /> Tambah Warga</Btn>
      </div>
      <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.textMuted }}>
              <th className="px-3 py-2">Nama</th><th className="px-3 py-2">Hubungan</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: C.textFaint }}>Belum ada anggota keluarga.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="border-b" style={{ borderColor: C.border }}>
                <td className="px-3 py-2 font-medium" style={{ color: C.text }}>{m.name}</td>
                <td className="px-3 py-2" style={{ color: C.textMuted }}>{m.relationship}</td>
                <td className="px-3 py-2"><Badge tone="muted">{m.resident_status}</Badge></td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => onEditResident(m)} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }} title="Edit"><Pencil size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-4" style={{ borderColor: C.border }}>
        <h4 className="rtd-display mb-3 text-sm font-bold" style={{ color: C.text }}>Lokasi di Peta</h4>
        {household.lat != null && household.lng != null && !Number.isNaN(Number(household.lat)) && !Number.isNaN(Number(household.lng)) ? (
          <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${C.border}`, height: 200 }}>
            <MapContainer center={[Number(household.lat), Number(household.lng)]} zoom={19} maxZoom={21} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution={MAP_LAYERS.satelit.attribution} url={MAP_LAYERS.satelit.url} maxNativeZoom={MAP_LAYERS.satelit.maxNativeZoom} maxZoom={MAP_LAYERS.satelit.maxZoom} />
              <MapAutoResize />
              <Marker position={[Number(household.lat), Number(household.lng)]} icon={houseMarkerIcon(C.navy)} />
            </MapContainer>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: C.orangeSoft, color: C.orange }}>
            <Info size={13} /> Rumah ini belum punya titik lokasi. Klik "Edit Rumah" lalu tandai posisinya di peta.
          </div>
        )}
      </div>

      <div className="flex justify-end border-t pt-4" style={{ borderColor: C.border }}>
        <Btn size="sm" variant="ghost" onClick={onEdit}><Pencil size={13} /> Edit Rumah</Btn>
      </div>
    </div>
  );
};

/* -- DATA RUMAH PAGE -- */
/* -- DENAH RT: peta skematik rumah per jalan, warna = status iuran periode terakhir -- */
