<template>
  <div>
    <!-- Label: renk duruma göre labelClass ile belirlenir -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <!-- Multiline modu: textarea -->
    <textarea
      v-if="multiline"
      :id="fieldName"
      v-model="value"
      :placeholder="placeholderName"
      :disabled="disabled"
      rows="1"
      :class="['field-input-base resize-none overflow-hidden', sizeClass, stateClass]"
    />

    <!-- Tekli satır modu: normal input -->
    <input
      v-else
      :id="fieldName"
      v-model="value"
      type="text"
      :placeholder="placeholderName"
      :disabled="disabled"
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
// FieldTextInput.vue — Metin input alanı: vee-validate bağlı veya bağımsız v-model modu.
import { toRefs, computed, ref, watch } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

const props = defineProps({
  modelValue:    { type: [String, Number], default: "" },
  fieldName:     { type: String, default: "" },
  labelName:     { type: String, default: "" },
  placeholderName: { type: String, default: "" },
  isShowSuccess: { type: Boolean, default: true },
  size:          { type: String, default: "normal" },
  multiline:     { type: Boolean, default: false },
  disabled:      { type: Boolean, default: false },
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

// stateClass / sizeClass / labelClass — useFieldInputState composable'dan gelir
const { stateClass, sizeClass, labelClass, errorText } = useFieldInputState(
  errorMessage,
  value,
  computed(() => props.isShowSuccess),
  disabled,
  computed(() => props.size),
);
</script>
