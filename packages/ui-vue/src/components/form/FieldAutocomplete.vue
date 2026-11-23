<template>
  <div ref="containerRef" class="relative">
    <!-- Label: renk duruma göre labelClass ile belirlenir -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <div ref="inputWrapperRef" class="relative">
      <!-- Arama input'u: searchQuery görünen metin, value gerçek ID -->
      <input
        :id="fieldName"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholderName"
        autocomplete="off"
        :disabled="disabled"
        :class="['field-input-base', sizeClass, stateClass, disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 dark:bg-gray-800 dark:text-gray-400' : '']"
        @focus="onFocus"
        @input="onInput"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.enter="onEnter"
        @keydown.esc="onEsc"
      >

      <!-- Seçimi temizle butonu -->
      <button
        v-if="value && !disabled"
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
        @click="clearSelection"
      >
        <i class="pi pi-times text-xs"/>
      </button>
    </div>

    <!-- Dropdown listesi: body'e teleport (z-index sorunlarını önler) -->
    <Teleport to="body">
      <div
        v-if="isOpen && filteredOptions.length > 0"
        ref="optionsListRef"
        :style="dropdownPosition"
        class="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto dark:bg-gray-700 dark:border-gray-600"
      >
        <ul class="py-1">
          <li
            v-for="(option, index) in filteredOptions"
            :key="index"
            :class="[
              'px-4 py-2 text-sm flex flex-col leading-tight',
              optionDisabled && option[optionDisabled]
                ? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50'
                : index === highlightedIndex
                  ? 'cursor-pointer bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
            ]"
            @click="!optionDisabled || !option[optionDisabled] ? selectOption(option) : null"
            @mouseenter="!optionDisabled || !option[optionDisabled] ? (highlightedIndex = index) : null"
          >
            <span>{{ option[optionLabel] }}</span>
            <span
              v-if="optionSubText(option)"
              class="text-xs text-gray-400 dark:text-gray-500"
            >
              {{ optionSubText(option) }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Sonuç bulunamadı mesajı -->
      <div
        v-if="isOpen && searchQuery && filteredOptions.length === 0"
        :style="dropdownPosition"
        class="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      >
        {{ $t("no_results_found") }}
      </div>
    </Teleport>

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldAutocomplete.vue — Otomatik tamamlama alanı: vee-validate bağlı, öneriler dropdown ile gösterilir.
import { ref, computed, watch, toRefs, onMounted, onUnmounted, nextTick } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

const emit = defineEmits(["select", "update:modelValue"]);

const props = defineProps({
  modelValue: { type: [String, Number, Object], default: null },
  fieldName: { type: String, default: "" },
  labelName: { type: String, default: "" },
  placeholderName: { type: String, default: "" },
  options: { type: Array, default: () => [] },
  optionLabel: { type: String, default: "label" },
  optionValue: { type: String, default: "value" },
  // Çoklu arama: optionLabel dışında bu alanlarda da arama yapılır
  // optionLabel dışında bu alanlarda da arama yapılır
  // (örn. Account için ['uniqueIdentityNumber','vatNumber'], Product için ['code'])
  searchFields: { type: Array, default: () => [] },
  isShowSuccess: { type: Boolean, default: true },
  size: { type: String, default: "normal" },
  disabled: { type: Boolean, default: false },
  optionDisabled: { type: String, default: null },
});

const { fieldName, options, optionLabel, optionValue, searchFields, disabled, optionDisabled, modelValue } = toRefs(props);

let value, errorMessage, setValue;

if (fieldName.value) {
  const field = useField(fieldName.value);
  value = field.value;
  errorMessage = field.errorMessage;
  setValue = field.setValue;
} else {
  value = ref(modelValue.value);
  errorMessage = ref("");
  setValue = (val) => {
    value.value = val;
    emit("update:modelValue", val);
  };
  watch(modelValue, (v) => { value.value = v; });
}

// stateClass / sizeClass / labelClass — useFieldInputState composable'dan gelir
const { stateClass, sizeClass, labelClass, errorText } = useFieldInputState(
  errorMessage,
  value,
  computed(() => props.isShowSuccess),
  computed(() => props.disabled),
  computed(() => props.size),
);

const searchQuery = ref("");
const isOpen = ref(false);
const containerRef = ref(null);
const inputWrapperRef = ref(null);
const dropdownPosition = ref({});
const highlightedIndex = ref(-1); // Klavye ile vurgulanan seçenek indeksi
const optionsListRef = ref(null); // Dropdown kapsayıcısı (scroll için)

// Kullanıcı aramasına göre seçenekleri filtrele.
// optionLabel + searchFields alanlarının tümünde arama yapılır (çoklu arama).
const filteredOptions = computed(() => {
  if (!searchQuery.value) return options.value;
  const query = searchQuery.value.toLowerCase();
  const keys = [optionLabel.value, ...(searchFields.value || [])];
  return options.value.filter((opt) =>
    keys.some((key) => {
      const fieldVal = opt[key];
      return fieldVal != null && String(fieldVal).toLowerCase().includes(query);
    }),
  );
});

// Dropdown'da optionLabel altında gösterilecek ek bilgi satırı
// (searchFields değerleri — örn. ürün kodu, cari UID/vergi no). Boşlar atlanır.
const optionSubText = (option) => {
  return (searchFields.value || [])
    .map((key) => option[key])
    .filter((v) => v != null && String(v).trim() !== "")
    .join(" • ");
};

// Dropdown konumunu AKILLICA hesapla: altta yer yoksa YUKARI (flip) aç; yüksekliği
// mevcut boşluğa göre kısıtla → liste HER KOŞULDA tam görünür (viewport dışına taşmaz),
// içeride scroll olur. Sayfanın en altındaki alanlarda bile listeler görünür kalır.
const DROPDOWN_MAX_H = 240; // ~15rem üst sınır
const MARGIN = 6; // input ile liste arası boşluk (px)

const updatePosition = () => {
  if (!inputWrapperRef.value) return;
  const rect = inputWrapperRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
  const spaceAbove = rect.top - MARGIN;

  if (spaceBelow >= DROPDOWN_MAX_H || spaceBelow >= spaceAbove) {
    // Yeterli alan var ya da aşağısı daha geniş → aşağı aç
    dropdownPosition.value = {
      top: `${rect.bottom + MARGIN}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(DROPDOWN_MAX_H, Math.max(spaceBelow, 96))}px`,
      bottom: "auto",
    };
  } else {
    // Aşağıda yer yok → yukarı (flip) aç
    dropdownPosition.value = {
      bottom: `${window.innerHeight - rect.top + MARGIN}px`,
      top: "auto",
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(DROPDOWN_MAX_H, Math.max(spaceAbove, 96))}px`,
    };
  }
};

const onFocus = () => {
  if (props.disabled) return;
  isOpen.value = true;
  highlightedIndex.value = -1;
  updatePosition();
};

const onInput = () => {
  if (props.disabled) return;
  isOpen.value = true;
  updatePosition();
  // Yazınca ilk "seçilebilir" eşleşmeyi bul
  let firstSelectable = 0;
  if (props.optionDisabled) {
    firstSelectable = filteredOptions.value.findIndex((opt) => !opt[props.optionDisabled]);
    if (firstSelectable === -1) firstSelectable = -1;
  }
  highlightedIndex.value = firstSelectable;
  if (searchQuery.value === "") setValue(null);
};

const selectOption = (option) => {
  setValue(option[optionValue.value]);
  searchQuery.value = option[optionLabel.value];
  isOpen.value = false;
  highlightedIndex.value = -1;
  emit("select", option);
};

const clearSelection = () => {
  setValue(null);
  searchQuery.value = "";
  highlightedIndex.value = -1;
};

// Klavye ile gezinme: aşağı/yukarı ok vurgular, Enter seçer, Esc kapatır
const onArrowDown = () => {
  if (props.disabled) return;
  if (!isOpen.value) {
    isOpen.value = true;
    updatePosition();
  }
  if (filteredOptions.value.length === 0) return;

  let nextIdx = highlightedIndex.value + 1;
  if (props.optionDisabled) {
    while (nextIdx < filteredOptions.value.length && filteredOptions.value[nextIdx][props.optionDisabled]) {
      nextIdx++;
    }
  }
  if (nextIdx < filteredOptions.value.length) {
    highlightedIndex.value = nextIdx;
  }
};

const onArrowUp = () => {
  if (props.disabled) return;
  if (!isOpen.value || filteredOptions.value.length === 0) return;

  let prevIdx = highlightedIndex.value - 1;
  if (props.optionDisabled) {
    while (prevIdx >= 0 && filteredOptions.value[prevIdx][props.optionDisabled]) {
      prevIdx--;
    }
  }
  if (prevIdx >= 0) {
    highlightedIndex.value = prevIdx;
  }
};

const onEnter = (event) => {
  const opt = filteredOptions.value[highlightedIndex.value];
  if (isOpen.value && highlightedIndex.value >= 0 && opt) {
    event.preventDefault(); // Form submit'i engelle, seçimi uygula
    selectOption(opt);
  }
};

const onEsc = () => {
  isOpen.value = false;
  highlightedIndex.value = -1;
};

// Vurgulanan seçeneği kaydırılabilir liste içinde görünür alana getir
watch(highlightedIndex, async (idx) => {
  if (idx < 0 || !isOpen.value) return;
  await nextTick();
  const el = optionsListRef.value?.querySelectorAll("li")?.[idx];
  if (el) el.scrollIntoView({ block: "nearest" });
});

// Dışarı tıklanınca dropdown'ı kapat
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
    highlightedIndex.value = -1;
    if (value.value) {
      const selected = options.value.find(
        (opt) => opt[optionValue.value] === value.value,
      );
      searchQuery.value = selected ? selected[optionLabel.value] : "";
    } else {
      searchQuery.value = "";
    }
  }
};

// Dropdown açıkken sayfa kaydırma / pencere boyutlanmasında yeniden konumlandır
// (capture:true → iç scroll konteynerleri de yakalanır) → liste input'la hizalı kalır.
const onScrollOrResize = () => {
  if (isOpen.value) updatePosition();
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
});
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
});

// value dışarıdan değiştiğinde (form reset vb.) searchQuery senkronize et
watch(
  value,
  (newVal) => {
    if (newVal && options.value?.length > 0) {
      const selected = options.value.find(
        (opt) => opt[optionValue.value] === newVal,
      );
      if (selected) searchQuery.value = selected[optionLabel.value];
    } else if (!newVal) {
      searchQuery.value = "";
    }
  },
  { immediate: true },
);

// options listesi geç yüklenirse seçili değeri eşleştir
watch(
  () => options.value,
  (newOptions) => {
    if (value.value && newOptions?.length > 0) {
      const selected = newOptions.find(
        (opt) => opt[optionValue.value] === value.value,
      );
      if (selected) searchQuery.value = selected[optionLabel.value];
    }
  },
  { deep: true },
);

// Dropdown'ı dışarıdan kapat (örn. ödeme modalı açılınca body'e teleport edilen
// liste modalın üstünde kalmasın). highlightedIndex sıfırlanır.
const close = () => {
  isOpen.value = false;
  highlightedIndex.value = -1;
};

defineExpose({ close });
</script>
