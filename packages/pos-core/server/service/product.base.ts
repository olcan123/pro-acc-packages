// product.base.ts — Yerel ürün kataloğu iş mantığı — pos + restoran ORTAK.
// Model pos'ta LocalProduct, restoranda LocalMenuItem'dır; `~~/server/utils/localDb` profilinden gelir.
// Ürünler main'den çekilir (sync.service.pullProducts) veya elle eklenir.
import { BaseRepository } from "../repository/base.repository.ts";
import { localDb } from "~~/server/utils/localDb";

export class ProductService extends BaseRepository<any> {
  constructor() {
    super(localDb.products);
  }

  /** Aktif ürünleri ada göre döner. */
  async getAll() {
    return await localDb.products.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /** Barkod/kod ile tek ürün (kasada hızlı arama). */
  async findByCode(code: string) {
    return await localDb.products.findUnique({ where: { code } });
  }

  /** Tek ürün upsert (main senkron veya elle). */
  async upsert(data: any) {
    return await localDb.products.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  /** Toplu upsert; eklenen/güncellenen sayısını döner. */
  async bulkUpsert(items: any[]) {
    let count = 0;
    for (const item of items) {
      await this.upsert(item);
      count++;
    }
    return { count };
  }
}
