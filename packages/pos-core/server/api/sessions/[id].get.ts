// GET /api/sessions/[id] — Tek vardiya başlığı (arşiv detay sayfası için).
import { sessionService } from "~~/server/service/session.service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id || isNaN(id)) throw createError({ statusCode: 400, statusMessage: "v_invalid_id" });
  const session = await sessionService.findById(id);
  if (!session) throw createError({ statusCode: 404, statusMessage: "session_not_found" });
  return session;
});
