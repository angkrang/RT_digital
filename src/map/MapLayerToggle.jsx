import React from "react";
import { C } from "../constants/theme";
import { MAP_LAYERS } from "./mapConfig";

export const MapLayerToggle = ({ layer, setLayer }) => (
  <div className="inline-flex rounded-lg p-0.5" style={{ background: C.navyFaint }}>
    {Object.entries(MAP_LAYERS).map(([key, l]) => (
      <button
        key={key}
        type="button"
        onClick={() => setLayer(key)}
        className="rtd-focus rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
        style={layer === key ? { background: C.card, color: C.navy, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: C.textMuted }}
      >
        {l.label}
      </button>
    ))}
  </div>
);

/* -- Klik-pilih lokasi di peta (pengganti input lat/lng manual) -- */
