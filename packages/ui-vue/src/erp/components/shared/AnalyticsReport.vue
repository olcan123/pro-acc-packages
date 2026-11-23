<template>
  <div class="space-y-4 p-4">
    <PagesHeader
      :title="title"
      :button-text="$t('refresh')"
      :button-icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
      @click="fetchData"
    />

    <!-- Filtre alanı: varsayılan tarih aralığı + #filters-extra (granularity, depo vb.);
         #filters ile alan tamamen değiştirilebilir (örn. tarih yerine gün eşiği). -->
    <slot name="filters" v-bind="ctx">
      <div v-if="period !== null || $slots['filters-extra']" class="flex flex-wrap items-end gap-3">
        <SharedDateRangeFilter v-if="period !== null" v-model:from="dateFrom" v-model:to="dateTo" />
        <slot name="filters-extra" v-bind="ctx" />
      </div>
    </slot>

    <slot name="before" v-bind="ctx" />

    <!-- Kart kabuğu ortak .card-panel sınıfından (pos-ui/tokens.css): gölge değil kural çizgisi -->
    <div class="card-panel p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div :class="['flex h-9 w-9 items-center justify-center rounded-sm', iconWrapClass]">
            <i :class="[icon, 'text-base']" />
          </div>
          <div>
            <h3 class="text-paper-900 dark:text-paper-100 text-base font-semibold">{{ title }}</h3>
            <p v-if="hint" class="text-paper-600 dark:text-paper-400 text-xs">{{ hint }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <slot name="actions" v-bind="ctx" />
          <FieldButton
            v-if="pdf"
            icon="pi pi-file-pdf"
            variant="danger"
            size="sm"
            :tooltip="$t('export_to_pdf')"
            :disabled="!rows.length"
            @click="printPdf"
          />
          <FieldButton
            v-if="excel"
            icon="pi pi-file-excel"
            variant="success"
            size="sm"
            :tooltip="$t('export_to_excel')"
            :disabled="!rows.length"
            @click="exportExcel"
          />
          <span v-if="countLabel" class="text-paper-600 dark:text-paper-400 text-xs"
            >{{ rows.length }} {{ countLabel }}</span
          >
        </div>
      </div>

      <SharedLedgerTable
        :data="rows"
        :columns="ledgerColumns"
        :loading="loading"
        :numbered="numbered"
        :row-class="rowClass"
        :data-key="typeof rowKey === 'string' ? rowKey : 'id'"
        :show-footer="showTotals"
        :footer-label-span="ledgerFooterLabelSpan"
        :global-filter-fields="globalFilterFields"
        :rows-per-page="1000"
        :empty-message="emptyText || $t('no_records_found', 'Veri bulunamadı.')"
        :search-placeholder="$t('search_placeholder', 'Ara...')"
        :row-count-label="$t('rows_per_page', 'Satır sayısı:')"
        size="small"
      >
        <!-- Hücre içeriği: tüketici raporun kendi cell-<key> slot'u varsa o kazanır,
             yoksa tip'e göre biçimlenmiş değer basılır. -->
        <template v-for="c in tableColumns" :key="'cell-' + c.key" #[`cell-${c.key}`]="{ data, value, index }">
          <span
            :class="[
              monoClass(c),
              c.bold ? 'font-semibold' : '',
              c.accent ? ACCENT_TEXT[c.accent] : '',
              c.cellClass ? c.cellClass(data) : '',
            ]"
          >
            <slot :name="`cell-${c.key}`" :row="data" :value="value" :index="index" :fmt="fmt">
              {{ display(value, c) }}
            </slot>
          </span>
        </template>

        <!-- Toplam satırı: birleşik etiket + toplamlı sütunlar -->
        <template #footer-label>
          <slot name="total-label" :totals="totals">{{ totalLabel || `${$t("total", "Toplam")}:` }}</slot>
        </template>
        <template v-for="c in trailingColumns" :key="'footer-' + c.key" #[`footer-${c.key}`]>
          <span :class="[monoClass(c), ACCENT_TEXT[c.totalAccent || c.accent] || '']">
            <template v-if="c.totalText">{{ c.totalText(totals) }}</template>
            <template v-else-if="c.total">{{ display(totals[c.key], c) }}</template>
          </span>
        </template>
      </SharedLedgerTable>
    </div>

    <slot name="after" v-bind="ctx" />
  </div>
</template>

<script setup>
// AnalyticsReport.vue — Analitik raporların ortak iskeleti: başlık, dönem filtresi, veri çekme,
// Excel/PDF dışa aktarım ve kolon tanımından üretilen tablo + toplam satırı.
// 24 rapor sayfasında birebir tekrarlanan ~135 satırlık bloğu tek yerde toplar; her rapor
// yalnız endpoint + kolon listesi bildirir.
//
// Kolon tanımı: { key, label, type?, total?, accent?, bold?, cellClass?, exportValue?, noExport? }
//   type: "text" (varsayılan) | "mono" | "num" | "int" | "money" | "pct"
//   total: true → toplam satırında totals[key] gösterilir
//   accent: ACCENT_TEXT anahtarı → hücre rengi
//   cellClass: (row) => string → satıra göre koşullu sınıf
//   exportValue: (row) => any → Excel/PDF'e yazılacak değer (varsayılan row[key])
// Not: metinler şablonda global `$t()` ile çevrilir (Field* bileşenlerindeki desenin aynısı);
// böylece bileşen vue-i18n'i doğrudan import etmez ve birim testte kolayca mock'lanır.
import { formatDate as displayDate } from "../../../utils/date.ts";
import { computed, watch, useSlots } from "vue";

import { useAnalyticsReport } from "../../composables/useAnalyticsReport.js";
import { useExcelExport } from "../../composables/useExcelExport.js";
import { useReportPrint } from "../../composables/useReportPrint.ts";
import FieldButton from "../../../components/form/FieldButton.vue";
// Nuxt auto-import'una guvenilmez: birim testinde de cozulmeli.
import SharedLedgerTable from "./LedgerTable.vue";
import SharedDateRangeFilter from "./DateRangeFilter.vue";
import PagesHeader from "../pages/header/index.vue";

const props = defineProps({
  /** Rapor API yolu */
  endpoint: { type: String, required: true },
  /** Sayfa + kart başlığı */
  title: { type: String, required: true },
  /** Başlık altı açıklama satırı (ops.) */
  hint: { type: String, default: "" },
  /** Kart ikonu (PrimeIcons sınıfı) */
  icon: { type: String, default: "pi pi-chart-bar" },
  /** İkon rengi — ACCENT_ICON anahtarı */
  iconColor: { type: String, default: "emerald" },
  /** Kolon tanımları (bkz. dosya başı) */
  columns: { type: Array, required: true },
  /** Dönem ön ayarı; null → tarih filtresi yok, tek seferlik yükleme */
  period: { type: String, default: "month" },
  /** Sol başta 1..n sıra numarası sütunu */
  numbered: { type: Boolean, default: false },
  /** Satır anahtarı: alan adı ya da (row, index) => key */
  rowKey: { type: [String, Function], default: null },
  /** Satıra göre ek sınıf: (row) => string (örn. marj sıkışan satırı vurgula) */
  rowClass: { type: Function, default: null },
  /** Excel dosya adı (uzantısız); boşsa Excel butonu gizlenir */
  exportName: { type: String, default: "" },
  /** PDF çıktısı yatay basılsın */
  landscape: { type: Boolean, default: true },
  /** Excel / PDF butonlarını göster */
  excel: { type: Boolean, default: true },
  pdf: { type: Boolean, default: true },
  /** Sağ üstteki "N ürün" etiketindeki birim adı */
  countLabel: { type: String, default: "" },
  /** Boş sonuç metni */
  emptyText: { type: String, default: "" },
  /** Toplam satırının sol etiketi */
  totalLabel: { type: String, default: "" },
  /** Ek sorgu parametreleri üreten fonksiyon */
  extraQuery: { type: Function, default: null },
  /** Değeri değişince veriyi yeniden çeker — sayfaya özel filtreler (gün eşiği, depo vb.) için */
  refreshKey: { type: [String, Number, Boolean, Object], default: null },
  /** PDF alt başlığı; verilmezse dönemli raporlarda tarih aralığı kullanılır */
  subtitle: { type: String, default: "" },
});

const {
  dateFrom,
  dateTo,
  loading,
  rows,
  totals: serverTotals,
  data,
  fetchData,
  fmt,
} = useAnalyticsReport(props.endpoint, {
  period: props.period,
  extraQuery: props.extraQuery,
  errorLabel: props.title,
});

/**
 * DİP TOPLAM — sunucu vermezse satırlardan hesaplanır.
 *
 * Analitik uçların HİÇBİRİ `totals` döndürmüyordu; bu yüzden kolon tanımında
 * `total: true` yazsa bile toplam satırı hiç görünmüyordu (showTotals, totals
 * null olduğu için daima false kalıyordu). Artık:
 *   sunucu totals gönderirse    → o kullanılır (özel/ağırlıklı toplamlar korunur)
 *   göndermezse                 → `total: true` sütunları burada toplanır
 *
 * Tablo tüm satırları istemcide tuttuğu için toplam TAM'dır (sayfa toplamı değil).
 * Ortalama/yüzde/oran gibi toplanamayan sütunlar zaten `total: true` almaz.
 */
const totals = computed(() => {
  if (serverTotals.value) return serverTotals.value;
  const summable = (props.columns || []).filter((c) => c.total);
  if (!summable.length || !rows.value?.length) return null;
  const acc = {};
  for (const c of summable) {
    acc[c.key] = rows.value.reduce((s, r) => s + (Number(r[c.key]) || 0), 0);
  }
  return acc;
});

// Tailwind sınıfları literal olmalı (JIT tarama) — bu yüzden eşleme tablosu.
/**
 * Kolon aksan renkleri — 27 rapor sayfasının ortak mini teması.
 *
 * ⚠ 9 ANAHTARIN HEPSİ KORUNMALI: tüketici raporlar `accent: "teal"` gibi değerler
 * veriyor; bir anahtar silinirse o rapor sessizce renksiz kalır.
 * (tests/unit/design/analytics-accents.test.ts bunu doğrular)
 *
 * ⚠ Sınıflar LİTERAL olmak zorunda — Tailwind JIT taraması dinamik string üretemez.
 *
 * İKİ DEĞİŞİKLİK:
 * 1. Defter rampalarına çekildi. Ham Tailwind aileleri kullanılsaydı remap sonrası
 *    emerald+teal, sky+indigo, amber+orange çiftleri BİRBİRİNİN AYNISI olurdu
 *    (9 aksan → 5) ve iki farklı kolonu ayırt eden renk bilgisi kaybolurdu.
 *    Burada her anahtar farklı bir rampa/kademe alır.
 * 2. `dark:` varyantı EKLENDİ. Önceden yoktu → koyu modda aksanlı hücreler
 *    (örn. text-emerald-600) kontrast 2.77 ile okunamıyordu.
 */
/**
 * Aksan → rampa eşlemesi, TÜKETİCİ RAPORLARDAKİ ANLAMA göre seçildi
 * (kullanım taraması: `grep -r 'accent:' app/pages/reports`):
 *
 *   emerald (7) → gelir / kâr / marj / satış        → positive
 *   rose    (7) → maliyet / ölü stok / iade / churn → negative
 *   amber   (4) → yaşlandırma, yeniden sipariş açığı → ochre (uyarı)
 *   orange  (1) → fiyat sapması (price-variance)     → ochre (uyarı, daha açık kademe)
 *   violet  (2) → cross-sell adedi, MRR              → plum (nötr sayısal vurgu)
 *   sky     (2) → tedarikçi hacmi, alış tarafı       → ink (ikincil bilgi)
 *   teal    (1) → pozitif başlık vurgusu             → positive (farklı kademe)
 *
 * ⚠ MARKA AKSANI (accent/kiremit) BURADA KULLANILMAZ. O renk etkileşim için
 * ayrılmıştır (birincil buton, aktif menü, bağlantı); veri kolonuna verilirse
 * "tek keskin vurgu" ilkesi bozulur ve tıklanabilir sanılır.
 */
const ACCENT_TEXT = {
  emerald: "text-positive-700 dark:text-positive-300",
  teal: "text-positive-600 dark:text-positive-400",
  amber: "text-ochre-800 dark:text-ochre-200",
  orange: "text-ochre-600 dark:text-ochre-400",
  rose: "text-negative-700 dark:text-negative-300",
  sky: "text-ink-600 dark:text-ink-300",
  indigo: "text-ink-800 dark:text-ink-200",
  violet: "text-plum-700 dark:text-plum-300",
  gray: "text-paper-600 dark:text-paper-400",
};

const ACCENT_ICON = {
  emerald: "bg-positive-100 dark:bg-positive-950/40 text-positive-700 dark:text-positive-300",
  teal: "bg-positive-100 dark:bg-positive-950/40 text-positive-600 dark:text-positive-400",
  amber: "bg-ochre-100 dark:bg-ochre-950/40 text-ochre-800 dark:text-ochre-200",
  orange: "bg-ochre-100 dark:bg-ochre-950/40 text-ochre-600 dark:text-ochre-400",
  rose: "bg-negative-100 dark:bg-negative-950/40 text-negative-700 dark:text-negative-300",
  sky: "bg-ink-100 dark:bg-ink-950/40 text-ink-600 dark:text-ink-300",
  indigo: "bg-ink-100 dark:bg-ink-950/40 text-ink-800 dark:text-ink-200",
  violet: "bg-plum-100 dark:bg-plum-950/40 text-plum-700 dark:text-plum-300",
  gray: "bg-paper-200 dark:bg-paper-800 text-paper-600 dark:text-paper-300",
};

const NUMERIC_TYPES = new Set(["num", "int", "money", "pct"]);

const slots = useSlots();

// Sayfaya özel filtre değiştiğinde yeniden çek (tarih filtresini composable zaten izliyor).
watch(
  () => props.refreshKey,
  (v, old) => {
    if (v !== old) fetchData();
  },
);

const iconWrapClass = computed(() => ACCENT_ICON[props.iconColor] || ACCENT_ICON.emerald);

const tableColumns = computed(() => props.columns.filter((c) => !c.exportOnly));
const colCount = computed(() => tableColumns.value.length + (props.numbered ? 1 : 0));

/**
 * Rapor kolon tanımını SharedLedgerTable biçimine çevirir.
 *
 * Tüketici 27 rapor sayfasının API'si DEĞİŞMEZ — onlar hâlâ
 * `{ key, label, type, total, accent, ... }` yazar; dönüşüm burada yapılır.
 *
 * - `sortable`: kolon açıkça kapatmadıysa açık (raporlarda sıralama beklenir)
 * - `filterType`: sayısal tipler ≥ filtresi alır, diğerleri metin araması
 * - `align`: alignClass ile aynı kural (sayısal → sağa)
 */
const ledgerColumns = computed(() =>
  tableColumns.value.map((c) => ({
    field: c.key,
    header: c.label,
    sortable: c.sortable !== false,
    filterable: c.filterable !== false,
    filterType: NUMERIC_TYPES.has(c.type) ? "number" : "text",
    align: c.align || (NUMERIC_TYPES.has(c.type) ? "right" : "left"),
    width: c.width,
  })),
);

/** Global arama: metin tipli sütunlar (sayısal sütunda serbest metin araması anlamsız) */
const globalFilterFields = computed(() =>
  tableColumns.value.filter((c) => !NUMERIC_TYPES.has(c.type) && c.type !== "date").map((c) => c.key),
);

const alignClass = (c) =>
  (c.align || (NUMERIC_TYPES.has(c.type) ? "right" : "left")) === "right"
    ? "text-right"
    : c.align === "center"
      ? "text-center"
      : "text-left";

const monoClass = (c) => (c.type === "mono" || NUMERIC_TYPES.has(c.type) ? "font-mono" : "");

/** Proje kuralı: tarihler istisnasız dd.mm.yyyy. */
const formatDate = (value, empty = "-") => displayDate(value, empty);

/** Hücre değerini kolon tipine göre metne çevirir (c.suffix varsa sonuna eklenir). */
const display = (v, c) => {
  if (c.type === "date") return formatDate(v, c.empty);
  if (v === null || v === undefined) {
    return NUMERIC_TYPES.has(c.type) ? `${fmt(0, c.type === "int" ? 0 : 2)}${c.suffix || ""}` : "";
  }
  let out;
  switch (c.type) {
    case "int":
      out = fmt(v, 0);
      break;
    case "num":
    case "money":
      out = fmt(v, c.digits ?? 2, c.maxDigits);
      break;
    case "pct":
      out = `${fmt(v, c.digits ?? 2, c.maxDigits)}%`;
      break;
    default:
      out = v;
  }
  return c.suffix ? `${out}${c.suffix}` : out;
};

const rowKeyOf = (r, i) => {
  if (typeof props.rowKey === "function") return props.rowKey(r, i);
  if (props.rowKey) return r[props.rowKey] ?? i;
  return i;
};

// --- Toplam satırı yerleşimi ---
// İlk toplamlı sütuna kadar olan hücreler tek bir colspan etiketinde birleşir.
// totalText'li sütun da toplam bölgesine dahildir (değeri olmasa da kendi hücresini korur).
const firstTotalIdx = computed(() => tableColumns.value.findIndex((c) => c.total || c.totalText));
// Toplamlı sütun yoksa ama sayfa #total-label verdiyse, satır tüm genişliği kaplayan
// tek bir etiket hücresi olur (örn. "Toplam: 12 cari").
const showTotals = computed(
  () => !!totals.value && rows.value.length > 0 && (firstTotalIdx.value >= 0 || !!slots["total-label"]),
);
const totalLabelSpan = computed(() =>
  firstTotalIdx.value < 0 ? colCount.value : firstTotalIdx.value + (props.numbered ? 1 : 0),
);

/**
 * LedgerTable'a verilen birleşik etiket genişliği.
 *
 * ⚠ `numbered` BURADA SAYILMAZ: LedgerTable sıra-no sütununa footer'da KENDİ
 * boş hücresini üretir (başlık ve filtre satırlarıyla tutarlı kalsın diye).
 * totalLabelSpan ise eski düz tabloya aitti ve numbered'ı içine katıyordu.
 *
 * Toplamlı sütun YOKSA (ama sayfa #total-label verdiyse) etiket tüm veri
 * sütunlarını kaplar — "Toplam: 12 cari" gibi tek satırlık özetler için.
 */
const ledgerFooterLabelSpan = computed(() =>
  firstTotalIdx.value < 0 ? tableColumns.value.length : firstTotalIdx.value,
);
const trailingColumns = computed(() => (firstTotalIdx.value < 0 ? [] : tableColumns.value.slice(firstTotalIdx.value)));

// --- Dışa aktarım ---
// Excel ve PDF AYNI satır eşlemesini kullanır (anahtar = sütun başlığı) — ham değerler yazılır,
// böylece PDF tarafı sayısal hücreleri EUR olarak biçimleyebilir.
const exportColumns = computed(() => props.columns.filter((c) => !c.noExport));

const buildExportRows = () =>
  (rows.value || []).map((r, i) => {
    const o = {};
    if (props.numbered) o["#"] = i + 1;
    for (const c of exportColumns.value) {
      // Sayısal alanlar HAM gider (PDF tarafı EUR biçimler); tarihler dd.mm.yyyy olarak yazılır.
      o[c.label] = c.exportValue ? c.exportValue(r) : c.type === "date" ? formatDate(r[c.key], c.empty) : r[c.key];
    }
    return o;
  });

const { exportToExcel } = useExcelExport();
const exportExcel = () => {
  const d = buildExportRows();
  if (d.length) exportToExcel(d, props.exportName || "rapor");
};

const { printReport } = useReportPrint();
const printPdf = () => {
  const d = buildExportRows();
  if (!d.length) return;
  printReport({
    title: props.title,
    subtitle: props.subtitle || (props.period === null ? undefined : `${dateFrom.value || ""} – ${dateTo.value || ""}`),
    rows: d,
    landscape: props.landscape,
  });
};

// Slot'lara verilen bağlam — özel filtre/gövde ekleyen raporlar için
const ctx = computed(() => ({
  rows: rows.value,
  totals: totals.value,
  data: data.value,
  loading: loading.value,
  fmt,
}));

defineExpose({ fetchData, rows, totals, data, dateFrom, dateTo });
</script>
