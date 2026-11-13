<template>
  <button
    :type="type"
    :form="form"
    :title="tooltip || null"
    :aria-label="!label && !$slots.default && tooltip ? tooltip : null"
    :disabled="disabled || loading"
    :class="[
      'btn-base',
      variantClass,
      sizeClass,
      rounded ? 'rounded-full' : 'rounded-lg',
      shadow && variant !== 'ghost' && variant !== 'link' ? 'shadow-sm' : '',
    ]"
    @click="$emit('click', $event)"
  >
    <!-- Yükleniyor: spinner ikonu -->
    <i v-if="loading" class="pi pi-spin pi-spinner mr-2"/>
    <!-- Normal: prop ile verilen ikon -->
    <i v-else-if="icon" :class="[icon, label ? 'mr-2' : '']"/>
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup>
// FieldButton.vue — Çok varyantlı buton: primary|secondary|danger|success|warning|ghost|link. size: xs|sm|md|lg.
import { computed } from "vue";

const props = defineProps({
  label:    { type: String,  default: "" },
  icon:     { type: String,  default: "" },
  type:     { type: String,  default: "button" },
  form:     { type: String,  default: null },
  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
  rounded:  { type: Boolean, default: false },
  shadow:   { type: Boolean, default: true },
  variant:  { type: String,  default: "primary" },
  size:     { type: String,  default: "md" },
  /**
   * İpucu metni.
   *
   * NEDEN NATIVE `title` (v-tooltip direktifi DEĞİL):
   * Bu prop 40+ yerde `:tooltip="$t('export_to_excel')"` diye kullanılıyordu ama
   * bileşende KARŞILIĞI YOKTU — PrimeVue Button'dan FieldButton'a geçilirken
   * düşmüş. Vue tanınmayan prop'u ham HTML özniteliği olarak basar, yani
   * `tooltip="Excel"` diye geçersiz bir öznitelik yazılıp ekranda hiçbir şey
   * görünmüyordu. Sessiz kayıptı: build de testler de yeşildi.
   *
   * `title` seçildi çünkü FieldButton üç uygulamanın HER yerinde (SSR, baskı,
   * birim testleri) kullanılıyor; direktif bağımlılığı olmayan tek çözüm bu.
   * Zengin balon isteyen çağrı yerleri `v-tooltip` direktifini doğrudan kullanır
   * (packages/pos-ui/app/plugins/tooltip.client.ts).
   *
   * Yalnız-ikon butonda ayrıca `aria-label` basılır: ikonun metin karşılığı yok,
   * ekran okuyucu aksi hâlde butonu isimsiz okur.
   */
  tooltip:  { type: String,  default: "" },
});

defineEmits(["click"]);

// variant prop → CSS bileşen sınıfı (main.css @layer components)
const variantClass = computed(() => ({
  primary:   "btn-primary",
  secondary: "btn-secondary",
  danger:    "btn-danger",
  success:   "btn-success",
  warning:   "btn-warning",
  ghost:     "btn-ghost",
  link:      "btn-link",
})[props.variant] ?? "btn-primary");

// size prop → CSS bileşen sınıfı (main.css @layer components)
const sizeClass = computed(() => ({
  xs: "btn-size-xs",
  sm: "btn-size-sm",
  lg: "btn-size-lg",
})[props.size] ?? "btn-size-md");
</script>
