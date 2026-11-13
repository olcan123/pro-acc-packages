/**
 * useAppToast — iziToast (nuxt-toast) wrapper composable'ı.
 *
 * İzin verilen iki kullanım biçimini tek API altında birleştirir:
 *   toast.success("Kayıt başarılı")            — string
 *   toast.success({ message: "...", timeout: 5000 }) — nesne
 *
 * SSR tarafında (import.meta.server) veya iziToast eklentisi yüklenmemişse
 * no-op fonksiyonlar döner; sunucu tarafında çalışmaya çalışmaz.
 *
 * Tüm bildirimler varsayılan olarak ekranın sağ alt köşesinde (bottomRight) görünür.
 */
export const useAppToast = () => {
  const nuxtApp = useNuxtApp();
  // Tip açıkça verilir: enjeksiyon tipi Nuxt'un üretilen tiplerine bağlı kalmasın.
  const raw = nuxtApp.$iziToast as Record<string, ((options: Record<string, unknown>) => void) | undefined> | undefined;

  // SSR'da veya plugin yüklenmemişse no-op nesnesi döndür
  if (import.meta.server || !raw) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      show: () => {},
    };
  }

  /**
   * İziToast metodunu string veya nesne argümanı ile çağıran yardımcı fonksiyon.
   * String gelirse { message } nesnesine sarıp konumu bottomRight olarak ayarlar.
   * Nesne gelirse mevcut seçenekleri koruyup konumu varsayılan olarak ekler.
   *
   * @param {string} methodName - iziToast metod adı: 'success' | 'error' | 'info' | 'warning' | 'show'
   * @returns {Function} String veya nesne kabul eden bildirim fonksiyonu
   */
  const wrap = (methodName: string) => (msgOrOptions: string | Record<string, any>) => {
    const method = raw[methodName];
    if (!method) return;

    if (typeof msgOrOptions === 'string') {
      method.call(raw, { message: msgOrOptions, position: 'bottomRight' });
    } else {
      method.call(raw, { position: 'bottomRight', ...msgOrOptions });
    }
  };

  return {
    /**
     * Yeşil başarı bildirimi gösterir.
     * @param {string | Object} msgOrOptions - Mesaj string'i veya iziToast seçenekleri nesnesi
     */
    success: wrap('success'),

    /**
     * Kırmızı hata bildirimi gösterir.
     * @param {string | Object} msgOrOptions - Mesaj string'i veya iziToast seçenekleri nesnesi
     */
    error: wrap('error'),

    /**
     * Mavi bilgi bildirimi gösterir.
     * @param {string | Object} msgOrOptions - Mesaj string'i veya iziToast seçenekleri nesnesi
     */
    info: wrap('info'),

    /**
     * Sarı uyarı bildirimi gösterir.
     * @param {string | Object} msgOrOptions - Mesaj string'i veya iziToast seçenekleri nesnesi
     */
    warning: wrap('warning'),

    /**
     * Özel ayarlarla bildirim gösterir (tip belirtilmemiş).
     * @param {string | Object} msgOrOptions - Mesaj string'i veya iziToast seçenekleri nesnesi
     */
    show: wrap('show'),
  };
};
