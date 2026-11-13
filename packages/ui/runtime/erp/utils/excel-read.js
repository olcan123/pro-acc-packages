// excel-read.js — Kullanıcının seçtiği Excel dosyasını SINIRLI biçimde okuyan ortak yardımcı.
//
// Tüm istemci tarafı içe aktarmalar (ExcelImport, fatura kalemleri) bu dosyadan geçer:
//   • dosya boyutu sınırı → tarayıcıyı kilitleyecek dev dosyalar okunmaz,
//   • satır sınırı (xlsx `sheetRows`) → kütüphane sınırın ötesini hiç ayrıştırmaz.
// Sunucudaki eş sınır: server/utils/import-limits.ts (MAX_IMPORT_ROWS ile aynı değer).
const loadXlsx = () => import("../../vendor/xlsx.mjs");

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMPORT_ROWS = 10_000;

/** i18n anahtarı taşıyan içe aktarma hatası. */
export class ExcelImportError extends Error {
  constructor(key, params = {}) {
    super(key);
    this.key = key;
    this.params = params;
  }
}

/** Dosya boyutu sınırını denetler. */
export function assertExcelFileSize(file) {
  if (file && file.size > MAX_IMPORT_BYTES) {
    throw new ExcelImportError("v_import_file_too_large", { max: MAX_IMPORT_BYTES / (1024 * 1024) });
  }
}

/**
 * İlk sayfayı nesne dizisine çevirir. Satır sınırı aşılırsa hata fırlatır
 * (sessizce kırpmak eksik içe aktarma demektir — kullanıcı fark etmez).
 *
 * @param {ArrayBuffer|Uint8Array} data - Dosya içeriği
 * @param {object} [sheetToJsonOptions] - XLSX.utils.sheet_to_json seçenekleri
 * @returns {object[]}
 */
export async function readFirstSheetRows(data, sheetToJsonOptions = {}) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  // Başlık satırı + sınır + 1: sınırı aşan dosyayı tespit edebilmek için bir fazlası okunur.
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(bytes, { type: "array", sheetRows: MAX_IMPORT_ROWS + 2 });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) return [];
  const rows = XLSX.utils.sheet_to_json(worksheet, sheetToJsonOptions);
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ExcelImportError("v_import_too_many_rows", { max: MAX_IMPORT_ROWS });
  }
  return rows;
}

/**
 * ADI VERİLEN sayfaları okur (ör. KontX "Dokumentat" + "DokumentDetalet"). Sayfa adı büyük/küçük
 * harf ve baş/son boşluk duyarsız eşleşir. Zorunlu sayfa yoksa hata; opsiyonel sayfa yoksa boş dizi.
 * Satır sınırı HER sayfa için ayrı uygulanır.
 *
 * @param {ArrayBuffer|Uint8Array} data - Dosya içeriği
 * @param {string[]} required - Bulunması zorunlu sayfa adları
 * @param {string[]} [optional] - Varsa okunan sayfa adları
 * @param {object} [sheetToJsonOptions] - XLSX.utils.sheet_to_json seçenekleri
 * @returns {Record<string, object[]>} sayfa adı (verilen yazımla) → satırlar
 */
export async function readNamedSheetsRows(data, required, optional = [], sheetToJsonOptions = {}) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(bytes, { type: "array", sheetRows: MAX_IMPORT_ROWS + 2 });
  const norm = (name) => String(name).trim().toLocaleLowerCase("tr");
  const byName = new Map(workbook.SheetNames.map((name) => [norm(name), workbook.Sheets[name]]));

  const missing = required.filter((name) => !byName.has(norm(name)));
  if (missing.length > 0) {
    throw new ExcelImportError("v_import_missing_sheets", { sheets: missing.join(", ") });
  }

  const result = {};
  for (const name of [...required, ...optional]) {
    const sheet = byName.get(norm(name));
    const rows = sheet ? XLSX.utils.sheet_to_json(sheet, sheetToJsonOptions) : [];
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new ExcelImportError("v_import_too_many_rows", { max: MAX_IMPORT_ROWS });
    }
    result[name] = rows;
  }
  return result;
}
