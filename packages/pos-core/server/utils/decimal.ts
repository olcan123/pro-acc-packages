// decimal.ts — Prisma Decimal tipini güvenli şekilde number'a çeviren yardımcı.
// SQLite + Prisma Decimal değerleri aritmetikte doğrudan kullanılamaz; her yerde toNumber() ile çevir.

/**
 * Prisma Decimal, null veya undefined değeri number'a dönüştürür.
 * @param {any} val - Decimal, string, number, null veya undefined
 * @returns {number} Dönüştürülmüş sayı; boş/null/undefined için 0
 */
export const toNumber = (val: any): number => parseFloat(String(val ?? 0));
