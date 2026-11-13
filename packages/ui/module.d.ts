// module.d.ts — Nuxt yapılandırmasındaki proAccUi seçeneklerinin tip sözleşmesi.
import type { NuxtModule } from "@nuxt/schema";

export interface ModuleOptions {
  /** ERP form/liste/rapor bileşenlerini kaydeder. */
  erp?: boolean;
  /** POS bileşenlerini ve istemci store'larını kaydeder. */
  pos?: boolean;
  /** Ortak CSS ve Tailwind Vite desteğini ekler. */
  css?: boolean;
  /** v-tooltip direktifini kaydeder. */
  tooltip?: boolean;
  /** tr/sq/en çevirilerini i18n modülüne ekler. */
  locales?: boolean;
}

declare module "@nuxt/schema" {
  interface NuxtConfig {
    proAccUi?: ModuleOptions;
  }
  interface NuxtOptions {
    proAccUi?: ModuleOptions;
  }
}

declare const uiModule: NuxtModule<ModuleOptions>;
export default uiModule;
