import React, { useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
} from "lucide-react";
import { C } from "../constants/theme";
import { MapAutoResize, MapClickHandler, houseMarkerIcon } from "./MapHelpers";
import { MapLayerToggle } from "./MapLayerToggle";
import { MAP_LAYERS, RT_MAP_CENTER } from "./mapConfig";

export const MapLocationPicker = ({ lat, lng, onChange }) => {
  const [layer, setLayer] = useState("satelit");
  const hasPoint = lat !== "" && lat != null && lng !== "" && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const center = hasPoint ? [Number(lat), Number(lng)] : RT_MAP_CENTER;
  return (
    <div>
      <div className="mb-2 flex justify-end"><MapLayerToggle layer={layer} setLayer={setLayer} /></div>
      <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${C.border}`, height: 260 }}>
        <MapContainer center={center} zoom={hasPoint ? 19 : 17} maxZoom={21} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer key={layer} attribution={MAP_LAYERS[layer].attribution} url={MAP_LAYERS[layer].url} maxNativeZoom={MAP_LAYERS[layer].maxNativeZoom} maxZoom={MAP_LAYERS[layer].maxZoom} />
          <MapAutoResize />
          <MapClickHandler onPick={(la, ln) => onChange(la.toFixed(6), ln.toFixed(6))} />
          {hasPoint && <Marker position={[Number(lat), Number(lng)]} icon={houseMarkerIcon(C.navy)} />}
        </MapContainer>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs" style={{ color: C.textMuted }}>
        <span className="flex items-center gap-1.5"><MapPin size={12} />{hasPoint ? `Titik dipilih: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : "Klik pada peta untuk menandai lokasi rumah"}</span>
        {hasPoint && <button type="button" onClick={() => onChange("", "")} className="rtd-focus font-semibold underline" style={{ color: C.red }}>Hapus titik</button>}
      </div>
    </div>
  );
};
