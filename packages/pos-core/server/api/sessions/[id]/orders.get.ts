// GET /api/sessions/[id]/orders — Belirli bir vardiyaya ait tüm fişler (items + payments dahil).
import { localDb } from "~~/server/utils/localDb";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "invalid_id" });

  return await localDb.client.order.findMany({
    where: { sessionId: id },
    include: {
      items: { include: { product: true } },
      payments: true,
    },
    orderBy: { id: "asc" },
  });
});
