// nuxt.config.ts — Üç uygulamanın ortak HTTP güvenliği ve güncelleme kontrolü.
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  runtimeConfig: { proaccImage: "" },
  nitro: {
    externals: { inline: ["@pro-acc/pos-core", "@pro-acc/ui"] },
    // Nitro varsayılan olarak node_modules içindeki TS'yi atlar; iki kaynak paketi derlenmelidir.
    esbuild: {
      options: {
        exclude: /node_modules[\\/](?!.*@pro-acc[\\/](?:ui|pos-core)[\\/])/,
      },
    },
  },
});
