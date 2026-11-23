// plugin.ts — Vue eklentisi: `app.use(ProAccUi, { router })`. Paketin uygulamaya bağlı noktalarını (gezinme, dil öneki,
// HTTP) yapılandırır ve `v-tooltip` direktifini kaydeder. Nuxt'ta bunu @pro-acc/ui modülünün eklentisi yapar.
import type { App, Plugin } from "vue";
import type { Router } from "vue-router";
import { configureProAccUi, type ProAccUiConfig } from "./config";
import { tooltipDirective } from "./tooltip-directive";

export interface ProAccUiOptions extends Partial<ProAccUiConfig> {
  /** Verilirse gezinme `router.push` ile yapılır (navigate ayrıca verilmediyse). */
  router?: Router;
  /** `v-tooltip` direktifini kaydet (varsayılan: true). */
  tooltip?: boolean;
}

export const ProAccUi: Plugin<[ProAccUiOptions?]> = {
  install(app: App, options: ProAccUiOptions = {}) {
    const { router, tooltip = true, ...config } = options;
    configureProAccUi({ ...config, navigate: config.navigate ?? (router ? (to) => router.push(to) : undefined) });
    if (tooltip) app.directive("tooltip", tooltipDirective);
  },
};
