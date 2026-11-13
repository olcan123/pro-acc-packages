<!-- pages/sessions/index.vue — Z-Rapor vardiyaları: aç/kapat (Z no giriş modalı ile), geçmiş ve main senkron durumu. -->
<template>
  <div class="max-w-4xl mx-auto flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-paper-900 dark:text-paper-100">
        <i class="pi pi-receipt mr-2" />{{ $t("sessions") }}
      </h1>
      <NuxtLink to="/" class="btn-base btn-secondary btn-size-sm rounded-lg">
        <i class="pi pi-arrow-left mr-1" />{{ $t("back") }}
      </NuxtLink>
    </div>

    <!-- Açık vardiya -->
    <section class="card-panel p-5 flex items-center justify-between">
      <div>
        <div class="pos-total-label">{{ $t("z_report") }}</div>
        <div v-if="sessionStore.isOpen" class="text-lg font-bold text-emerald-600">
          {{ $t("session_open") }} · {{ $t("z_report_no") }} {{ sessionStore.current.zReportNo }}
        </div>
        <div v-else class="text-lg font-bold text-paper-500 dark:text-paper-400">{{ $t("no_open_session") }}</div>
      </div>
      <div class="flex gap-2">
        <button v-if="!sessionStore.isOpen" class="btn-base btn-primary btn-size-md rounded-lg" @click="openSession">
          <i class="pi pi-play mr-2" />{{ $t("open_session") }}
        </button>
        <button v-else class="btn-base btn-warning btn-size-md rounded-lg" @click="showCloseModal = true">
          <i class="pi pi-flag-fill mr-2" />{{ $t("close_session_btn") }}
        </button>
      </div>
    </section>

    <!-- Geçmiş -->
    <section class="card-panel overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-paper-100 dark:bg-paper-800/60 text-paper-600 dark:text-paper-400">
          <tr>
            <th class="text-left px-4 py-2">{{ $t("z_report_no") }}</th>
            <th class="text-left px-4 py-2">{{ $t("opened_at") }}</th>
            <th class="text-left px-4 py-2">{{ $t("closed_at") }}</th>
            <th class="text-right px-4 py-2">{{ $t("turnover") }}</th>
            <th class="text-center px-4 py-2">{{ $t("synced") }}</th>
            <th class="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sessions" :key="s.id" class="border-t border-paper-300 dark:border-paper-800">
            <td class="px-4 py-2 font-semibold">{{ s.zReportNo }}</td>
            <td class="px-4 py-2 text-paper-600 dark:text-paper-400">{{ fmtDate(s.openedAt) }}</td>
            <td class="px-4 py-2 text-paper-600 dark:text-paper-400">{{ s.closedAt ? fmtDate(s.closedAt) : "—" }}</td>
            <td class="px-4 py-2 text-right tabular-nums font-medium">{{ fmtCur(s.totalAmount) }}</td>
            <td class="px-4 py-2 text-center">
              <span v-if="sessionSyncStatus(s) === 'synced'" class="badge-base badge-success badge-size-sm">{{
                $t("synced")
              }}</span>
              <span v-else-if="sessionSyncStatus(s) === 'pending'" class="badge-base badge-warning badge-size-sm">{{
                $t("sync_pending")
              }}</span>
              <span
                v-else-if="sessionSyncStatus(s) === 'failed'"
                class="badge-base badge-danger badge-size-sm"
                :title="s.syncError || ''"
                >{{ $t("not_synced") }}</span
              >
              <span v-else class="badge-base badge-secondary badge-size-sm">{{ $t("session_open") }}</span>
            </td>
            <td class="px-4 py-2 text-right">
              <button v-if="s.closedAt && !s.isSyncedToMain" class="list-btn-sync" @click="resync(s.id)">
                <i class="pi pi-sync mr-1" />{{ $t("resync") }}
              </button>
            </td>
          </tr>
          <tr v-if="!sessions.length">
            <td colspan="6" class="px-4 py-10 text-center text-paper-500 dark:text-paper-400">—</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>

  <!-- Z-Rapor Kapatma Modalı -->
  <SharedModal
    v-model:visible="showCloseModal"
    :header="$t('close_session_btn')"
    max-width="440px"
    :close-on-backdrop="false"
  >
    <div class="flex flex-col gap-4">
      <!-- Bilgi kutusu -->
      <div
        class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300"
      >
        <i class="pi pi-info-circle mr-1.5" />
        {{ $t("z_report_close_hint") }}
      </div>

      <!-- Z-Rapor No input -->
      <div>
        <label class="field-label field-label-default" for="zReportNoInput">
          {{ $t("z_report_no") }}
        </label>
        <input
          id="zReportNoInput"
          v-model.number="zReportNoInput"
          type="number"
          min="1"
          class="field-input-base field-input-default field-size-md"
          :placeholder="$t('z_report_no_placeholder')"
          @keydown.enter="confirmClose"
        />
        <p v-if="zReportNoError" class="field-error-msg">{{ zReportNoError }}</p>
      </div>
      <!-- Kasa sayımı (isteğe bağlı): fark main'e fark fişi olarak gider -->
      <PosCashCountPanel v-model="cashCount" :cash-sales="sessionStore.current?.totalCash ?? 0" />
    </div>

    <template #footer>
      <button class="btn-base btn-secondary btn-size-sm rounded-lg" @click="cancelClose">
        <i class="pi pi-times mr-1" />{{ $t("cancel") }}
      </button>
      <button
        class="btn-base btn-warning btn-size-sm rounded-lg"
        :disabled="sessionStore.loading"
        @click="confirmClose"
      >
        <i v-if="sessionStore.loading" class="pi pi-spin pi-spinner mr-1" />
        <i v-else class="pi pi-flag-fill mr-1" />
        {{ $t("close_and_sync") }}
      </button>
    </template>
  </SharedModal>
</template>

<script setup>
import { formatDateTime as displayDateTime } from "@pro-acc/ui/utils/date";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useSessionSync } from "@pro-acc/ui/pos/composables/useSessionSync.js";
import { emptyCashCount, cashCountPayload } from "@pro-acc/ui/pos/composables/useCashCount.js";

const { t } = useI18n();
const toast = useAppToast();
const { sessionSyncStatus, notifySyncResult } = useSessionSync();
const { $api } = useNuxtApp();
const sessionStore = useSessionStore();
const { formatCurrency } = useCurrency();

const sessions = ref([]);
const fmtCur = (n) => formatCurrency(n);
const fmtDate = (value) => displayDateTime(value, "—");

async function refresh() {
  sessions.value = await $api.session.list().catch(() => []);
  await sessionStore.fetchCurrent().catch(() => {});
}
onMounted(refresh);

async function openSession() {
  await sessionStore.open();
  toast.success(t("session_opened"));
  await refresh();
}

// Z-Rapor kapatma modalı
const showCloseModal = ref(false);
const zReportNoInput = ref(null);
// Vardiya kapanışı kasa sayımı formu (boş bırakılırsa sayım gönderilmez)
const cashCount = ref(emptyCashCount());
const zReportNoError = ref("");

function cancelClose() {
  showCloseModal.value = false;
  zReportNoInput.value = null;
  zReportNoError.value = "";
}

async function confirmClose() {
  // Validasyon
  if (!zReportNoInput.value || zReportNoInput.value < 1) {
    zReportNoError.value = t("z_report_no_required");
    return;
  }
  zReportNoError.value = "";

  showCloseModal.value = false;
  const res = await sessionStore.close(zReportNoInput.value, cashCountPayload(cashCount.value));
  zReportNoInput.value = null;
  cashCount.value = emptyCashCount();

  notifySyncResult(res?.sync);
  await refresh();
}

async function resync(id) {
  const res = await $api.sync.pushSession(id);
  notifySyncResult(res);
  await refresh();
}
</script>
