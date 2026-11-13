// product.ts — Yerel ürün/menü API modülü ($api.product) — pos + restoran ORTAK.
// POS'a özel `setFavorite` uygulamanın kendi modülünde (alt sınıf) tanımlanır.
import FetchFactory from "../factory.ts";

export class ProductModule extends FetchFactory<any> {
  protected RESOURCE = "/api/products";

  /** Aktif ürünler. */
  async fetchProducts() { return this.getAll(this.RESOURCE); }

  /** Barkod/kod ile ürün (kasa hızlı arama). */
  async fetchByCode(code: string) { return this.getById(`${this.RESOURCE}/by-code`, encodeURIComponent(code)); }
}
