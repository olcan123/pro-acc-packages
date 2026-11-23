// tooltip.client.ts — `v-tooltip` direktifini kaydeder. Mantık @pro-acc/ui-vue'dadır (Nuxt'tan bağımsız, test edilir).
// `.client`: balon document.body'ye eklenir, SSR'da DOM yok.
import { defineNuxtPlugin } from "#app";
import { tooltipDirective } from "@pro-acc/ui-vue/tooltip-directive";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("tooltip", tooltipDirective);
});
