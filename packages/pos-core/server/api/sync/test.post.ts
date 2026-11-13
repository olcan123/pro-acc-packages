// POST /api/sync/test — Main bağlantısını test eder (x-pos-key ile /api/<kind>/ping).
// Alan adı (pos ↔ restaurant) `~~/server/utils/localDb` profilinden gelir.
import { settingsService } from "~~/server/service/settings.service";
import { TERMINAL_KIND } from "~~/server/utils/localDb";

export default defineEventHandler(async () => {
  const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
  if (!mainApiUrl) return { ok: false, error: "main_api_url_missing" };
  try {
    const res: any = await $fetch(`${mainApiUrl}/api/${TERMINAL_KIND}/ping`, {
      headers: { "x-pos-key": syncKey },
    });
    // Beklenen yanıt: { ok: true }. JSON değilse (yanlış URL / login sayfası) başarısız say.
    if (res?.ok === true) return { ok: true, main: res };
    return { ok: false, error: "unexpected_response" };
  } catch (e: any) {
    return { ok: false, error: e?.data?.statusMessage || e?.message || "connection_failed" };
  }
});
