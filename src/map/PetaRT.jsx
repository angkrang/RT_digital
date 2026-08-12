import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Info, MapPin,
} from "lucide-react";
import { EmptyState } from "../components/ui";
import { C } from "../constants/theme";
import { DENAH_STATUS_COLOR, DENAH_STATUS_LABEL, LegendDot } from "../denah/DenahRT";
import { FitBoundsToMarkers, MapAutoResize, houseMarkerIcon } from "./MapHelpers";
import { MapLayerToggle } from "./MapLayerToggle";
import { MAP_LAYERS, RT_MAP_CENTER } from "./mapConfig";
import { formatPeriodLabel } from "../utils/format";

export const PetaRT = ({ households, residents, dues, onSelect }) => {
  const [layer, setLayer] = useState("satelit");
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

  const withCoords = households.filter((h) => h.lat != null && h.lng != null && !Number.isNaN(Number(h.lat)) && !Number.isNaN(Number(h.lng)));
  const withoutCoords = households.filter((h) => !(h.lat != null && h.lng != null && !Number.isNaN(Number(h.lat)) && !Number.isNaN(Number(h.lng))));
  const points = withCoords.map((h) => [Number(h.lat), Number(h.lng)]);
  const defaultCenter = RT_MAP_CENTER;

  if (households.length === 0) {
    return <EmptyState icon={MapPin} title="Belum ada data rumah" subtitle="Tambahkan data rumah untuk melihat peta RT." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: C.navyFaint, color: C.navy }}>
          <span className="font-semibold">
            {latestPeriod ? `Status iuran periode ${formatPeriodLabel(latestPeriod)}:` : "Warna menunjukkan status iuran:"}
          </span>
          <LegendDot color={DENAH_STATUS_COLOR.lunas} label="Lunas" />
          <LegendDot color={DENAH_STATUS_COLOR.sebagian} label="Sebagian" />
          <LegendDot color={DENAH_STATUS_COLOR.belum} label="Belum Bayar" />
          <LegendDot color={DENAH_STATUS_COLOR.none} label="Belum ada tagihan" />
        </div>
        <MapLayerToggle layer={layer} setLayer={setLayer} />
      </div>

      {withoutCoords.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: C.orangeSoft, color: C.orange }}>
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>{withoutCoords.length} rumah belum punya koordinat (rumah No. {withoutCoords.map((h) => h.house_number).join(", ")}) sehingga belum tampil di peta. Isi koordinat lewat Edit Rumah.</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.border}`, height: 480 }}>
        <MapContainer center={points[0] || defaultCenter} zoom={19} maxZoom={21} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            key={layer}
            attribution={MAP_LAYERS[layer].attribution}
            url={MAP_LAYERS[layer].url}
            maxNativeZoom={MAP_LAYERS[layer].maxNativeZoom}
            maxZoom={MAP_LAYERS[layer].maxZoom}
          />
          <MapAutoResize />
          <FitBoundsToMarkers points={points} />
          {withCoords.map((h) => {
            const head = residentMap[h.head_resident_id];
            const status = statusFor(h.id);
            return (
              <Marker key={h.id} position={[Number(h.lat), Number(h.lng)]} icon={houseMarkerIcon(DENAH_STATUS_COLOR[status])}>
                <Popup>
                  <div style={{ minWidth: 150, fontFamily: "inherit" }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Rumah No. {h.house_number}</p>
                    <p style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>{head ? head.name : "Belum ada kepala keluarga"}</p>
                    <p style={{ fontSize: 11, marginBottom: 8 }}>
                      Status iuran: <strong style={{ color: DENAH_STATUS_COLOR[status] }}>{DENAH_STATUS_LABEL[status]}</strong>
                    </p>
                    <button
                      onClick={() => onSelect(h)}
                      style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: C.navy, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
