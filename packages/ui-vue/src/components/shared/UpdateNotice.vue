<!-- UpdateNotice.vue — Navbar'daki "Yeni Versiyon var" rozeti + açılıştaki "güncelleyelim mi?" diyaloğu (main + pos + restoran). -->
<template>
  <!-- Yalnız istemcide (Nuxt SSR'da hidrasyon farkı olmasın diye ClientOnly yerine mounted bayrağı). -->
  <div v-if="mounted" class="contents">
    <button
      v-if="updateAvailable && !dialogOpen"
      type="button"
      data-test="update-badge"
      class="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-amber-600"
      :title="$t('update_dialog_title')"
      @click="openDialog"
    >
      <i class="pi pi-cloud-download" />
      <span>{{ $t("new_version_available") }}</span>
    </button>

    <Teleport to="body">
      <div
        v-if="dialogOpen"
        class="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
        @click.self="close"
      >
        <div
          role="dialog"
          aria-modal="true"
          data-test="update-dialog"
          class="w-full max-w-md rounded-lg bg-paper-50 p-6 text-gray-800 shadow-xl dark:bg-paper-900 dark:text-gray-100"
        >
          <h2 class="mb-2 flex items-center gap-2 text-lg font-semibold">
            <i class="pi pi-cloud-download text-amber-500" />
            {{ $t("update_dialog_title") }}
          </h2>
          <p class="mb-4 text-sm">
            {{ $t("update_dialog_message", { latest: latestVersion, current: currentVersion }) }}
          </p>

          <!-- "Evet" → güncelleme adımları (uygulama kendini güncelleyemez; betik sunucuda çalışır) -->
          <div
            v-if="showSteps"
            data-test="update-steps"
            class="mb-4 rounded-sm bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
          >
            <p class="mb-2 font-semibold">{{ $t("update_steps_title") }}</p>
            <ol class="list-decimal space-y-1 pl-5">
              <li>{{ $t("update_step_1") }}</li>
              <li>{{ $t("update_step_2") }}</li>
              <li>{{ $t("update_step_3") }}</li>
            </ol>
          </div>

          <div class="flex justify-end gap-2">
            <FieldButton
              variant="ghost"
              data-test="update-later"
              :label="$t(showSteps ? 'update_close' : 'update_later')"
              @click="close"
            />
            <FieldButton
              v-if="!showSteps"
              variant="primary"
              icon="pi pi-check"
              data-test="update-yes"
              :label="$t('update_yes')"
              @click="showSteps = true"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
// Sunucu render'ında çizilmez (ClientOnly karşılığı).
const mounted = ref(false);
onMounted(() => (mounted.value = true));
import { useAppUpdate } from "../../composables/useAppUpdate.js";
import FieldButton from "../form/FieldButton.vue";

const props = defineProps({
  // Açılıştaki "güncelleyelim mi?" sorusu bu kullanıcıya sorulsun mu? (güncellemeyi yapabilecek kişi).
  // false → yalnız rozet görünür; rozete tıklayan yine adımları okuyabilir.
  ask: { type: Boolean, default: true },
});

const { dialogOpen, updateAvailable, currentVersion, latestVersion, check, maybeAsk, openDialog, closeDialog } =
  useAppUpdate();
const showSteps = ref(false);

// Kapatınca bir sonraki açılış (rozete tıklama) yine soruyla başlar
function close() {
  showSteps.value = false;
  closeDialog();
}

onMounted(async () => {
  await check();
  maybeAsk(props.ask);
});

// Yetki bilgisi oturum yüklendikten sonra gelebilir → sonradan true olursa yine sor
watch(
  () => props.ask,
  (ask) => maybeAsk(ask),
);
</script>
