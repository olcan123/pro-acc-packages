// POST /api/session/close — Vardiyayı kapatır, toplamları hesaplar ve main'e senkronlar.
// Body: { sessionId?: number, zReportNo?: number, cashCount?: { openingFloat, counts, countedTotal } }
import { sessionService } from "~~/server/service/session.service";
import { closeSessionSchema } from "../../validation/order.validation.ts";

export default defineEventHandler(async (event) => {
  const parsed = closeSessionSchema.safeParse((await readBody(event).catch(() => ({}))) ?? {});
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message || "Validation Error" });
  }
  const { sessionId, zReportNo, cashCount } = parsed.data;
  return await sessionService.close(sessionId, zReportNo, cashCount ?? null);
});
