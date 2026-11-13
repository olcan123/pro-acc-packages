<!-- pos/PaymentModal.vue — Liste/Split Ödeme Modalı: Arka(Nakit) + her banka(kart) ayrı satır, ayrı tutar. -->
<template>
  <PosModal :visible="visible" :title="$t('payment_cash_title')" kbd="F5" icon="pi pi-wallet" max-width-class="max-w-4xl" @update:visible="$emit('update:visible', $event)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
      <!-- Sol: Ödeme satırları listesi -->
      <div class="flex flex-col gap-3">
        <!-- Ödenecek Toplam -->
        <div class="rounded-xl bg-paper-100 dark:bg-paper-800 px-4 py-3 flex justify-between items-center">
          <div class="text-xl font-bold">{{ $t("to_pay") }}</div>
          <div class="text-3xl font-extrabold text-paper-900 dark:text-paper-100 tabular-nums">{{ fmt(toPay) }}</div>
        </div>

        <!-- Müşteri: varsayılan nihai tüketici; şirket seçilirse fişe NUI yazılır -->
        <PosCustomerPicker v-model="customer" />

        <!-- Satırlar: Arka(Nakit) + bankalar -->
        <div class="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          <div
            v-for="row in rows"
            :key="row.key"
            class="rounded-xl border p-3 cursor-pointer transition-colors"
            :class="activeKey === row.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-paper-300 dark:border-paper-700'"
            @click="activeKey = row.key"
          >
            <div class="flex justify-between items-center">
              <div class="font-bold flex items-center gap-2">
                <i :class="['pi', row.icon, row.type === 'CASH' ? 'text-emerald-600' : 'text-blue-600']" />
                {{ row.label }}
              </div>
              <div class="text-2xl font-bold tabular-nums">{{ fmt(amt(row.key)) }}</div>
            </div>

            <!-- SEF kart türü: kredi / banka kartı. İkisi de AYNI terminal hesabına
                 düşer; ayrım ATK bildirimi için ödeme kaydında taşınır. -->
            <div v-if="row.type === 'CARD'" class="mt-2 flex gap-1" @click.stop>
              <button
                v-for="opt in CARD_TYPES"
                :key="opt.value"
                type="button"
                class="rounded-lg border px-2 py-1 text-xs font-semibold transition-colors"
                :class="cardTypeOf(row.key) === opt.value
                  ? 'border-blue-500 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  : 'border-paper-300 text-paper-500 dark:border-paper-700'"
                @click="cardTypes[row.key] = opt.value"
              >
                {{ $t(opt.i18nKey) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Kalan / Para Üstü -->
        <div class="rounded-xl px-4 py-3 flex justify-between items-center" :class="change < 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'">
          <div class="text-xl font-bold">{{ change < 0 ? $t("to_pay") + " (Kalan)" : $t("change") }}</div>
          <div class="text-2xl font-bold tabular-nums" :class="change < 0 ? 'text-rose-600' : 'text-emerald-600'">{{ fmt(Math.abs(change)) }}</div>
        </div>

        <!-- Nakit işlem limiti uyarısı (engellemez) -->
        <div
          v-if="cashLimitWarning"
          class="rounded-xl bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-sm text-amber-800 dark:text-amber-200"
          role="alert"
        >
          <i class="pi pi-exclamation-triangle mr-1" />
          {{
            $t(customer ? "cash_limit_warning_pos_business" : "cash_limit_warning_pos", {
              limit: fmt(cashLimitWarning.limit),
              amount: fmt(cashLimitWarning.amount),
            })
          }}
        </div>
      </div>

      <!-- Sağ: Tuş Takımı (aktif satıra yazar) -->
      <div class="grid grid-cols-4 gap-2">
        <button v-for="d in [1,2,3]" :key="d" class="pos-keypad-btn" @click="press(d)">{{ d }}</button>
        <button class="pos-keypad-chip bg-emerald-100 text-emerald-800" @click="fillRemaining()">{{ $t('fill_remaining') }}</button>

        <button v-for="d in [4,5,6]" :key="d" class="pos-keypad-btn" @click="press(d)">{{ d }}</button>
        <button class="pos-keypad-chip bg-blue-100 text-blue-800" @click="exactActive()">Tam Tutar</button>

        <button v-for="d in [7,8,9]" :key="d" class="pos-keypad-btn" @click="press(d)">{{ d }}</button>
        <button class="pos-keypad-chip bg-amber-100 text-amber-800" @click="clear()">{{ $t('clear_row') }}</button>

        <button class="pos-keypad-btn" @click="press('00')">00</button>
        <button class="pos-keypad-btn" @click="press(0)">0</button>
        <button class="pos-keypad-btn text-rose-500" @click="backspace()"><i class="pi pi-delete-left"></i></button>
        <button class="pos-keypad-btn text-rose-500 font-bold" @click="resetAll()">C</button>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-5 pb-5 flex gap-3">
      <button class="btn-base btn-secondary btn-size-lg rounded-xl flex-1" @click="cancel">
        <i class="pi pi-times mr-2" /> {{ $t("cancel") }}
      </button>
      <button class="btn-base btn-success btn-size-lg rounded-xl flex-[2]" :disabled="change < 0" @click="confirm">
        <i class="pi pi-check mr-2" /> {{ $t("confirm_payment") }}
      </button>
    </div>
  </PosModal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { buildSplitPayments, cashKeptAfterChange } from "../../composables/usePaymentSplit.js";
import { checkCashLimit } from "../../../utils/cash-limit.ts";
import { useTerminalStore } from "../../stores/terminal.store.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  visible: { type: Boolean, default: false },
  toPay: { type: Number, default: 0 },
});
const emit = defineEmits(["update:visible", "confirm"]);

const { t } = useI18n();
const { formatCurrency } = useCurrency();
const fmt = (n) => formatCurrency(n);
const terminalStore = useTerminalStore();

const CASH_KEY = "cash";

/** SEF kart türleri — GL hesabı ortak, ödeme yöntemi ayrı. */
const CARD_TYPES = [
  { value: "CREDIT", i18nKey: "pm_card_credit" },
  { value: "DEBIT", i18nKey: "pm_card_debit" },
];

/** Terminal key → seçili kart türü (varsayılan: kredi kartı). */
const cardTypes = reactive({});
const cardTypeOf = (key) => cardTypes[key] ?? "CREDIT";

// Ödeme satırları: Arka(Nakit) + ayarlardaki aktif banka(kart) hesapları
const rows = computed(() => [
  { key: CASH_KEY, type: "CASH", label: t("cash_arka"), icon: "pi-money-bill", terminalId: null },
  ...terminalStore.active.map((tm) => ({
    key: tm.id,
    type: "CARD",
    label: tm.name,
    icon: "pi-credit-card",
    terminalId: tm.id,
    cardType: cardTypeOf(tm.id),
  })),
]);

const amounts = reactive({}); // satır key → girilen tutar (string)
const activeKey = ref(CASH_KEY);

const amt = (key) => parseFloat(amounts[key]) || 0;
const totalPaid = computed(() => rows.value.reduce((s, r) => s + amt(r.key), 0));
const change = computed(() => Math.round((totalPaid.value - (props.toPay || 0) + Number.EPSILON) * 100) / 100);

// Şirket müşterisi (null = nihai tüketici / Blerësi Fizik). Her açılışta sıfırlanır.
const customer = ref(null);

// NAKİT İŞLEM LİMİTİ — yalnız UYARI, ödeme engellenmez. Alıcı bireyselse (Blerësi Fizik)
// sınır 2.000 €, şirket müşterisi seçildiyse (B2B) 300 €. Para üstü nakitten düşülür:
// kasada KALAN nakit ölçülür.
const cashLimitWarning = computed(() => {
  const result = checkCashLimit(customer.value ? "BUSINESS" : "INDIVIDUAL", cashKeptAfterChange(amt(CASH_KEY), change.value));
  return result.exceeded ? result : null;
});

function resetInputs() {
  for (const r of rows.value) amounts[r.key] = "";
  amounts[CASH_KEY] = String(props.toPay || 0); // varsayılan: tamamı nakit (Arka)
  activeKey.value = CASH_KEY;
  customer.value = null; // müşteri bir önceki satıştan taşınmaz
}

onMounted(() => terminalStore.fetch().catch(() => {}));
watch(() => props.visible, (v) => { if (v) resetInputs(); });

function press(d) {
  const cur = amounts[activeKey.value] ?? "";
  amounts[activeKey.value] = cur === "0" && d !== "00" ? String(d) : cur + String(d);
}
function backspace() {
  amounts[activeKey.value] = String(amounts[activeKey.value] ?? "").slice(0, -1);
}
function clear() { amounts[activeKey.value] = ""; }
function resetAll() { resetInputs(); amounts[CASH_KEY] = ""; }

/** Aktif satıra "kalan" tutarı yazar (toplam - diğer satırlar). */
function fillRemaining() {
  const others = rows.value.reduce((s, r) => s + (r.key === activeKey.value ? 0 : amt(r.key)), 0);
  const remaining = Math.round(((props.toPay || 0) - others + Number.EPSILON) * 100) / 100;
  amounts[activeKey.value] = remaining > 0 ? String(remaining) : "";
}
/** Aktif satıra tüm toplamı yazar, diğerlerini sıfırlar. */
function exactActive() {
  for (const r of rows.value) amounts[r.key] = "";
  amounts[activeKey.value] = String(props.toPay || 0);
}

function cancel() {
  emit("update:visible", false);
}

function confirm() {
  if (change.value < 0) return;
  const payments = buildSplitPayments(rows.value, { ...amounts }, props.toPay);
  emit("confirm", payments, customer.value);
  emit("update:visible", false);
}

// Fiziksel klavye (aktif satıra yazar)
function onKey(e) {
  if (!props.visible) return;
  // Müşteri arama/giriş alanına yazılırken tuşlar ödeme tutarına gitmesin, Enter ödemeyi onaylamasın.
  if (e.target?.closest?.("input, textarea, select")) return;
  if (e.key >= "0" && e.key <= "9") press(Number(e.key));
  else if (e.key === "Backspace") backspace();
  else if (e.key === "Enter") confirm();
  else if (e.key === "Escape") cancel();
}

onMounted(() => {
  if (import.meta.client) {
    watch(() => props.visible, (v) => {
      if (v) window.addEventListener("keydown", onKey);
      else window.removeEventListener("keydown", onKey);
    });
  }
});
</script>
