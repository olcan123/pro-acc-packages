// POST /api/sync/session — Kapalı bir vardiyayı main'e (yeniden) gönderir. Body: { sessionId }.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  if (!body?.sessionId) throw createError({ statusCode: 400, statusMessage: "v_session_id_required" });
  return await syncService.pushSession(Number(body.sessionId));
});
