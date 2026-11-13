<!--
  shared/RoutingTable.vue — ROTA (routing) tablosu: üretim operasyonları.
  İki kipte çalışır:
    mode="bom"        → Reçete rotası: hazırlık (dk) + birim başına süre (dk) girilir
    mode="work-order" → İş emri rotası: planlanan/gerçekleşen toplam süre (dk) girilir

  Maliyet: süre(saat) × (işçilik €/saat + GÜG €/saat). İş merkezinin ücretleri satıra
  SNAPSHOT olarak yazılır → merkez ücreti sonradan değişse bile eski emirler oynamaz.
-->
<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
        <i class="pi pi-sitemap text-blue-600" />
        {{ t("routing", "Rota (Operasyonlar)") }}
        <span class="text-xs font-normal text-gray-400">{{ t("optional", "opsiyonel") }}</span>
      </h3>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        @click="addRow"
      >
        <i class="pi pi-plus" /> {{ t("add_operation", "Operasyon Ekle") }}
      </button>
    </div>

    <SharedLedgerTable
      :data="rows"
      :columns="tableColumns"
      size="small"
      :empty-message="t('no_operations', 'Rota tanımlanmadı — işçilik/GÜG elle girilecek')"
    >
      <template #cell-sequence="{ data }">
        <input
          v-model.number="data.sequence"
          type="number"
          min="0"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
        />
      </template>

      <template #cell-workCenterId="{ data, index }">
        <select
          v-model="data.workCenterId"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
          @change="onWorkCenterChange(index)"
        >
          <option :value="null">{{ t("select_work_center", "İş merkezi seçiniz") }}</option>
          <option v-for="wc in workCenters" :key="wc.id" :value="wc.id">{{ wc.code }} — {{ wc.name }}</option>
        </select>
      </template>

      <template #cell-name="{ data }">
        <input
          v-model="data.name"
          type="text"
          :placeholder="t('operation_name_placeholder', 'Örn: Kesim')"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
        />
      </template>

      <!-- REÇETE kipi: hazırlık + birim başına süre -->
      <template v-if="mode === 'bom'" #cell-setupMinutes="{ data }">
        <input
          v-model.number="data.setupMinutes"
          type="number"
          min="0"
          step="any"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
        />
      </template>
      <template v-if="mode === 'bom'" #cell-runMinutesPerUnit="{ data }">
        <input
          v-model.number="data.runMinutesPerUnit"
          type="number"
          min="0"
          step="any"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
        />
      </template>

      <!-- İŞ EMRİ kipi: planlanan + gerçekleşen toplam süre -->
      <template v-if="mode === 'work-order'" #cell-plannedMinutes="{ data }">
        <input
          v-model.number="data.plannedMinutes"
          type="number"
          min="0"
          step="any"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
        />
      </template>
      <template v-if="mode === 'work-order'" #cell-actualMinutes="{ data }">
        <input
          v-model.number="data.actualMinutes"
          type="number"
          min="0"
          step="any"
          :placeholder="t('planned_used_if_empty', 'boşsa plan')"
          class="bg-paper-50 w-full rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
        />
      </template>

      <template #cell-ratePerHour="{ data }">
        <span class="block text-right font-mono text-gray-500">
          {{ fmtMoney(Number(data.laborRatePerHour || 0) + Number(data.overheadRatePerHour || 0)) }}
        </span>
      </template>

      <template #cell-cost="{ data }">
        <span class="block text-right font-mono font-semibold text-emerald-600">
          {{ fmtMoney(rowCost(data)) }}
        </span>
      </template>

      <template #cell-actions="{ index }">
        <button type="button" class="text-red-500 hover:text-red-700" @click="removeRow(index)">
          <i class="pi pi-trash" />
        </button>
      </template>
    </SharedLedgerTable>

    <div v-if="rows.length" class="flex justify-end gap-6 pt-1 text-sm">
      <span class="text-gray-500">
        {{ t("total_minutes", "Toplam Süre") }}:
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-100"
          >{{ fmt(totalMinutes) }} {{ t("minutes_short", "dk") }}</span
        >
      </span>
      <span class="text-gray-500">
        {{ t("labor_cost", "İşçilik") }}:
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-100">{{ fmtMoney(totals.laborCost) }}</span>
      </span>
      <span class="text-gray-500">
        {{ t("overhead_cost", "GÜG") }}:
        <span class="font-mono font-semibold text-gray-800 dark:text-gray-100">{{
          fmtMoney(totals.overheadCost)
        }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  // "bom" → hazırlık + birim süre; "work-order" → planlanan + gerçekleşen süre
  mode: { type: String, default: "bom" },
  // İş emri kipinde plan sürelerini yeniden hesaplamak için üretim miktarı
  quantity: { type: Number, default: 1 },
});

const rows = defineModel({ type: Array, default: () => [] });
// Hesaplanan işçilik/GÜG toplamları üst forma bildirilir (maliyet alanlarını doldurur)
const emit = defineEmits(["cost-change"]);

const { t } = useI18n();
const workCenters = ref([]);

const tableColumns = computed(() => {
  const cols = [
    { field: "sequence", header: t("sequence", "Sıra"), width: "80px" },
    { field: "workCenterId", header: t("work_center", "İş Merkezi"), width: "200px" },
    { field: "name", header: t("operation_name", "Operasyon"), width: "180px" },
  ];

  if (props.mode === "bom") {
    cols.push(
      { field: "setupMinutes", header: t("setup_minutes", "Hazırlık (dk)"), width: "110px", align: "right" },
      {
        field: "runMinutesPerUnit",
        header: t("run_minutes_per_unit", "Birim Süre (dk)"),
        width: "130px",
        align: "right",
      },
    );
  } else {
    cols.push(
      { field: "plannedMinutes", header: t("planned_minutes", "Planlanan (dk)"), width: "120px", align: "right" },
      { field: "actualMinutes", header: t("actual_minutes", "Gerçekleşen (dk)"), width: "130px", align: "right" },
    );
  }

  cols.push(
    { field: "ratePerHour", header: t("rate_per_hour", "€/saat"), width: "110px", align: "right" },
    { field: "cost", header: t("cost", "Maliyet"), width: "110px", align: "right" },
    { field: "actions", header: "", width: "50px", align: "center" },
  );

  return cols;
});

// Bir satırın toplam dakikası: reçete kipinde miktarla ölçeklenir.
const rowMinutes = (row) => {
  if (props.mode === "bom") {
    return (Number(row.setupMinutes) || 0) + (Number(row.runMinutesPerUnit) || 0) * (Number(props.quantity) || 0);
  }
  return row.actualMinutes != null && row.actualMinutes !== ""
    ? Number(row.actualMinutes) || 0
    : Number(row.plannedMinutes) || 0;
};

const rowCost = (row) => {
  const hours = rowMinutes(row) / 60;
  return hours * ((Number(row.laborRatePerHour) || 0) + (Number(row.overheadRatePerHour) || 0));
};

const totalMinutes = computed(() => rows.value.reduce((s, r) => s + rowMinutes(r), 0));

const totals = computed(() => {
  let laborCost = 0;
  let overheadCost = 0;
  for (const r of rows.value) {
    const hours = rowMinutes(r) / 60;
    laborCost += hours * (Number(r.laborRatePerHour) || 0);
    overheadCost += hours * (Number(r.overheadRatePerHour) || 0);
  }
  return {
    laborCost: Number(laborCost.toFixed(4)),
    overheadCost: Number(overheadCost.toFixed(4)),
  };
});

// Rota değiştikçe üst form maliyet alanlarını günceller
watch(totals, (val) => emit("cost-change", val), { deep: true, immediate: true });

const addRow = () =>
  rows.value.push({
    workCenterId: null,
    sequence: (rows.value.length + 1) * 10,
    name: "",
    setupMinutes: 0,
    runMinutesPerUnit: 0,
    plannedMinutes: 0,
    actualMinutes: null,
    laborRatePerHour: 0,
    overheadRatePerHour: 0,
  });

const removeRow = (i) => rows.value.splice(i, 1);

// İş merkezi seçilince saatlik ücretler satıra SNAPSHOT olarak kopyalanır
const onWorkCenterChange = (i) => {
  const row = rows.value[i];
  if (!row) return;
  const wc = workCenters.value.find((w) => w.id === row.workCenterId);
  if (!wc) {
    row.laborRatePerHour = 0;
    row.overheadRatePerHour = 0;
    return;
  }
  row.laborRatePerHour = Number(wc.laborRatePerHour) || 0;
  row.overheadRatePerHour = Number(wc.overheadRatePerHour) || 0;
  if (!row.name) row.name = wc.name;
};

const fmt = (n) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Number(n) || 0);
const fmtMoney = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "EUR" }).format(Number(n) || 0);

onMounted(async () => {
  try {
    workCenters.value = await $fetch("/api/work-centers", { query: { isActive: true } });
  } catch (_) {
    workCenters.value = [];
  }
});
</script>
