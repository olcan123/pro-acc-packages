// nuxt.config.ts — Üç uygulamanın ortak HTTP güvenliği ve güncelleme kontrolü.
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  runtimeConfig: { proaccImage: "" },
  nitro: {
    // Nuxt 4.6 renderer'ı manifest/entry sanal modülleriyle birlikte paketlenmelidir.
    externals: { inline: ["@pro-acc/pos-core", "@pro-acc/ui", "nuxt/internal"] },
    // Nitro varsayılan olarak node_modules içindeki TS'yi atlar; iki kaynak paketi derlenmelidir.
    esbuild: {
      options: {
        exclude: /node_modules[\\/](?!.*@pro-acc[\\/](?:ui|pos-core)[\\/])/,
      },
    },
  },
});
