// 11-csrf-origin.ts — CSRF savunması: durum değiştiren /api/* isteklerinde Origin ↔ Host eşleşmesi.
// sameSite=lax çerezlerle birlikte çalışır: tarayıcı cross-site POST'ta Origin başlığını her zaman
// gönderir → uyuşmazlık 403 ile kesilir. Origin başlığı OLMAYAN istekler (curl, sunucular-arası
// senkron, eski istemciler) serbesttir — bunlar çerez taşımadığından CSRF vektörü değildir.
// /api/pos/* ve /api/restaurant/* muaf: x-pos-key ile doğrulanan sunucu→sunucu senkron uçlarıdır.

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const EXEMPT_PREFIXES = ["/api/pos/", "/api/restaurant/"];

/**
 * İstek cross-origin CSRF adayı mı? (saf fonksiyon — birim test edilir)
 * Origin varsa host kısmı Host veya X-Forwarded-Host ile eşleşmelidir.
 */
export function isCrossOriginRequest(
  origin: string | undefined,
  host: string | undefined,
  forwardedHost?: string | undefined
): boolean {
  if (!origin) return false; // Origin yok → tarayıcı-dışı istemci; çerez tabanlı CSRF söz konusu değil
  if (origin === "null") return true; // sandbox/file kaynaklı — güvenilmez
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true; // bozuk Origin — güvenilmez
  }
  return originHost !== host && originHost !== forwardedHost;
}

export default defineEventHandler((event) => {
  const method = (event.node.req.method || "GET").toUpperCase();
  if (!STATE_CHANGING.has(method)) return;

  const path = (event.node.req.url || "").split("?")[0];
  if (!path.startsWith("/api/")) return;
  if (EXEMPT_PREFIXES.some((p) => path.startsWith(p))) return;

  const origin = getHeader(event, "origin");
  const host = getHeader(event, "host");
  const forwardedHost = getHeader(event, "x-forwarded-host");

  if (isCrossOriginRequest(origin, host, forwardedHost)) {
    throw createError({ statusCode: 403, statusMessage: "cross-origin-forbidden" });
  }
});
