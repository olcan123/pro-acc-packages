// GET /api/sync/accounts — Main'den carileri çeker.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.fetchAccounts();
});
