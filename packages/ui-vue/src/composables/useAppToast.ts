/**
 * useAppToast — iziToast sarmalayıcısı (Nuxt'a bağlı değil; nuxt-toast da aynı iziToast'u kullanır).
 *
 * İzin verilen iki kullanım biçimini tek API altında birleştirir:
 *   toast.success("Kayıt başarılı")                  — string
 *   toast.success({ message: "...", timeout: 5000 }) — nesne
 *
 * Tüm bildirimler varsayılan olarak ekranın sağ alt köşesinde (bottomRight) görünür.
 * Sunucuda (SSR, `window` yok) no-op döner. iziToast'un CSS'ini uygulama yükler
 * (Vue: `import "izitoast/dist/css/iziToast.min.css"` · Nuxt: nuxt-toast modülü).
 */
import iziToast from "izitoast";

type ToastMethod = "success" | "error" | "info" | "warning" | "show";
type ToastInput = string | Record<string, unknown>;

const noop = () => {};

export const useAppToast = () => {
  if (typeof window === "undefined") {
    return { success: noop, error: noop, info: noop, warning: noop, show: noop };
  }

  const raw = iziToast as unknown as Record<ToastMethod, (options: Record<string, unknown>) => void>;

  /** String gelirse { message }'a sarar; nesne gelirse seçenekleri korur. Konum varsayılanı bottomRight. */
  const wrap = (methodName: ToastMethod) => (msgOrOptions: ToastInput) => {
    const options = typeof msgOrOptions === "string" ? { message: msgOrOptions } : msgOrOptions;
    raw[methodName].call(iziToast, { position: "bottomRight", ...options });
  };

  return {
    /** Yeşil başarı bildirimi */
    success: wrap("success"),
    /** Kırmızı hata bildirimi */
    error: wrap("error"),
    /** Mavi bilgi bildirimi */
    info: wrap("info"),
    /** Sarı uyarı bildirimi */
    warning: wrap("warning"),
    /** Tipsiz, özel ayarlı bildirim */
    show: wrap("show"),
  };
};
