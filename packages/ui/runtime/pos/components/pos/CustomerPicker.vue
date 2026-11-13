<!-- pos/CustomerPicker.vue — Şirket müşterisi seçimi: yerel önbellekte NUI/ad araması ya da elle giriş.
     Seçilince fişe NUI yazılır ve B2B nakit sınırı devreye girer. pos + restoran ORTAK. -->
<template>
  <div class="rounded-xl border border-paper-300 dark:border-paper-700 px-3 py-2 text-sm" data-testid="customer-picker">
    <!-- Seçili müşteri -->
    <div v-if="modelValue" class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="font-semibold truncate"><i class="pi pi-building mr-1.5" />{{ modelValue.name }}</div>
        <div class="text-xs text-paper-600 dark:text-paper-400 tabular-nums">NUI {{ modelValue.fiscalNumber }}</div>
      </div>
      <button type="button" class="btn-base btn-secondary btn-size-sm rounded-lg" data-testid="customer-clear" @click="clear">
        <i class="pi pi-times mr-1" />{{ $t("customer_remove") }}
      </button>
    </div>

    <!-- Kapalı: tek satır düğme -->
    <button v-else-if="!open" type="button" class="w-full flex items-center justify-between" data-testid="customer-open" @click="open = true">
      <span><i class="pi pi-user mr-1.5" />{{ $t("customer_walk_in") }}</span>
      <span class="text-blue-600 dark:text-blue-400"><i class="pi pi-building mr-1" />{{ $t("customer_add_company") }}</span>
    </button>

    <!-- Açık: arama + elle giriş -->
    <div v-else class="flex flex-col gap-2">
      <div class="flex gap-2">
        <input
          v-model.trim="query"
          type="text"
          class="flex-1 rounded border border-paper-300 dark:border-paper-700 bg-transparent px-2 py-1.5"
          :placeholder="$t('customer_search_placeholder')"
          data-testid="customer-search"
          @input="onSearch"
        />
        <button type="button" class="btn-base btn-secondary btn-size-sm rounded-lg" @click="close">
          <i class="pi pi-times" />
        </button>
      </div>

      <ul v-if="results.length" class="max-h-32 overflow-y-auto divide-y divide-paper-200 dark:divide-paper-800">
        <li v-for="c in results" :key="c.id">
          <button type="button" class="w-full text-left py-1.5 hover:bg-paper-100 dark:hover:bg-paper-800" data-testid="customer-result" @click="pick(c)">
            <span class="font-medium">{{ c.name }}</span>
            <span class="ml-2 text-xs text-paper-600 dark:text-paper-400 tabular-nums">{{ c.fiscalNumber }}</span>
          </button>
        </li>
      </ul>

      <!-- Önbellekte yoksa elle giriş (main cariyi NUI ile bulur ya da açar) -->
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model.trim="manual.fiscalNumber"
          type="text"
          inputmode="numeric"
          maxlength="9"
          class="rounded border bg-transparent px-2 py-1.5 tabular-nums"
          :class="manual.fiscalNumber && !fiscalValid ? 'border-rose-400' : 'border-paper-300 dark:border-paper-700'"
          placeholder="NUI"
          data-testid="customer-manual-nui"
        />
        <input
          v-model.trim="manual.name"
          type="text"
          maxlength="200"
          class="rounded border border-paper-300 dark:border-paper-700 bg-transparent px-2 py-1.5"
          :placeholder="$t('customer_name')"
          data-testid="customer-manual-name"
        />
      </div>
      <p v-if="manual.fiscalNumber && !fiscalValid" class="text-xs text-rose-600">{{ $t("v_customer_fiscal_number_invalid") }}</p>
      <button
        type="button"
        class="btn-base btn-primary btn-size-sm rounded-lg self-end"
        :disabled="!fiscalValid || !manual.name"
        data-testid="customer-manual-add"
        @click="pickManual"
      >
        <i class="pi pi-check mr-1" />{{ $t("customer_use") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

defineProps({
  /** Seçili müşteri: { id?, name, fiscalNumber, vatNumber? } ya da null (nihai tüketici). */
  modelValue: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue"]);

const { $api } = useNuxtApp();
const open = ref(false);
const query = ref("");
const results = ref([]);
const manual = reactive({ fiscalNumber: "", name: "" });

/** Kosova mali numarası: 9 hane, 6 veya 8 ile başlar (sunucu aynı kuralı yeniden denetler). */
const fiscalValid = computed(() => /^[68]\d{8}$/.test(manual.fiscalNumber));

let seq = 0;
/** Yerel önbellekte arar; geç gelen eski yanıt yeni sonucu ezmez. */
async function onSearch() {
  const mine = ++seq;
  // Rakam yazılıyorsa aynı metni elle giriş NUI alanına da taşı (tek yerden yazılsın).
  if (/^\d+$/.test(query.value)) manual.fiscalNumber = query.value.slice(0, 9);
  if (query.value.length < 2) {
    results.value = [];
    return;
  }
  try {
    const list = await $api.order.searchCustomers(query.value);
    if (mine === seq) results.value = (list || []).filter((c) => c.fiscalNumber);
  } catch {
    if (mine === seq) results.value = [];
  }
}

function pick(c) {
  emit("update:modelValue", { id: c.id, name: c.name, fiscalNumber: c.fiscalNumber, vatNumber: c.vatNumber || null });
  close();
}
function pickManual() {
  if (!fiscalValid.value || !manual.name) return;
  emit("update:modelValue", { id: null, name: manual.name, fiscalNumber: manual.fiscalNumber, vatNumber: null });
  close();
}
function clear() {
  emit("update:modelValue", null);
}
function close() {
  open.value = false;
  query.value = "";
  results.value = [];
  manual.fiscalNumber = "";
  manual.name = "";
}
</script>
