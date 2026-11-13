// product.store.js — Yerel ürün/menü kataloğu: yükleme + barkod/kod arama + favori yönetimi.
// pos + restoran ORTAK. Favori alanı (isFavorite) YALNIZ POS'un LocalProduct modelinde vardır;
// restoranda favorites her zaman boş kalır ve toggleFavorite çağrılmaz (menüde favori kavramı yok).
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useProductStore = defineStore("product", () => {
  const { $api } = useNuxtApp();

  const products = ref([]);
  const loading = ref(false);

  /** Hızlı satış ızgarasında gösterilen favori ürünler (ada göre). */
  const favorites = computed(() =>
    products.value
      .filter((p) => p.isFavorite)
      .sort((a, b) => String(a.name).localeCompare(String(b.name))),
  );

  /** Tüm ürünleri yükler. */
  async function fetchProducts() {
    loading.value = true;
    try {
      products.value = await $api.product.fetchProducts();
    } finally {
      loading.value = false;
    }
  }

  /** Barkod/kod ile ürün bulur: önce yerel listede, yoksa API. */
  async function findByCode(code) {
    const local = products.value.find((p) => p.code === code);
    if (local) return local;
    try {
      return await $api.product.fetchByCode(code);
    } catch {
      return null;
    }
  }

  /**
   * Favori işaretini değiştirir — iyimser (optimistic) güncelleme, hata olursa geri alır.
   * YALNIZ POS: $api.product.setFavorite sadece POS'un ProductModule'ünde tanımlıdır.
   */
  async function toggleFavorite(product) {
    const target = products.value.find((p) => p.id === product.id);
    if (!target) return;
    const next = !target.isFavorite;
    target.isFavorite = next; // iyimser
    try {
      await $api.product.setFavorite(target.id, next);
    } catch (e) {
      target.isFavorite = !next; // geri al
      throw e;
    }
  }

  return { products, loading, favorites, fetchProducts, findByCode, toggleFavorite };
});
