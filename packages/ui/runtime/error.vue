<!-- error.vue — Ortak tam-ekran hata sayfası (pos-ui katmanı → main + pos + restaurant).
     404 ve 5xx için ayrı metinler; "Ana sayfaya dön" clearError ile hata durumunu temizler.
     Güvenlik: hata ayrıntısı (message/stack) YALNIZ dev'de gösterilir — prod'da sızıntı olmaz. -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
    <div class="w-full max-w-md text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10">
      <p class="text-6xl font-black text-blue-600 dark:text-blue-400">{{ statusCode }}</p>

      <h1 class="mt-4 text-xl font-bold text-gray-800 dark:text-gray-100">
        {{ is404 ? $t("error-page-title-404") : $t("error-page-title-500") }}
      </h1>

      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ is404 ? $t("error-page-desc-404") : $t("error-page-desc-500") }}
      </p>

      <!-- Hata ayrıntısı yalnız geliştirme ortamında -->
      <pre
        v-if="isDev && error?.message"
        class="mt-4 p-3 text-left text-xs bg-gray-50 dark:bg-gray-900 text-red-600 dark:text-red-400 rounded-lg overflow-x-auto"
        data-testid="error-dev-detail"
      >{{ error.message }}</pre>

      <button
        type="button"
        class="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        data-testid="error-home-btn"
        @click="goHome"
      >
        {{ $t("error-page-back-home") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  error: { type: Object, default: null },
});

const statusCode = computed(() => props.error?.statusCode || 500);
const is404 = computed(() => statusCode.value === 404);
const isDev = import.meta.dev === true;

function goHome() {
  // Hata durumunu temizleyip güvenli başlangıç noktasına dön
  clearError({ redirect: "/" });
}
</script>
