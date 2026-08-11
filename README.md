# RT Digital

Aplikasi administrasi RT (kas, iuran warga, jimpitan, arisan, dana sosial, laporan) dengan **Google Spreadsheet sebagai database** dan **Google Apps Script sebagai backend**. Frontend di-hosting gratis di **GitHub Pages**.

---

## Bagian 1 — Setup Backend (Google Spreadsheet + Apps Script)

1. Buat **Google Spreadsheet baru** di [sheets.google.com](https://sheets.google.com) (boleh kosong).
2. Buka **Extensions > Apps Script**.
3. Hapus isi `Code.gs` bawaan, tempel seluruh isi file **`Code.gs`** dari folder project ini.
4. Ganti baris berikut dengan token rahasia buatan sendiri (bebas, contoh: string acak 20+ karakter):
   ```js
   const API_TOKEN = "GANTI_DENGAN_TOKEN_RAHASIA_ANDA_SENDIRI";
   ```
5. Di dropdown fungsi (atas editor), pilih **`SETUP`**, klik **Run (▶)**.
   - Google akan minta izin — klik **Review permissions > pilih akun Anda > Advanced > Go to (nama project) > Allow**.
   - Setelah selesai muncul alert "Setup selesai!" — sheet `Users`, `Transactions`, `Payments`, `Jimpitan`, `Arisan`, `Settings` otomatis terisi data demo.
6. Klik **Deploy > New deployment**.
   - Ikon gerigi di "Select type" → pilih **Web app**.
   - Execute as: **Me**. Who has access: **Anyone**.
   - Klik **Deploy**, salin **URL Web App** (berakhiran `/exec`).

Simpan URL dan token itu — dipakai di Bagian 2.

---

## Bagian 2 — Hubungkan Frontend ke Backend

Buka `src/App.jsx`, cari baris berikut lalu isi dengan punya Anda:

```js
const API_URL = "PASTE_URL_WEB_APP_APPS_SCRIPT_DI_SINI";
const API_TOKEN = "GANTI_DENGAN_TOKEN_RAHASIA_ANDA_SENDIRI"; // harus SAMA dengan yang di Code.gs
```

Coba jalankan lokal dulu (opsional tapi disarankan):
```bash
npm install
npm run dev
```
Buka `http://localhost:5173`, login pakai akun demo (`admin@rtdigital.id` / `admin123`), pastikan data muncul dari Spreadsheet.

---

## Bagian 3 — Push ke GitHub

```bash
git init
git add .
git commit -m "RT Digital"
git branch -M main
git remote add origin https://github.com/USERNAME/rt-digital.git
git push -u origin main
```
Ganti `USERNAME` dan nama repo sesuai punya Anda.

**Penting:** buka `vite.config.js`, sesuaikan `base` dengan nama repo Anda:
```js
base: "/nama-repo-anda/",
```
Kalau nama repo Anda `rt-digital`, biarkan `base: "/rt-digital/"` (default sudah benar).

---

## Bagian 4 — Aktifkan GitHub Pages

Repo ini sudah dilengkapi workflow otomatis (`.github/workflows/deploy.yml`) yang akan **build & publish otomatis setiap kali Anda `git push` ke branch `main`**.

Yang perlu dilakukan sekali saja:
1. Buka repo di GitHub → **Settings > Pages**.
2. Pada **Source**, pilih **GitHub Actions** (bukan "Deploy from a branch").
3. Push ulang (atau tunggu workflow pertama selesai jalan otomatis setelah push tadi) — cek progresnya di tab **Actions**.
4. Setelah selesai (centang hijau), aplikasi bisa diakses semua orang di:
   ```
   https://USERNAME.github.io/rt-digital/
   ```

Setiap kali Anda push perubahan kode ke `main`, situs akan otomatis ter-update dalam 1–2 menit.

---

## Catatan Penting untuk Pemakaian Publik

| Isu | Penjelasan |
|---|---|
| **Token API** | `API_TOKEN` tetap terlihat siapa pun yang membuka DevTools browser — ini normal untuk aplikasi frontend statis. Fungsinya hanya mencegah bot/orang asing sembarangan menemukan & memanggil API tanpa sengaja, bukan enkripsi penuh. |
| **Password login** | Sudah di-hash (SHA-256) sebelum disimpan di sheet `Users` — password asli tidak tersimpan. |
| **Tulis data bersamaan** | `Code.gs` sudah pakai `LockService` supaya aman kalau beberapa bendahara input data di waktu yang (hampir) sama. |
| **Kuota Google** | Akun Google gratis dibatasi ±20.000 request/hari untuk Apps Script — lebih dari cukup untuk skala RT/RW. |
| **Update backend** | Kalau `Code.gs` diubah lagi nanti, di Apps Script pilih **Deploy > Manage deployments > ✏️ Edit > Version: New version > Deploy** agar perubahan aktif di URL yang sama (URL tidak berubah). |

---

## Struktur Project
```
rt-digital-app/
├─ Code.gs                 # backend (tempel ke Apps Script)
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ .github/workflows/deploy.yml   # auto-deploy GitHub Pages
└─ src/
   ├─ main.jsx
   ├─ App.jsx              # aplikasi utama (dari rt-digital.jsx)
   └─ index.css
```
