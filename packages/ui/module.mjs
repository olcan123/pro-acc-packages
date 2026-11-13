// module.mjs — @pro-acc/ui bileşenlerini, stillerini ve isteğe bağlı ERP/POS arayüzlerini Nuxt'a kaydeder.
import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
  addImportsDir,
  addPlugin,
} from "@nuxt/kit";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtModule({
  meta: { name: "@pro-acc/ui", configKey: "proAccUi", compatibility: { nuxt: ">=4.0.0" } },
  defaults: { erp: false, pos: false, css: true, tooltip: true, locales: true },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const resolve = (path) => resolver.resolve(path);
    // Nuxt, node_modules içindeki kaynaklarda örtük importları varsayılan olarak işlemez.
    nuxt.options.imports.transform ??= {};
    nuxt.options.imports.transform.include ??= [];
    nuxt.options.imports.transform.include.push(/@pro-acc[\\/]ui[\\/]runtime[\\/]/);
    addComponentsDir({ path: resolve("./runtime/components"), pathPrefix: true });
    addImportsDir(resolve("./runtime/composables"));
    if (options.tooltip)
      addPlugin({ src: resolve("./runtime/plugins/tooltip.client.ts"), mode: "client" });

    if (options.erp) {
      addComponentsDir({ path: resolve("./runtime/erp/components"), pathPrefix: true });
      addImportsDir(resolve("./runtime/erp/composables"));
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
      ]),
    ];
    nuxt.options.build.transpile.push("@pro-acc/ui");
    nuxt.options.nitro.publicAssets ??= [];
    nuxt.options.nitro.publicAssets.push({ dir: resolve("./runtime/public"), maxAge: 31536000 });

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
          langDir: resolve("./runtime/locales"),
          locales: ["tr", "sq", "en"].map((code) => ({ code, file: `${code}.json` })),
        }),
      );
    }
  },
});
