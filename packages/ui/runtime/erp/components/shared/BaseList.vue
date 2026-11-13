<template>
  <div class="p-4 lg:p-6">
    <div class="mb-6">
      <PagesHeader
        v-if="!customHeader"
        v-model:search-term="searchTerm"
        :title="title"
        :button-text="addButtonText || (createRoute ? $t('add') : '')"
        :button-icon="addButtonIcon"
        :show-button="!!createRoute || !!addButtonText || (headerItems && headerItems.length > 0)"
        :search-placeholder="$t('search_placeholder') || 'Ara...'"
        :items="headerItems"
        :force-dropdown="forceHeaderDropdown"
        @click="createRoute ? navigateTo(localePath(createRoute)) : null"
      />
      <slot name="header" />
    </div>

    <slot name="pre-table" />

    <div
      v-if="selectable && selection && selection.length > 0"
      class="bg-accent-50 dark:bg-accent-950/30 border-accent-200 dark:border-accent-900 mb-3 flex items-center justify-between gap-3 rounded-sm border px-4 py-2"
    >
      <span class="text-accent-800 dark:text-accent-300 text-sm font-semibold">
        {{ $t("selected_count", { count: selection.length }) }}
      </span>
      <div class="flex items-center gap-2">
        <slot name="bulk-actions" :selection="selection" :clear="clearSelection" />
        <FieldButton variant="ghost" size="sm" :label="$t('cancel', 'İptal')" @click="clearSelection" />
      </div>
    </div>

    <!-- LedgerTable entegrasyonu -->
    <SharedLedgerTable
      :data="data"
      :columns="columns"
      :loading="loading"
      :global-filter-fields="globalFilterFields"
      :search-placeholder="$t('search_placeholder')"
      :selection-mode="selectable ? 'multiple' : null"
      :selection="selection"
      :expanded-rows="expandedRows"
      :data-key="dataKey"
      :numbered="showIndex"
      :expandable-rows="true"
      :empty-message="emptyMessage || $t('no_records_found')"
      :rows-per-page="10"
      :server-mode="serverMode"
      :search-query="searchQuery"
      :server-sort-field="sortField"
      :server-sort-order="sortOrder"
      @update:search-query="$emit('update:searchQuery', $event)"
      @sort="$emit('sort', $event)"
      @update:selection="updateSelection"
      @update:expandedRows="$emit('update:expandedRows', $event)"
      @row-click="$emit('row-click', $event)"
      size="normal"
    >
      <!-- Paginations header slot inject -->
      <template #toolbar>
        <FieldButton
          v-if="data && data.length > 0"
          icon="pi pi-file-excel"
          variant="success"
          size="sm"
          :tooltip="$t('export_to_excel')"
          :loading="exporting"
          :disabled="exporting"
          @click="exportExcel"
        />
        <slot name="paginatorstart-extra" />
      </template>

      <!-- Parent componentten gelen tüm slotları LedgerTable'a aktar (cell-*) -->
      <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps || {}"></slot>
      </template>
    </SharedLedgerTable>
  </div>
</template>

<script setup>
// BaseList.vue — Tüm liste sayfaları için temel şablon: LedgerTable (SharedLedgerTable), sayfalama, filtre ve Excel export.
import { ref, computed } from "vue";
import { useExcelExport } from "../../composables/useExcelExport.js";
import FieldButton from "../../../components/form/FieldButton.vue";
// Nuxt auto-import'una güvenilmez: birim testinde de çözülmeli
// (AnalyticsReport.vue ile aynı gerekçe).
import SharedLedgerTable from "./LedgerTable.vue";

const props = defineProps({
  title: { type: String, required: true },
  addButtonText: { type: String, default: "" },
  addButtonIcon: { type: String, default: "pi pi-plus" },
  createRoute: { type: String, default: null },
  headerItems: { type: Array, default: () => [] },
  customHeader: { type: Boolean, default: false },
  data: { type: Array, required: true },
  columns: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  dataKey: { type: String, default: "id" },
  showIndex: { type: Boolean, default: true },
  exportName: { type: String, default: null },
  emptyIcon: { type: String, default: "pi pi-info-circle" },
  emptyMessage: { type: String, default: "" },
  expandedRows: { type: [Object, Array], default: () => [] },
  globalFilterFields: { type: Array, default: () => [] },
  forceHeaderDropdown: { type: Boolean, default: false },
  exportMapper: { type: Function, default: null },
  selectable: { type: Boolean, default: false },
  columnFilters: { type: Object, default: () => ({}) },
  stateKey: { type: String, default: null },
  // Sayfalı listelerde arama/sıralama yerel diziye uygulanmaz; üst sayfa sunucu sorgusunu yönetir.
  serverMode: { type: Boolean, default: false },
  searchQuery: { type: String, default: "" },
  sortField: { type: String, default: "date" },
  sortOrder: { type: String, default: "desc" },
  exportProvider: { type: Function, default: null },
});

const emit = defineEmits([
  "update:expandedRows",
  "update:selection",
  "row-click",
  "update:searchQuery",
  "sort",
  "export-error",
]);

// NOT: `useI18n` ve `useLocalePath` BİLEREK import EDİLMİYOR — Nuxt bunları
// otomatik sağlar, birim testi de kolayca stub'layabilir. Doğrudan import
// edildiklerinde BaseList.test.js hiç derlenemiyordu:
//   • "vue-i18n"  → main/package.json'da BEYAN EDİLMEMİŞ bağımlılık
//                   (Nuxt build'de @nuxtjs/i18n alias'ıyla çözülüyor).
//   • "#imports"  → Nuxt'ın sanal modülü, Vitest'te karşılığı yok.
// Metinler şablonda global `$t()` ile çevrilir (AnalyticsReport ve Field*
// bileşenlerindeki desenin aynısı).
const localePath = useLocalePath();
const { exportToExcel } = useExcelExport();
const localSearch = ref("");
const exporting = ref(false);
const searchTerm = computed({
  get: () => (props.serverMode ? props.searchQuery : localSearch.value),
  set: (value) => (props.serverMode ? emit("update:searchQuery", value) : (localSearch.value = value)),
});

const selection = ref([]);
const clearSelection = () => {
  selection.value = [];
  emit("update:selection", selection.value);
};

const updateSelection = (val) => {
  selection.value = val;
  emit("update:selection", val);
};

// Excel dışa aktarım
const exportExcel = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const data = props.exportProvider ? await props.exportProvider() : props.data;
    if (data?.length > 0) {
      const mappedData = props.exportMapper ? data.map(props.exportMapper) : data;
      const name = props.exportName || props.title || "export";
      exportToExcel(mappedData, name);
    }
  } catch (error) {
    emit("export-error", error);
  } finally {
    exporting.value = false;
  }
};
</script>
