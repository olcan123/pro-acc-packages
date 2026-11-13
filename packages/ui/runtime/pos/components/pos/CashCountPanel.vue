<!-- pos/CashCountPanel.vue — Vardiya kapanışı kasa sayımı: kupür dökümü (ya da elle toplam),
     beklenen nakit ve fark. İsteğe bağlıdır; boş bırakılırsa sayım gönderilmez. pos + restoran ORTAK. -->
<template>
  <div class="rounded-lg border border-paper-300 dark:border-paper-700 p-3 flex flex-col gap-3" data-testid="cash-count-panel">
    <button type="button" class="flex items-center justify-between text-sm font-semibold" @click="open = !open">
      <span><i class="pi pi-calculator mr-1.5" />{{ $t("cash_count_title") }}</span>
      <i class="pi" :class="open ? 'pi-chevron-up' : 'pi-chevron-down'" />
    </button>

    <template v-if="open">
      <label class="flex items-center justify-between gap-2 text-sm">
        <span class="text-paper-600 dark:text-paper-400">{{ $t("cash_count_opening_float") }}</span>
        <input
          :value="modelValue.openingFloat"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          class="w-28 rounded border border-paper-300 dark:border-paper-700 bg-transparent px-2 py-1 text-right tabular-nums"
          data-testid="cash-count-opening"
          @input="patch({ openingFloat: $event.target.value })"
        />
      </label>

      <!-- Kupür dökümü: banknotlar ve madeni paralar -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-1">
        <label v-for="d in denominations" :key="d" class="flex items-center justify-between gap-2 text-sm">
          <span class="tabular-nums" :class="isBanknote(d) ? 'font-semibold' : 'text-paper-600 dark:text-paper-400'">
            {{ formatCurrency(d) }}
          </span>
          <input
            :value="modelValue.counts?.[String(d)] ?? ''"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            placeholder="0"
            class="w-20 rounded border border-paper-300 dark:border-paper-700 bg-transparent px-2 py-1 text-right tabular-nums"
            :data-testid="`cash-count-${d}`"
            @input="setCount(d, $event.target.value)"
          />
        </label>
      </div>

      <!-- Döküm girilmediyse sayılan toplam elle yazılabilir -->
      <label v-if="!hasBreakdown" class="flex items-center justify-between gap-2 text-sm">
        <span class="text-paper-600 dark:text-paper-400">{{ $t("cash_count_counted_manual") }}</span>
        <input
          :value="modelValue.countedTotal"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          class="w-28 rounded border border-paper-300 dark:border-paper-700 bg-transparent px-2 py-1 text-right tabular-nums"
          data-testid="cash-count-total"
          @input="patch({ countedTotal: $event.target.value })"
        />
      </label>

      <!-- Sonuç -->
      <div class="rounded-lg bg-paper-100 dark:bg-paper-800 p-3 text-sm flex flex-col gap-1" data-testid="cash-count-result">
        <div class="flex justify-between">
          <span>{{ $t("cash_count_expected") }}</span>
          <span class="tabular-nums font-medium">{{ formatCurrency(expected) }}</span>
        </div>
        <template v-if="result">
          <div class="flex justify-between">
            <span>{{ $t("cash_count_counted") }}</span>
            <span class="tabular-nums font-medium">{{ formatCurrency(result.counted) }}</span>
          </div>
          <div class="flex justify-between font-bold" :class="differenceClass">
            <span>{{ $t(differenceLabel) }}</span>
            <span class="tabular-nums" data-testid="cash-count-difference">{{ formatCurrency(result.difference) }}</span>
          </div>
        </template>
        <p v-else class="text-xs text-paper-500 dark:text-paper-400">{{ $t("cash_count_optional_hint") }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { EUR_DENOMINATIONS, isBanknote, cleanBreakdown, cashDifferenceKind } from "../../../utils/cash-count.ts";
import { cashCountPreview } from "../../composables/useCashCount.js";

const props = defineProps({
  /** { openingFloat, counts, countedTotal } — bkz. useCashCount.emptyCashCount */
  modelValue: { type: Object, required: true },
  /** Vardiyanın nakit satış toplamı (beklenen nakdin satış bacağı). */
  cashSales: { type: [Number, String], default: 0 },
  /** Panel açık mı başlasın? */
  expanded: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue"]);

const { formatCurrency } = useCurrency();
const open = ref(props.expanded);
const denominations = EUR_DENOMINATIONS;

const patch = (part) => emit("update:modelValue", { ...props.modelValue, ...part });
const setCount = (d, value) => patch({ counts: { ...(props.modelValue.counts || {}), [String(d)]: value } });

const hasBreakdown = computed(() => Object.keys(cleanBreakdown(props.modelValue.counts)).length > 0);
const result = computed(() => cashCountPreview(props.modelValue, props.cashSales));
/** Sayım girilmeden de beklenen nakit gösterilir: açılış nakdi + nakit satış. */
const expected = computed(
  () => result.value?.expected ?? Math.round(((Number(props.modelValue.openingFloat) || 0) + (Number(props.cashSales) || 0)) * 100) / 100,
);
const kind = computed(() => (result.value ? cashDifferenceKind(result.value.difference) : "ok"));
const differenceLabel = computed(
  () => ({ short: "cash_count_short", over: "cash_count_over", ok: "cash_count_exact" })[kind.value],
);
const differenceClass = computed(
  () => ({ short: "text-rose-600", over: "text-amber-600", ok: "text-emerald-600" })[kind.value],
);
</script>
