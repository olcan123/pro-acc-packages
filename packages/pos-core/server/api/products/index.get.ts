// GET /api/products — Aktif yerel ürünleri döner.
import { productService } from "~~/server/service/product.service";

export default defineEventHandler(async () => {
  return await productService.getAll();
});
