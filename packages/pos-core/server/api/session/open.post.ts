// POST /api/session/open — Açık vardiya yoksa yeni Z-Rapor vardiyası açar.
import { sessionService } from "~~/server/service/session.service";

export default defineEventHandler(async () => {
  return await sessionService.open();
});
