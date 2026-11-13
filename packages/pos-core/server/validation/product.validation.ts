// product.validation.ts — LocalProduct/LocalMenuItem (yerel ürün kataloğu) ortak Zod şemaları.
import { z } from "zod";

// Tek ürün upsert (main'den çekme veya elle ekleme).
export const localProductSchema = z.object({
  id: z.coerce.number().int().positive(),
  code: z.string().min(1, "v_product_code_required"),
  name: z.string().min(1, "v_product_name_required"),
  sellPrice: z.coerce.number().min(0),
  vatRate: z.coerce.number().int().min(0).max(100).default(18),
  unitId: z.coerce.number().int().positive().default(1),
  // SEF ölçü birimi (Njësia Matëse) — main'den gelir; eski sürümlerde boş olabilir
  unitCode: z.string().max(10).nullish(),
  unitSymbol: z.string().max(10).nullish(),
  // SEF mal/hizmet kategori kodu (ör. "UR", "AU") — main'den gelir
  sefCategoryCode: z.string().max(10).nullish(),
  isActive: z.boolean().default(true),
});

// Toplu ürün senkron (main /api/products yanıtı normalize edilmiş dizi).
export const localProductBulkSchema = z.array(localProductSchema);

export const productIdSchema = z.object({
  id: z.string().transform((v) => parseInt(v, 10)).refine((v) => !isNaN(v) && v > 0, { message: "v_invalid_id" }),
});

// Restoran tarafı aynı şemayı LocalMenuItem adlarıyla kullanır (takma ad).
export const localMenuItemSchema = localProductSchema;
export const localMenuItemBulkSchema = localProductBulkSchema;
