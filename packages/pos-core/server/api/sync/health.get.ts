// GET /api/sync/health — Senkron sağlık özeti (üst bar rozeti): bekleyen vardiya / son hata / son senkron.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.getHealth();
});
