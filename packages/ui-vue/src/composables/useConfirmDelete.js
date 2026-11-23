/**
 * useConfirmDelete — Tüm Liste bileşenlerinde tekrarlayan silme onay akışını tek noktada yönetir.
 *
 * Dahili olarak useTailwindConfirm (dialog açma), useAppToast (sonuç bildirimi)
 * ve useI18n (çeviri) composable'larını kullanır.
 *
 * KULLANIM:
 *   const { confirmDelete } = useConfirmDelete();
 *
 *   confirmDelete({
 *     message:  t("delete_product_confirm", { name: item.name }),
 *     onAccept: () => store.deleteProduct(item.id),
 *   });
 *
 * Kullanılan bileşenler: account, company, product, unit, warehouse,
 *                        category, gl-account, journal-entry, invoice listleri
 */
import { useI18n } from "vue-i18n";
import { useAppToast } from "./useAppToast.ts";
import { useTailwindConfirm } from "./useTailwindConfirm.ts";

export function useConfirmDelete() {
  const { t } = useI18n();
  const toast = useAppToast();
  const confirm = useTailwindConfirm();

  /**
   * Silme onay diyaloğunu açar; kullanıcı onaylarsa onAccept fonksiyonunu çalıştırır.
   * Başarıda "deleted_successfully" toast'ı gösterir, hata durumunda hata mesajını iletir.
   *
   * @param {Object} options - Silme onayı yapılandırması
   * @param {string} options.message - Diyalog gövdesinde gösterilecek onay metni
   *   (örn. "Bu ürünü silmek istediğinizden emin misiniz?")
   * @param {Function} options.onAccept - Kullanıcı onayladığında çalışacak async silme fonksiyonu
   *   (örn. () => store.deleteProduct(item.id))
   * @param {string} [options.header] - Diyalog başlığı; verilmezse "delete_confirmation" i18n key'i kullanılır
   * @param {string} [options.icon] - PrimeIcons CSS sınıfı (varsayılan: "pi pi-exclamation-triangle")
   * @returns {void} - Diyalog açılır; sonuç toast ile bildirilir
   */
  const confirmDelete = ({ message, onAccept, header, icon }) => {
    confirm.require({
      message,
      header: header ?? t("delete_confirmation"),
      icon:   icon   ?? "pi pi-exclamation-triangle",
      acceptClass: "bg-red-600 text-white",
      accept: async () => {
        try {
          await onAccept();
          toast.success(t("deleted_successfully"));
        } catch (e) {
          // Nuxt createError → e.data.statusMessage; standart Error → e.message
          toast.error(t(e?.data?.statusMessage || e?.statusMessage || e?.message || "delete_failed"));
        }
      },
    });
  };

  return { confirmDelete };
}
