// cash-limit.ts — Nakit işlem limiti UYARISININ tek kaynağı (ERP + POS + restoran).
//
// KURAL (iş sahibi kararı, 12.11.2026):
//   • İşletmeler arası (B2B) faturada NAKİT tahsilat/ödeme 300 €'yu geçerse uyar.
//   • Bireysel alıcıya (POS / "Blerësi Fizik") NAKİT satış 2.000 €'yu geçerse uyar.
// YALNIZ UYARIDIR — hiçbir kayıt engellenmez. Sınırlar kanunla değişirse SADECE buradaki
// iki sabit güncellenir; üç uygulama da aynı değeri okur.

/** B2B (şirket cari) nakit işlem sınırı — EUR. */
export const CASH_LIMIT_BUSINESS = 300;
/** Bireysel alıcı (POS / Blerësi Fizik) nakit işlem sınırı — EUR. */
export const CASH_LIMIT_INDIVIDUAL = 2000;

export type CashLimitParty = "BUSINESS" | "INDIVIDUAL";

export interface CashLimitResult {
  party: CashLimitParty;
  limit: number;
  amount: number;
  /** Sınırı aşan kısım (aşım yoksa 0). */
  excess: number;
  exceeded: boolean;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** Tarafın nakit sınırı. */
export function cashLimitFor(party: CashLimitParty): number {
  return party === "BUSINESS" ? CASH_LIMIT_BUSINESS : CASH_LIMIT_INDIVIDUAL;
}

/**
 * Cari türünden tarafı belirler: COMPANY → B2B; diğer her şey (INDIVIDUAL, carisiz
 * POS satışı, "Blerësi Fizik") → bireysel.
 */
export function cashPartyOf(accountType: string | null | undefined): CashLimitParty {
  return accountType === "COMPANY" ? "BUSINESS" : "INDIVIDUAL";
}

/**
 * Hesap kodu NAKİT kasa mı? Nakit bloğu 1000.0xxx'tir (1000.0001 Arka …);
 * 1000.1xxx kart/POS, 1000.2xxx banka hesabıdır (bkz. payment-methods.catalog.mjs).
 */
export function isCashGlCode(code: string | null | undefined): boolean {
  return /^1000\.0\d{3}$/.test(String(code || "").trim());
}

/**
 * Nakit tutarı sınırla karşılaştırır. "Geçerse" uyarılır → sınırın TAM kendisi serbesttir.
 * Tutarın işareti önemsizdir (iade faturası da nakit hareketidir).
 */
export function checkCashLimit(party: CashLimitParty, cashAmount: number): CashLimitResult {
  const limit = cashLimitFor(party);
  const amount = round2(Math.abs(Number(cashAmount) || 0));
  const excess = round2(Math.max(0, amount - limit));
  return { party, limit, amount, excess, exceeded: excess > 0 };
}
