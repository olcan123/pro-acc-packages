<!-- pos/TotalsBar.vue — Alt toplam şeridi: GJENDJA, BONUS, PER PAGESE, PAGUAR, PER KTHIM, TOTALI. -->
<template>
  <div class="bg-paper-50 dark:bg-paper-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-end justify-between gap-4">
    <!-- Sol: durum bilgileri -->
    <div class="flex items-center gap-6">
      <div>
        <div class="pos-total-label">{{ $t("stock") }}</div>
        <div class="text-sm font-semibold text-gray-600 dark:text-gray-300">{{ cart.itemCount }} {{ $t("items").toLowerCase() }}</div>
      </div>
      <div>
        <div class="pos-total-label">{{ $t("bonus_card") }} · F3</div>
        <div class="text-sm font-mono text-paper-500 dark:text-paper-400">…</div>
      </div>
    </div>

    <!-- Sağ: tutarlar -->
    <div class="flex items-end gap-6">
      <div class="text-right">
        <div class="pos-total-label">{{ $t("to_pay") }}</div>
        <div class="pos-total-value">{{ fmt(cart.grandTotal) }}</div>
      </div>
      <div class="text-right">
        <div class="pos-total-label">{{ $t("paid") }}</div>
        <div class="pos-total-value text-paper-500 dark:text-paper-400">{{ fmt(paid) }}</div>
      </div>
      <div class="text-right">
        <div class="pos-total-label">{{ $t("change") }}</div>
        <div class="pos-total-value" :class="change < 0 ? 'text-rose-500' : 'text-emerald-600'">{{ fmt(change) }}</div>
      </div>
      <div class="text-right border-l border-paper-300 dark:border-paper-700 pl-6">
        <div class="pos-total-label">{{ $t("total") }}</div>
        <div class="pos-total-grand">{{ fmt(cart.grandTotal) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from "../../stores/cart.store.js";

defineProps({
  paid: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
});

const cart = useCartStore();
const { formatCurrency } = useCurrency();
const fmt = (n) => formatCurrency(n);
</script>
