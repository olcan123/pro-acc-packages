// settings.base.ts — Cihaz + Main bağlantı ayarları iş mantığı — pos + restoran ORTAK.
// Ayar modeli pos'ta PosSettings, restoranda RestaurantSettings'tir; cihaz adı alanı da
// posName ↔ restaurantName olarak ayrışır. İkisi de `~~/server/utils/localDb` profilinden gelir.
// mainApiUrl/syncKey: DB kaydı önceliklidir; boşsa nuxt runtimeConfig env'i kullanılır.
import { localDb, TERMINAL_NAME_FIELD, defaultTerminalName } from "~~/server/utils/localDb";
import { resolveFiscalConfig, type FiscalConfig } from "~~/server/utils/fiscalPrinter";

const DEFAULT_ID = "DEFAULT";

export class SettingsService {
  /** DEFAULT ayar kaydını getirir; yoksa env varsayılanlarıyla oluşturur. */
  async getOrInit() {
    let s = await localDb.settings.findUnique({ where: { id: DEFAULT_ID } });
    if (!s) {
      const cfg = useRuntimeConfig();
      s = await localDb.settings.create({
        data: {
          id: DEFAULT_ID,
          companyId: 1,
          warehouseId: 1,
          [TERMINAL_NAME_FIELD]: defaultTerminalName(cfg),
          fiscalNumber: "",
          vatNumber: "",
        },
      });
    }
    return s;
  }

  /** DEFAULT ayarı günceller (upsert). */
  async update(data: any) {
    const cfg = useRuntimeConfig();
    return await localDb.settings.upsert({
      where: { id: DEFAULT_ID },
      update: data,
      create: {
        id: DEFAULT_ID,
        companyId: data.companyId ?? 1,
        warehouseId: data.warehouseId ?? 1,
        [TERMINAL_NAME_FIELD]: data[TERMINAL_NAME_FIELD] ?? defaultTerminalName(cfg),
        fiscalNumber: data.fiscalNumber ?? "",
        vatNumber: data.vatNumber ?? "",
        companyName: data.companyName ?? null,
        warehouseName: data.warehouseName ?? null,
        defaultAccountName: data.defaultAccountName ?? "Blerësi Fizik",
        mainApiUrl: data.mainApiUrl ?? null,
        syncKey: data.syncKey ?? null,
        defaultAccountId: data.defaultAccountId ?? null,
        cashGlAccountId: data.cashGlAccountId ?? null,
        fiscalWatchDir: data.fiscalWatchDir ?? "C:\\TEMP",
      },
    });
  }

  /**
   * Etkin mali yazıcı (FLink) yapılandırması: env (FISCAL_*) tabanı + DB ayarının üzerine yazımı.
   * watchDir: ayar kaydındaki fiscalWatchDir doluysa onu, değilse env/varsayılanı (C:\Temp) kullanır.
   * @returns {FiscalConfig}
   */
  async getFiscalConfig(): Promise<FiscalConfig> {
    const base = resolveFiscalConfig(useRuntimeConfig());
    const s = await this.getOrInit();
    const watchDir = (s.fiscalWatchDir && s.fiscalWatchDir.trim()) || base.watchDir;
    return { ...base, watchDir };
  }

  /**
   * Etkin Main bağlantısını çözer: DB (ayar kaydı) > env (runtimeConfig).
   * @returns {{ mainApiUrl: string, syncKey: string, settings: any }}
   */
  async resolveMainConnection() {
    const cfg = useRuntimeConfig();
    const s = await this.getOrInit();
    const rawUrl = (s.mainApiUrl && s.mainApiUrl.trim()) || cfg.mainApiUrl || "";
    const syncKey = (s.syncKey && s.syncKey.trim()) || cfg.posSyncKey || "";
    // Windows'ta `localhost` bazen IPv6 ::1 adresine çözümlenir; Nuxt dev sunucu yalnız
    // IPv4 0.0.0.0'da dinler. Bu nedenle localhost → 127.0.0.1 olarak normalize edilir.
    const normalizedUrl = rawUrl.replace(/localhost/g, "127.0.0.1");
    return { mainApiUrl: normalizedUrl.replace(/\/+$/, ""), syncKey, settings: s };
  }
}

export const settingsService = new SettingsService();
