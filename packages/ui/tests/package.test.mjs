// package.test.mjs — Nuxt sarmalayıcısı: @pro-acc/ui-vue bileşen/composable'larını ve POS arayüzünü Nuxt'a kaydeder;
// Pro-Acc deposu olmadan kullanılabilir. Paylaşılan bileşenlerin kendi testleri packages/ui-vue/tests'tedir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { sep } from "node:path";
import { loadNuxt } from "@nuxt/kit";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);

await test("bağımsız Nuxt tüketicisi npm kaynaklarının otomatik importlarını etkinleştirir", async () => {
  const cacheRoot = resolve(root, "../../.cache");
  await mkdir(cacheRoot, { recursive: true });
  const consumer = await mkdtemp(resolve(cacheRoot, "ui-consumer-"));
  let nuxt;
  let importContext;
  try {
    nuxt = await loadNuxt({
      cwd: consumer,
      ready: true,
      overrides: {
        modules: [resolve(root, "module.mjs")],
        proAccUi: { erp: true, pos: true, css: false, locales: false, tooltip: false },
        devtools: { enabled: false },
        telemetry: false,
        hooks: {
          "imports:context": (context) => {
            importContext = context;
          },

        },
      },
    });
    const include = nuxt.options.imports.transform.include;
    assert.ok(
      include.some((pattern) =>
        pattern.test("/repo/node_modules/@pro-acc/ui/runtime/pos/composables/useTerminalName.js"),
      ),
    );
    const imports = await importContext.getImports();
    assert.ok(imports.some((item) => item.as === "useSettingsStore"));
    assert.ok(imports.some((item) => item.as === "useRuntimeConfig"));
    // Paylaşılan composable'lar ve bileşenler @pro-acc/ui-vue'dan gelir (aynı otomatik adlarla).
    assert.ok(imports.some((item) => item.as === "useAppToast" && /ui-vue/.test(item.from)));
    assert.ok(imports.some((item) => item.as === "useExcelExport" && /ui-vue/.test(item.from)));
    // addComponentsDir klasörlerini bu kancanın dinleyicisi olarak ekler → kancayı çağırıp listeyi topla.
    const componentDirs = [];
    await nuxt.callHook("components:dirs", componentDirs);
    const paths = componentDirs.map((dir) => (typeof dir === "string" ? dir : dir.path).replaceAll("\\", "/"));
    assert.ok(paths.some((path) => /ui-vue\/src\/components$/.test(path)), paths.join(", "));
    assert.ok(paths.some((path) => /ui-vue\/src\/erp\/components$/.test(path)), paths.join(", "));
    assert.ok(paths.some((path) => /ui\/runtime\/pos\/components$/.test(path)), paths.join(", "));
  } finally {
    await nuxt?.close();
    assert.ok(consumer.startsWith(cacheRoot + sep));
    await rm(consumer, { recursive: true, force: true });
  }
});

/** Paket kaynaklarını alt dizinleriyle birlikte listeler. */
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

await test("paket kendi kaynaklarıyla eksiksizdir; paylaşılan kaynaklar @pro-acc/ui-vue'dan gelir", () => {
  assert.ok(existsSync(resolve(root, "runtime/pos/components/pos/PaymentModal.vue")), "POS kaynakları eksik");
  assert.ok(existsSync(resolve(root, "runtime/plugins/pro-acc-ui.ts")), "Nuxt köprü eklentisi eksik");
  assert.ok(!existsSync(resolve(root, "runtime/components")), "Paylaşılan bileşenler @pro-acc/ui-vue'ya taşındı");
  const missing = [];
  for (const file of files(resolve(root, "runtime")).filter((file) =>
    /\.(vue|[cm]?[jt]s)$/.test(file),
  )) {
    for (const match of readFileSync(file, "utf8").matchAll(
      /(?:from\s*|import\s*\(\s*)["']([^"']+)["']/g,
    )) {
      const specifier = match[1].split("?")[0];
      if (/^(~\/|~~\/|@pro-acc\/pos-ui)/.test(specifier))
        missing.push(`${relative(root, file)} → ${specifier}`);
      if (specifier.startsWith(".")) {
        const target = resolve(dirname(file), specifier);
        if (
          !target.startsWith(root) ||
          !["", ".vue", ".ts", ".js", ".json"].some((ext) => existsSync(target + ext))
        )
          missing.push(`${file} → ${specifier}`);
      }
      if (specifier.startsWith("@pro-acc/ui-vue/")) {
        const sub = "./" + specifier.slice("@pro-acc/ui-vue/".length);
        if (!(sub in require("@pro-acc/ui-vue/package.json").exports)) missing.push(`${file} → ${specifier} (exports'ta yok)`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

await test("bütün UI bileşenleri bağımsız Vue derleyicisiyle derlenir", () => {
  const { parse, compileScript, compileTemplate } = require("vue/compiler-sfc");
  for (const file of files(resolve(root, "runtime")).filter((file) => file.endsWith(".vue"))) {
    const { descriptor, errors } = parse(readFileSync(file, "utf8"), { filename: file });
    assert.deepEqual(errors, [], file);
    const script = compileScript(descriptor, { id: file });
    const result = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: file,
      compilerOptions: { bindingMetadata: script.bindings },
    });
    assert.deepEqual(result.errors, [], file);
  }
});
