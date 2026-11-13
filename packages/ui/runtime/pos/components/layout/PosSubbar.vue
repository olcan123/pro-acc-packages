<!-- layout/PosSubbar.vue — İkincil bar: SHITORE (mağaza) ve KLIENTI (müşteri) bilgisi. -->
<template>
  <div class="pos-subbar flex flex-wrap items-center gap-x-8 gap-y-1 px-4 py-1.5">
    <div class="flex items-center gap-2">
      <span class="font-semibold text-paper-600 dark:text-paper-400">{{ $t("store") }}</span>
      <span class="font-bold text-paper-900 dark:text-paper-100">{{ storeName }}</span>
      <span class="text-paper-500 dark:text-paper-400">NR</span>
      <span class="font-mono text-paper-700 dark:text-paper-300">{{ fiscal || "106" }}</span>
    </div>

    <div class="flex items-center gap-2">
      <span class="font-semibold text-paper-600 dark:text-paper-400">{{ $t("client") }}</span>
      <span class="font-bold text-paper-900 dark:text-paper-100">{{ clientName }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";

const settingsStore = useSettingsStore();
// MAĞAZA: depo adı (warehouse.name) — yoksa POS adına düşer
const storeName = computed(() => settingsStore.settings?.warehouseName || settingsStore.settings?.posName || settingsStore.settings?.restaurantName || "MENTA");
// MÜŞTERİ: varsayılan cari adı (main'de seedlenen "Blerësi Fizik")
const clientName = computed(() => settingsStore.settings?.defaultAccountName || "Blerësi Fizik");
const fiscal = computed(() => settingsStore.settings?.fiscalNumber);

onMounted(() => {
  if (!settingsStore.settings) settingsStore.fetch().catch(() => {});
});
</script>
