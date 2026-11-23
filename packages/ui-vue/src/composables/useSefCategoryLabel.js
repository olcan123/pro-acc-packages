// useSefCategoryLabel.js — SEF mal/hizmet kategorisi (Kategoria e mallrave dhe
// shërbimeve) görünen ad, etiket ve ATK kodu yardımcıları.
//
// ÜÇ uygulama da (main, pos, restaurant) aynı gösterimi kullanır: DB'de kategorinin
// resmi SEF adı (Arnavutça) durur, arayüzde kullanıcının diline çevrilir.
//
// Çeviri anahtarı kurallı üretilir — SEF KODUNDAN DEĞİL, sefNo'DAN: resmi tabloda
// "PM" kodu iki kategoride birden geçer (no.8 Pajisje mjekësore, no.36 Produkte të
// miellit), bu yüzden koda dayalı anahtar iki kategoriyi karıştırırdı.
// Örn: sefNo 8 → sef_cat_8, sefNo 36 → sef_cat_36.

import { useI18n } from "vue-i18n";

/** Hiçbir SEF kategorisine bağlanmamış ürünlerin ATK koduna verilen değer. */
export const SEF_FALLBACK_CATEGORY_CODE = "TT";

/**
 * SEF sıra numarasından i18n anahtarı üretir.
 *
 * @param {number | null | undefined} sefNo Resmi tablo sırası (1..53)
 * @returns {string} i18n anahtarı (ör. "sef_cat_8") — geçersizse boş string
 */
export function sefCategoryI18nKey(sefNo) {
  const n = Number(sefNo);
  if (!Number.isInteger(n) || n < 1 || n > 53) return "";
  return `sef_cat_${n}`;
}

/**
 * Kategoriden ATK/SEF kodunu çözer: kendi kodu → üst kategorinin kodu → "TT".
 * Sunucu tarafındaki server/utils/sef-category.ts ile AYNI kuralı uygular.
 *
 * @param {{ code?: string, parent?: { code?: string } } | null} category Kategori
 * @returns {string} ATK kodu (ör. "UR"); çözülemezse "TT"
 */
export function resolveSefCategoryCode(category) {
  const own = category?.code?.trim();
  if (own) return own.toUpperCase();

  const inherited = category?.parent?.code?.trim();
  if (inherited) return inherited.toUpperCase();

  return SEF_FALLBACK_CATEGORY_CODE;
}

export const useSefCategoryLabel = (i18n) => {
  const { t, te } = i18n ?? useI18n();

  /**
   * Kategorinin kullanıcı dilindeki adı. Çeviri yoksa (kullanıcı kategorileri dahil)
   * kaydın kendi adı döner.
   *
   * @param {{ sefNo?: number, isSystem?: boolean, name?: string } | null} category Kategori
   * @returns {string} Görünen ad
   */
  function categoryName(category) {
    if (category?.isSystem) {
      const key = sefCategoryI18nKey(category?.sefNo);
      if (key && te(key)) return t(key);
    }
    return category?.name ?? "";
  }

  /**
   * Seçim listesi etiketi: "KOD — Ad". Kullanıcı kategorisi kendi kodunu taşımaz;
   * bu durumda üstünden miras aldığı ATK kodu gösterilir.
   *
   * @param {object | null} category Kategori (parent ilişkisiyle)
   * @returns {string} Tam etiket (ör. "UR — Restoran yemekleri")
   */
  function categoryLabel(category) {
    if (!category) return "";
    const name = categoryName(category);
    const code = resolveSefCategoryCode(category);
    return code ? `${code} — ${name}` : name;
  }

  return { categoryName, categoryLabel, resolveSefCategoryCode, sefCategoryI18nKey };
};
