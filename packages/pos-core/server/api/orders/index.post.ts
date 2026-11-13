// POST /api/orders — Yeni POS fişi oluşturur (sepet → fiş). Açık vardiya yoksa otomatik açar.
import { orderService } from "~~/server/service/order.service";
import { createOrderSchema } from "../../validation/order.validation.ts";
import { makeCreateHandler } from "@pro-acc/pos-core/server/utils/crudHandlers";

export default makeCreateHandler({
  service: orderService,
  schema: createOrderSchema,
  createMethod: "createOrder",
});
