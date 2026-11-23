// useExcelExport.js — Veri dizisini Excel (.xlsx) dosyası olarak indirmeye hazırlayan composable (başlıklar daima Arnavutça).
// xlsx-js-style: xlsx'in stil (kenarlık/hizalama/font) destekli drop-in çatallaması.

import {
  buildSqReverseMap,
  buildSqReverseMapFromTranslator,
  toSqHeader,
  translateRowKeys,
  translateHeaderRows,
} from "../utils/excel-headers.ts";

// Excel başlıkları arayüz dilinden BAĞIMSIZ olarak Arnavutça yazılır (ATK/resmi çıktı kuralı).
//
// Sözlük NASIL kurulur:
//   • Uygulamada (Nuxt): vue-i18n'in kendi t() fonksiyonuyla — `t(key, {}, { locale })`.
//     ⚠ Locale JSON'u doğrudan import EDİLMEZ: @nuxtjs/i18n'in Vite eklentisi bu dosyaları
//     (`?raw` dahil!) derlenmiş mesaj nesnesine çevirir; düz okunursa sözlük BOŞ kalır ve
//     başlıklar Türkçe çıkar. t() ise her biçimi doğru çözer.
//   • Nuxt dışında (birim testi): ham JSON okunur.
// Sözlük locale başına BİR KEZ kurulur; arayüz zaten Arnavutça ise çeviriye gerek yoktur.
const mapCache = new Map();

// PAKET BOYUTU: xlsx-js-style (~1 MB) yalnız dışa aktarma anında yüklenir. Bu composable onlarca
// liste/rapor sayfasında kullanıldığı için statik import kütüphaneyi o sayfaların chunk'larına
// gömüyordu. Kilit: tests/unit/app/composables/useExcelExport.test.js
const loadXlsx = () => import("xlsx-js-style");

const loadFromI18n = (i18n) => {
  const current = typeof i18n.locale === "object" ? i18n.locale.value : i18n.locale;
  if (!current || current === "sq") return Promise.resolve(new Map());
  if (!mapCache.has(current)) {
    mapCache.set(
      current,
      Promise.resolve(i18n.loadLocaleMessages?.("sq"))
        .then(() =>
          buildSqReverseMapFromTranslator(
            Object.keys(i18n.getLocaleMessage(current) || {}),
            (key) => i18n.t(key, {}, { locale: current }),
            (key) => i18n.t(key, {}, { locale: "sq" }),
          ),
        )
        // Sözlük kurulamazsa dışa aktarma ENGELLENMEZ; başlıklar olduğu gibi kalır.
        .catch(() => new Map()),
    );
  }
  return mapCache.get(current);
};

const loadFromJson = () => {
  if (!mapCache.has("__json__")) {
    mapCache.set(
      "__json__",
      Promise.all([import("../i18n/locales/tr.json?raw"), import("../i18n/locales/sq.json?raw")])
        .then(([tr, sq]) => buildSqReverseMap([JSON.parse(tr.default)], JSON.parse(sq.default)))
        .catch(() => new Map()),
    );
  }
  return mapCache.get("__json__");
};

export const useExcelExport = () => {
  // Nuxt bağlamı varsa i18n örneği setup sırasında yakalanır (tıklama anında bağlam olmayabilir).
  const nuxtApp = typeof tryUseNuxtApp === "function" ? tryUseNuxtApp() : null;
  const i18n = nuxtApp?.$i18n ?? null;
  const loadSqHeaderMap = () => (i18n ? loadFromI18n(i18n) : loadFromJson());
  // Sayfa açılışında sözlüğü ısıt: tıklama anında bekleme olmasın.
  loadSqHeaderMap();

  /**
   * Verilen nesne dizisini Excel (.xlsx) dosyasına dönüştürür ve tarayıcıda indirmeyi başlatır.
   * Her nesnenin anahtarları sütun başlığı, değerleri ise hücre içeriği olur.
   * Dosya sıkıştırma (compression) etkin olarak oluşturulur.
   *
   * @param {Array<Object>} data - Dışa aktarılacak nesne dizisi; boş veya undefined ise işlem yapılmaz
   * @param {string} [filename="export"] - İndirilecek dosyanın adı (uzantısız; .xlsx otomatik eklenir)
   * @param {string} [sheetName="Sheet1"] - Excel çalışma sayfasının adı
   * @returns {Promise<void>} - Başlıklar çevrildikten sonra tarayıcı dosya indirme diyaloğunu tetikler
   *
   * @example
   * exportToExcel(products, "urunler", "Ürün Listesi")
   * // → "urunler.xlsx" indirilir
   */
  const exportToExcel = async (data, filename = "export", sheetName = "Sheet1") => {
    if (!data || !data.length) {
      console.warn("No data to export");
      return;
    }

    // Sütun başlıkları (nesne anahtarları) ve sayfa adı Arnavutça'ya çevrilir; hücre verisi değişmez.
    const headerMap = await loadSqHeaderMap();
    const rows = translateRowKeys(data, headerMap);
    sheetName = toSqHeader(sheetName, headerMap);
    const XLSX = await loadXlsx();

    // Nesne dizisinden XLSX çalışma sayfası oluştur
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Yeni çalışma kitabı oluştur ve sayfayı ekle
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Sıkıştırarak dosyayı yaz ve tarayıcıda indirmeyi tetikle
    XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
  };

  /**
   * Düşük seviyeli dışa aktarım: dizi-dizisi (aoa) + birleştirilmiş hücreler + sütun genişlikleri.
   * Çok katmanlı başlıklı resmi defter/form çıktıları için kullanılır.
   *
   * @param {Array<Array<any>>} aoa - Satır dizisi (her satır hücre dizisi)
   * @param {Array<{s:{r,c},e:{r,c}}>} [merges=[]] - Birleştirilecek hücre aralıkları (0-indeksli)
   * @param {Array<{wch:number}>} [cols=[]] - Sütun genişlikleri (karakter birimi)
   * @param {string} [filename="export"] - Dosya adı (uzantısız)
   * @param {string} [sheetName="Sheet1"] - Çalışma sayfası adı
   * @param {number} [headerRows=0] - İlk N satıra (başlık) kenarlık + ortalama + kaydırma uygula
   * @returns {Promise<void>} - Tarayıcı dosya indirme diyaloğunu tetikler
   */
  const exportAoaToExcel = async (
    aoa,
    merges = [],
    cols = [],
    filename = "export",
    sheetName = "Sheet1",
    headerRows = 0,
  ) => {
    if (!aoa || !aoa.length) {
      console.warn("No data to export");
      return;
    }

    // Yalnız başlık satırları (ve sayfa adı) Arnavutça'ya çevrilir; gövde olduğu gibi kalır.
    const headerMap = await loadSqHeaderMap();
    aoa = translateHeaderRows(aoa, headerRows, headerMap);
    sheetName = toSqHeader(sheetName, headerMap);
    const XLSX = await loadXlsx();

    // Dizi-dizisinden çalışma sayfası oluştur
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    // Birleştirilmiş hücreler ve sütun genişliklerini uygula
    if (merges.length) worksheet["!merges"] = merges;
    if (cols.length) worksheet["!cols"] = cols;

    // Başlık satırlarına kenarlık + ortalama + metin kaydırma uygula
    if (headerRows > 0) {
      const thin = { style: "thin", color: { rgb: "000000" } };
      const headerStyle = {
        border: { top: thin, bottom: thin, left: thin, right: thin },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        font: { bold: true },
      };
      // Tüm satırların en uzununa göre sütun sayısı
      const colCount = aoa.reduce((m, r) => Math.max(m, r.length), 0);
      for (let r = 0; r < headerRows; r++) {
        for (let c = 0; c < colCount; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          // Boş hücreleri de oluştur ki birleştirilmiş başlığın kenarlığı tam çıksın
          if (!worksheet[ref]) worksheet[ref] = { t: "s", v: "" };
          worksheet[ref].s = headerStyle;
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
  };

  return { exportToExcel, exportAoaToExcel };
};
