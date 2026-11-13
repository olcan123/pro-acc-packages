// GET /api/system/update-check — Docker Hub'da çalışan sürümden yeni bir imaj var mı? (main + pos + restoran ortak)
// Oturum gerektirir (her uygulamanın global auth middleware'i). İmaj adı Docker'da compose'tan
// gelir (NUXT_PROACC_IMAGE); dev ortamında boştur → kontrol kapalı döner.
import { checkForAppUpdate } from "../../utils/update-check.ts";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  return await checkForAppUpdate(String(config.proaccImage || ""), String(config.appVersion || ""));
});
