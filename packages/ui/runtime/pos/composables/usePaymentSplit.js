// usePaymentSplit.js — Split (liste) ödeme satırlarını fiş payload ödemelerine çevirir.
// Her satır: Arka (Nakit) veya bir banka(kart) hesabı. Nakit fazlası para üstüdür → nakitten düşülür.
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v) => Math.max(0, Number(v) || 0);

/**
 * Kasada KALAN nakit: girilen nakitten para üstü düşülür (para üstü nakit iade edilir).
 * Nakit işlem limiti uyarısı bu tutara bakar — müşterinin uzattığı banknota değil.
 *
 * @param {number|string} cashEntered  Nakit satırına girilen tutar
 * @param {number} change  Toplam ödenen − ödenecek (> 0 = para üstü)
 * @returns {number}
 */
export function cashKeptAfterChange(cashEntered, change) {
  return Math.max(0, round2(num(cashEntered) - Math.max(0, Number(change) || 0)));
}

/**
 * SEF ödeme yöntemi kodları üretilir: nakit → CASH, kart → CARD_CREDIT / CARD_DEBIT.
 * Kredi ve banka kartı AYNI terminal GL hesabına düşer; ayrım yalnız ödeme kaydında
 * (ve ATK bildiriminde) taşınır — bkz. main/prisma/payment-methods.catalog.mjs.
 *
 * @param {Array<{key:string, type:'CASH'|'CARD', terminalId?:string, cardType?:'CREDIT'|'DEBIT'}>} rows  Ödeme satırları (Arka + bankalar)
 * @param {Record<string, number|string>} amounts  Satır key → girilen tutar
 * @param {number} toPay  Ödenecek toplam
 * @returns {Array<{paymentMethod:'CASH'|'CARD_CREDIT'|'CARD_DEBIT', amount:number, bankTerminalId?:string}>}
 */
export function buildSplitPayments(rows, amounts, toPay) {
  const totalPaid = rows.reduce((s, r) => s + num(amounts[r.key]), 0);
  const change = round2(totalPaid - (Number(toPay) || 0)); // > 0 = para üstü (nakitten)

  const payments = [];
  for (const r of rows) {
    let amt = num(amounts[r.key]);
    // Nakit fazlası para üstü olarak iade edilir → kaydedilen nakit tutarından düş
    if (r.type === "CASH" && change > 0) amt = Math.max(0, round2(amt - change));
    if (amt <= 0) continue;
    payments.push(
      r.type === "CASH"
        ? { paymentMethod: "CASH", amount: amt }
        : {
            // Kart türü satırda seçilir; belirtilmemişse kredi kartı varsayılır
            paymentMethod: r.cardType === "DEBIT" ? "CARD_DEBIT" : "CARD_CREDIT",
            amount: amt,
            bankTerminalId: r.terminalId,
          },
    );
  }

  // Bedelsiz fiş (toplam 0) → 0 tutarlı nakit satırı
  if (payments.length === 0 && (Number(toPay) || 0) === 0) {
    payments.push({ paymentMethod: "CASH", amount: 0 });
  }
  return payments;
}
