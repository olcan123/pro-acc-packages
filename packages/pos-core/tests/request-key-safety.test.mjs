// request-key-safety.test.mjs — Farklı HTTP sorguları aynı uçuş anahtarında birleşmemelidir.
import { test } from "node:test";
import assert from "node:assert/strict";
import Factory, { readRequestKey } from "../app/repository/factory.ts";
await test("karmaşık sorgu türlerinde paylaşım atlanır", () => {
  for (const value of [
    new Date("2026-11-13T00:00:00Z"),
    { a: 1 },
    [[1]],
    [undefined],
    NaN,
    Infinity,
  ]) {
    assert.equal(readRequestKey("/x", { query: { value } }), undefined);
  }
  assert.ok(readRequestKey("/x", { query: { value: [null, 1, "a"] } }));
});
await test("Date ve düz ISO metni ayrı HTTP istekleri olarak kalır", async () => {
  let calls = 0;
  const api = new Factory(async () => {
    calls++;
    return [];
  });
  const date = new Date("2026-11-13T00:00:00Z");
  await Promise.all([
    api.getAll("/x", { query: { date } }),
    api.getAll("/x", { query: { date: date.toISOString() } }),
  ]);
  assert.equal(calls, 2);
});
