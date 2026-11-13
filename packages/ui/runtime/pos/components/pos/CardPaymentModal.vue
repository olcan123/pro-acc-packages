<!-- pos/CardPaymentModal.vue — Kart/POS ödeme modalı: terminal seçimi + onay. -->
<template>
  <PosModal
    :visible="visible"
    :title="$t('payment_card_title')"
    kbd="F11"
    icon="pi pi-credit-card"
    max-width-class="max-w-md"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="p-5 flex flex-col gap-4">
      <div class="rounded-xl bg-paper-100 dark:bg-paper-800 px-4 py-3 text-center">
        <div class="pos-total-label">{{ $t("to_pay") }}</div>
        <div class="text-4xl font-extrabold text-blue-700 dark:text-blue-300 tabular-nums">{{ fmt(toPay) }}</div>
      </div>

      <div>
        <div class="field-label field-label-default">{{ $t("select_terminal") }}</div>
        <div v-if="terminal.active.length" class="grid grid-cols-1 gap-2">
          <button
            v-for="t in terminal.active"
            :key="t.id"
            class="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors"
            :class="selected === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-paper-300 dark:border-paper-700 hover:border-blue-300'"
            @click="selected = t.id"
          >
            <span class="font-medium">{{ t.name }}</span>
            <i v-if="selected === t.id" class="pi pi-check-circle text-blue-600" />
          </button>
        </div>
        <p v-else class="text-sm text-paper-500 dark:text-paper-400">{{ $t("bank_terminals") }} —</p>
      </div>
    </div>

    <div class="px-5 pb-5 flex flex-col gap-2">
      <button class="btn-base btn-success btn-size-lg rounded-xl w-full" @click="confirm">
        <i class="pi pi-check mr-2" /> {{ $t("confirm_payment") }}
      </button>
      <button class="btn-base btn-secondary btn-size-md rounded-xl w-full" @click="cancel">
        <i class="pi pi-times mr-2" /> {{ $t("cancel") }}
      </button>
    </div>
  </PosModal>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useTerminalStore } from "../../stores/terminal.store.js";

const props = defineProps({
  visible: { type: Boolean, default: false },
  toPay: { type: Number, default: 0 },
});
const emit = defineEmits(["update:visible", "confirm"]);

const terminal = useTerminalStore();
const { formatCurrency } = useCurrency();
const fmt = (n) => formatCurrency(n);

const selected = ref(null);

onMounted(() => terminal.fetch().catch(() => {}));
watch(() => props.visible, (v) => {
  if (v && !selected.value && terminal.active.length) selected.value = terminal.active[0].id;
});

function cancel() {
  emit("update:visible", false);
}
function confirm() {
  emit("confirm", { method: "CARD", amount: props.toPay, bankTerminalId: selected.value });
  emit("update:visible", false);
}
</script>
