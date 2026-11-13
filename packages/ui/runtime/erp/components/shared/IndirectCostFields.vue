<!--
  shared/IndirectCostFields.vue — Üretimde DOLAYLI MALİYET alanları (işçilik + GÜG).
  Reçete (BomForm), üretim emri (ProductionForm) ve iş emri (WorkOrderForm) formlarının
  üçü de aynı bileşeni kullanır → alan adları ve davranış tek yerde tanımlıdır.

  Tutar girildiğinde karşı (yansıtma) muhasebe hesabı ZORUNLUDUR: yevmiye fişi
  D Mamul Depo / C İşçilik-GÜG şeklinde dengelenir (bkz. order.journal.ts).
  Boş bırakılırsa (0) üretim eskisi gibi yalnız malzeme maliyetiyle çalışır.
-->
<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <i class="pi pi-wrench text-sm text-amber-600" />
      <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {{ title || t("indirect_production_costs", "Dolaylı Üretim Maliyetleri") }}
      </h4>
      <span class="text-xs text-gray-400">{{ t("optional", "opsiyonel") }}</span>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- İşçilik -->
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ laborLabel || t("labor_cost", "İşçilik") }}
        </label>
        <input
          v-model.number="laborCost"
          type="number"
          min="0"
          step="any"
          class="bg-paper-50 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t("labor_gl_account", "İşçilik Yansıtma Hesabı") }}
          <span v-if="Number(laborCost) > 0" class="text-red-500">*</span>
        </label>
        <select
          v-model="laborGlAccountId"
          class="bg-paper-50 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option :value="null">{{ t("select_gl_account", "Muhasebe hesabı seçiniz") }}</option>
          <option v-for="a in accountOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
      </div>

      <!-- GÜG -->
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ overheadLabel || t("overhead_cost", "Genel Üretim Gideri (GÜG)") }}
        </label>
        <input
          v-model.number="overheadCost"
          type="number"
          min="0"
          step="any"
          class="bg-paper-50 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t("overhead_gl_account", "GÜG Yansıtma Hesabı") }}
          <span v-if="Number(overheadCost) > 0" class="text-red-500">*</span>
        </label>
        <select
          v-model="overheadGlAccountId"
          class="bg-paper-50 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option :value="null">{{ t("select_gl_account", "Muhasebe hesabı seçiniz") }}</option>
          <option v-for="a in accountOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
      </div>
    </div>

    <p class="text-xs text-gray-400">
      {{
        hint ||
        t(
          "indirect_cost_hint",
          "Girilen tutarlar mamulün birim maliyetine eklenir; karşı hesaba alacak yazılarak gider yansıtılır. Boş bırakılırsa maliyet yalnız malzemeden oluşur.",
        )
      }}
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useGlAccountStore } from "#imports";

defineProps({
  title: { type: String, default: "" },
  laborLabel: { type: String, default: "" },
  overheadLabel: { type: String, default: "" },
  hint: { type: String, default: "" },
});

const laborCost = defineModel("laborCost", { type: Number, default: 0 });
const overheadCost = defineModel("overheadCost", { type: Number, default: 0 });
const laborGlAccountId = defineModel("laborGlAccountId", { type: Number, default: null });
const overheadGlAccountId = defineModel("overheadGlAccountId", { type: Number, default: null });

const { t } = useI18n();
const glAccountStore = useGlAccountStore();
const { glAccounts } = storeToRefs(glAccountStore);

// Yansıtma hesabı: gider (5xxx) ve maliyet hesapları arasından seçilir.
// Yalnız ALT hesaplar (kod içinde "." olanlar) listelenir — yevmiye ana hesaba yazılmaz.
const accountOptions = computed(() =>
  (glAccounts.value || [])
    .filter((a) => a.code && a.code.includes(".") && String(a.code).startsWith("5"))
    .map((a) => ({ label: `${a.code} - ${a.name}`, value: a.id })),
);

onMounted(() => {
  if (!glAccounts.value?.length) glAccountStore.fetchAccounts?.();
});
</script>
