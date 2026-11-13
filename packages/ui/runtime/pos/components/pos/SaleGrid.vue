<!-- pos/SaleGrid.vue — Satış kalemleri tablosu (Kodi, Pershkrimi, Sasia, Cmimi, Vlera, Zbritje, Çmimi me TVSH). -->
<template>
  <div class="flex flex-col h-full bg-paper-50 dark:bg-paper-900">
    <!-- Başlık satırı -->
    <table class="w-full table-fixed border-collapse">
      <thead>
        <tr class="pos-grid-head">
          <th class="pos-grid-cell w-10 text-center">#</th>
          <th class="pos-grid-cell w-40 text-left">{{ $t("col_code") }}</th>
          <th class="pos-grid-cell text-left">{{ $t("col_description") }}</th>
          <th class="pos-grid-cell w-24 text-right">{{ $t("col_qty") }}</th>
          <th class="pos-grid-cell w-24 text-right">{{ $t("col_price") }}</th>
          <th class="pos-grid-cell w-24 text-right">{{ $t("col_value") }}</th>
          <th class="pos-grid-cell w-24 text-right">{{ $t("col_discount") }}</th>
          <th class="pos-grid-cell w-28 text-right">{{ $t("col_price_vat") }}</th>
          <th class="pos-grid-cell w-10" />
        </tr>
      </thead>
    </table>

    <!-- Gövde (kaydırılabilir) -->
    <div class="flex-1 overflow-y-auto">
      <table class="w-full table-fixed border-collapse">
        <tbody>
          <tr
            v-for="(it, idx) in cart.items"
            :key="it.productId"
            class="pos-grid-row"
            :class="{ 'pos-grid-row-active': idx === cart.activeIndex }"
            @click="selectRow(idx)"
          >
            <td class="pos-grid-cell w-10 text-center text-paper-500 dark:text-paper-400">{{ idx + 1 }}</td>
            <td class="pos-grid-cell w-40 font-mono text-xs truncate">{{ it.code }}</td>
            <td class="pos-grid-cell font-medium truncate">{{ it.name }}</td>
            <td class="pos-grid-cell w-24">
              <div class="flex items-center gap-1">
                <input
                  type="number" min="0" step="any"
                  class="w-full text-right bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-0.5 focus:outline-none tabular-nums"
                  :value="it.quantity"
                  @click.stop
                  @change="cart.setQty(idx, $event.target.valueAsNumber)"
                >
                <!-- SEF ölçü birimi sembolü (varsa) -->
                <span v-if="it.unitSymbol" class="text-2xs text-paper-500 shrink-0">{{ it.unitSymbol }}</span>
              </div>
            </td>
            <td class="pos-grid-cell w-24 text-right tabular-nums">{{ fmt(it.unitPrice) }}</td>
            <td class="pos-grid-cell w-24 text-right tabular-nums">{{ fmt(it.quantity * it.unitPrice) }}</td>
            <td class="pos-grid-cell w-24">
              <input
                type="number" min="0" max="100" step="any"
                class="w-full text-right bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-0.5 focus:outline-none tabular-nums"
                :value="it.discount"
                @click.stop
                @change="cart.setDiscount(idx, $event.target.valueAsNumber)"
              >
            </td>
            <td class="pos-grid-cell w-28 text-right font-semibold tabular-nums">{{ fmt(cart.lineGross(it)) }}</td>
            <td class="pos-grid-cell w-10 text-center">
              <button class="text-rose-500 hover:text-rose-700" @click.stop="cart.removeAt(idx)">
                <i class="pi pi-times" />
              </button>
            </td>
          </tr>

          <!-- Boş durum -->
          <tr v-if="cart.isEmpty">
            <td colspan="9" class="py-20 text-center text-gray-300 dark:text-gray-600">
              <i class="pi pi-shopping-cart text-5xl mb-3 block" />
              {{ $t("scan_or_search") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from "../../stores/cart.store.js";

// Satıra tıklanınca üst giriş satırına yükle (düzenleme).
const emit = defineEmits(["edit"]);
const cart = useCartStore();
const fmt = (n) => (Number(n) || 0).toFixed(2);

function selectRow(idx) {
  cart.setActive(idx);
  emit("edit", idx);
}
</script>
