// 00-sw-noop.ts — Dev'de tarayıcıda kalan eski PWA service worker'ının istediği
// /dev-sw.js, /sw.js(.map), /workbox-*.js(.map) yollarını sessizce 204 ile yutar.
// Aksi halde bu istekler SPA catch-all'a düşüp "[Vue Router warn] No match found" üretir.
// Production'da PWA SW'si Nuxt PWA modülü tarafından sunulduğundan bu middleware çalışmaz.
export default defineEventHandler((event) => {
  if (!import.meta.dev) return;
  const url = event.node.req.url || "";
  if (/^\/(dev-sw\.js|sw\.js|registerSW\.js|workbox-[\w-]+\.js)(\.map)?(\?.*)?$/.test(url)) {
    setResponseStatus(event, 204);
    return "";
  }
});
