// GET /api/products/[id] — Tekil ürün; bulunamazsa 404.
import { productService } from "~~/server/service/product.service";
import { productIdSchema } from "../../validation/product.validation.ts";
import { makeGetByIdHandler } from "@pro-acc/pos-core/server/utils/crudHandlers";

export default makeGetByIdHandler({
  service: productService,
  idSchema: productIdSchema,
  notFoundMessage: "product_not_found",
});
