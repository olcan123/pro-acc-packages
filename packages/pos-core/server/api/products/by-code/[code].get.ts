// GET /api/products/by-code/[code] — Barkod/kod ile ürün (kasa hızlı arama); yoksa 404.
import { productService } from "~~/server/service/product.service";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) throw createError({ statusCode: 400, statusMessage: "v_code_required" });
  const product = await productService.findByCode(code);
  if (!product) throw createError({ statusCode: 404, statusMessage: "product_not_found" });
  return product;
});
