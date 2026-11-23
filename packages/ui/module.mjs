// module.mjs — @pro-acc/ui: @pro-acc/ui-vue bileşenlerini Nuxt'a kaydeden İNCE sarmalayıcı + POS arayüzü.
// Bileşen, composable, stil, font ve sözlüklerin TEK kaynağı @pro-acc/ui-vue'dur (Nuxt'tan bağımsız Vue paketi); bu modül
// yalnız Nuxt'a özgü olanları yapar: otomatik bileşen/composable kaydı (aynı adlar: FormFieldButton, SharedBaseList …),
// paketin gezinme/dil/HTTP noktalarını navigateTo · $localePath · $fetch'e bağlayan eklenti, i18n kaydı, public fontlar.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
  addImportsDir,
  addPlugin,
} from "@nuxt/kit";
import tailwindcss from "@tailwindcss/vite";

/** @pro-acc/ui-vue'nun kaynak klasörü (pnpm/npm yerleşiminden bağımsız). */
export function uiVueSrc() {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve("@pro-acc/ui-vue/package.json")), "src");
}

export default defineNuxtModule({
  meta: { name: "@pro-acc/ui", configKey: "proAccUi", compatibility: { nuxt: ">=4.0.0" } },
  defaults: { erp: false, pos: false, css: true, tooltip: true, locales: true },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const resolve = (path) => resolver.resolve(path);
    const uiVue = uiVueSrc();
    // Nuxt, node_modules içindeki kaynaklarda örtük importları varsayılan olarak işlemez (POS bileşenleri kullanır).
    nuxt.options.imports.transform ??= {};
    nuxt.options.imports.transform.include ??= [];
    nuxt.options.imports.transform.include.push(/@pro-acc[\/]ui[\/]runtime[\/]/);

    addComponentsDir({ path: join(uiVue, "components"), pathPrefix: true });
    addImportsDir(join(uiVue, "composables"));
    // Paketin gezinme/dil/HTTP noktaları + (isteğe bağlı) v-tooltip
    addPlugin({ src: resolve("./runtime/plugins/pro-acc-ui.ts") });
    if (options.tooltip) addPlugin({ src: resolve("./runtime/plugins/tooltip.client.ts"), mode: "client" });

    if (options.erp) {
      addComponentsDir({ path: join(uiVue, "erp/components"), pathPrefix: true });
      addImportsDir(join(uiVue, "erp/composables"));
    }
    if (options.pos) {
      addComponentsDir({ path: resolve("./runtime/pos/components"), pathPrefix: true });
      addImportsDir(resolve("./runtime/pos/composables"));
      addImportsDir(resolve("./runtime/pos/stores"));
    }

    // Pnpm peer kopyalarının iki ayrı form/Pinia/i18n durumu oluşturmasını önler.
    nuxt.options.vite.resolve ??= {};
    nuxt.options.vite.resolve.dedupe = [
      ...new Set([
        ...(nuxt.options.vite.resolve.dedupe || []),
        "vue",
        "vue-router",
        "pinia",
        "vee-validate",
        "vue-i18n",
        "@vueuse/core",
        "izitoast",
      ]),
    ];
    nuxt.options.build.transpile.push("@pro-acc/ui", "@pro-acc/ui-vue");
    nuxt.options.nitro.publicAssets ??= [];
    nuxt.options.nitro.publicAssets.push({ dir: join(uiVue, "public"), maxAge: 31536000 });

    if (options.css) {
      nuxt.options.css.push(resolve("./runtime/styles/ui.css"));
      // Tüketicide zaten Tailwind Vite eklentisi varsa ikinci kez eklemez.
      nuxt.hook("vite:extendConfig", (config) => {
        config.plugins ??= [];
        if (
          !config.plugins
            .flat(Infinity)
            .some((plugin) => plugin?.name?.startsWith("@tailwindcss/vite"))
        ) {
          config.plugins.push(...tailwindcss());
        }
      });
    }
    if (options.locales) {
      nuxt.hook("i18n:registerModule", (register) =>
        register({
          langDir: join(uiVue, "locales"),
          locales: ["tr", "sq", "en"].map((code) => ({ code, file: `${code}.json` })),
        }),
      );
    }
  },
});
