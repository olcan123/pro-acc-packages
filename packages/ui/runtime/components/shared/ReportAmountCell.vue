<script setup>
// `computed` açıkça import edilir: kardeş bileşenlerle (FieldNumberInput.vue vb.)
// aynı desen ve Nuxt auto-import'u olmayan ortamlarda (birim testi) da çalışır.
import { computed } from "vue";

/**
 * ReportAmountCell — Borç/Alacak sütun hücresi.
 *
 * Props:
 *   value         - numeric değer (pozitif, negatif veya sıfır)
 *   positiveClass - pozitif değer için CSS class (varsayılan: defter yeşili)
 *   negativeClass - negatif değer için CSS class (varsayılan: oxblood)
 *
 * Gösterim:
 *   value > 0  → positive rampası, formatlanmış tutar
 *   value < 0  → negative rampası, "(-) tutar" öneki
 *   value == 0 → soluk "–" işareti
 *
 * Renkler ham Tailwind ailesi yerine defter rampalarından verilir; böylece anlam
 * (alacak/borç) doğrudan token adında görünür ve tema değişse de doğru kalır.
 * Her kademe kendi zemininde WCAG AA geçer (tests/unit/design/contrast.test.ts).
 */
const props = defineProps({
  value: { type: [Number, String], default: 0 },
  positiveClass: { type: String, default: "text-positive-600 dark:text-positive-400" },
  negativeClass: { type: String, default: "text-negative-600 dark:text-negative-400" },
  currency: { type: String, default: "EUR" },
  locale: { type: String, default: "tr-TR" },
});

const numVal = computed(() => Number(props.value));

const formatted = computed(() =>
  new Intl.NumberFormat(props.locale, {
    style: "currency",
    currency: props.currency,
  }).format(Math.abs(numVal.value))
);
</script>

<template>
  <span
    v-if="numVal !== 0"
    class="font-semibold"
    :class="numVal > 0 ? positiveClass : negativeClass"
  >
    <span v-if="numVal < 0" class="opacity-70 mr-0.5">(-)</span>{{ formatted }}
  </span>
  <!-- Sıfır: "burada bir şey yok" işareti. Soluk ama koyu modda da SEÇİLEBİLİR
       olmalı (paper-600 koyu zeminde 1.6 kontrastla neredeyse kaybolyordu). -->
  <span v-else class="text-paper-400 dark:text-paper-500">–</span>
</template>
