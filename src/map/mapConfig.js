import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export const RT_MAP_CENTER = [-7.674597, 110.344724]; // Gang Sempit, Sidomulyo, Triharjo, Sleman

/* -- Dua pilihan tampilan peta: "Peta Jalan" (data OpenStreetMap, kadang
   belum sesuai kondisi asli karena hasil kontribusi komunitas) dan "Citra
   Satelit" (foto udara asli dari Esri, gratis tanpa API key) supaya
   kondisi rumah/tanah sebenarnya tetap bisa dicek. -- */
/* -- maxZoom WAJIB diset eksplisit di TileLayer: default bawaan Leaflet
   untuk TileLayer adalah 18, lebih rendah dari maxZoom MapContainer (21).
   Kalau tidak diset, begitu peta di-zoom melewati 18, GridLayer berhenti
   me-render tile sama sekali sehingga layar peta terlihat blank/kosong. -- */

export const MAP_LAYERS = {
  jalan: {
    label: "Peta Jalan",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
    maxZoom: 21,
  },
  satelit: {
    label: "Citra Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxNativeZoom: 19,
    maxZoom: 21,
  },
};
