// package.test.mjs — UI paketinin Pro-Acc deposu olmadan kullanılabildiğini doğrular.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);

/** Paket kaynaklarını alt dizinleriyle birlikte listeler. */
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

await test("paket Pro-Acc kaynakları olmadan eksiksiz bir UI dağıtımı içerir", () => {
  assert.ok(
    existsSync(resolve(root, "runtime/components/form/FieldTextInput.vue")),
    "Bağımsız UI kaynakları eksik",
  );
  const inventory = JSON.parse(readFileSync(resolve(root, "runtime/inventory.json"), "utf8"));
  assert.equal(inventory.components.length, 48);
  for (const component of inventory.components)
    assert.ok(existsSync(resolve(root, "runtime", component.path)), component.name);
  const missing = [];
  for (const file of files(resolve(root, "runtime")).filter((file) =>
    /\.(vue|[cm]?[jt]s)$/.test(file),
  )) {
    for (const match of readFileSync(file, "utf8").matchAll(
      /(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g,
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

await test("Excel okuyucusu dış proje veya CDN gerektirmeden çalışma kitabını okur", async () => {
  const xlsx = await import("../runtime/vendor/xlsx.mjs");
  const reader = await import("../runtime/erp/utils/excel-read.js");
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    book,
    xlsx.utils.aoa_to_sheet([
      ["Kod", "Ad"],
      ["P01", "Ürün"],
    ]),
    "Ürünler",
  );
  const bytes = xlsx.write(book, { type: "array", bookType: "xlsx" });
  assert.deepEqual(await reader.readFirstSheetRows(bytes), [{ Kod: "P01", Ad: "Ürün" }]);
  await assert.rejects(
    reader.readNamedSheetsRows(bytes, ["Eksik"]),
    (error) => error.key === "v_import_missing_sheets",
  );
});
