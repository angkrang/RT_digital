export const API_URL = "https://script.google.com/macros/s/AKfycbxse55nZ354Rp58E9joi0OfH8_FQI1BimZPc_Ry7pS-xI7MIP1h2fuMyzVYzbORXOb6zg/exec";

export const API_TOKEN = "Mocacino3in1kopiku"; // harus SAMA PERSIS dengan API_TOKEN di Code.gs

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text || text.trimStart().startsWith("<")) {
    // Server mengembalikan HTML (mis. halaman error 404 / GAS belum di-deploy)
    throw new Error(
      `Server mengembalikan respons tidak valid (HTTP ${res.status}). ` +
      `Pastikan Google Apps Script sudah di-deploy ulang dan API_URL di client.js sudah diperbarui.`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Respons server bukan JSON yang valid. Periksa kembali URL deployment Apps Script.");
  }
}

export async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, token: API_TOKEN, ...params }).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  const json = await parseJsonSafe(res);
  if (!json.ok) throw new Error(json.error || "Gagal memuat data dari server.");
  return json.data;
}

export async function apiPost(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: API_TOKEN, payload }),
  });
  const json = await parseJsonSafe(res);
  if (!json.ok) throw new Error(json.error || "Gagal menyimpan data ke server.");
  return json.data;
}

/* ============================================================
   CONSTANTS / MOCK "SERVICE LAYER"
   Data referensi (kategori, daftar warga, dsb.) tetap disimpan
   di sini. Data transaksional (kas, pembayaran, jimpitan, arisan,
   pengaturan, akun login) sekarang diambil & disimpan lewat
   Google Spreadsheet melalui fungsi apiGet/apiPost di atas.
   ============================================================ */
