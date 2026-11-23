// useUnitLabel.js — Ölçü birimi (SEF "Njësia Matëse") görünen ad/etiket yardımcıları.
// ÜÇ uygulama da (main, pos, restaurant) aynı gösterimi kullanır: DB'de birimin
// resmi SEF adı (Arnavutça) durur, arayüzde kullanıcının diline çevrilir.
//
// Çeviri anahtarı kurallı üretilir: SEF kodu → küçük harf, aksan ASCII'ye indirgenir,
// harf/rakam dışı karakterler "_" olur. Örn: "CP" → unit_sef_cp, "KËH" → unit_sef_keh,
// "M/S2" → unit_sef_m_s2. Çeviri yoksa DB'deki resmi SEF adına düşülür.

import { useI18n } from "vue-i18n";

/**
 * SEF birim kodundan i18n anahtarı üretir.
 *
 * @param {string | null | undefined} code SEF kodu (ör. "LTR", "KËH")
 * @returns {string} i18n anahtarı (ör. "unit_sef_ltr") — kod yoksa boş string
 *
 * @example
 * unitI18nKey("KËH")  // → "unit_sef_keh"
 * unitI18nKey("M/S2") // → "unit_sef_m_s2"
 */
export function unitI18nKey(code) {
  if (!code) return "";
  const slug = String(code)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug ? `unit_sef_${slug}` : "";
}

/**
 * @param {{ t: Function, te: Function } | undefined} [i18n] Testlerde enjekte edilebilen
 *   i18n arayüzü. Verilmezse aktif Vue-i18n örneği (useI18n) kullanılır — uygulamada
 *   her zaman bu yol işler; enjeksiyon yalnız birim testleri içindir.
 */
export const useUnitLabel = (i18n) => {
  const { t, te } = i18n ?? useI18n();

  /**
   * Birimin kullanıcı dilindeki adı. Çeviri yoksa resmi SEF adı (Arnavutça) döner.
   *
   * @param {{ code?: string, name?: string } | null} unit Birim nesnesi
   * @returns {string} Görünen ad (ör. "Adet")
   */
  function unitName(unit) {
    const key = unitI18nKey(unit?.code);
    if (key && te(key)) return t(key);
    return unit?.name ?? "";
  }

  /**
   * Seçim listesi etiketi: "KOD — Ad (sembol)".
   *
   * @param {{ code?: string, name?: string, symbol?: string } | null} unit Birim nesnesi
   * @returns {string} Tam etiket (ör. "CP — Adet (cop)")
   */
  function unitLabel(unit) {
    if (!unit) return "";
    const name = unitName(unit);
    const parts = [];
    if (unit.code) parts.push(unit.code);
    if (name) parts.push(name);
    const head = parts.join(" — ");
    return unit.symbol ? `${head} (${unit.symbol})` : head;
  }

  /**
   * Fatura/fiş satırlarında kullanılan kısa gösterim: sembol varsa sembol,
   * yoksa kod, o da yoksa ad.
   *
   * @param {{ code?: string, name?: string, symbol?: string } | null} unit Birim nesnesi
   * @returns {string} Kısa gösterim (ör. "cop")
   */
  function unitShort(unit) {
    return unit?.symbol || unit?.code || unitName(unit);
  }

  return { unitName, unitLabel, unitShort, unitI18nKey };
};
