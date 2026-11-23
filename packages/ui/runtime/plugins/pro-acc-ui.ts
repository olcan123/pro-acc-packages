// pro-acc-ui.ts — @pro-acc/ui-vue'nun uygulamaya bağlı noktalarını Nuxt'a bağlar: gezinme navigateTo, dil öneki
// @nuxtjs/i18n $localePath (prefix_except_default → /sq/…), HTTP $fetch. Sunucu ve istemcide çalışır.
import { defineNuxtPlugin, navigateTo } from "#app";
import { configureProAccUi } from "@pro-acc/ui-vue";

export default defineNuxtPlugin((nuxtApp) => {
  const localePath = (nuxtApp as unknown as { $localePath?: (path: string) => string }).$localePath;
  configureProAccUi({
    navigate: (to) => navigateTo(to as Parameters<typeof navigateTo>[0]),
    localePath: localePath ? (path) => localePath(path) : undefined,
    fetch: $fetch as never,
  });
});
