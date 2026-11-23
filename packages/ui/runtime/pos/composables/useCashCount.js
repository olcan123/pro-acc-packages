// useCashCount.js — Vardiya kapanışı kasa sayımı formunun durumu ve API yükü (pos + restoran ORTAK).
// Hesap kuralı tek kaynaktadır: packages/pos-ui/utils/cash-count.ts
import { computeCashCount, cleanBreakdown } from "@pro-acc/ui-vue/utils/cash-count";

/** Boş sayım formu. */
export function emptyCashCount() {
  return { openingFloat: "", counts: {}, countedTotal: "" };
}

/** Form bir sayım içeriyor mu? (kupür dökümü ya da elle toplam) */
export function hasCashCount(model) {
  if (!model) return false;
  return Object.keys(cleanBreakdown(model.counts)).length > 0 || (model.countedTotal !== "" && model.countedTotal != null);
}

/**
 * Formu kapanış API yüküne çevirir. Sayım girilmediyse null döner → sunucu alanları boş bırakır
 * ("0 sayıldı" ile "sayılmadı" ayrıdır).
 */
export function cashCountPayload(model) {
  if (!hasCashCount(model)) return null;
  const counts = cleanBreakdown(model.counts);
  const hasBreakdown = Object.keys(counts).length > 0;
  return {
    openingFloat: Number(model.openingFloat) || 0,
    ...(hasBreakdown ? { counts } : { countedTotal: Number(model.countedTotal) || 0 }),
  };
}

/** Ekranda gösterilecek anlık sonuç (beklenen / sayılan / fark); sayım yoksa null. */
export function cashCountPreview(model, cashSales) {
  return computeCashCount({ ...model, cashSales });
}
