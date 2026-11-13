// orderMath.ts — Fiş satırı tutar/KDV hesabının TEK kaynağı — pos + restoran ORTAK (saf fonksiyonlar).
// Fiyatlar KDV DAHİL (perakende "Çmimi me TVSH"): vat = gross * rate / (100 + rate).
// Fiş (order.base), restoran adisyonu ve masa haritası toplamı AYNI satır yuvarlamasını kullanır.
import { toNumber } from "./decimal.ts";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Tek kalemin KDV dahil tutarını ve içindeki KDV'yi hesaplar (satır bazında yuvarlanır). */
export function calcLine(item: { quantity: unknown; unitPrice: unknown; vatRate?: number; discount?: number }) {
  const quantity = toNumber(item.quantity);
  const unitPrice = toNumber(item.unitPrice);
  const vatRate = item.vatRate ?? 0;
  const gross = round2(quantity * unitPrice * (1 - (item.discount ?? 0) / 100));
  const vat = round2((gross * vatRate) / (100 + vatRate));
  return { gross, vat };
}

/** Kalemlerin KDV dahil toplamı (fişin totalAmount'u ile birebir aynı formül). */
export function orderTotalOf(items: { quantity: unknown; unitPrice: unknown; discount?: number }[]): number {
  return round2(items.reduce((s, it) => s + calcLine(it).gross, 0));
}
