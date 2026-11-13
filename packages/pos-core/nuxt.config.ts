// nuxt.config.ts — @pro-acc/pos-core: POS + Restoran'ın paylaştığı çekirdek katman (Nuxt layer).
// İçerik: satış ekranı bileşenleri (Pos*), ortak store'lar, repository (factory + ortak
// modüller), pos layout'u, auth middleware'i ve Nitro server util'leri.
// @pro-acc/ui modülünü kullanır → tüketici uygulamalar yalnız bu katmanı extend etmekle
// hem form bileşenlerini (FormFieldXxx) hem çekirdeği alır.
// Uygulama-özel dosyalar (product.store, product/session repo modülleri, fiscalPrinter,
// PosTopbar/PosSubbar, default layout) tüketici uygulamada kalır ve katmanı override eder.

const isProd = process.env.NODE_ENV === "production";
// Production'da kimlik doğrulama her zaman açık; diğer modlarda AUTH_ENABLED env ile kontrol edilir.
const authEnabled = process.env.AUTH_ENABLED ? process.env.AUTH_ENABLED === "true" : isProd;

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  extends: ["./security"],
  modules: ["@pro-acc/ui"],
  proAccUi: { pos: true },

  devtools: { enabled: true },
  compatibilityDate: "2026-06-13",

  // Kasa uygulamaları offline SPA'dır: tüm veri client-side $fetch ile yerel Nitro'dan gelir,
  // SEO gereksizdir. SSR kapalı → hidrasyon maliyeti yok + sunucu-taraflı durum kirliliği
  // (cross-request state pollution) yüzeyi tamamen kalkar. API route'ları etkilenmez.
  ssr: false,

  // Ortak server-only + public runtime config. mainApiUrl/posSyncKey env VARSAYILANIDIR;
  // cihaz ayarları (DB) doluysa senkron servisi onu önceler.
  // Uygulamaya özel olanlar (posName / restaurantName / terminalNameField) app config'inde kalır.
  runtimeConfig: {
    posSyncKey: process.env.POS_SYNC_KEY || "",
    mainApiUrl: process.env.MAIN_API_URL || "",
    authEnabled,
    // Mali yazıcı (Tremol FLink): satış sonrası fiş `.INP` dosyasını izlenen klasöre yazar.
    // Yalnızca kasanın çalıştığı Windows makinesinde anlamlıdır (FLink + COM portu orada).
    fiscal: {
      enabled: process.env.FISCAL_ENABLED === "true",
      watchDir: process.env.FISCAL_WATCH_DIR || "C:\\Temp",
      footerMessage: process.env.FISCAL_FOOTER || "Ju Faleminderit per viziten",
      // KDV oranı → cihaz vergi grubu eşlemesi (JSON). DOĞRULANDI: 0→3, 8→4, 18→5.
      vatGroups: process.env.FISCAL_VAT_GROUPS || "",
    },
    public: {
      // Client tarafı da authEnabled değerini görür (middleware bypass için)
      authEnabled,
    },
  },

  build: {
    transpile: ["zod-i18n-map", "i18next"],
  },
  // Ortak Tailwind ana CSS (POS + Restoran aynı temayı kullanır; @source yolları bu dosyaya göredir)
  // Ortak i18n anahtarları — @nuxtjs/i18n katman locale'lerini uygulamanınkiyle birleştirir
  // (aynı code için dosyalar deep-merge edilir; uygulama anahtarı katmanı ezer).
  i18n: {
    langDir: "locales/",
    locales: [
      { code: "tr", file: "tr.json" },
      { code: "sq", file: "sq.json" },
      { code: "en", file: "en.json" },
    ],
    // Ortak i18n davranışı (uygulamalar yalnız kendi locale listesini/etiketlerini bildirir)
    defaultLocale: "tr",
    strategy: "no_prefix",
    bundle: {
      runtimeOnly: false,
      fullInstall: true,
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
  vite: {
    resolve: {
      // Katman dosyaları pinia/vue'yu kendi node_modules'ünden çözmesin — pnpm peer-varyant
      // kopyaları çift instance yaratır ("no active Pinia" hatası). Tek instance'a sabitle.
      dedupe: ["vue", "pinia", "vee-validate", "vue-i18n"],
    },
    optimizeDeps: {
      include: [
        "izitoast",
        "pinia-logger",
        "currency.js",
        "vee-validate",
        "zod-i18n-map",
        "i18next",
        "zod",
        "@vee-validate/zod",
      ],
    },
  },
});
