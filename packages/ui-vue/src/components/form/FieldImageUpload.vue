<template>
  <div>
    <!-- Label: labelClass composable'dan (field-label + durum rengi) -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <div class="relative">
      <!-- Mevcut görsel önizleme -->
      <div
        v-if="currentValue"
        class="relative flex items-center p-4 rounded-lg border border-dashed transition-colors w-full"
        :class="
          disabled
            ? 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
            : errorMessage
              ? 'bg-red-50/10 border-red-400 dark:bg-red-900/10 dark:border-red-800'
              : 'bg-blue-50/10 border-blue-300 hover:border-blue-400 dark:bg-gray-900 dark:border-blue-800 dark:hover:border-blue-700'
        "
      >
        <div class="flex-1 flex justify-center">
          <img
            :src="currentValue"
            alt="Uploaded Image"
            class="h-24 w-auto object-contain rounded shadow-sm bg-white dark:bg-gray-800 p-2"
          >
        </div>

        <!-- Görseli sil butonu -->
        <button
          v-if="!disabled"
          type="button"
          title="Logoyu Sil"
          class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 w-8 h-8 flex items-center justify-center shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
          @click="clearImage"
        >
          <i class="pi pi-times text-sm"/>
        </button>
      </div>

      <!-- Görsel yükleme alanı (görsel yokken görünür) -->
      <div v-if="!currentValue">
        <input
          :id="fieldName"
          type="file"
          accept="image/*"
          :disabled="disabled || uploading"
          class="field-input-base p-2 text-sm file-btn-base"
          :class="[
            disabled || uploading ? ['field-input-disabled', 'file-btn-disabled']
            : errorMessage       ? ['field-input-error',    'file-btn-error']
            :                      ['field-input-default',  'file-btn-default'],
          ]"
          @change="handleFileUpload"
        >

        <!-- Yükleniyor overlay -->
        <div
          v-if="uploading"
          class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-lg backdrop-blur-sm"
        >
          <span class="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center">
            <i class="pi pi-spin pi-spinner mr-2 text-lg"/>
            {{ $t('uploading', 'Yükleniyor...') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title", "Hata:") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
import { uiFetch } from "../../config.ts";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
// FieldImageUpload.vue — Resim yükleme alanı: önizleme, dosya validasyonu ve sunucuya upload.
import { ref, toRefs, computed } from "vue";
import { useField } from "vee-validate";
import { useAppToast } from "../../composables/useAppToast.ts";
import { useFieldInputState } from "../../composables/useFormStyles.js";

const props = defineProps({
  modelValue: { type: String,  default: "" },
  fieldName:  { type: String,  default: "" },
  labelName:  { type: String,  default: "" },
  disabled:   { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);
const { fieldName, disabled, modelValue } = toRefs(props);
const toast = useAppToast();
const uploading = ref(false);

// vee-validate veya v-model modu
const field = fieldName.value ? useField(fieldName.value) : null;

const currentValue = computed({
  get: () => (field ? field.value.value : modelValue.value),
  set: (val) => {
    if (field) field.setValue(val);
    else emit("update:modelValue", val);
  },
});

const errorMessage = computed(() => (field ? field.errorMessage.value : ""));

// labelClass composable'dan (isShowSuccess olmadığı için filled yoktur)
const { labelClass, errorText } = useFieldInputState(
  errorMessage,
  currentValue,
  computed(() => false),
  disabled,
  null,
);

const clearImage = () => {
  // null göndererek backend'de silinmesini tetikler
  currentValue.value = null;
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  uploading.value = true;
  try {
    const data = await uiFetch("/api/upload", { method: "POST", body: formData });
    if (data?.path) currentValue.value = data.path;
  } catch (err) {
    console.error("Upload error:", err);
    toast.error(t("v_image_upload_error"));
  } finally {
    uploading.value = false;
    event.target.value = ""; // Aynı dosyayı tekrar seçebilmek için sıfırla
  }
};
</script>
