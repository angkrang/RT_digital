import { ARISAN_MEMBER_IDS } from "../constants/data";

export function computeObligation(residentId, settings) {
  const member = isArisanMember(residentId);
  const iuran = settings.iuranAmount;
  const arisan = member ? settings.arisanAmount : 0;
  const sosial = member ? settings.sosialWajibAmount : 0;
  return { iuran, arisan, sosial, total: iuran + arisan + sosial, isArisanMember: member };
}

// Bagi nominal yang dibayarkan ke kategori Iuran -> Arisan -> Dana Sosial,
// dengan memperhitungkan porsi yang sudah tertutup dari pembayaran sebelumnya.

export function allocatePayment(paidBefore, amountNow, ob) {
  const buckets = [["iuran", ob.iuran], ["arisan", ob.arisan], ["sosial", ob.sosial]];
  let remainingBefore = paidBefore;
  let remainingNow = amountNow;
  const result = { iuran: 0, arisan: 0, sosial: 0 };
  for (const [key, cap] of buckets) {
    const coveredBefore = Math.min(remainingBefore, cap);
    remainingBefore -= coveredBefore;
    const capLeft = cap - coveredBefore;
    const applyHere = Math.min(remainingNow, capLeft);
    result[key] = applyHere;
    remainingNow -= applyHere;
  }
  return result;
}

export const paymentStatusOf = (paid, total) => (paid <= 0 ? "Belum Bayar" : paid < total ? "Sebagian" : "Lunas");

export const isArisanMember = (residentId) => ARISAN_MEMBER_IDS.includes(residentId);
