<template>
  <!-- Excel import bileşeni: drag-drop veya dosya seçimi ile .xlsx/.xls yükler,
       ilk 5 satırı önizler, validate eder ve 'import' event'i ile veriyi parent'a iletir. -->
  <div class="flex flex-col gap-4">
    <!-- Dosya Yükleme Alanı -->
    <div
      class="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
      @click="triggerFileInput"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input ref="fileInput" type="file" class="hidden" accept=".xlsx, .xls" @change="handleFileChange" />
      <div v-if="!file" class="flex flex-col items-center gap-2">
        <i class="pi pi-cloud-upload text-4xl text-gray-400" />
        <p class="font-medium text-gray-600 dark:text-gray-300">
          {{ $t("drag_drop_excel") }}
        </p>
        <p class="text-sm text-gray-500">{{ $t("or_click_to_select") }}</p>
      </div>
      <div v-else class="flex flex-col items-center gap-2">
        <i class="pi pi-file-excel text-4xl text-green-500" />
        <p class="font-medium text-gray-900 dark:text-white">
          {{ file.name }}
        </p>
        <p class="text-sm text-gray-500">{{ (file.size / 1024).toFixed(2) }} KB</p>
        <FormFieldButton icon="pi pi-times" variant="ghost" size="sm" rounded class="mt-2" @click.stop="clearFile" />
      </div>
    </div>

    <!-- Excel Import Kılavuzu — maddeler `guide-items` ile dışarıdan verilebilir.
         Verilmezse FATURA içe aktarma maddeleri gösterilir (eski davranış);
         boş dizi verilirse kutu hiç görünmez (kılavuz tablosu zaten üstte olduğunda). -->
    <div
      v-if="guideList.length > 0"
      class="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300"
    >
      <h4 class="mb-2 flex items-center gap-2 font-semibold">
        <i class="pi pi-info-circle" /> {{ $t("import_guide", "İçe Aktarım Kılavuzu") }}
      </h4>
      <ul class="list-disc space-y-1 pl-5">
        <li v-for="(item, i) in guideList" :key="i">{{ item }}</li>
      </ul>
    </div>

    <!-- Hata Mesajı -->
    <div
      v-if="error"
      class="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400"
    >
      <i class="pi pi-exclamation-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Önizleme Tablosu (İlk 5 satır) -->
    <div v-if="previewData.length > 0" class="overflow-hidden rounded-lg border">
      <div class="border-b bg-gray-50 p-3 font-medium dark:bg-gray-800">
        {{ $t("preview_first_5_rows") }}
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase dark:bg-gray-700">
            <tr>
              <th v-for="header in headers" :key="header" class="px-4 py-2 font-medium">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in previewData" :key="i" class="border-b last:border-0 dark:border-gray-700">
              <td v-for="header in headers" :key="header" class="px-4 py-2">
                {{ row[header] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Aksiyon Butonları -->
    <div class="mt-4 flex justify-end gap-2">
      <FormFieldButton :label="$t('cancel')" variant="ghost" @click="$emit('close')" />
      <FormFieldButton
        :label="$t('import_data')"
        icon="pi pi-check"
        :disabled="!file || !hasData || !!error"
        :loading="loading"
        variant="primary"
        @click="importData"
      />
    </div>
  </div>
</template>

<script setup>
// ExcelImport.vue — Excel import bileşeni: drag-drop veya dosya seçimi, önizleme ve doğrulama.
import { computed, ref } from "vue";
import { assertExcelFileSize, readFirstSheetRows, readNamedSheetsRows, ExcelImportError } from "../../utils/excel-read.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  // Beklenen sütun başlıkları. İki biçim desteklenir:
  //   ["name", "code"]                    → başlık birebir bulunmalı
  //   [["name", "Ürün Adı"], ["code"]]    → EŞ ANLAMLI grup; birinin bulunması yeterli
  // Karşılaştırma büyük/küçük harf ve baş/son boşluk duyarsızdır (TR yerel kuralı).
  expectedHeaders: {
    type: Array,
    default: () => [],
  },
  // Kılavuz kutusundaki maddeler. null → fatura içe aktarma maddeleri (varsayılan),
  // [] → kutu gizlenir, dolu dizi → verilen maddeler gösterilir.
  guideItems: {
    type: Array,
    default: null,
  },
  // ÇOK SAYFALI mod: { required: ["Dokumentat", "DokumentDetalet"], optional: [] }.
  // Verilirse adı geçen sayfalar okunur ve `import` olayı { sayfaAdı: satırlar } nesnesi gönderir;
  // verilmezse (null) eski davranış: yalnız ilk sayfa, satır dizisi.
  sheetNames: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["import", "close"]);
const { t } = useI18n();

const fileInput = ref(null);
const file = ref(null);
const error = ref(null);
const parsedData = ref([]);
const previewData = ref([]);
const headers = ref([]);

// Kılavuz maddeleri: prop verilmediyse (null) fatura içe aktarma metinleri gösterilir.
const guideList = computed(() =>
  props.guideItems !== null
    ? props.guideItems
    : [t("ei_invoice_date"), t("ei_vat_declared"), t("ei_qty_price"), t("ei_required_fields")],
);

// Başlık karşılaştırması için normalleştirme (TR: I/İ farkı)
const normHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr");

/**
 * Zorunlu başlıkları kontrol eder; eksik grupların ilk (kanonik) adını döndürür.
 * Eş anlamlı gruplarda gruptan bir başlığın bulunması yeterlidir.
 */
const findMissingHeaders = (fileHeaders) => {
  const present = fileHeaders.map(normHeader);
  return props.expectedHeaders
    .map((group) => (Array.isArray(group) ? group : [group]))
    .filter((group) => group.length > 0 && !group.some((h) => present.includes(normHeader(h))))
    .map((group) => group[0]);
};

// Gizli file input'u programatik olarak tetikler
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    processFile(selectedFile);
  }
};

const handleDrop = (event) => {
  const selectedFile = event.dataTransfer.files[0];
  if (selectedFile) {
    processFile(selectedFile);
  }
};

const clearFile = () => {
  file.value = null;
  parsedData.value = [];
  previewData.value = [];
  headers.value = [];
  error.value = null;
  if (fileInput.value) fileInput.value.value = "";
};

// XLSX kütüphanesi ile dosyayı JSON'a çevirir; header validasyonu yapar
const processFile = (selectedFile) => {
  error.value = null;

  // Dosya tipi kontrolü
  if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
    error.value = t("invalid_file_type_excel");
    return;
  }

  // Boyut sınırı (bkz. app/utils/excel-read.js)
  try {
    assertExcelFileSize(selectedFile);
  } catch (err) {
    error.value = t(err.key, err.params);
    return;
  }

  file.value = selectedFile;
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      if (props.sheetNames) {
        // Çok sayfalı: zorunlu sayfalar okunur; önizleme ilk zorunlu sayfadan
        const sheets = await readNamedSheetsRows(
          e.target.result,
          props.sheetNames.required || [],
          props.sheetNames.optional || [],
          { defval: "" },
        );
        const first = sheets[(props.sheetNames.required || [])[0]] || [];
        if (first.length === 0) {
          error.value = t("empty_excel_file");
          return;
        }
        parsedData.value = sheets;
        previewData.value = first.slice(0, 5);
        headers.value = Object.keys(first[0]);
        return;
      }

      // İlk sayfayı satır sınırıyla JSON'a çevir
      const jsonData = await readFirstSheetRows(e.target.result, { defval: "" });

      if (jsonData.length === 0) {
        error.value = t("empty_excel_file");
        return;
      }

      parsedData.value = jsonData;
      previewData.value = jsonData.slice(0, 5); // İlk 5 satır önizleme
      headers.value = Object.keys(jsonData[0]);

      // Zorunlu başlık kontrolü — eksikse içe aktarma butonu da kilitlenir,
      // aksi hâlde kullanıcı hatayı görmezden gelip boş kayıt yüklüyordu.
      if (props.expectedHeaders.length > 0) {
        const missingHeaders = findMissingHeaders(headers.value);
        if (missingHeaders.length > 0) {
          error.value = t("v_import_missing_headers", { headers: missingHeaders.join(", ") });
        }
      }
    } catch (err) {
      if (err instanceof ExcelImportError) {
        error.value = t(err.key, err.params);
        return;
      }
      console.error("Excel parsing error:", err);
      error.value = t("excel_parsing_error");
    }
  };

  reader.readAsArrayBuffer(selectedFile);
};

// Tek sayfa → satır dizisi; çok sayfa → { sayfa: satırlar } nesnesi
const hasData = computed(() =>
  Array.isArray(parsedData.value) ? parsedData.value.length > 0 : Object.keys(parsedData.value || {}).length > 0,
);

const importData = () => {
  if (hasData.value) {
    emit("import", parsedData.value);
  }
};
</script>
