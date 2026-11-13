// customer.base.ts — Şirket müşterileri yerel önbelleği (LocalCustomer) — pos + restoran ORTAK.
// Müşteriler main'den çekilir (sync.pullCustomers) ve ÇEVRİMDIŞI aranır.
import { localDb } from "~~/server/utils/localDb";

export class CustomerService {
  /**
   * Mali numara (baştan eşleşme) ya da ada göre arar. Boş sorgu ilk kayıtları döner.
   * @param q Arama metni (NUI ya da ad)
   * @param limit En fazla kayıt (varsayılan 20)
   */
  async search(q: string, limit = 20) {
    const term = String(q ?? "").trim();
    const where: Record<string, unknown> = { isActive: true };
    if (term) {
      where.OR = /^\d+$/.test(term)
        ? [{ fiscalNumber: { startsWith: term } }, { vatNumber: { startsWith: term } }]
        : [{ name: { contains: term } }];
    }
    return await localDb.client.localCustomer.findMany({
      where,
      orderBy: { name: "asc" },
      take: Math.max(1, Math.min(50, Number(limit) || 20)),
    });
  }

  /** Main'den gelen listeyi önbelleğe yazar; listede olmayanları pasifleştirir (silmez). */
  async replaceFromMain(list: any[]) {
    const seen: number[] = [];
    for (const c of list) {
      const id = Number(c?.id);
      const name = String(c?.name ?? "").trim();
      if (!id || !name) continue;
      const data = {
        id,
        name,
        fiscalNumber: String(c.uniqueIdentityNumber ?? c.fiscalNumber ?? "").trim() || null,
        vatNumber: String(c.vatNumber ?? "").trim() || null,
        address: [c.address, c.city].map((x: unknown) => String(x ?? "").trim()).filter(Boolean).join(", ") || null,
        isActive: true,
      };
      await localDb.client.localCustomer.upsert({ where: { id }, create: data, update: data });
      seen.push(id);
    }
    if (seen.length) {
      await localDb.client.localCustomer.updateMany({ where: { id: { notIn: seen } }, data: { isActive: false } });
    }
    return { count: seen.length };
  }
}

export const customerService = new CustomerService();
