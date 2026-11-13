// 10-security-headers.ts — HTTP güvenlik başlıkları (3 uygulama da pos-ui katmanından alır).
// Clickjacking (X-Frame-Options/frame-ancestors), MIME-sniffing (nosniff) ve XSS (CSP) savunması.
// HSTS BİLİNÇLİ OLARAK YOK: LAN'da TLS'siz HTTP dağıtımları var (COOKIE_SECURE=false senaryosu);
// HSTS eklenirse cihazlar HTTPS'e zorlanıp uygulamaya erişemez. TLS zorunlu hale gelirse eklenir.
// CSP yalnız production'da set edilir — dev'de Vite HMR/devtools inline/ws ihtiyaçlarını kırmasın.

/** Ortama göre gönderilecek başlık haritasını üretir (saf fonksiyon — birim test edilir). */
export function buildSecurityHeaders(isDev: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  if (!isDev) {
    // Pragmatik CSP: Nuxt hydration payload'ı ve PrimeVue/Tailwind inline stilleri nedeniyle
    // 'unsafe-inline' gerekir; POS→main senkronu SUNUCU tarafında yapıldığından (sync.service
    // Nitro içinde $fetch atar) connect-src 'self' yeterlidir. PWA SW/manifest aynı origin'dir.
    headers["Content-Security-Policy"] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
  }

  return headers;
}

const HEADERS = buildSecurityHeaders(import.meta.dev === true);

export default defineEventHandler((event) => {
  for (const [name, value] of Object.entries(HEADERS)) {
    setResponseHeader(event, name, value);
  }
});
