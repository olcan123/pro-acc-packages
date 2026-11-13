// pos-ui/app/plugins/tooltip.client.ts — `v-tooltip` direktifini üç uygulamaya da kaydeder.
//
// Mantığın tamamı packages/pos-ui/tooltip-directive.ts içindedir (Nuxt'tan
// bağımsız, doğrudan test edilir). Burası yalnızca kayıt katmanı.
//
// `.client` son eki bilinçli: balon `document.body`ye eklenir, SSR'da DOM yok.

import { defineNuxtPlugin } from "#app";
import { tooltipDirective } from "../tooltip-directive.ts";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("tooltip", tooltipDirective);
});
