// package.test.mjs — Çekirdeğin yalnız kendi kaynaklarını, UI paketini ve tüketici sözleşmesini kullandığını doğrular.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);

/** Derlenebilir paket kaynaklarını listeler. */
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

await test("çekirdek importları paket dışındaki kaynak klasörüne bağımlı değildir", () => {
  const missing = [];
  for (const folder of ["app", "server", "security"]) {
    for (const file of files(resolve(root, folder)).filter((file) => /\.(vue|ts|js)$/.test(file))) {
      for (const match of readFileSync(file, "utf8").matchAll(
        /(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g,
      )) {
        const specifier = match[1];
        if (specifier.startsWith(".")) {
          const path = resolve(dirname(file), specifier);
          if (
            !path.startsWith(root) ||
            !["", ".ts", ".js", ".vue"].some((ext) => existsSync(path + ext))
          )
            missing.push(`${file} → ${specifier}`);
        } else if (specifier.startsWith("@pro-acc/")) {
          try {
            require.resolve(specifier);
          } catch {
            missing.push(`${file} → ${specifier}`);
          }
        }
      }
    }
  }
  assert.deepEqual(missing, []);
});

await test("tüketici güvenlik katmanını ve doğrudan servis export'larını çözebilir", () => {
  assert.ok(existsSync(require.resolve("@pro-acc/pos-core/security")));
  assert.ok(existsSync(require.resolve("@pro-acc/pos-core/server/service/order.base")));
  assert.ok(existsSync(require.resolve("@pro-acc/ui/pos/stores/cart.store.js")));
  assert.ok(existsSync(require.resolve("@pro-acc/ui/error-page")));
});

await test("Nitro npm içindeki paket TypeScript dosyalarını derler", () => {
  const { transpile } = require("typescript");
  const source = readFileSync(resolve(root, "security/nuxt.config.ts"), "utf8");
  const code = transpile(source, { module: 1 });
  const context = { exports: {}, defineNuxtConfig: (config) => config };
  runInNewContext(code, context);
  const exclude = context.exports.default.nitro.esbuild.options.exclude;
  for (const separator of ["/", "\\"]) {
    const path = (value) => value.replaceAll("/", separator);
    assert.equal(
      exclude.test(
        path("/repo/node_modules/.pnpm/ui@1/node_modules/@pro-acc/ui/runtime/utils/cash-count.ts"),
      ),
      false,
    );
    assert.equal(
      exclude.test(path("/repo/node_modules/@pro-acc/pos-core/server/utils/sessionPayload.ts")),
      false,
    );
    assert.equal(exclude.test(path("/repo/node_modules/other/index.ts")), true);
    assert.equal(exclude.test(path("/repo/server/api/test.ts")), false);
  }
});
