<template>
  <div>
    <!-- Label: renk duruma göre labelClass ile belirlenir -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <!-- Textarea: boyut sabit (p-2.5 text-sm), durum composable'dan -->
    <textarea
      :id="fieldName"
      v-model="value"
      :placeholder="placeholderName"
      :rows="rows"
      :disabled="disabled"
      :class="['field-input-base p-2.5 text-sm resize-y', stateClass]"
    />

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldTextArea.vue — Çok satırlı metin alanı: vee-validate bağlı, useFieldInputState ile durum stilleri.
import { toRefs, computed } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

const props = defineProps({
  fieldName: { type: String, required: true },
  labelName: { type: String, default: "" },
  placeholderName: { type: String, default: "" },
  rows: { type: Number, default: 4 },
  isShowSuccess: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
});

const { fieldName } = toRefs(props);
const { value, errorMessage } = useField(fieldName.value);

// Textarea için sizeClass gerekmez (sabit p-2.5 text-sm kullanılır)
const { stateClass, labelClass, errorText } = useFieldInputState(
  errorMessage,
  value,
  computed(() => props.isShowSuccess),
  computed(() => props.disabled),
  null,
);
</script>
