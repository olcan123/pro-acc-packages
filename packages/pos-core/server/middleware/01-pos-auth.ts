// 01-pos-auth.ts — Default-deny sunucu-taraflı kimlik doğrulama: TÜM /api/* istekleri geçerli
// pos_session çerezi gerektirir (dev'de authEnabled=false → mock). Client middleware (auth.global.ts)
// yalnız UX'tir; gerçek güvenlik bu katmandır. Muafiyetler:
//   • Her zaman: POST /api/auth/login|logout, GET /api/sync/health (posAuth.isAlwaysOpenPath)
//   • İlk kurulum (yerelde hiç kullanıcı yokken): settings/sync/bank-terminals (posAuth.isBootstrapPath)
// `~~/server/service/auth.service` içe aktarımı polimorfiktir: pos ve restaurant kendi servisini sağlar.
import { posAuthService } from "~~/server/service/auth.service";
import { requirePosAuth, isAlwaysOpenPath, isBootstrapPath } from "../utils/posAuth.ts";

// Tek yönlü mandal: kullanıcılar bir kez senkronlandıysa bootstrap modu kalıcı kapanır
// (kullanıcılar yalnız main'den gelir; her istekte DB sayımı yapmamak için süreç-içi cache).
let usersKnownToExist = false;

export default defineEventHandler(async (event) => {
  const path = (event.node.req.url || "").split("?")[0];
  if (!path.startsWith("/api/")) return;

  const method = (event.node.req.method || "GET").toUpperCase();
  if (isAlwaysOpenPath(method, path)) return;

  if (isBootstrapPath(path)) {
    try {
      requirePosAuth(event);
      return;
    } catch (err) {
      if (!usersKnownToExist) {
        // DB hatasında güvenli taraf: kullanıcı VAR say (fail-closed) → 401 fırlat.
        const hasUsers = await posAuthService.hasUsers().catch(() => true);
        if (!hasUsers) return; // İlk kurulum: settings/sync açık kalır
        usersKnownToExist = true;
      }
      throw err;
    }
  }

  requirePosAuth(event);
});
