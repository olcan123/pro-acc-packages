// posAuth.ts — POS/Restoran sunucu-taraflı kimlik doğrulama yardımcıları (01-pos-auth middleware + route'lar).
// AUTH_ENABLED=false (dev) modunda client'taki auth.global.ts DEV_MOCK_USER ile uyumlu mock enjekte edilir;
// aksi halde httpOnly pos_session çerezi verifyPosToken ile doğrulanır. Ana kaynak: terminalSession.ts.
import type { H3Event } from "h3";
import { verifyPosToken, POS_SESSION_COOKIE, type PosSessionPayload } from "./terminalSession.ts";

/** Dev modunda (authEnabled=false) enjekte edilen mock kullanıcı — auth.global.ts ile uyumlu tutulmalı. */
export function getPosDevMockUser(): PosSessionPayload {
  return {
    userId: 1,
    email: "developer@pro-acc.local",
    firstName: "Dev",
    lastName: "User",
    roleKey: "ADMIN",
  };
}

/**
 * Event'ten geçerli POS oturumunu döner ve `event.context.posUser`'a yazar; yoksa 401 fırlatır.
 * authEnabled=false (dev) ise mock kullanıcı döner — dev deneyimi bozulmaz.
 */
export function requirePosAuth(event: H3Event): PosSessionPayload {
  if (event.context.posUser) return event.context.posUser;

  const config = useRuntimeConfig(event) as { authEnabled?: boolean };
  if (!config.authEnabled) {
    const mock = getPosDevMockUser();
    event.context.posUser = mock;
    return mock;
  }

  const payload = verifyPosToken(getCookie(event, POS_SESSION_COOKIE));
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: "unauthenticated" });
  }
  event.context.posUser = payload;
  return payload;
}

/**
 * Her zaman açık uçlar (oturum gerektirmez): giriş/çıkış + senkron sağlık rozeti.
 * Health salt-okunur bir özet döner; login öncesi üst bar rozeti kırılmasın diye açıktır.
 */
export function isAlwaysOpenPath(method: string, path: string): boolean {
  if (method === "POST" && (path === "/api/auth/login" || path === "/api/auth/logout")) return true;
  if (method === "GET" && path === "/api/sync/health") return true;
  return false;
}

/**
 * İlk kurulum (bootstrap) uçları: yerelde HİÇ kullanıcı yokken oturumsuz erişilebilir.
 * Gerekçe: kullanıcılar main'den senkronlanır → "giriş için sync gerek, sync için ayar gerek"
 * kilidini çözmek için /settings sayfasının kullandığı uçlar ilk kurulumda açık kalmalıdır
 * (bkz. app/middleware/auth.global.ts PUBLIC_PATHS). Kullanıcılar senkronlanır senkronlanmaz kapanır.
 */
export function isBootstrapPath(path: string): boolean {
  return (
    path === "/api/settings" ||
    path.startsWith("/api/settings/") ||
    path.startsWith("/api/sync/") ||
    path === "/api/bank-terminals" ||
    path.startsWith("/api/bank-terminals/")
  );
}
