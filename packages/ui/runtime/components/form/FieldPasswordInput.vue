<template>
  <div>
    <!-- Label: renk duruma göre labelClass ile belirlenir -->
    <label v-if="labelName" :for="fieldName" :class="labelClass">
      {{ labelName }}
    </label>

    <div class="relative">
      <!-- Şifre input'u: type toggle ile göster/gizle -->
      <input
        :id="fieldName"
        v-model="value"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholderName"
        :disabled="disabled"
        autocomplete="current-password"
        :class="['field-input-base pr-10', sizeClass, stateClass]"
      >

      <!-- Şifre görünürlük toggle butonu -->
      <button
        type="button"
        :disabled="disabled"
        class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none transition-colors"
        :title="showPassword ? $t('password_hide') : $t('password_show')"
        @click="showPassword = !showPassword"
      >
        <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
      </button>
    </div>

    <!-- Şifre güç göstergesi (opsiyonel) -->
    <div v-if="showStrength && value" class="mt-2">
      <div class="flex gap-1 mb-1">
        <div
          v-for="i in 4"
          :key="i"
          class="h-1 flex-1 rounded-full transition-all duration-300"
          :class="i <= strengthLevel ? strengthColor : 'bg-gray-200 dark:bg-gray-700'"
        />
      </div>
      <p class="text-xs" :class="strengthTextColor">{{ strengthLabel ? $t(strengthLabel) : "" }}</p>
    </div>

    <!-- Validasyon hata mesajı -->
    <p v-if="errorMessage" class="field-error-msg">
      <span class="font-medium">{{ $t("error_title") }}</span>
      {{ errorText }}
    </p>
  </div>
</template>

<script setup>
// FieldPasswordInput.vue — Şifre input alanı: göster/gizle toggle butonu ile.
import { ref, computed, toRefs } from "vue";
import { useField } from "vee-validate";
import { useFieldInputState } from "../../composables/useFormStyles.js";

const props = defineProps({
  fieldName:     { type: String, required: true },
  labelName:     { type: String, default: "" },
  placeholderName: { type: String, default: "••••••••" },
  isShowSuccess: { type: Boolean, default: true },
  size:          { type: String, default: "normal" },
  disabled:      { type: Boolean, default: false },
  showStrength:  { type: Boolean, default: false },
});

const { fieldName, disabled } = toRefs(props);
const { value, errorMessage } = useField(fieldName.value);

const showPassword = ref(false);

// stateClass / sizeClass / labelClass — useFieldInputState composable'dan gelir
const { stateClass, sizeClass, labelClass, errorText } = useFieldInputState(
  errorMessage,
  value,
  computed(() => props.isShowSuccess),
  disabled,
  computed(() => props.size),
);

// ── Şifre güç hesaplama ─────────────────────────────────────
// 4 kritere göre 0-4 arası puan: uzunluk, büyük harf, rakam, özel karakter
const strengthLevel = computed(() => {
  const pw = value.value || "";
  let score = 0;
  if (pw.length >= 8)          score++; // En az 8 karakter
  if (/[A-Z]/.test(pw))        score++; // Büyük harf
  if (/[0-9]/.test(pw))        score++; // Rakam
  if (/[^A-Za-z0-9]/.test(pw)) score++; // Özel karakter
  return score;
});

// Güç seviyesine göre progress bar rengi
const strengthColor = computed(() => {
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  return colors[strengthLevel.value] || "bg-gray-200";
});

// Güç seviyesine göre etiket rengi
const strengthTextColor = computed(() => {
  const colors = [
    "",
    "text-red-600 dark:text-red-400",
    "text-orange-500 dark:text-orange-400",
    "text-yellow-600 dark:text-yellow-400",
    "text-green-600 dark:text-green-400",
  ];
  return colors[strengthLevel.value] || "text-gray-400";
});

// Güç seviyesi i18n ANAHTARI döner; şablon $t ile basar
const strengthLabel = computed(() => {
  const labels = ["", "pw_very_weak", "pw_weak", "pw_medium", "pw_strong"];
  return labels[strengthLevel.value] || "";
});
</script>
