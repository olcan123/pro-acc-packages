<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->
<script setup>
/**
 * ReportSearchBar — Rapor sayfalarının üst kısmında kullanılan
 * arama kutusu + sayfa başına satır sayısı seçici.
 *
 * v-model        → arama metni (global DataTable filtresi)
 * v-model:rows   → seçili satır sayısı
 */
const props = defineProps({
  modelValue: { type: String, default: "" },
  rows: { type: Number, default: 20 },
  rowsOptions: { type: Array, default: () => [5, 10, 20, 50, 100] },
  placeholder: { type: String, default: "Ara..." },
});

const emit = defineEmits(["update:modelValue", "update:rows"]);
</script>

<template>
  <div
    class="flex flex-col items-start gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center dark:border-gray-700"
  >
    <!-- Arama input'u — arama ikonu sol içe hizalı -->
    <div class="relative max-w-sm flex-1">
      <i class="pi pi-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400" />
      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="ctrl-search"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </div>

    <!-- Sayfa başına satır seçici (ctrl-select: main.css) -->
    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>{{ $t("rows_per_page", "Sayfa başına:") }}</span>
      <select :value="rows" class="ctrl-select" @change="emit('update:rows', Number($event.target.value))">
        <option v-for="opt in rowsOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </div>
</template>
