// date.ts — ERP, POS ve restoran için ortak dd.mm.yyyy tarih gösterimi.

/** Gün ve ayı iki, yılı en az dört haneli gösterir. */
const pad = (value: number, length = 2): string => String(value).padStart(length, "0");

/** ISO takvim gününü doğrular; 31 Nisan gibi değerlerin başka güne taşmasını engeller. */
function parseDate(value: unknown): Date | null {
  if (typeof value === "string") {
    value = value.trim();
    if (!value) return null;
    const calendar = /^(\d{4})-(\d{2})-(\d{2})(?=$|T| )/.exec(value as string);
    if (calendar) {
      const year = Number(calendar[1]);
      const month = Number(calendar[2]);
      const day = Number(calendar[3]);
      const check = new Date(0);
      check.setUTCFullYear(year, month - 1, day);
      if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
      if ((value as string).length === 10) {
        const local = new Date(0);
        local.setFullYear(year, month - 1, day);
        local.setHours(0, 0, 0, 0);
        return local;
      }
    }
  }
  if (!(value instanceof Date) && typeof value !== "string" && typeof value !== "number") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Yalnız gösterim içindir: ISO/API ve date input değerlerini değiştirmez.
 * YYYY-MM-DD takvim günleri saat diliminden bağımsızdır. Zaman damgaları varsayılan
 * olarak çalışılan ortamın yerel saatini kullanır; UTC takvim raporları açıkça utc seçer.
 */
export function formatDate(value: unknown, empty = "-", timeZone: "local" | "utc" = "local"): string {
  const date = parseDate(value);
  if (!date) return empty;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split("-");
    return `${day}.${month}.${year}`;
  }
  const utc = timeZone === "utc";
  return `${pad(utc ? date.getUTCDate() : date.getDate())}.${pad((utc ? date.getUTCMonth() : date.getMonth()) + 1)}.${pad(utc ? date.getUTCFullYear() : date.getFullYear(), 4)}`;
}

/** Tarih ve yerel saati ortak gösterim biçimine dönüştürür. */
export function formatDateTime(value: unknown, empty = "-", seconds = false): string {
  const date = parseDate(value);
  if (!date) return empty;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}${seconds ? `:${pad(date.getSeconds())}` : ""}`;
  return `${formatDate(value, empty)} ${time}`;
}
