// usePaymentKeypad.js — Ödeme modalı tuş takımı durumu: girilen tutar + para üstü hesabı.
// Klavye/tuş takımı tutarı oluşturur; hızlı çipler (10/20/50/100) tutarı ayarlar.
import { ref, computed } from "vue";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * @param {import('vue').Ref<number>} toPayRef - Ödenecek toplam (reaktif)
 */
export const usePaymentKeypad = (toPayRef) => {
  // Girilen tutar string'i (ör. "1050" → 10.50 değil; tam euro mantığı: "10" → 10)
  const entered = ref("");

  /** Girilen tutarın sayısal değeri. */
  const paid = computed(() => (entered.value === "" ? 0 : parseFloat(entered.value) || 0));

  /** Para üstü = ödenen − ödenecek (negatifse henüz yetersiz). */
  const change = computed(() => round2(paid.value - Number(toPayRef.value || 0)));

  /** Rakam/00 basışı (tutarı oluşturur). */
  function press(d) {
    if (d === "00") entered.value = entered.value === "" ? "0" : entered.value + "00";
    else entered.value = entered.value === "0" ? String(d) : entered.value + String(d);
  }

  /** Hızlı çip: tutarı doğrudan ayarlar (ör. müşteri 20 verdi). */
  function setQuick(v) {
    entered.value = String(v);
  }

  /** Son haneyi sil. */
  function backspace() {
    entered.value = entered.value.slice(0, -1);
  }

  /** Temizle (C). */
  function clear() {
    entered.value = "";
  }

  /** Tam ödeme: girileni ödenecek tutara eşitle. */
  function exact() {
    entered.value = String(Number(toPayRef.value || 0));
  }

  return { entered, paid, change, press, setQuick, backspace, clear, exact };
};
