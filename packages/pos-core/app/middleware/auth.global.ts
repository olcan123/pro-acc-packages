// auth.global.ts — POS/Restoran ortak global rota koruması (pos-core layer): oturum yoksa /login'e yönlendirir.
// Oturum httpOnly çerezde tutulduğundan kontrol istemci tarafında yapılır (SSR cookie
// forwarding karmaşası olmadan). /login sayfası muaftır.
// AUTH_ENABLED=false (dev modu) ise tüm auth kontrolü atlanır; mock kullanıcı kullanılır.
import { useAuthStore } from "@pro-acc/ui/pos/stores/auth.store.js";

// Giriş gerektirmeyen sayfalar: /login ve /settings (ilk kurulumda main bağlantısını
// yapılandırabilmek için — aksi halde "giriş için sync gerek, sync için ayar gerek" kilidi oluşur).
const PUBLIC_PATHS = ["/login", "/settings"];

// Dev mod için mock kullanıcı — main'deki getDevMockUser ile uyumlu
const DEV_MOCK_USER = {
  userId: 1,
  firstName: "Dev",
  lastName: "User",
  email: "developer@pro-acc.local",
  role: "ADMIN",
};

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const config = useRuntimeConfig();

  // Auth kapalıysa (dev modu) mock kullanıcı ile bypass et
  if (!config.public.authEnabled) {
    const auth = useAuthStore();
    if (!auth.isInitialized) {
      auth.user = DEV_MOCK_USER;
      auth.isInitialized = true;
    }
    return;
  }

  if (PUBLIC_PATHS.includes(to.path)) return;

  const auth = useAuthStore();
  if (!auth.isInitialized) await auth.fetchMe();

  if (!auth.isAuthenticated) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
