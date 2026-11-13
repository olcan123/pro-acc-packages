<template>
  <div>
    <!-- Label: labelClass composable'dan (field-label + durum rengi) -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <!-- Native HTML select — PrimeVue Select kaldırıldı.
         field-input-base + Tailwind ile diğer input'larla aynı görsele uyumlu. -->
    <select
      :id="fieldName"
      v-model="value"
      :disabled="disabled"
      :class="['field-input-base', sizeClass, stateClass, 'w-full appearance-none pr-8 bg-no-repeat',
               disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 dark:bg-gray-800 dark:text-gray-400' : '']"
      :style="caretStyle"
    >
      <!-- Placeholder -->
      <option v-if="placeholderName" :value="''" disabled hidden>
        {{ placeholderName }}
      </option>
      <!-- Show-clear: boş seçim için tek opsiyon -->
      <option v-if="showClear" :value="null">—</option>
      <option
        v-for="opt in normalizedOptions"
        :key="opt.value ?? 'null'"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </option>
    </select>

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldSelect.vue — Seçim kutusu: native <select> (PrimeVue Select kaldırıldı).
// options: ya primitive dizisi (string/number) ya da { [optionLabel], [optionValue], [optionDisabled] } objesi.
import { toRefs, computed, ref, watch } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

const props = defineProps({
  modelValue:          { type: [String, Number, Object], default: "" },
  fieldName:           { type: String, default: "" },
  labelName:           { type: String, default: "" },
  placeholderName:     { type: String, default: "" },
  options:             { type: Array, default: () => [] },
  optionLabel:         { type: String, default: "label" },
  optionValue:         { type: String, default: "value" },
  optionDisabled:      { type: String, default: "disabled" },
  optionGroupLabel:    { type: String, default: "" },
  optionGroupChildren: { type: String, default: "" },
  isShowSuccess:       { type: Boolean, default: true },
  disabled:            { type: Boolean, default: false },
  size:                { type: String, default: "normal" },
  showClear:           { type: Boolean, default: false },
});

const { fieldName, options, optionLabel, optionValue, optionDisabled, disabled, modelValue, showClear } = toRefs(props);
const emit = defineEmits(["update:modelValue"]);

// Seçenekleri { value, label, disabled } formatına normalize et
const normalizedOptions = computed(() =>
  options.value.map((option) => {
    if (typeof option === "string" || typeof option === "number")
      return { value: option, label: option, disabled: false };
    return {
      value:    option[optionValue.value],
      label:    option[optionLabel.value],
      disabled: option[optionDisabled.value] || false,
    };
  })
);

let value, errorMessage;

if (fieldName.value) {
  // vee-validate ile bağlı alan
  const field = useField(fieldName.value);
  value = field.value;
  errorMessage = field.errorMessage;
} else {
  // Bağımsız v-model modu
  value = ref(modelValue.value);
  errorMessage = ref("");
  watch(modelValue, (v) => (value.value = v));
  watch(value, (v) => emit("update:modelValue", v));
}

// labelClass + stateClass + sizeClass — useFieldInputState composable'dan gelir
const { stateClass, labelClass, sizeClass, errorText } = useFieldInputState(
  errorMessage,
  value,
  computed(() => props.isShowSuccess),
  disabled,
  computed(() => props.size),
);

// Native select için "chevron-down" ikonu (SVG inline data URI)
const caretStyle = computed(() => ({
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
  backgroundPosition: "right 0.5rem center",
  backgroundSize: "1.25rem 1.25rem",
}));
</script>
