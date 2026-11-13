// POST /api/sync/products — Main'den ürün/menü kataloğunu çeker (yerel katalog upsert).
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.pullProducts();
});
