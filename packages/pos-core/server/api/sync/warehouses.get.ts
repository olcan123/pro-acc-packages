// GET /api/sync/warehouses — Main'den depoları çeker.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.fetchWarehouses();
});
