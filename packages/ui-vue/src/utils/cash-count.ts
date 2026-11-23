// cash-count.ts — Vardiya kapanışı kasa sayımının TEK KAYNAĞI (POS + restoran + ERP).
//
// Kasiyer Z-raporunu kapatırken çekmecedeki parayı sayar:
//   beklenen = açılış nakdi (kasa başı) + vardiyanın nakit satışı
//   fark     = sayılan − beklenen      → eksi: kasa AÇIĞI · artı: kasa FAZLASI
// Hesap kuruş (tamsayı) üzerinden yapılır; 0,1 + 0,2 gibi kayan nokta hataları oluşmaz.

/** EUR banknot ve madeni paraları — ekrandaki sıra (büyükten küçüğe). */
export const EUR_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01] as const;

/** Banknot mu? (5 € ve üstü kâğıt, altı madeni) — ekranda iki sütuna ayırmak için. */
export function isBanknote(denomination: number): boolean {
  return denomination >= 5;
}

/** Adet sözlüğü: kupür (metin anahtar, ör. "50" ya da "0.5") → adet. */
export type DenominationCounts = Record<string, number | string | null | undefined>;

export interface CashCountInput {
  /** Vardiya başında çekmecede bırakılan nakit (kasa başı). */
  openingFloat?: number | string | null;
  /** Vardiyanın nakit satış toplamı (para üstü düşülmüş). */
  cashSales: number | string | null;
  /** Kupür dökümü. Doluysa sayılan tutar bundan hesaplanır. */
  counts?: DenominationCounts | null;
  /** Döküm girilmediyse elle yazılan sayılan toplam. */
  countedTotal?: number | string | null;
}

export interface CashCountResult {
  openingFloat: number;
  cashSales: number;
  expected: number;
  counted: number;
  /** sayılan − beklenen (eksi = açık, artı = fazla). */
  difference: number;
  /** Yalnız adedi > 0 olan kupürler. */
  breakdown: Record<string, number>;
}

const toCents = (n: unknown) => Math.round((Number(n) || 0) * 100);
const fromCents = (c: number) => Math.round(c) / 100;
const isBlank = (v: unknown) => v === null || v === undefined || v === "";

/** Geçerli kupür anahtarlarını ve pozitif tamsayı adetleri süzer. */
export function cleanBreakdown(counts: DenominationCounts | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!counts) return out;
  for (const d of EUR_DENOMINATIONS) {
    const qty = Math.floor(Number(counts[String(d)]) || 0);
    if (qty > 0) out[String(d)] = qty;
  }
  return out;
}

/** Kupür dökümünün toplamı (EUR). Tanımsız kupürler ve eksi adetler yok sayılır. */
export function sumDenominations(counts: DenominationCounts | null | undefined): number {
  const clean = cleanBreakdown(counts);
  let cents = 0;
  for (const [d, qty] of Object.entries(clean)) cents += toCents(d) * qty;
  return fromCents(cents);
}

/**
 * Kasa sayımını hesaplar. Sayım YAPILMADIYSA (ne döküm ne elle toplam) null döner —
 * "0 € sayıldı" ile "sayılmadı" birbirinden ayrılmalıdır.
 */
export function computeCashCount(input: CashCountInput): CashCountResult | null {
  const breakdown = cleanBreakdown(input.counts);
  const hasBreakdown = Object.keys(breakdown).length > 0;
  if (!hasBreakdown && isBlank(input.countedTotal)) return null;

  const openingCents = Math.max(0, toCents(input.openingFloat));
  const salesCents = toCents(input.cashSales);
  const countedCents = hasBreakdown ? toCents(sumDenominations(breakdown)) : Math.max(0, toCents(input.countedTotal));
  const expectedCents = openingCents + salesCents;

  return {
    openingFloat: fromCents(openingCents),
    cashSales: fromCents(salesCents),
    expected: fromCents(expectedCents),
    counted: fromCents(countedCents),
    difference: fromCents(countedCents - expectedCents),
    breakdown,
  };
}

/** Fark yönü: "short" (açık) · "over" (fazla) · "ok" (tam). 1 kuruştan küçük fark yok sayılır. */
export function cashDifferenceKind(difference: number): "short" | "over" | "ok" {
  const cents = toCents(difference);
  return cents < 0 ? "short" : cents > 0 ? "over" : "ok";
}
