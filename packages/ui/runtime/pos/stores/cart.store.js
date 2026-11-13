// cart.store.js — Aktif satış sepeti: kalemler, miktar/iskonto, KDV dahil toplamlar.
// Fiyatlar KDV DAHİL (perakende): satır KDV'si = brüt * oran / (100 + oran).
import { defineStore } from "pinia";
import { ref, computed } from "vue";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const useCartStore = defineStore("cart", () => {
  /** Sepet kalemleri: { productId, code, name, quantity, unitSymbol, unitPrice, vatRate, discount } */
  // unitSymbol = SEF ölçü biriminin sembolü (main'den sync edilir); yalnız gösterim amaçlıdır,
  // main'e gönderilen satış payload'ında yer almaz.
  const items = ref([]);
  /** Aktif (seçili) satır index'i */
  const activeIndex = ref(-1);

  // ─── Hesaplamalar ──────────────────────────────────────────────
  const lineGross = (it) => round2(it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100));
  const lineVat = (it) => round2((lineGross(it) * it.vatRate) / (100 + it.vatRate));

  const grandTotal = computed(() => round2(items.value.reduce((s, it) => s + lineGross(it), 0)));
  const vatTotal = computed(() => round2(items.value.reduce((s, it) => s + lineVat(it), 0)));
  const itemCount = computed(() => items.value.length);
  const isEmpty = computed(() => items.value.length === 0);

  // ─── Eylemler ──────────────────────────────────────────────────

  /** Ürünü sepete ekler; aynı ürün varsa miktarını artırır. */
  function addProduct(product, qty = 1) {
    const idx = items.value.findIndex((i) => i.productId === product.id);
    if (idx !== -1) {
      items.value[idx].quantity = round2(items.value[idx].quantity + qty);
      activeIndex.value = idx;
    } else {
      items.value.push({
        productId: product.id,
        code: product.code,
        name: product.name,
        quantity: qty,
        unitSymbol: product.unitSymbol ?? null,
        unitPrice: Number(product.sellPrice),
        vatRate: Number(product.vatRate ?? 18),
        discount: 0,
      });
      activeIndex.value = items.value.length - 1;
    }
  }

  function setQty(index, qty) {
    if (items.value[index] && qty > 0) items.value[index].quantity = Number(qty);
  }
  function incQty(index) {
    if (items.value[index]) items.value[index].quantity = round2(items.value[index].quantity + 1);
  }
  function decQty(index) {
    const it = items.value[index];
    if (it && it.quantity > 1) it.quantity = round2(it.quantity - 1);
  }
  function setDiscount(index, disc) {
    if (items.value[index]) items.value[index].discount = Math.min(100, Math.max(0, Number(disc) || 0));
  }
  function removeAt(index) {
    items.value.splice(index, 1);
    if (activeIndex.value >= items.value.length) activeIndex.value = items.value.length - 1;
  }
  function setActive(index) {
    activeIndex.value = index;
  }

  /** Giriş satırından gelen tam tanımlı kalemi sepete ekler (yeni satır). */
  function addCustomLine({ productId, code, name, quantity, unitSymbol = null, unitPrice, vatRate, discount = 0 }) {
    items.value.push({
      productId,
      code,
      name,
      quantity: Number(quantity) || 1,
      unitSymbol,
      unitPrice: Number(unitPrice) || 0,
      vatRate: Number(vatRate ?? 18),
      discount: Number(discount) || 0,
    });
    activeIndex.value = items.value.length - 1;
  }

  /** Mevcut bir satırı kısmen günceller (düzenleme modu). */
  function updateLine(index, patch) {
    if (!items.value[index]) return;
    Object.assign(items.value[index], patch);
    activeIndex.value = index;
  }

  function reset() {
    items.value = [];
    activeIndex.value = -1;
  }

  /**
   * Sepeti API'nin beklediği fiş payload'una çevirir.
   * @param {Array} payments - [{ paymentMethod, amount, bankTerminalId? }]
   */
  function toOrderPayload(payments, customer = null) {
    return {
      // Şirket müşterisi (null = nihai tüketici). Sunucu NUI biçimini yeniden doğrular.
      ...(customer && { customer }),
      items: items.value.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        discount: it.discount || 0,
      })),
      payments,
    };
  }

  return {
    items, activeIndex,
    grandTotal, vatTotal, itemCount, isEmpty,
    lineGross, lineVat,
    addProduct, addCustomLine, updateLine, setQty, incQty, decQty, setDiscount, removeAt, setActive, reset, toOrderPayload,
  };
});
