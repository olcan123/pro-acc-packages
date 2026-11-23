/**
 * useFormStyles.js — Form bileşenlerinin CSS sınıf hesaplamalarının tek kaynağı.
 *
 * Bu dosya iki composable export eder:
 *   - useFieldInputState: input, textarea, select vb. alanların durum sınıfları
 *   - useFieldBadge: badge bileşeninin renk ve boyut sınıfları
 *
 * CSS karşılıkları app/assets/css/main.css içinde @layer components bloğunda tanımlıdır.
 * Kullanılan sınıf grupları:
 *   field-input-{base|default|filled|error|disabled}
 *   field-size-{xs|sm|md}
 *   field-label, field-label-{default|filled|error|disabled}
 *   badge-base, badge-{primary|success|danger|warning|info|secondary}
 *   badge-size-{xs|sm|md|lg}
 */

import { computed, toValue, getCurrentInstance } from "vue";

/**
 * Doğrulama hata metnini gösterilecek metne çevirir.
 * Sunucu şemaları (server/validation/*) mesajı i18n ANAHTARI olarak verir ("v_payment_amount_positive");
 * bazı formlar ise zaten çevrilmiş cümle verir (LoginForm). Anahtarsa çevrilir, değilse aynen kalır —
 * böylece kullanıcı hiçbir zaman "Hata! v_..." görmez ve hazır cümleler bozulmaz.
 * i18n kurulu değilse (izole birim testi) metin olduğu gibi döner.
 * setup() içinde çağrılmalıdır (bileşen örneğinin $t/$te'sini kullanır).
 * @param {import("vue").MaybeRefOrGetter<string|undefined>} errorMessage
 * @returns {import("vue").ComputedRef<string|undefined>}
 */
export function useErrorText(errorMessage) {
  const proxy = getCurrentInstance()?.proxy;
  return computed(() => {
    const msg = toValue(errorMessage);
    if (!msg) return msg;
    const t = proxy?.$t;
    const te = proxy?.$te;
    return typeof t === "function" && typeof te === "function" && te(msg) ? t(msg) : msg;
  });
}

// ─── INPUT STATE ──────────────────────────────────────────────────────────────

/**
 * Form input bileşenlerinin durum, boyut ve etiket CSS sınıflarını hesaplar.
 * Tüm Field* bileşenleri (TextInput, NumberInput, TextArea, DateInput, PasswordInput,
 * Autocomplete, Select, ImageUpload) bu composable'ı kullanır.
 *
 * Durum öncelik sırası: disabled > error > filled > default
 *
 * @param {Ref<string>|ComputedRef<string>} errorMessage
 *   vee-validate hata mesajı; boş string veya undefined ise hata yok sayılır
 * @param {Ref<any>|ComputedRef<any>} value
 *   Alanın mevcut değeri; truthy ise "filled" (dolu) durumu etkinleşir
 * @param {Ref<boolean>|boolean} isShowSuccess
 *   false verilirse "filled" durum sınıfı gösterilmez (bazı alanlarda success feedback istenmiyor)
 * @param {Ref<boolean>|boolean} disabled
 *   Alan etkileşime kapalıysa true; diğer tüm durumların önüne geçer
 * @param {Ref<string>|string} size
 *   Alan boyutu: 'xs' | 'sm' | 'small' | 'normal' (varsayılan: 'normal' → md)
 *
 * @returns {{
 *   stateClass: ComputedRef<string>,
 *   sizeClass: ComputedRef<string>,
 *   labelClass: ComputedRef<string>
 * }}
 *   stateClass: input border/arka plan CSS sınıfı (örn. "field-input-error")
 *   sizeClass: padding/font-size CSS sınıfı (örn. "field-size-md")
 *   labelClass: etiket rengi ve temel CSS sınıfı (örn. "field-label field-label-filled")
 */
export function useFieldInputState(errorMessage, value, isShowSuccess, disabled, size) {

  /**
   * Input'un görsel durumunu belirleyen Tailwind bileşen sınıfı.
   * Öncelik: disabled > error > filled > default
   * @type {ComputedRef<string>}
   */
  const stateClass = computed(() => {
    if (toValue(disabled))                                  return "field-input-disabled";
    if (toValue(errorMessage))                              return "field-input-error";
    if (toValue(value) && toValue(isShowSuccess) !== false) return "field-input-filled";
    return "field-input-default";
  });

  /**
   * Boyut prop'una karşılık gelen padding/font-size Tailwind bileşen sınıfı.
   * xs → 7px yükseklik (tablo filtre), sm → kompakt, md → standart (varsayılan).
   * @type {ComputedRef<string>}
   */
  const sizeClass = computed(() => {
    const s = toValue(size) || "normal";
    if (s === "xs")                  return "field-size-xs";
    if (s === "small" || s === "sm") return "field-size-sm";
    return "field-size-md";
  });

  /**
   * Etiketin (label) rengini ve temel stilini birleştiren CSS sınıfı.
   * Her zaman "field-label" temel sınıfını içerir; duruma göre renk eklenir.
   * @type {ComputedRef<string>}
   */
  const labelClass = computed(() => {
    if (toValue(errorMessage))                              return "field-label field-label-error";
    if (toValue(value) && toValue(isShowSuccess) !== false) return "field-label field-label-filled";
    return "field-label field-label-default";
  });

  /** Gösterilecek hata metni: i18n anahtarı ise çevrilmiş hâli (bkz. useErrorText). */
  const errorText = useErrorText(errorMessage);

  return { stateClass, sizeClass, labelClass, errorText };
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

/** severity prop → CSS renk sınıfı eşleme tablosu */
const BADGE_SEVERITY_MAP = {
  success:   "badge-success",
  error:     "badge-danger",
  danger:    "badge-danger",
  warning:   "badge-warning",
  info:      "badge-info",
  secondary: "badge-secondary",
};

/** size prop → CSS boyut sınıfı eşleme tablosu */
const BADGE_SIZE_MAP = {
  xs: "badge-size-xs",
  sm: "badge-size-sm",
  lg: "badge-size-lg",
};

/**
 * FieldBadge bileşeni için severity ve size prop'larını CSS sınıflarına dönüştürür.
 * Bilinmeyen severity değerinde "badge-primary", bilinmeyen size'da "badge-size-md" döner.
 *
 * @param {Ref<string>|string} severity
 *   Badge renk şiddeti: 'primary' | 'success' | 'danger' | 'error' | 'warning' | 'info' | 'secondary'
 * @param {Ref<string>|string} size
 *   Badge boyutu: 'xs' | 'sm' | 'md' | 'lg'
 *
 * @returns {{
 *   badgeClass: ComputedRef<string>,
 *   badgeSizeClass: ComputedRef<string>
 * }}
 *   badgeClass: renk CSS sınıfı (örn. "badge-success")
 *   badgeSizeClass: boyut CSS sınıfı (örn. "badge-size-md")
 */
export function useFieldBadge(severity, size) {
  /** Severity'ye karşılık gelen arka plan/metin renk sınıfı */
  const badgeClass = computed(
    () => BADGE_SEVERITY_MAP[toValue(severity)] ?? "badge-primary"
  );

  /** Boyuta karşılık gelen padding/font-size sınıfı */
  const badgeSizeClass = computed(
    () => BADGE_SIZE_MAP[toValue(size)] ?? "badge-size-md"
  );

  return { badgeClass, badgeSizeClass };
}
