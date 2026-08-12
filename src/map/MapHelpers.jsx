import React, { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export const MapClickHandler = ({ onPick }) => {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

export const MapAutoResize = () => {
  const map = useMap();
  useEffect(() => {
    const timers = [80, 250, 500].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export const FitBoundsToMarkers = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 19);
    } else {
      map.fitBounds(points, { padding: [32, 32], maxZoom: 19 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);
  return null;
};

export const houseMarkerIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
             <span style="transform:rotate(45deg);color:#fff;font-size:10px;font-weight:800;font-family:sans-serif;">🏠</span>
           </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });

/* -- Perbaikan bug umum Leaflet: peta di dalam modal/tab sering menghitung
   ukurannya sebelum layout benar-benar selesai (mis. animasi modal .18s),
   sehingga sebagian tile OpenStreetMap tidak termuat / peta terlihat
   "tidak update". invalidateSize() memaksa Leaflet menghitung ulang. -- */
