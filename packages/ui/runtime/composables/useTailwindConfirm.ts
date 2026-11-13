/**
 * useTailwindConfirm.ts — Özel Tailwind onay diyaloğu yönetici composable'ı.
 *
 * Modül seviyesinde (singleton) state tutar: aynı anda yalnızca bir dialog açık olabilir.
 * FieldConfirmDialog.vue bileşeni bu composable'ı okuyarak kendini gösterir/gizler.
 * useConfirmDelete composable'ı da bu composable'ı kullanır.
 *
 * KULLANIM:
 *   const confirm = useTailwindConfirm();
 *   confirm.require({ message: "...", accept: () => doSomething() });
 */
import { ref } from "vue";

/** Diyalog yapılandırma seçenekleri */
interface ConfirmOptions {
  /** Kullanıcıya gösterilecek onay mesajı */
  message: string;
  /** Diyalog başlık metni (opsiyonel) */
  header?: string;
  /** PrimeIcons CSS sınıfı, örn. "pi pi-exclamation-triangle" (opsiyonel) */
  icon?: string;
  /** Onay butonunun etiketi (opsiyonel, varsayılan: i18n 'confirm') */
  acceptLabel?: string;
  /** İptal butonunun etiketi (opsiyonel, varsayılan: i18n 'cancel') */
  rejectLabel?: string;
  /** Onay butonu için ek CSS sınıfı (örn. "bg-red-600 text-white") */
  acceptClass?: string;
  /** İptal butonu için ek CSS sınıfı */
  rejectClass?: string;
  /** Kullanıcı onayladığında çalışacak async fonksiyon */
  accept?: () => void;
  /** Kullanıcı iptal ettiğinde çalışacak fonksiyon */
  reject?: () => void;
}

/** Diyaloğun görünürlük durumu — singleton, tüm composable kullanımları paylaşır */
const isVisible = ref(false);

/** Şu an açık diyaloğun yapılandırması — null ise diyalog kapalı */
const options = ref<ConfirmOptions | null>(null);

export const useTailwindConfirm = () => {

  /**
   * Onay diyaloğunu belirtilen seçeneklerle açar.
   * Önceki diyalog varsa üzerine yazar (yalnızca bir diyalog aynı anda açık olabilir).
   *
   * @param {ConfirmOptions} confirmOptions - Diyalog başlık, mesaj ve callback yapılandırması
   * @returns {void}
   */
  const require = (confirmOptions: ConfirmOptions) => {
    options.value = confirmOptions;
    isVisible.value = true;
  };

  /**
   * Diyaloğu kapatır; state'i temizlemez (sonraki açılışa kadar options'ı korur).
   *
   * @returns {void}
   */
  const close = () => {
    isVisible.value = false;
  };

  /**
   * Kullanıcı "Onayla" butonuna bastığında çağrılır.
   * options.accept callback'ini çalıştırır ve diyaloğu kapatır.
   *
   * @returns {void}
   */
  const accept = () => {
    if (options.value?.accept) options.value.accept();
    close();
  };

  /**
   * Kullanıcı "İptal" butonuna bastığında veya diyalog dışına tıkladığında çağrılır.
   * options.reject callback'ini çalıştırır (varsa) ve diyaloğu kapatır.
   *
   * @returns {void}
   */
  const reject = () => {
    if (options.value?.reject) options.value.reject();
    close();
  };

  return { isVisible, options, require, accept, reject, close };
};
