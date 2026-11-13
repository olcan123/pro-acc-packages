// tender.ts — Ödeme yöntemi (tender) kurallarının TEK kaynağı — pos + restoran ORTAK.
// Normalize (eski "CARD" → CARD_CREDIT), kart ailesi, vardiya nakit/kart ayrımı ve main'e giden
// ödeme satırlarının GL hesabına göre gruplanması yalnız burada tanımlıdır.
// OTORİTE main/prisma/payment-methods.catalog.mjs'dedir; burada yalnız kasada SEÇİLEBİLEN alt küme vardır.
import { toNumber } from "./decimal.ts";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Kasada seçilebilen SEF ödeme yöntemleri. Vauçer/çek vb. main'de elle tahsil edilir. */
export const POS_PAYMENT_METHODS = ["CASH", "CARD_CREDIT", "CARD_DEBIT"] as const;

/** Kart ailesi — iki tür de AYNI terminal GL hesabına düşer; ayrım ATK bildirimi içindir. */
export const POS_CARD_METHODS: readonly string[] = ["CARD_CREDIT", "CARD_DEBIT"];

/**
 * Ödeme yöntemi kodunu normalize eder: boşluk kırpılır, büyük harfe çevrilir,
 * eski "CARD" değeri CARD_CREDIT olur (sahada güncellenmemiş kasalar / eski fişler).
 */
export function normalizePaymentMethod(value: unknown): string {
  const upper = (typeof value === "string" ? value : "").trim().toUpperCase();
  return upper === "CARD" ? "CARD_CREDIT" : upper;
}

/** Kart ailesinden mi? (CARD, CARD_CREDIT, CARD_DEBIT — büyük/küçük harf duyarsız) */
export function isCardMethod(value: unknown): boolean {
  return POS_CARD_METHODS.includes(normalizePaymentMethod(value));
}

type PaymentLike = { paymentMethod: unknown; amount: unknown; bankTerminalId?: string | null };

/** Ödemeleri vardiya toplamları için nakit / kart olarak ayırır (Z ve X raporu, fiş toplamı). */
export function splitCashCard(payments: PaymentLike[]): { cash: number; card: number } {
  let cash = 0;
  let card = 0;
  for (const p of payments) {
    if (isCardMethod(p.paymentMethod)) card += toNumber(p.amount);
    else cash += toNumber(p.amount);
  }
  return { cash: round2(cash), card: round2(card) };
}

/**
 * Bir ödemenin main'deki GL hesabı:
 *   CASH          → kasa hesabı (ayarlardaki cashGlAccountId)
 *   kart ailesi   → seçilen banka terminalinin hesabı
 * Çözülemezse 0 döner (main bu satırı reddeder → hata terminalde görünür).
 */
export function resolvePaymentGlAccount(
  p: PaymentLike,
  ctx: { cashGlAccountId?: number | null; terminalGlById: Map<string, number> },
): number {
  const method = normalizePaymentMethod(p.paymentMethod);
  if (method === "CASH") return ctx.cashGlAccountId ?? 0;
  if (POS_CARD_METHODS.includes(method) && p.bankTerminalId) {
    return ctx.terminalGlById.get(p.bankTerminalId) ?? 0;
  }
  return 0;
}

/**
 * Main'e gidecek ödeme satırları: normalize yöntem + GL hesabı bazında toplanır.
 * Sıra ilk görülme sırasıdır (deterministik payload).
 */
export function groupPaymentsForMain(
  payments: PaymentLike[],
  ctx: { cashGlAccountId?: number | null; terminalGlById: Map<string, number> },
): { method: string; amount: number; glAccountId: number }[] {
  const groups = new Map<string, { method: string; amount: number; glAccountId: number }>();
  for (const p of payments) {
    const method = normalizePaymentMethod(p.paymentMethod);
    const glAccountId = resolvePaymentGlAccount(p, ctx);
    const key = `${method}-${glAccountId}`;
    const existing = groups.get(key);
    if (existing) existing.amount = round2(existing.amount + toNumber(p.amount));
    else groups.set(key, { method, amount: toNumber(p.amount), glAccountId });
  }
  return Array.from(groups.values());
}
