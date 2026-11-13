// GET /api/sessions — Geçmiş Z-Rapor vardiyaları (senkron durumu dahil).
import { sessionService } from "~~/server/service/session.service";

export default defineEventHandler(async () => {
  return await sessionService.list();
});
