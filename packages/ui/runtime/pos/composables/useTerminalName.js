/**
 * useTerminalName — Terminal görünen adı (POS/Restoran ortak).
 *
 * Öncelik sırası: cihaz ayarlarındaki şirket adı → cihaz ayarlarındaki terminal adı →
 * env (POS_NAME / RESTAURANT_NAME → runtimeConfig.public) → app.config appTitle → sabit.
 */
import { computed } from "vue";
import { useSettingsStore } from "../stores/settings.store.js";

export const useTerminalName = () => {
  const config = useRuntimeConfig();
  const appConfig = useAppConfig();
  const settingsStore = useSettingsStore();

  return computed(
    () =>
      settingsStore.settings?.companyName ||
      settingsStore.settings?.posName ||
      settingsStore.settings?.restaurantName ||
      config.public.posName ||
      config.public.restaurantName ||
      appConfig.appTitle ||
      "Pro-Acc POS",
  );
};
