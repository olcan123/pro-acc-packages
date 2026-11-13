<template>
  <!-- POS/Restoran ortak giriş ekranı (pos-core layer) — kullanıcılar main'de oluşturulur. -->
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
    <div class="w-full max-w-sm bg-paper-50 dark:bg-paper-900 rounded-2xl shadow-lg p-7">
      <AuthLoginForm
        :title="terminalName"
        :subtitle="$t('pos_login_subtitle', 'Kasaya giriş yapın')"
        :error="errorText"
        :loading="loading"
        @submit="onSubmit"
      >
        <template #icon>
          <i class="pi pi-bolt text-yellow-400 text-4xl" />
        </template>
      </AuthLoginForm>
    </div>
  </div>
</template>

<script setup>
// login.vue — POS/Restoran ortak giriş sayfası (layout'suz). AuthLoginForm (pos-ui) + auth store.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@pro-acc/ui/pos/stores/auth.store.js";
import { useSettingsStore } from "@pro-acc/ui/pos/stores/settings.store.js";
import { useTerminalName } from "@pro-acc/ui/pos/composables/useTerminalName.js";

definePageMeta({ layout: false });

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const settingsStore = useSettingsStore();
const terminalName = useTerminalName();

const loading = ref(false);
const error = ref("");
const errorText = computed(() => (error.value ? t(error.value, error.value) : ""));

onMounted(() => {
  if (!settingsStore.settings) settingsStore.fetch().catch(() => {});
  // Kasada klavye odaklı akış: e-posta alanına otomatik odaklan
  document.getElementById("email")?.focus();
});

async function onSubmit({ email, password }) {
  loading.value = true;
  error.value = "";
  try {
    await auth.login({ email: email.trim(), password });
    await navigateTo(route.query.redirect || "/");
  } catch (e) {
    error.value = e?.data?.statusMessage || "v_invalid_credentials";
  } finally {
    loading.value = false;
  }
}
</script>
