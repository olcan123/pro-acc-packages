// standalone.test.ts — @pro-acc/ui-vue Nuxt OLMADAN çalışır: hiçbir kaynak dosyası Nuxt'un otomatik sağladığı bir adı
// (navigateTo, useI18n, $fetch, ref …), import edilmemiş bir bileşen adını (PagesHeader …) ya da Nuxt sanal modülünü
// (#app, #imports) kullanmaz; PrimeVue'ya bağlı değildir; her SFC bağımsız Vue derleyicisiyle derlenir; göreli importlar
// paketin içinde kalır. Kural ihlali, paketi düz bir Vue uygulamasında çalışma anında kırar (ReferenceError).
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { createUnimport } from "unimport";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../src");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const sources = files(SRC).filter((f) => /\.(vue|[cm]?[jt]s)$/.test(f) && !f.includes(`${"vendor"}`) && !f.endsWith(".d.ts"));

// Nuxt'un (ve @pro-acc/ui Nuxt modülünün) otomatik import ettiği adlar: bunlardan biri import edilmeden kullanılırsa
// Nuxt'ta çalışır, düz Vue'da ReferenceError verir.
const NUXT_GLOBALS = [
  "navigateTo",
  "useLocalePath",
  "useNuxtApp",
  "$fetch",
  "useFetch",
  "useRuntimeConfig",
  "useState",
  "useCookie",
  "useHead",
  "useColorMode",
  "useError",
  "clearError",
  "defineNuxtPlugin",
  "useAppToast",
  "useConfirmDelete",
  "useTailwindConfirm",
  "useCurrency",
  "useFormStyles",
  "useUnitLabel",
  "useSefCategoryLabel",
  "useAppUpdate",
  "useExcelExport",
  "useReportPrint",
  "useAnalyticsReport",
];
const unimport = createUnimport({
  presets: ["vue", "vue-router", { from: "vue-i18n", imports: ["useI18n"] }],
  imports: NUXT_GLOBALS.map((name) => ({ name, from: "#nuxt-global" })),
});
const BUILTIN_COMPONENTS = new Set(["RouterLink", "RouterView", "Teleport", "Transition", "TransitionGroup", "KeepAlive"]);

/** SFC'yi şablon gömülü derler: şablonda çözülemeyen ad `_ctx.x`, bileşen `_resolveComponent("X")` olur. */
function compiled(file: string): string {
  const source = readFileSync(file, "utf8");
  if (!file.endsWith(".vue")) return source;
  const { descriptor } = parse(source, { filename: file });
  if (descriptor.scriptSetup) return compileScript(descriptor, { id: file, inlineTemplate: true }).content;
  const script = descriptor.script ? compileScript(descriptor, { id: file }) : null;
  const template = descriptor.template
    ? compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id: file,
        compilerOptions: { bindingMetadata: script?.bindings, prefixIdentifiers: true },
      }).code
    : "";
  return `${script?.content ?? ""}\n${template}`;
}

describe("Nuxt'suz kaynak", () => {
  it("import edilmeden kullanılan Nuxt/Vue otomatik adı yok", async () => {
    const offenders: string[] = [];
    for (const file of sources) {
      const code = compiled(file);
      const { matchedImports } = await unimport.detectImports(code);
      for (const item of matchedImports ?? []) offenders.push(`${relative(SRC, file)} → ${item.as ?? item.name}`);
      for (const m of code.matchAll(/_ctx\.(\$?\w+)/g)) {
        if (NUXT_GLOBALS.includes(m[1]!)) offenders.push(`${relative(SRC, file)} → şablonda ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("şablonda import edilmemiş bileşen adı yok", () => {
    const offenders: string[] = [];
    for (const file of sources.filter((f) => f.endsWith(".vue"))) {
      for (const m of compiled(file).matchAll(/_resolveComponent\("([^"]+)"/g)) {
        if (!BUILTIN_COMPONENTS.has(m[1]!)) offenders.push(`${relative(SRC, file)} → <${m[1]}>`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("Nuxt sanal modülü, PrimeVue ya da uygulama yolu (~/, ~~/) import edilmez; göreli importlar paket içinde kalır", () => {
    const offenders: string[] = [];
    for (const file of sources) {
      for (const m of readFileSync(file, "utf8").matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g)) {
        const spec = m[1]!.split("?")[0]!;
        if (/^(#|~\/|~~\/|primevue|nuxt|@nuxt)/.test(spec)) offenders.push(`${relative(SRC, file)} → ${spec}`);
        if (spec.startsWith(".")) {
          const target = resolve(dirname(file), spec);
          const ok = ["", ".vue", ".ts", ".js", ".json"].some((ext) => existsSync(target + ext));
          if (!target.startsWith(SRC) || !ok) offenders.push(`${relative(SRC, file)} → ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it(".ts kaynakları göreli importu UZANTISIZ yazar (tüketicinin TS'i allowImportingTsExtensions istemesin — TS5097)", () => {
    const offenders = sources
      .filter((f) => f.endsWith(".ts"))
      .flatMap((f) =>
        [...readFileSync(f, "utf8").matchAll(/from\s+["'](\.{1,2}\/[^"']+\.ts)["']/g)].map((m) => `${relative(SRC, f)} → ${m[1]}`),
      );
    expect(offenders).toEqual([]);
  });

  it("her SFC bağımsız Vue derleyicisiyle hatasız derlenir", () => {
    for (const file of sources.filter((f) => f.endsWith(".vue"))) {
      const { descriptor, errors } = parse(readFileSync(file, "utf8"), { filename: file });
      expect(errors, file).toEqual([]);
      expect(() => compiled(file), file).not.toThrow();
    }
  });
});
