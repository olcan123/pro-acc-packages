<script setup>
// shared/BookView.vue — Resmi defter görünümü (Libri i Blerjes / Libri i Shitjes).
// Tek COLUMNS/GROUPS metadata'sından hem 3 katmanlı HTML tablosunu hem Excel/PDF çıktısını üretir.
import { computed } from "vue";
import { useExcelExport } from "../../composables/useExcelExport.js";
import { useReportPrint } from "../../composables/useReportPrint.ts";

const props = defineProps({
  // Başlık (sayfa adı)
  title: { type: String, default: "" },
  // Satır 1 grup başlıkları: [{ label, span, vmerge }]
  groups: { type: Array, required: true },
  // Sütunlar: [{ key, name, box, width, text, vmerge }]
  columns: { type: Array, required: true },
  // Veri satırları (API'den)
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // Excel dosya/sayfa adı
  filename: { type: String, default: "Libri" },
  sheetName: { type: String, default: "Libri" },
});
defineEmits(["refresh"]);

const { exportAoaToExcel } = useExcelExport();

// Satır 3'teki A–F birleşik kutu etiketi
const BOX_LABEL = "Numri i kutisë në Deklaratën e TVSH-së";

// Tablo toplam genişliği (yatay scroll için) — wch ≈ 7px
const tableWidth = computed(() => props.columns.reduce((s, c) => s + Math.round((c.width || 10) * 7), 0));

// Sayı biçimi — 0/boş ise hücre boş kalır (resmi defterle birebir)
const fmt = (n) =>
  n
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n)
    : "";

// Excel çıktısı — aoa + birleştirmeler + sütun genişlikleri
const exportExcel = () => {
  const cols = props.columns;
  // Satır 0: grup başlıkları (yalnız grubun ilk hücresinde değer)
  const r0 = new Array(cols.length).fill("");
  let ci = 0;
  for (const g of props.groups) {
    r0[ci] = g.label;
    ci += g.vmerge ? 1 : g.span;
  }
  // Satır 1: sütun adları (dikey birleşik sütunlar boş)
  const r1 = cols.map((c) => (c.vmerge ? "" : c.name));
  // Satır 2: TVSH kutu numaraları (A–F birleşik etiket)
  const r2 = cols.map((c, i) => (i < 6 ? "" : c.box));
  r2[0] = BOX_LABEL;
  // Veri satırları — metin alanları string, sayısal alanlar 0 ise boş
  const data = props.rows.map((row) =>
    cols.map((c) => {
      const v = row[c.key];
      if (c.text) return v ?? "";
      return v ? Number(v) : null;
    }),
  );
  const aoa = [r0, r1, r2, ...data];

  // Birleştirmeler — gruplardan üretilir
  const merges = [];
  let c = 0;
  for (const g of props.groups) {
    if (g.vmerge) merges.push({ s: { r: 0, c }, e: { r: 1, c } });
    else if (g.span > 1) merges.push({ s: { r: 0, c }, e: { r: 0, c: c + g.span - 1 } });
    c += g.vmerge ? 1 : g.span;
  }
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }); // A3:F3 kutu etiketi

  const colWidths = cols.map((col) => ({ wch: col.width || 10 }));
  // headerRows = 3 → grup / sütun adı / kutu no satırlarına kenarlık uygulanır
  exportAoaToExcel(aoa, merges, colWidths, props.filename, props.sheetName, 3);
};

// PDF baskı — resmi defter geniş olduğundan yatay A4; başlık "ad [kutu]" birleşimi
const { printReport } = useReportPrint();
const printPdf = () => {
  if (!props.rows.length) return;
  const cols = props.columns;
  const rows = props.rows.map((row) =>
    Object.fromEntries(
      cols.map((c) => {
        const header = c.box ? `${c.box} ${c.name}` : c.name;
        const v = row[c.key];
        return [header, c.text ? (v ?? "") : v ? Number(v) : 0];
      }),
    ),
  );
  printReport({ title: props.title || props.sheetName, rows, landscape: true });
};
</script>

<template>
  <div class="space-y-3">
    <!-- Üst çubuk: başlık + kayıt sayısı + butonlar -->
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {{ title }}
      </h2>
      <span class="text-xs text-gray-400">{{ rows.length }} {{ $t("records", "kayıt") }}</span>
      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="bg-paper-50 flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="$emit('refresh')"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
          {{ $t("refresh") }}
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
          @click="printPdf"
        >
          <i class="pi pi-file-pdf" />
          {{ $t("export_to_pdf", "PDF") }}
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          @click="exportExcel"
        >
          <i class="pi pi-file-excel" />
          {{ $t("export_to_excel", "Excel'e Aktar") }}
        </button>
      </div>
    </div>

    <!-- Defter tablosu — yatay scroll, 3 katmanlı başlık -->
    <div class="bg-paper-50 overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900">
      <table
        class="text-2xs border-collapse text-gray-800 dark:text-gray-100"
        style="table-layout: fixed"
        :style="{ width: tableWidth + 'px' }"
      >
        <colgroup>
          <col v-for="(c, ci) in columns" :key="ci" :style="{ width: Math.round((c.width || 10) * 7) + 'px' }" />
        </colgroup>
        <thead class="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <!-- Satır 1: grup başlıkları -->
          <tr>
            <th
              v-for="(g, gi) in groups"
              :key="'g' + gi"
              :colspan="g.vmerge ? 1 : g.span"
              :rowspan="g.vmerge ? 2 : 1"
              class="border border-gray-300 px-1 py-1 text-center align-middle leading-tight font-semibold dark:border-gray-600"
            >
              {{ g.label }}
            </th>
          </tr>
          <!-- Satır 2: sütun adları -->
          <tr>
            <template v-for="(c, ci) in columns" :key="'n' + ci">
              <th
                v-if="!c.vmerge"
                class="border border-gray-300 px-1 py-1 text-center align-middle leading-tight font-medium dark:border-gray-600"
              >
                {{ c.name }}
              </th>
            </template>
          </tr>
          <!-- Satır 3: TVSH beyanname kutu numaraları -->
          <tr>
            <th
              colspan="6"
              class="border border-gray-300 px-1 py-1 text-center font-semibold italic dark:border-gray-600"
            >
              {{ BOX_LABEL }}
            </th>
            <th
              v-for="(c, ci) in columns.slice(6)"
              :key="'b' + ci"
              class="border border-gray-300 px-1 py-1 text-center font-mono text-gray-500 dark:border-gray-600 dark:text-gray-400"
            >
              {{ c.box }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td
              :colspan="columns.length"
              class="border border-gray-200 px-2 py-6 text-center text-gray-500 dark:border-gray-700"
            >
              {{ $t("no_records_found") }}
            </td>
          </tr>
          <tr
            v-for="(row, ri) in rows"
            :key="ri"
            class="odd:bg-paper-50 even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800/40"
          >
            <td
              v-for="(c, ci) in columns"
              :key="ci"
              class="border border-gray-200 px-1 py-0.5 align-top dark:border-gray-700"
              :class="c.text ? 'text-left break-words whitespace-normal' : 'text-right font-mono tabular-nums'"
            >
              {{ c.text ? row[c.key] : fmt(row[c.key]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
