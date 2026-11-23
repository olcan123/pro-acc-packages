<!-- layout/PosTopbar.vue — Üst bar: firma/POS adı, canlı tarih-saat, dil, hızlı linkler ve giriş yapan kullanıcı (menü: şifre değiştir / çıkış). -->
<template>
  <header class="pos-topbar">
    <!-- Sol: logo + firma/POS adı -->
    <div class="flex min-w-0 items-center gap-2">
      <i class="pi pi-bolt text-lg text-yellow-300" />
      <span class="truncate font-bold">{{ posName }}</span>
    </div>

    <!-- Sağ: senkron sağlık + tarih-saat + dil + linkler + kullanıcı -->
    <div class="flex items-center gap-3 text-sm">
      <LayoutSyncHealthBadge />
      <!-- Docker Hub'da yeni sürüm varsa: açılışta soru + reddedilince rozet (pos-ui) -->
      <SharedUpdateNotice />
      <ClientOnly
        ><span class="hidden font-medium tabular-nums sm:inline">{{ clock }}</span></ClientOnly
      >

      <!-- Dil değiştirici -->
      <div class="flex items-center rounded-md bg-blue-800/60 p-0.5">
        <button
          v-for="l in locales"
          :key="l"
          class="rounded px-2 py-0.5 text-xs font-semibold uppercase transition-colors"
          :class="locale === l ? 'bg-paper-50 text-blue-700' : 'text-blue-100 hover:text-white'"
          @click="setLocale(l)"
        >
          {{ l }}
        </button>
      </div>

      <NuxtLink to="/sessions" class="transition-colors hover:text-yellow-300" :title="$t('z_report')">
        <i class="pi pi-receipt text-lg" />
      </NuxtLink>
      <NuxtLink to="/archive" class="transition-colors hover:text-yellow-300" :title="$t('archive')">
        <i class="pi pi-box text-lg" />
      </NuxtLink>
      <NuxtLink to="/settings" class="transition-colors hover:text-yellow-300" :title="$t('settings')">
        <i class="pi pi-cog text-lg" />
      </NuxtLink>

      <!-- Giriş yapan kullanıcı + menü -->
      <div class="relative border-l border-blue-500/50 pl-3">
        <button class="flex items-center gap-1.5 transition-colors hover:text-yellow-300" @click="menuOpen = !menuOpen">
          <i class="pi pi-user" />
          <!-- Kullanıcı adı yalnız istemcide bilinir (auth SSR'de boş) → ClientOnly ile hydration
               uyuşmazlığını önle (saat gibi). Fallback: sunucuda "Misafir" gösterilir. -->
          <ClientOnly>
            <span class="hidden sm:inline">{{ auth.userTag || $t("guest", "Misafir") }}</span>
            <template #fallback
              ><span class="hidden sm:inline">{{ $t("guest", "Misafir") }}</span></template
            >
          </ClientOnly>
          <i class="pi pi-angle-down text-xs" />
        </button>

        <!-- Açılır menü -->
        <div
          v-if="menuOpen"
          class="absolute right-0 z-[200] mt-2 w-48 rounded-lg bg-paper-50 py-1 text-gray-700 shadow-xl dark:bg-paper-800 dark:text-gray-200"
        >
          <div
            class="truncate border-b border-gray-100 px-3 py-2 text-xs text-paper-500 dark:border-gray-700 dark:text-paper-400"
          >
            {{ auth.userName }}
          </div>
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="openChangePw"
          >
            <i class="pi pi-key" /> {{ $t("change_password", "Şifre Değiştir") }}
          </button>
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="onLogout"
          >
            <i class="pi pi-sign-out" /> {{ $t("logout", "Çıkış") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dışarı tıklayınca menüyü kapat -->
    <div v-if="menuOpen" class="fixed inset-0 z-[150]" @click="menuOpen = false" />

    <!-- Şifre değiştirme modalı -->
    <SharedModal v-model:visible="pwOpen" :header="$t('change_password', 'Şifre Değiştir')" max-width="420px">
      <div class="space-y-3">
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">{{
            $t("current_password", "Mevcut Şifre")
          }}</label>
          <input
            v-model="pw.current"
            type="password"
            class="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">{{
            $t("new_password", "Yeni Şifre")
          }}</label>
          <input
            v-model="pw.next"
            type="password"
            class="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">{{
            $t("confirm_password", "Yeni Şifre (Tekrar)")
          }}</label>
          <input
            v-model="pw.confirm"
            type="password"
            class="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>
      <template #footer>
        <button
          class="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="pwOpen = false"
        >
          {{ $t("cancel", "İptal") }}
        </button>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          :disabled="pwSaving"
          @click="submitChangePw"
        >
          {{ $t("save", "Kaydet") }}
        </button>
      </template>
    </SharedModal>
  </header>
</template>

<script setup>
import { formatDateTime } from "@pro-acc/ui-vue/utils/date";
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useTerminalName } from "../../composables/useTerminalName.js";

const { t, locale, setLocale } = useI18n();
const locales = ["tr", "sq", "en"];

const settingsStore = useSettingsStore();
const auth = useAuthStore();
const toast = useAppToast();

// Üst bar: firma adı (company.name) — yoksa terminal adı / env'e düşer (POS + Restoran ortak)
const posName = useTerminalName();

// Kullanıcı menüsü
const menuOpen = ref(false);

// Şifre değiştirme
const pwOpen = ref(false);
const pwSaving = ref(false);
const pw = reactive({ current: "", next: "", confirm: "" });

function openChangePw() {
  menuOpen.value = false;
  pw.current = "";
  pw.next = "";
  pw.confirm = "";
  pwOpen.value = true;
}

async function submitChangePw() {
  if (pw.next !== pw.confirm) {
    toast.error(t("v_passwords_mismatch", "Şifreler eşleşmiyor"));
    return;
  }
  pwSaving.value = true;
  try {
    await auth.changePassword({ currentPassword: pw.current, newPassword: pw.next });
    toast.success(t("password_changed", "Şifre değiştirildi"));
    pwOpen.value = false;
  } catch (e) {
    toast.error(
      e?.data?.statusMessage ? t(e.data.statusMessage, e.data.statusMessage) : t("save_failed", "İşlem başarısız"),
    );
  } finally {
    pwSaving.value = false;
  }
}

async function onLogout() {
  menuOpen.value = false;
  await auth.logout();
}

// Canlı saat (dd.mm.yyyy HH:mm:ss)
const now = ref(new Date());
let timer;
const clock = computed(() => formatDateTime(now.value, "-", true));
onMounted(() => {
  if (!settingsStore.settings) settingsStore.fetch().catch(() => {});
  if (!auth.isInitialized) auth.fetchMe().catch(() => {});
  timer = setInterval(() => (now.value = new Date()), 1000);
});
onUnmounted(() => clearInterval(timer));
</script>
