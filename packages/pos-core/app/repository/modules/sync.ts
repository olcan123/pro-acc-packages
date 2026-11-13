// sync.ts — Main senkron API modülü ($api.sync).
import FetchFactory from "../factory.ts";

export class SyncModule extends FetchFactory<any> {
  private RESOURCE = "/api/sync";

  /** Main'den ürün kataloğunu çek. */
  async pullProducts() { return this.create(`${this.RESOURCE}/products`, {}); }

  /** Kapalı bir vardiyayı main'e (yeniden) gönder. */
  async pushSession(sessionId: number) { return this.create(`${this.RESOURCE}/session`, { sessionId }); }

  /** Main bağlantısını test et. */
  async test() { return this.create(`${this.RESOURCE}/test`, {}); }

  /** Senkron sağlık özeti (üst bar rozeti). */
  async health() { return this.getAll(`${this.RESOURCE}/health`); }

  /** Main'den firma/depo/cari adlarını çek (önbelleğe al). */
  async bootstrap() { return this.create(`${this.RESOURCE}/bootstrap`, {}); }

  /** Tek tuş: firma/depo/cari + ürünleri main'den güncelle. */
  async all() { return this.create(`${this.RESOURCE}/all`, {}); }

  /** Main'den banka/kasa GL hesaplarını (1000–1050) çek. */
  async glAccounts() { return this.getAll(`${this.RESOURCE}/gl-accounts`); }

  /** Main'den depoları çek. */
  async warehouses() { return this.getAll(`${this.RESOURCE}/warehouses`); }

  /** Main'den şirketleri çek. */
  async companies() { return this.getAll(`${this.RESOURCE}/companies`); }

  /** Main'den carileri çek. */
  async accounts() { return this.getAll(`${this.RESOURCE}/accounts`); }
}
