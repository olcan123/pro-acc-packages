<template>
  <div>
    <!-- Label: renk duruma göre labelClass ile belirlenir -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <!-- Sayısal input: number type, step otomatik hesaplanır.
         Varsayılan "any" → tarayıcı ondalık kısıtlaması koymaz (muhasebe için).
         Açık step veya maxFractionDigits verilirse ona uyulur.
         readonly: değeri korur ve submit eder ama kullanıcı değiştiremez (KMSH gibi
         hesaplanmış değerler için). disabled: tamamen pasif. -->
    <input
      :id="fieldName"
      v-model.number="value"
      type="number"
      :placeholder="placeholderName"
      :min="min"
      :max="max"
      :step="
        step ?? (maxFractionDigits ? 1 / Math.pow(10, maxFractionDigits) : 'any')
      "
      :disabled="disabled"
      :readonly="readonly"
      v-bind="$attrs"
      :class="['field-input-base', sizeClass, stateClass,
               readonly ? 'bg-gray-50 dark:bg-gray-800/60 cursor-not-allowed text-gray-700 dark:text-gray-300' : '']"
      @input="emit('input', { value })"
      @change="emit('change', { value })"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    >

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldNumberInput.vue — Sayısal input alanı: min/max/step destekli.
// fieldName verilirse vee-validate'e bağlanır; verilmezse bağımsız v-model modunda çalışır
// (FieldTextInput / FieldDateInput ile aynı çift-mod deseni).
import { ref, toRefs, computed, watch } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

defineOptions({ inheritAttrs: false });

const emit = defineEmits(["input", "change", "blur", "focus", "update:modelValue"]);

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  fieldName: { type: String, default: "" },
  labelName: { type: String, default: "" },
  placeholderName: { type: String, default: "" },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: [Number, String], default: undefined },
  minFractionDigits: { type: Number, default: undefined },
  maxFractionDigits: { type: Number, default: undefined },
  isShowSuccess: { type: Boolean, default: true },
  size: { type: String, default: "normal" },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
});

const { fieldName, disabled, modelValue } = toRefs(props);

let value, errorMessage;
if (fieldName.value) {
  const field = useField(fieldName.value);
  value = field.value;
  errorMessage = field.errorMessage;
} else {
  value = ref(modelValue.value);
  errorMessage = ref("");
  watch(modelValue, (v) => (value.value = v));
  watch(value, (v) => emit("update:modelValue", v));
}

// Sayısal alan için 0 değeri "boş" sayılmamalı; null/undefined boş kabul edilir
const hasValue = computed(
  () => value.value !== undefined && value.value !== null && value.value !== "",
);

// stateClass / sizeClass / labelClass — useFieldInputState composable'dan gelir
const { stateClass, sizeClass, labelClass, errorText } = useFieldInputState(
  errorMessage,
  hasValue,
  computed(() => props.isShowSuccess),
  disabled,
  computed(() => props.size),
);
</script>
