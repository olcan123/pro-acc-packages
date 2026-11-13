<!-- LoginForm.vue — Ortak giriş formu (AuthLoginForm): e-posta + şifre, vee-validate + zod.
     ÜÇ uygulama da kullanır: main (indigo accent, remember-me/footer slot'ları) ve
     pos/restaurant (mavi accent, terminal başlığı). Görsel farklar prop + slot ile verilir. -->
<template>
  <Form :validation-schema="schema" @submit="handleSubmit">
    <div class="flex flex-col gap-5">
      <!-- Başlık (title boşsa gizli; tüketici #header ile tamamen değiştirebilir) -->
      <slot name="header">
        <div v-if="title || subtitle" class="text-center">
          <slot name="icon" />
          <h1 v-if="title" class="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-gray-500">{{ subtitle }}</p>
        </div>
      </slot>

      <!-- Sunucu/oturum hatası -->
      <div
        v-if="error"
        class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 text-center dark:bg-red-900/30 dark:border-red-900/30 dark:text-red-400"
      >
        {{ error }}
      </div>

      <FieldTextInput
        field-name="email"
        :label-name="emailLabel || t('email', 'E-posta')"
        placeholder-name="ornek@mail.com"
        :is-show-success="false"
      />

      <FieldPasswordInput
        field-name="password"
        :label-name="passwordLabel || t('password', 'Şifre')"
        placeholder-name="••••••••"
        :is-show-success="false"
      />

      <!-- Remember-me / şifremi unuttum gibi uygulamaya özel satır -->
      <slot name="actions" />

      <button
        type="submit"
        :disabled="loading"
        class="w-full text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        :class="accent === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'"
      >
        <i v-if="loading" class="pi pi-spin pi-spinner" />
        <span>{{ loading ? (loadingLabel || submitLabel || t('login', 'Giriş')) : (submitLabel || t('login', 'Giriş')) }}</span>
      </button>

      <!-- Kayıt ol vb. alt bağlantılar -->
      <slot name="footer" />
    </div>
  </Form>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { Form } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import FieldTextInput from "../form/FieldTextInput.vue";
import FieldPasswordInput from "../form/FieldPasswordInput.vue";

defineProps({
  title:         { type: String, default: "" },
  subtitle:      { type: String, default: "" },
  error:         { type: String, default: "" },
  loading:       { type: Boolean, default: false },
  accent:        { type: String, default: "blue" }, // "blue" | "indigo"
  emailLabel:    { type: String, default: "" },
  passwordLabel: { type: String, default: "" },
  submitLabel:   { type: String, default: "" },
  loadingLabel:  { type: String, default: "" },
});

const emit = defineEmits(["submit"]);

// i18n kurulu değilse (ör. birim testte izole mount) fallback metinlerle çalış
let t = (key, fallback) => fallback || key;
try {
  t = useI18n().t;
} catch {
  /* vue-i18n yüklü değil — fallback t kullanılır */
}

// Doğrulama mesajları çevrilmiş metin olarak verilir (Field* hata metnini ham basar)
const schema = toTypedSchema(
  z.object({
    email: z
      .string({ required_error: t("v_email_required", "E-posta zorunludur.") })
      .min(1, t("v_email_required", "E-posta zorunludur."))
      .email(t("v_email_invalid", "Geçerli bir e-posta adresi giriniz.")),
    password: z
      .string({ required_error: t("v_password_required", "Şifre zorunludur.") })
      .min(1, t("v_password_required", "Şifre zorunludur.")),
  }),
);

/** vee-validate values → tüketiciye { email, password } olarak iletilir. */
function handleSubmit(values) {
  emit("submit", values);
}
</script>
