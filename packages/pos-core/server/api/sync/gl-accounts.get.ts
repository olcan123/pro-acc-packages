// GET /api/sync/gl-accounts — Main'den banka/kasa GL hesaplarını (1000–1050) çek.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.fetchBankAccounts();
});
