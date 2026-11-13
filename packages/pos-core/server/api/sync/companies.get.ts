// GET /api/sync/companies — Main'den şirketleri çeker.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => {
  return await syncService.fetchCompanies();
});
