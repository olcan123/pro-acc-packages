// PUT /api/settings — DEFAULT POS ayarlarını günceller (Main adresi/anahtarı dahil).
import { settingsService } from "~~/server/service/settings.service";
import { updateSettingsSchema } from "../../validation/settings.validation.ts";
import { assertValid } from "@pro-acc/pos-core/server/utils/apiHandler";

export default defineEventHandler(async (event) => {
  const data = assertValid(updateSettingsSchema.safeParse(await readBody(event)));
  return await settingsService.update(data);
});
