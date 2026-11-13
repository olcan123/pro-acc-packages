// GET /api/settings — DEFAULT POS ayarları (yoksa env varsayılanıyla oluşturulur).
import { settingsService } from "~~/server/service/settings.service";

export default defineEventHandler(async () => {
  return await settingsService.getOrInit();
});
