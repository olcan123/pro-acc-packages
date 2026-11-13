// server-type-safety.test.mjs — Paylaşılan sunucu kaynaklarını bağımsız ve katı TypeScript tüketicisinde doğrular.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

// Nuxt'un sağladığı API ve tüketiciye ait servisler fixture sözleşmesidir; paket kaynakları gerçektir.
const ambient = `
declare function defineEventHandler<T>(handler: (event: import("h3").H3Event) => T): typeof handler;
declare function readBody(event: import("h3").H3Event): Promise<any>;
declare function getRouterParam(event: import("h3").H3Event, name: string): string | undefined;
declare function createError(options: any): Error;
declare function useRuntimeConfig(event?: import("h3").H3Event): any;
declare function getCookie(event: import("h3").H3Event, name: string): string | undefined;
declare function setCookie(event: import("h3").H3Event, name: string, value: string, options: any): void;
declare const $fetch: import("ofetch").$Fetch;
declare module "~~/server/utils/localDb" {
  export const localDb: any;
  export const TERMINAL_KIND: string;
  export const TERMINAL_NAME_FIELD: string;
  export const PRODUCTS_ENDPOINT: string;
  export const SYNC_PAYLOAD_EXTRA: any;
  export function mapExtraProductFields(value: any): any;
  export function prepareProductRelations(...args: any[]): Promise<void>;
}
declare module "~~/server/service/settings.service" { export const settingsService: any; }
declare module "~~/server/service/auth.service" { export const posAuthService: any; }
declare module "~~/server/service/product.service" { export const productService: any; }
`;

await test("dönüşen ürün kimliği, ödeme eşlemesi ve doğrulama hataları katı tüketicide tip güvenlidir", () => {
  const ambientFile = resolve(root, "tests/.server-type-globals.d.ts");
  const options = {
    noEmit: true,
    strict: true,
    noUncheckedIndexedAccess: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    types: ["node"],
    typeRoots: [dirname(dirname(require.resolve("@types/node/package.json")))],
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, ...args) =>
    resolve(file) === ambientFile
      ? ts.createSourceFile(file, ambient, languageVersion, true)
      : getSourceFile(file, languageVersion, ...args);
  const program = ts.createProgram(
    [
      ambientFile,
      ...[
        "api/auth/change-password.post.ts",
        "api/auth/login.post.ts",
        "api/products/[id].get.ts",
        "service/sync.base.ts",
        "utils/crudHandlers.ts",
      ].map((file) => resolve(root, "server", file)),
    ],
    options,
    host,
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (file) => file,
      getNewLine: () => "\n",
    }),
  );
});
