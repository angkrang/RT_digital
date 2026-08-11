import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PENTING untuk GitHub Pages:
// base harus "/NAMA-REPO-ANDA/" (diawali & diakhiri garis miring),
// contoh kalau repo Anda bernama "rt-digital" maka base = "/rt-digital/".
// Kalau memakai custom domain, ganti base menjadi "/".
export default defineConfig({
  plugins: [react()],
  base: "/rt-digital/",
});
