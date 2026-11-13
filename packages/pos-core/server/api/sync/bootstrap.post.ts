// POST /api/sync/bootstrap — Main'den firma/depo/cari adlarını çeker ve cihaz ayarlarına önbelleğe alır.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.bootstrap();
});
