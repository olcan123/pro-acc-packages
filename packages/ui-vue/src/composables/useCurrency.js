// useCurrency.js — Euro (€) para birimi formatlama ve hesaplama composable'ı.
// currency.js kütüphanesi kullanılır: ondalık virgül (,), binlik nokta (.) — Kosova standartları.

import currency from "currency.js";

export const useCurrency = () => {

  /**
   * Sayısal değeri Kosova/Avrupa Euro formatında biçimlendirilmiş string'e dönüştürür.
   * Null, undefined veya NaN değerler 0 olarak işlenir.
   *
   * @param {number | string | null} value - Biçimlendirilecek sayısal değer
   * @returns {string} Biçimlendirilmiş para birimi string'i (örn. "€1.234,56")
   *
   * @example
   * formatCurrency(1234.56)  // → "€1.234,56"
   * formatCurrency(null)     // → "€0,00"
   */
  function formatCurrency(value) {
    return currency(Number(value) || 0, {
      symbol: "€",
      decimal: ",",
      separator: ".",
      precision: 2,
    }).format();
  }

  /**
   * Biçimlendirilmiş Euro string'ini (veya ham sayıyı) JavaScript number'a dönüştürür.
   * Virgüllü ondalık ve noktalı binlik ayırıcı formatını doğru işler.
   *
   * @param {string | number} value - Ayrıştırılacak değer (örn. "€1.234,56" veya 1234.56)
   * @returns {number} Ondalıklı sayı değeri (örn. 1234.56)
   *
   * @example
   * parseCurrency("€1.234,56")  // → 1234.56
   * parseCurrency("1.500,00")   // → 1500
   */
  function parseCurrency(value) {
    return currency(value, {
      symbol: "€",
      decimal: ",",
      separator: ".",
    }).value;
  }

  /**
   * Birden fazla sayısal değeri güvenli biçimde toplar.
   * Kayan nokta hatalarını önlemek için currency.js'in hassas toplama özelliği kullanılır.
   * Null/undefined değerler 0 olarak işlenir.
   *
   * @param {Array<number | null | undefined>} values - Toplanacak sayı dizisi
   * @returns {number} Toplamın ondalıklı sayı değeri
   *
   * @example
   * sumCurrency([10.5, 20.3, null, 5.2])  // → 36
   */
  function sumCurrency(values) {
    return values.reduce((acc, val) => {
      return currency(acc).add(val || 0);
    }, currency(0)).value;
  }

  return { formatCurrency, parseCurrency, sumCurrency };
};
