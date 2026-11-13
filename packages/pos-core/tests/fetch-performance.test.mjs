// fetch-performance.test.mjs — Eşzamanlı okumaların paylaşımını, mutasyon ve SSR sınırlarını doğrular.
import { test } from "node:test";
import assert from "node:assert/strict";
import Factory from "../app/repository/factory.ts";

/** Ağ yanıtının sırasını testin belirlemesine izin verir. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

await test("aynı fetcher kullanan modüller aynı GET için tek ağ isteği paylaşır", async () => {
  const pending = deferred();
  let calls = 0;
  const fetcher = () => {
    calls++;
    return pending.promise;
  };
  const a = new Factory(fetcher);
  const b = new Factory(fetcher);
  const one = a.getAll("/api/products", { query: { page: 1, search: "a" } });
  const two = b.getAll("/api/products", { query: { search: "a", page: 1 } });
  assert.equal(calls, 1);
  pending.resolve([{ id: 1 }]);
  assert.deepEqual(await one, await two);
  await a.getAll("/api/products", { query: { page: 1, search: "a" } });
  assert.equal(calls, 2, "Tamamlanan finansal veri önbelleğe alınmamalı");
});

await test("Nuxt örnekleri ve farklı sorgular birbirinden izoledir", async () => {
  let calls = 0;
  const a = new Factory(async () => {
    calls++;
    return [];
  });
  const b = new Factory(async () => {
    calls++;
    return [];
  });
  await Promise.all([a.getAll("/x"), b.getAll("/x"), a.getAll("/x", { query: { page: 2 } })]);
  assert.equal(calls, 3);
});

await test("mutasyon eski uçuşu geçersizleştirir; eski finalizer yeni okumayı silmez", async () => {
  const old = deferred();
  const fresh = deferred();
  let reads = 0;
  const fetcher = (_url, options) =>
    options.method === "POST"
      ? Promise.resolve({ id: 3 })
      : ++reads === 1
        ? old.promise
        : fresh.promise;
  const api = new Factory(fetcher);
  const before = api.getAll("/x");
  await api.create("/x", {});
  const after = api.getAll("/x");
  old.resolve([]);
  await before;
  const joined = api.getAll("/x");
  assert.equal(reads, 2);
  fresh.resolve([{ id: 3 }]);
  assert.deepEqual(await after, await joined);
});

await test("hata sonrası tekrar istek gönderilir; abort ve özel başlıklar paylaşılmaz", async () => {
  let calls = 0;
  const api = new Factory(async () => {
    calls++;
    if (calls === 1) throw new Error("offline");
    return [];
  });
  await assert.rejects(api.getAll("/x"), /offline/);
  await api.getAll("/x");
  await Promise.all([
    api.getAll("/x", { signal: new AbortController().signal }),
    api.getAll("/x", { signal: new AbortController().signal }),
  ]);
  await Promise.all([
    api.getAll("/x", { headers: { "x-tenant": "a" } }),
    api.getAll("/x", { headers: { "x-tenant": "b" } }),
  ]);
  assert.equal(calls, 6);
});
