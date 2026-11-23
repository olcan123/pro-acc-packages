<!-- eslint-disable no-unused-vars -->
<script setup>
// shared/LedgerTable.vue — PrimeVue DataTable alternatifi: saf HTML tablo.
// "Editoryal Defter" kimliğine uygun, Tailwind CSS ile stillendirilmiş,
// sort / filter / search / pagination özellikleri yerleşik.
// ⚠ Sadece main uygulamasında kullanılır (yeşil bölge).
import { ref, computed, watch, useSlots } from "vue";

const props = defineProps({
  /** Tablo verileri (dizi) */
  data: { type: Array, default: () => [] },
  /** Sütun tanımları: { field, header, sortable, filterable, filterType, width, align, footerValue, footerSlot } */
  columns: { type: Array, required: true },
  /** Yükleniyor durumu */
  loading: { type: Boolean, default: false },
  /** Satır başına varsayılan sayfa */
  rowsPerPage: { type: Number, default: 1000 },
  /** Sayfa başı seçenekleri */
  rowsOptions: { type: Array, default: () => [10, 25, 50, 100, 1000] },
  /** Global arama alanları (field name dizisi) */
  globalFilterFields: { type: Array, default: () => [] },
  /** Satıra tıklanabilir mi */
  rowClickable: { type: Boolean, default: false },
  /** Boş mesaj */
  emptyMessage: { type: String, default: "Veri bulunamadı." },
  /** Striped rows (zebra) */
  striped: { type: Boolean, default: true },
  /** Dip toplam satırı gösterilsin mi */
  showFooter: { type: Boolean, default: false },
  /** Arama placeholder */
  searchPlaceholder: { type: String, default: "Ara..." },
  /** Satır sayısı etiketi */
  rowCountLabel: { type: String, default: "Satır sayısı:" },
  /** Selection support: 'single' | 'multiple' */
  selectionMode: { type: String, default: null },
  /** The v-model for selection */
  selection: { type: [Array, Object], default: null },
  /** Unique key for rows (used for selection and expansion) */
  dataKey: { type: String, default: "id" },
  /** Table size: 'small' | 'normal' */
  size: { type: String, default: "normal" },
  /** Expandable rows support */
  expandableRows: { type: Boolean, default: false },
  /** Sıra numarası sütunu (#) — raporlarda satır saymak için */
  numbered: { type: Boolean, default: false },
  /**
   * Dip toplam satırında SOLDAKİ sütunları tek hücrede birleştirir.
   * Değer: birleştirilecek sütun sayısı (öncü kolonlar hariç).
   * Muhasebe raporlarında "Toplam:" etiketi böyle sağa yaslanır.
   * 0 → birleştirme yok, her sütunun kendi footer hücresi olur.
   */
  footerLabelSpan: { type: Number, default: 0 },
  /** Satıra koşullu sınıf veren fonksiyon: (row) => string */
  rowClass: { type: Function, default: null },
  /** The v-model for expanded rows (array of dataKeys or objects depending on use, we'll use array of keys) */
  expandedRows: { type: [Array, Object], default: () => [] },
  /** Sunucu modu: yüklenen diziye tekrar arama/sıralama uygulama. */
  serverMode: { type: Boolean, default: false },
  searchQuery: { type: String, default: "" },
  serverSortField: { type: String, default: "date" },
  serverSortOrder: { type: String, default: "desc" },
});

const emit = defineEmits([
  "row-click",
  "update:selection",
  "update:expandedRows",
  "row-expand",
  "row-collapse",
  "update:searchQuery",
  "sort",
]);
const slots = useSlots();

// ── STATE ────────────────────────────────────────────────────────────────────
const localSearch = ref("");
const globalSearch = computed({
  get: () => (props.serverMode ? props.searchQuery : localSearch.value),
  set: (value) => (props.serverMode ? emit("update:searchQuery", value) : (localSearch.value = value)),
});
const columnFilters = ref({});
const localSortField = ref(null);
const localSortOrder = ref(1); // 1 = asc, -1 = desc
const sortField = computed(() => (props.serverMode ? props.serverSortField : localSortField.value));
const sortOrder = computed(() =>
  props.serverMode ? (props.serverSortOrder === "asc" ? 1 : -1) : localSortOrder.value,
);
const currentPage = ref(1);
const perPage = ref(props.rowsPerPage);

// Sayfa seçimi değişince ilk sayfaya dön
watch(perPage, () => {
  currentPage.value = 1;
});

// ── KOLON SAYISI ────────────────────────────────────────────────────────────
// Boş durum ve genişletme satırının colspan'i; seçim/genişletme kolonları dâhil.
const leadingCols = computed(
  () => (props.selectionMode ? 1 : 0) + (props.expandableRows ? 1 : 0) + (props.numbered ? 1 : 0),
);
const totalColSpan = computed(() => props.columns.length + leadingCols.value);

// ── COLUMN FILTERS ──────────────────────────────────────────────────────────
// ⚠ Kolonlar değişince ESKİ anahtarlar TEMİZLENİR; aksi hâlde artık var olmayan
// bir sütunun filtresi veride süzmeye devam eder ve satırlar sebepsiz kaybolur.
const initFilters = () => {
  const next = {};
  props.columns.forEach((col) => {
    if (col.filterable !== false && col.field) {
      next[col.field] = columnFilters.value[col.field] ?? "";
    }
  });
  columnFilters.value = next;
};
initFilters();
watch(() => props.columns, initFilters, { deep: true });

/** Filtre satırı yalnız süzülebilir en az bir kolon varsa render edilir */
const hasFilterableColumn = computed(
  () => !props.serverMode && props.columns.some((c) => c.filterable !== false && c.field),
);

/**
 * Footer'da kendi hücresi olan sütunlar.
 * footerLabelSpan kadar soldaki sütun birleşik etiket hücresine gider,
 * geri kalanlar tek tek render edilir → hizalama korunur.
 */
const footerColumns = computed(() =>
  props.footerLabelSpan > 0 ? props.columns.slice(props.footerLabelSpan) : props.columns,
);

// ── SORT ─────────────────────────────────────────────────────────────────────
const toggleSort = (col) => {
  if (!col.sortable) return;
  const order = sortField.value === col.field ? -sortOrder.value : 1;
  if (props.serverMode) {
    emit("sort", { field: col.field, order: order === 1 ? "asc" : "desc" });
  } else {
    localSortField.value = col.field;
    localSortOrder.value = order;
  }
  currentPage.value = 1;
};

const sortIcon = (col) => {
  if (!col.sortable) return "";
  if (sortField.value !== col.field) return "pi pi-sort-alt";
  return sortOrder.value === 1 ? "pi pi-sort-amount-up-alt" : "pi pi-sort-amount-down";
};

// ── FILTER + SORT PIPELINE ──────────────────────────────────────────────────
const processedData = computed(() => {
  let result = [...(props.data || [])];
  if (props.serverMode) return result;

  // 1. Global arama
  if (globalSearch.value && props.globalFilterFields.length) {
    const q = globalSearch.value.toLowerCase();
    result = result.filter((row) =>
      props.globalFilterFields.some((field) => {
        const val = row[field];
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }

  // 2. Sütun filtreleri
  for (const [field, filterVal] of Object.entries(columnFilters.value)) {
    if (filterVal === "" || filterVal == null) continue;
    const col = props.columns.find((c) => c.field === field);
    if (!col) continue;

    if (col.filterType === "number") {
      const num = Number(filterVal);
      if (!isNaN(num)) {
        result = result.filter((row) => Number(row[field] || 0) >= num);
      }
    } else {
      const q = String(filterVal).toLowerCase();
      result = result.filter((row) => {
        const val = row[field];
        return val != null && String(val).toLowerCase().includes(q);
      });
    }
  }

  // 3. Sıralama
  if (sortField.value) {
    const dir = sortOrder.value;
    result.sort((a, b) => {
      const va = a[sortField.value];
      const vb = b[sortField.value];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      // Sayısal mı?
      const na = Number(va);
      const nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return String(va).localeCompare(String(vb), "tr") * dir;
    });
  }

  return result;
});

// ── PAGINATION ──────────────────────────────────────────────────────────────
const totalRows = computed(() => processedData.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / perPage.value)));
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return processedData.value.slice(start, start + perPage.value);
});

// Filtre değişince ilk sayfaya dön
watch(
  [globalSearch, columnFilters],
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

// Sayfa düzeltme
watch(totalPages, (tp) => {
  if (currentPage.value > tp) currentPage.value = tp;
});

const paginationRange = computed(() => {
  const start = (currentPage.value - 1) * perPage.value + 1;
  const end = Math.min(currentPage.value * perPage.value, totalRows.value);
  return { start, end };
});

// ── EXPANSION ───────────────────────────────────────────────────────────────
const isExpanded = (row) => {
  if (!props.expandedRows) return false;
  if (Array.isArray(props.expandedRows)) {
    return props.expandedRows.includes(row[props.dataKey]);
  }
  return !!props.expandedRows[row[props.dataKey]];
};

const toggleRow = (row) => {
  if (Array.isArray(props.expandedRows)) {
    const current = [...props.expandedRows];
    const index = current.indexOf(row[props.dataKey]);
    if (index > -1) {
      current.splice(index, 1);
      emit("row-collapse", row);
    } else {
      current.push(row[props.dataKey]);
      emit("row-expand", row);
    }
    emit("update:expandedRows", current);
  } else {
    const current = { ...props.expandedRows };
    const key = row[props.dataKey];
    if (current[key]) {
      delete current[key];
      emit("row-collapse", row);
    } else {
      current[key] = true;
      emit("row-expand", row);
    }
    emit("update:expandedRows", current);
  }
};

// ── SELECTION ────────────────────────────────────────────────────────────────
const isSelected = (row) => {
  if (!props.selection) return false;
  if (props.selectionMode === "multiple") {
    return Array.isArray(props.selection) && props.selection.some((r) => r[props.dataKey] === row[props.dataKey]);
  }
  return props.selection[props.dataKey] === row[props.dataKey];
};

const toggleSelection = (row) => {
  if (!props.selectionMode) return;
  if (props.selectionMode === "multiple") {
    const current = Array.isArray(props.selection) ? [...props.selection] : [];
    const index = current.findIndex((r) => r[props.dataKey] === row[props.dataKey]);
    if (index > -1) current.splice(index, 1);
    else current.push(row);
    emit("update:selection", current);
  } else {
    // Single select toggle
    if (isSelected(row)) emit("update:selection", null);
    else emit("update:selection", row);
  }
};

const toggleAllSelection = () => {
  if (props.selectionMode !== "multiple") return;
  const currentItems = paginatedData.value;
  const allSelected = currentItems.every((row) => isSelected(row));

  let currentSelection = Array.isArray(props.selection) ? [...props.selection] : [];
  if (allSelected) {
    currentItems.forEach((row) => {
      const index = currentSelection.findIndex((r) => r[props.dataKey] === row[props.dataKey]);
      if (index > -1) currentSelection.splice(index, 1);
    });
  } else {
    currentItems.forEach((row) => {
      if (!currentSelection.some((r) => r[props.dataKey] === row[props.dataKey])) {
        currentSelection.push(row);
      }
    });
  }
  emit("update:selection", currentSelection);
};

// ── ROW CLICK OVERRIDE ──────────────────────────────────────────────────────
const onRowClick = (row) => {
  if (props.selectionMode) {
    toggleSelection(row);
  }
  if (props.rowClickable) {
    emit("row-click", row);
  }
};

// Sayfa numaralarını hesapla (en fazla 7 göster)
const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  }
  return pages;
});

// Tüm filtreleri temizle
const hasActiveFilters = computed(() => {
  if (globalSearch.value) return true;
  return Object.values(columnFilters.value).some((v) => v !== "" && v != null);
});

const clearAllFilters = () => {
  globalSearch.value = "";
  for (const key in columnFilters.value) {
    columnFilters.value[key] = "";
  }
};
</script>

<template>
  <div class="ledger-table-root rounded-sm border border-paper-200 bg-paper-50 dark:border-paper-800 dark:bg-paper-900">
    <!-- ═══════ TOOLBAR ═══════ -->
    <div
      class="flex flex-col items-start justify-between gap-3 border-b border-paper-200 px-4 py-3 sm:flex-row sm:items-center dark:border-paper-800"
    >
      <!-- Sol: Arama -->
      <div class="relative max-w-sm flex-1">
        <i class="pi pi-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-paper-400" />
        <input v-model="globalSearch" type="text" :placeholder="searchPlaceholder" class="ctrl-search" />
      </div>

      <!-- Sağ: Kontroller -->
      <div class="flex items-center gap-3">
        <slot name="toolbar" />

        <!-- Filtre temizle -->
        <button
          v-if="hasActiveFilters"
          class="inline-flex items-center gap-1 rounded-sm border border-negative-200 bg-negative-50 px-2.5 py-1.5 text-xs font-medium text-negative-700 transition-colors hover:bg-negative-100 dark:border-negative-900 dark:bg-negative-950/40 dark:text-negative-300"
          @click="clearAllFilters"
        >
          <i class="pi pi-filter-slash text-xs" />
          {{ $t("clear", "Temizle") }}
        </button>

        <!-- Sayfa başı satır -->
        <div class="flex items-center gap-2 text-sm text-paper-500 dark:text-paper-400">
          <span>{{ rowCountLabel }}</span>
          <select v-model="perPage" class="ctrl-select">
            <option v-for="opt in rowsOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ═══════ TABLE ═══════ -->
    <div class="ledger-scroll relative">
      <!-- Loading overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 z-30 flex items-center justify-center bg-paper-50/70 backdrop-blur-sm dark:bg-paper-950/70"
      >
        <div class="flex flex-col items-center gap-2">
          <i class="pi pi-spin pi-spinner text-2xl text-accent-600" />
          <span class="text-sm text-paper-500">{{ $t("loading", "Yükleniyor...") }}</span>
        </div>
      </div>

      <table class="w-full border-collapse text-sm" style="min-width: 60rem">
        <!-- THEAD (Sticky) -->
        <thead class="sticky top-0 z-20 shadow-sm">
          <!-- Başlık satırı -->
          <tr>
            <th v-if="selectionMode" class="ledger-th w-10 text-center">
              <input
                v-if="selectionMode === 'multiple'"
                type="checkbox"
                class="ctrl-checkbox mx-auto"
                :checked="paginatedData.length > 0 && paginatedData.every((r) => isSelected(r))"
                @change="toggleAllSelection"
              />
            </th>
            <th v-if="expandableRows" class="ledger-th w-10"></th>
            <th v-if="numbered" class="ledger-th w-12 text-right">#</th>
            <th
              v-for="col in columns"
              :key="col.field || col.header"
              :style="col.width ? { width: col.width } : {}"
              class="ledger-th"
              :class="{
                'cursor-pointer select-none hover:bg-paper-300/50 dark:hover:bg-paper-700/50': col.sortable,
                'text-right': col.align === 'right',
                'text-center': col.align === 'center',
              }"
              @click="toggleSort(col)"
            >
              <div
                class="flex items-center gap-1"
                :class="{ 'justify-end': col.align === 'right', 'justify-center': col.align === 'center' }"
              >
                <span>{{ col.header }}</span>
                <i
                  v-if="col.sortable"
                  :class="sortIcon(col)"
                  class="text-2xs transition-colors"
                  :style="sortField === col.field ? 'color: var(--color-accent-600)' : ''"
                />
              </div>
            </th>
          </tr>

          <!-- Filtre satırı.
               ⚠ Seçim ve genişletme kolonları için ÖNCÜ boş hücreler şart —
               yoksa filtre kutuları bir/iki sütun kayar ve yanlış kolonu süzer. -->
          <tr v-if="hasFilterableColumn">
            <th v-if="selectionMode" class="ledger-filter-cell w-10" />
            <th v-if="expandableRows" class="ledger-filter-cell w-10" />
            <th v-if="numbered" class="ledger-filter-cell w-12" />
            <th v-for="col in columns" :key="'f-' + (col.field || col.header)" class="ledger-filter-cell">
              <input
                v-if="col.filterable !== false && col.field && columnFilters[col.field] !== undefined"
                v-model="columnFilters[col.field]"
                :type="col.filterType === 'number' ? 'number' : 'text'"
                :placeholder="col.filterType === 'number' ? '≥' : '...'"
                :aria-label="`${col.header} filtresi`"
                class="ledger-filter-input"
                :class="{ 'text-right': col.filterType === 'number' }"
                @click.stop
              />
            </th>
          </tr>
        </thead>

        <!-- TBODY -->
        <tbody>
          <!-- ⚠ Satır ve genişletme satırı AYNI <template v-for> içinde olmak
               ZORUNDA: aksi hâlde genişletme satırındaki `row` kapsam dışında
               kalır ve Vue render sırasında patlar. -->
          <template v-if="paginatedData.length">
            <template v-for="(row, idx) in paginatedData" :key="row[dataKey] ?? idx">
              <tr
                class="ledger-row"
                :class="[
                  striped ? (idx % 2 === 0 ? 'ledger-row-even' : 'ledger-row-odd') : '',
                  rowClickable || selectionMode ? 'cursor-pointer' : '',
                  isSelected(row) ? 'ledger-row-selected' : '',
                  rowClass ? rowClass(row) : '',
                ]"
                @click="onRowClick(row)"
              >
                <!-- SELECTION CELL -->
                <td v-if="selectionMode" class="ledger-td w-10 text-center">
                  <input
                    v-if="selectionMode === 'multiple'"
                    type="checkbox"
                    class="ctrl-checkbox mx-auto"
                    :checked="isSelected(row)"
                    @change="toggleSelection(row)"
                    @click.stop
                  />
                  <input
                    v-else-if="selectionMode === 'single'"
                    type="radio"
                    class="ctrl-radio mx-auto"
                    :checked="isSelected(row)"
                    @change="toggleSelection(row)"
                    @click.stop
                  />
                </td>
                <!-- EXPAND TOGGLE CELL -->
                <td v-if="expandableRows" class="ledger-td w-10 text-center">
                  <button
                    class="rounded-sm p-1 transition-colors hover:bg-paper-200 dark:hover:bg-paper-700"
                    @click.stop="toggleRow(row)"
                  >
                    <i
                      :class="isExpanded(row) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                      class="text-xs text-paper-500"
                    ></i>
                  </button>
                </td>

                <td v-if="numbered" class="ledger-td w-12 text-right font-mono text-paper-500 dark:text-paper-500">
                  {{ (currentPage - 1) * perPage + idx + 1 }}
                </td>
                <td
                  v-for="col in columns"
                  :key="col.field || col.header"
                  class="ledger-td"
                  :class="{
                    'text-right font-mono': col.align === 'right',
                    'text-center': col.align === 'center',
                    'px-3 py-1.5': size === 'small',
                  }"
                >
                  <!-- `index` SAYFA OFSETLİ mutlak satır numarasıdır (0 tabanlı):
                     raporlar kümülatif hesap için kullanır, sayfa 2'de 0'dan
                     başlarsa yanlış sonuç verir. -->
                  <slot
                    :name="'cell-' + col.field"
                    :data="row"
                    :value="row[col.field]"
                    :index="(currentPage - 1) * perPage + idx"
                    :row-index="idx"
                  >
                    {{ row[col.field] }}
                  </slot>
                </td>
              </tr>

              <!-- GENİŞLETİLMİŞ SATIR — aynı v-for kapsamında -->
              <tr v-if="expandableRows && isExpanded(row)" class="bg-paper-100/50 dark:bg-paper-800/20">
                <td :colspan="totalColSpan" class="border-b border-paper-200 p-0 dark:border-paper-800">
                  <slot name="expansion" :data="row" />
                </td>
              </tr>
            </template>
          </template>

          <!-- Empty state -->
          <tr v-else-if="!loading">
            <td :colspan="totalColSpan" class="py-12 text-center">
              <div class="flex flex-col items-center gap-3 text-paper-400 dark:text-paper-500">
                <i class="pi pi-inbox text-4xl" />
                <span class="text-base">{{ emptyMessage }}</span>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- TFOOT — öncü hücreler başlık/filtre satırlarıyla AYNI sayıda olmalı -->
        <tfoot v-if="showFooter && paginatedData.length">
          <tr>
            <td v-if="selectionMode" class="ledger-tfoot-td w-10" />
            <td v-if="expandableRows" class="ledger-tfoot-td w-10" />
            <td v-if="numbered" class="ledger-tfoot-td w-12" />

            <!-- Birleşik etiket hücresi (footerLabelSpan > 0) -->
            <td v-if="footerLabelSpan > 0" :colspan="footerLabelSpan" class="ledger-tfoot-td text-right">
              <slot name="footer-label" :rows="processedData" />
            </td>

            <td
              v-for="col in footerColumns"
              :key="'ft-' + (col.field || col.header)"
              class="ledger-tfoot-td"
              :class="{
                'text-right font-mono': col.align === 'right',
                'text-center': col.align === 'center',
                'px-3 py-1.5': size === 'small',
              }"
            >
              <slot :name="'footer-' + col.field" :data="processedData">
                <template v-if="col.footerValue !== undefined">
                  {{ col.footerValue }}
                </template>
              </slot>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ═══════ BOTTOM BAR (Sticky) ═══════ -->
    <div
      class="sticky bottom-0 z-20 flex flex-col rounded-b-sm border-t border-paper-200 bg-paper-50/95 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur dark:border-paper-800 dark:bg-paper-900/95"
    >
      <!-- Özel global footer slotu (örn. Siparişler sayfasındaki KDV / Genel Toplam için) -->
      <div v-if="slots['global-footer']" class="border-b border-paper-200 px-4 py-3 dark:border-paper-800">
        <slot name="global-footer" />
      </div>

      <!-- PAGINATION -->
      <div
        v-if="totalPages > 1 || totalRows > 0"
        class="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row"
      >
        <!-- Sol: bilgi -->
        <div class="text-sm text-paper-500 dark:text-paper-400">
          <span class="font-medium text-paper-700 dark:text-paper-200">{{ paginationRange.start }}</span>
          –
          <span class="font-medium text-paper-700 dark:text-paper-200">{{ paginationRange.end }}</span>
          /
          <span class="font-medium text-paper-700 dark:text-paper-200">{{ totalRows }}</span>
          {{ $t("records", "kayıt") }}
        </div>

        <!-- Orta: sayfalama satırına YERLEŞEN ek içerik (ör. fatura toplamları).
             Ayrı bir şerit yerine buraya konur; sayfalama çubuğu tablonun doğal
             sonunda olduğu için toplamlar da HER ZAMAN aynı satırda görünür,
             kullanıcı listenin en altına inmek zorunda kalmaz. -->
        <div v-if="slots['pagination-extra']" class="flex-1 text-right sm:px-4">
          <slot name="pagination-extra" />
        </div>

        <!-- Sağ: sayfa düğmeleri -->
        <nav v-if="totalPages > 1" class="flex items-center gap-1">
          <button class="ledger-page-btn" :disabled="currentPage <= 1" @click="currentPage = 1">
            <i class="pi pi-angle-double-left text-xs" />
          </button>
          <button class="ledger-page-btn" :disabled="currentPage <= 1" @click="currentPage--">
            <i class="pi pi-angle-left text-xs" />
          </button>

          <template v-for="pg in pageNumbers" :key="pg">
            <span v-if="pg === '...'" class="px-1 text-paper-400">…</span>
            <button
              v-else
              class="ledger-page-btn"
              :class="{ 'ledger-page-btn-active': pg === currentPage }"
              @click="currentPage = pg"
            >
              {{ pg }}
            </button>
          </template>

          <button class="ledger-page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
            <i class="pi pi-angle-right text-xs" />
          </button>
          <button class="ledger-page-btn" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">
            <i class="pi pi-angle-double-right text-xs" />
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<!-- Stiller main.css @layer components bloğunda tanımlıdır (ledger-*) -->
