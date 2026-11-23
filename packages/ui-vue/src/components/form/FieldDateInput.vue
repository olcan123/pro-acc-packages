<template>
  <div>
    <!-- Label: renk duruma göre labelClass ile belirlenir -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <!-- Date input: ISO string ↔ Date dönüşümü inputValue computed ile yapılır -->
    <input
      :id="fieldName"
      v-model="inputValue"
      type="date"
      :disabled="disabled"
      v-bind="$attrs"
      :class="['field-input-base', sizeClass, stateClass]"
    >

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldDateInput.vue — Tarih input alanı: vee-validate bağlı, useFieldInputState ile durum stilleri.
import { toRefs, computed, ref, watch } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue:      { type: [String, Date], default: "" },
  fieldName:       { type: String, default: "" },
  labelName:       { type: String, default: "" },
  placeholderName: { type: String, default: "" },
  isShowSuccess:   { type: Boolean, default: true },
  size:            { type: String, default: "normal" },
  disabled:        { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);
const { fieldName, disabled, modelValue } = toRefs(props);

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

// HTML date input'u için ISO date string ↔ Date object dönüşümü
const inputValue = computed({
  get: () => {
    if (!value.value) return "";
    try {
      const date = new Date(value.value);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  },
  set: (val) => {
    value.value = val ? new Date(val) : undefined;
  },
});

// stateClass / sizeClass / labelClass — useFieldInputState composable'dan gelir
const { stateClass, sizeClass, labelClass, errorText } = useFieldInputState(
  errorMessage,
  value,
  computed(() => props.isShowSuccess),
  disabled,
  computed(() => props.size),
);
</script>
