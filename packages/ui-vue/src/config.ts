// config.ts — Paketin uygulamaya bağlı TEK noktası: gezinme, dil öneki ve HTTP. Bileşenler Nuxt'a ya da belirli bir
// router'a bağlanmaz; uygulama açılışta bir kez `app.use(ProAccUi, { router })` (Vue) ya da Nuxt eklentisi
// (@pro-acc/ui) aracılığıyla bunları verir. Verilmezse güvenli varsayılanlar çalışır.
import { ofetch, type $Fetch } from "ofetch";
import type { RouteLocationRaw } from "vue-router";

export interface ProAccUiConfig {
  /** Uygulama içi gezinme (Vue: router.push · Nuxt: navigateTo). Varsayılan: tam sayfa yükleme. */
  navigate: (to: RouteLocationRaw) => unknown;
  /** Yola dil öneki ekler (Nuxt i18n prefix_except_default: /sq/…). Varsayılan: yol aynen. */
  localePath: (path: string) => string;
  /** Paket bileşenlerinin kendi uçlarını çağırdığı HTTP istemcisi (ek dosya, kayıt geçmişi, rapor). */
  fetch: $Fetch;
}

const defaults: ProAccUiConfig = {
  navigate: (to) => {
    if (typeof to === "string" && typeof window !== "undefined") window.location.assign(to);
  },
  localePath: (path) => path,
  fetch: ofetch.create({ credentials: "include", headers: { Accept: "application/json" } }),
};

let current: ProAccUiConfig = { ...defaults };

/** Uygulama açılışında çağrılır; verilmeyen alanlar mevcut değerini korur. */
export function configureProAccUi(options: Partial<ProAccUiConfig>): void {
  current = { ...current, ...Object.fromEntries(Object.entries(options).filter(([, v]) => v != null)) };
}

/** Yalnız testler için: varsayılanlara döner. */
export function resetProAccUiConfig(): void {
  current = { ...defaults };
}

/** Dil önekli yola gider (Nuxt'taki `navigateTo(localePath(path))` karşılığı). */
export function uiNavigate(to: RouteLocationRaw): unknown {
  return current.navigate(typeof to === "string" ? current.localePath(to) : to);
}

export function uiLocalePath(path: string): string {
  return current.localePath(path);
}

/** Paket içi HTTP çağrısı — çağrı anında okunur, böylece sonradan yapılan yapılandırma da geçerli olur. */
export const uiFetch = ((request: Parameters<$Fetch>[0], options?: Parameters<$Fetch>[1]) =>
  current.fetch(request, options)) as $Fetch;
