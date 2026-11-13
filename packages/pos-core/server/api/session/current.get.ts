// GET /api/session/current — Açık vardiyayı döner (yoksa null).
import { sessionService } from "~~/server/service/session.service";

export default defineEventHandler(async () => {
  return await sessionService.getCurrent();
});
