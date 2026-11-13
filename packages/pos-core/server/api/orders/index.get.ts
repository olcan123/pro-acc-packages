// GET /api/orders — Açık vardiyanın fişleri.
import { orderService } from "~~/server/service/order.service";

export default defineEventHandler(async () => {
  return await orderService.listForCurrentSession();
});
