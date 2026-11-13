// POST /api/sync/all — Tek tuşla Main'den tüm verileri çeker:
//   firma adı + depo adı + varsayılan cari (bootstrap) ve ürün kataloğu (pullProducts).
// Veriler main'de değiştiğinde (ürün/firma/depo adları) bu uç tekrar çağrılarak güncellenir.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  const bootstrap = await syncService.bootstrap();
  const products = await syncService.pullProducts();
  // POS kullanıcılarını da çek (offline giriş için); hata olsa da akışı bozma
  const users = await syncService.pullUsers().catch(() => ({ count: 0 }));
  // Şirket müşterileri (kasada NUI ile seçim); hata olsa da akışı bozma
  const customers = await syncService.pullCustomers().catch(() => ({ count: 0 }));
  return {
    ok: true,
    company: bootstrap.company,
    warehouse: bootstrap.warehouse,
    account: bootstrap.account,
    products: products.count,
    users: users.count,
    customers: customers.count,
  };
});
