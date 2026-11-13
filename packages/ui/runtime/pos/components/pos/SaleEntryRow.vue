<!--
  pos/SaleEntryRow.vue — Barkod/ürün giriş satırı.
  Barkod + Ürün ismi = FieldAutocomplete (tıklayınca tüm ürün listesi açılır).
  Barkod okutulunca ürün ismi + adet(1) + fiyat dolar; Tab ile geçilir, Enter ile grid'e iner.
  Grid'de bir satıra tıklanınca o satır buraya yüklenir (düzenleme); Enter ile değişiklik uygulanır.
-->
<template>
  <div class="bg-paper-50 dark:bg-paper-900 border-b border-gray-200 dark:border-gray-800 px-2 py-2">
    <div class="grid grid-cols-12 gap-2 items-end">
      <!-- Barkod (FieldAutocomplete) -->
      <div class="col-span-3">
        <FormFieldAutocomplete
          ref="codeAcRef"
          v-model="productId"
          :options="products"
          option-label="code"
          option-value="id"
          :search-fields="['name']"
          :label-name="$t('col_code')"
          :placeholder-name="$t('scan_or_search')"
          @select="onPick"
        />
      </div>

      <!-- Ürün ismi (FieldAutocomplete) -->
      <div class="col-span-4">
        <FormFieldAutocomplete
          ref="nameAcRef"
          v-model="productId"
          :options="products"
          option-label="name"
          option-value="id"
          :search-fields="['code']"
          :label-name="$t('col_description')"
          :placeholder-name="$t('col_description')"
          @select="onPick"
        />
      </div>

      <!-- Adet -->
      <div class="col-span-1">
        <label class="field-label field-label-default">
          {{ $t("col_qty") }}
          <!-- Seçili ürünün SEF ölçü birimi (Njësia Matëse) -->
          <span v-if="selectedUnitSymbol" class="text-paper-500 font-normal">({{ selectedUnitSymbol }})</span>
        </label>
        <input
          ref="qtyRef"
          v-model.number="quantity"
          type="number" min="0" step="any"
          class="field-input-base field-input-default field-size-md text-right tabular-nums"
          @keydown.enter="commit"
        >
      </div>

      <!-- Fiyat -->
      <div class="col-span-2">
        <label class="field-label field-label-default">{{ $t("col_price") }}</label>
        <input
          v-model.number="price"
          type="number" min="0" step="any"
          class="field-input-base field-input-default field-size-md text-right tabular-nums"
          @keydown.enter="commit"
        >
      </div>

      <!-- Tutar (salt okunur) -->
      <div class="col-span-1">
        <label class="field-label field-label-default">{{ $t("col_value") }}</label>
        <div class="field-input-base field-input-filled field-size-md text-right tabular-nums font-semibold">
          {{ total.toFixed(2) }}
        </div>
      </div>

      <!-- Ekle / Uygula -->
      <div class="col-span-1">
        <button
          class="btn-base btn-size-md rounded-lg w-full"
          :class="editMode ? 'btn-warning' : 'btn-primary'"
          :disabled="!productId"
          :title="editMode ? $t('confirm') : $t('add')"
          @click="commit"
        >
          <i :class="editMode ? 'pi pi-check' : 'pi pi-arrow-down'" />
        </button>
      </div>
    </div>

    <!-- Düzenleme göstergesi -->
    <div v-if="editMode" class="mt-1.5 flex items-center gap-3 text-xs text-amber-600 dark:text-amber-400">
      <span class="flex items-center gap-1"><i class="pi pi-pencil" /> {{ $t("edit") }} · #{{ editingIndex + 1 }}</span>
      <button class="underline hover:text-amber-700" @click="cancel">{{ $t("cancel") }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps({
  // Düzenlenecek grid satırı: { productId, code, name, quantity, unitPrice, vatRate, _index } | null
  editing: { type: Object, default: null },
});
const emit = defineEmits(["commit", "cancel"]);

const productStore = useProductStore();
const products = computed(() => productStore.products);
// Seçili ürünün ölçü birimi sembolü — miktar etiketinin yanında gösterilir
const selectedUnitSymbol = computed(
  () => products.value.find((x) => x.id === productId.value)?.unitSymbol || "",
);

const productId = ref(null);
const code = ref("");
const name = ref("");
const quantity = ref(1);
const price = ref(0);
const vatRate = ref(18);
const editMode = ref(false);
const editingIndex = ref(-1);

const codeAcRef = ref(null);
const nameAcRef = ref(null);
const qtyRef = ref(null);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const total = computed(() => round2((Number(quantity.value) || 0) * (Number(price.value) || 0)));

/** Barkod veya ürün ismi seçilince: isim + adet(1) + fiyat doldur, miktara odaklan. */
function onPick(product) {
  if (!product) return;
  productId.value = product.id;
  code.value = product.code;
  name.value = product.name;
  vatRate.value = Number(product.vatRate ?? 18);
  price.value = Number(product.sellPrice);
  if (!editMode.value) quantity.value = 1;
  nextTick(() => qtyRef.value?.focus());
}

function focusCode() {
  const el = codeAcRef.value?.$el?.querySelector("input");
  el?.focus();
}

/**
 * Açık autocomplete dropdown'larını kapat ve odaklı input'u blur'la.
 * Ödeme/kapatma modalı açılınca çağrılır: body'e teleport edilen liste modalın
 * üstünde kalmasın ve klavye girişi (keypad) yanlışlıkla aramaya gitmesin.
 */
function closeDropdowns() {
  codeAcRef.value?.close?.();
  nameAcRef.value?.close?.();
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function resetRow() {
  productId.value = null;
  code.value = "";
  name.value = "";
  quantity.value = 1;
  price.value = 0;
  vatRate.value = 18;
  editMode.value = false;
  editingIndex.value = -1;
}

/** Enter / buton: yeni satır ekle veya düzenlenen satırı güncelle. */
function commit() {
  if (!productId.value) return;
  const p = products.value.find((x) => x.id === productId.value);
  emit("commit", {
    index: editMode.value ? editingIndex.value : -1,
    line: {
      productId: productId.value,
      code: code.value || p?.code,
      name: name.value || p?.name,
      quantity: Number(quantity.value) || 1,
      // SEF ölçü birimi sembolü — yalnız gösterim (main'e giden payload'da yok)
      unitSymbol: p?.unitSymbol ?? null,
      unitPrice: Number(price.value) || 0,
      vatRate: Number(vatRate.value ?? 18),
    },
  });
  resetRow();
  nextTick(focusCode);
}

function cancel() {
  resetRow();
  emit("cancel");
  nextTick(focusCode);
}

// Grid'den düzenleme isteği gelince satırı yükle
watch(
  () => props.editing,
  (e) => {
    if (!e) return;
    productId.value = e.productId;
    code.value = e.code;
    name.value = e.name;
    quantity.value = e.quantity;
    price.value = e.unitPrice;
    vatRate.value = e.vatRate;
    editMode.value = true;
    editingIndex.value = e._index;
    nextTick(() => qtyRef.value?.focus());
  },
);

defineExpose({ focusCode, closeDropdowns });
</script>
