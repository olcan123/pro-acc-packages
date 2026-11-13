// settings.validation.ts — PosSettings/RestaurantSettings (cihaz + Main bağlantı) ortak Zod şeması.
import { z } from "zod";

// Tüm alanlar opsiyonel (PATCH semantiği) — id sabit "DEFAULT".
export const updateSettingsSchema = z.object({
  companyId: z.coerce.number().int().optional(),
  warehouseId: z.coerce.number().int().optional(),
  posName: z.string().optional(),
  restaurantName: z.string().optional(),
  fiscalNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  companyName: z.string().nullable().optional(),
  warehouseName: z.string().nullable().optional(),
  defaultAccountName: z.string().nullable().optional(),
  mainApiUrl: z.string().url("v_invalid_url").or(z.literal("")).nullable().optional(),
  syncKey: z.string().nullable().optional(),
  defaultAccountId: z.coerce.number().int().nullable().optional(),
  cashGlAccountId: z.coerce.number().int().nullable().optional(),
  // Mali yazıcı: FLink'in izlediği klasör (boş bırakılırsa env/varsayılan kullanılır)
  fiscalWatchDir: z.string().nullable().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
