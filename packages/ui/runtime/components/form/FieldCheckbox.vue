<template>
  <div>
    <!-- Native checkbox gizlendi: özel görsel kutu kullanılıyor -->
    <input
      :id="fieldName"
      v-model="value"
      type="checkbox"
      :disabled="disabled"
      v-bind="$attrs"
      class="hidden"
    >

    <div class="flex items-center">
      <!-- Özel checkbox kutusu: durum sınıfları inline (checkbox'a özgü mantık) -->
      <div
        class="w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0"
        :class="[
          disabled
            ? 'cursor-not-allowed bg-gray-200 border-gray-300 opacity-70 dark:bg-gray-700 dark:border-gray-600'
            : 'cursor-pointer',
          errorMessage
            ? 'border-red-500 bg-red-50 dark:bg-gray-700 dark:border-red-500'
            : value
              ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
              : 'bg-white border-gray-400 hover:border-blue-500 dark:bg-gray-800 dark:border-gray-500 dark:hover:border-blue-400',
        ]"
        @click="!disabled && (value = !value)"
      >
        <i
          v-if="value"
          class="pi pi-check text-2xs font-bold leading-none"
        />
      </div>

      <!-- Inline label: disabled/error/checked durumuna göre renk değişir -->
      <label
        v-if="labelName"
        :for="fieldName"
        class="ml-2 text-sm font-medium select-none"
        :class="[
          disabled
            ? 'field-label-disabled'
            : errorMessage
              ? 'field-label-error'
              : value && isShowSuccess
                ? 'field-label-filled cursor-pointer'
                : 'field-label-default cursor-pointer',
        ]"
        @click="!disabled && (value = !value)"
      >
        {{ labelName }}
      </label>
    </div>

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldCheckbox.vue — Özel checkbox: native input gizli, görsel kutu tıklanabilir.
// fieldName verilirse vee-validate'e bağlanır; verilmezse bağımsız v-model modunda çalışır
// (FieldTextInput / FieldNumberInput ile aynı çift-mod deseni). Bağımsız mod, form dışı
// listelerde (örn. bordro satır tablosu) tek tek satır alanları için gereklidir.
import { toRefs, ref, watch } from "vue";
import { useField } from "vee-validate";
import { useErrorText } from "../../composables/useFormStyles.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  fieldName: { type: String, default: "" },
  labelName: { type: String, default: "" },
  isShowSuccess: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
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

// Gösterilecek hata metni: i18n anahtarı ise çevrilir (bkz. useErrorText)
const errorText = useErrorText(() => errorMessage.value);
</script>
