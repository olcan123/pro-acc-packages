<!-- pages/archive.vue — POS Arşivi: kapalı vardiyalar ve fiş detayları. -->
<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-paper-900 dark:text-paper-100">
        <i class="pi pi-box mr-2 text-indigo-500" />{{ $t("archive") }}
      </h1>
      <NuxtLink to="/" class="btn-base btn-secondary btn-size-sm rounded-lg">
        <i class="pi pi-arrow-left mr-1" />{{ $t("back") }}
      </NuxtLink>
    </div>

    <!-- Yükleniyor -->
    <div v-if="loading" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-3xl text-blue-500" />
    </div>

    <template v-else>
      <!-- Kapanmış vardiya yok -->
      <div v-if="!closedSessions.length" class="card-panel p-10 text-center text-paper-500 dark:text-paper-400">
        <i class="pi pi-inbox text-4xl mb-3 block" />
        <p>{{ $t("no_closed_sessions") }}</p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <!-- Vardiya tablosu -->
        <section class="card-panel overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-paper-100 dark:bg-paper-800/60 text-paper-600 dark:text-paper-400">
              <tr>
                <th class="text-left px-4 py-2">{{ $t("z_report_no") }}</th>
                <th class="text-left px-4 py-2">{{ $t("opened_at") }}</th>
                <th class="text-left px-4 py-2">{{ $t("closed_at") }}</th>
                <th class="text-right px-4 py-2">{{ $t("turnover") }}</th>
                <th class="text-right px-4 py-2">{{ $t("total_cash") }}</th>
                <th class="text-right px-4 py-2">{{ $t("total_card") }}</th>
                <th class="text-center px-4 py-2">{{ $t("synced") }}</th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in closedSessions"
                :key="s.id"
                class="border-t border-paper-300 dark:border-paper-800 cursor-pointer transition-colors"
                :class="
                  selectedSession?.id === s.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                "
                @click="selectSession(s)"
              >
                <td class="px-4 py-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  <i class="pi pi-receipt mr-1 text-xs" />{{ s.zReportNo }}
                </td>
                <td class="px-4 py-2 text-paper-600 dark:text-paper-400">{{ fmtDate(s.openedAt) }}</td>
                <td class="px-4 py-2 text-paper-600 dark:text-paper-400">{{ fmtDate(s.closedAt) }}</td>
                <td class="px-4 py-2 text-right tabular-nums font-semibold">{{ fmtCur(s.totalAmount) }}</td>
                <td class="px-4 py-2 text-right tabular-nums text-green-700 dark:text-green-400">
                  {{ fmtCur(s.totalCash) }}
                </td>
                <td class="px-4 py-2 text-right tabular-nums text-blue-600 dark:text-blue-400">
                  {{ fmtCur(s.totalCard) }}
                </td>
                <td class="px-4 py-2 text-center" @click.stop>
                  <span v-if="sessionSyncStatus(s) === 'synced'" class="badge-base badge-success badge-size-sm">{{
                    $t("synced")
                  }}</span>
                  <span v-else class="flex items-center justify-center gap-1.5">
                    <span v-if="sessionSyncStatus(s) === 'pending'" class="badge-base badge-warning badge-size-sm">{{
                      $t("sync_pending")
                    }}</span>
                    <span v-else class="badge-base badge-danger badge-size-sm" :title="s.syncError || ''">{{
                      $t("not_synced")
                    }}</span>
                    <button
                      class="btn-base btn-secondary btn-size-xs rounded-md flex items-center gap-1"
                      :disabled="resyncingId === s.id"
                      @click.stop="resyncSession(s)"
                    >
                      <i :class="resyncingId === s.id ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-xs" />
                      {{ $t("resync") }}
                    </button>
                  </span>
                </td>
                <td class="px-4 py-2 text-center text-xs text-indigo-500">
                  <i class="pi pi-chevron-right" />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Seçili vardiya — fiş detayları -->
        <section v-if="selectedSession" class="card-panel overflow-hidden">
          <!-- Başlık -->
          <div class="flex items-center justify-between px-5 py-3 bg-indigo-600 text-white">
            <div class="font-bold">
              <i class="pi pi-receipt mr-2" />
              {{ $t("z_report_no") }} {{ selectedSession.zReportNo }}
              <span class="text-indigo-200 font-normal text-sm ml-2">
                — {{ fmtDate(selectedSession.openedAt) }} → {{ fmtDate(selectedSession.closedAt) }}
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm">
              <span
                >{{ $t("turnover") }}:
                <strong class="tabular-nums">{{ fmtCur(selectedSession.totalAmount) }}</strong></span
              >
              <span
                >{{ $t("total_vat") }}:
                <strong class="tabular-nums">{{ fmtCur(selectedSession.totalVat) }}</strong></span
              >
            </div>
          </div>

          <!-- Yükleniyor -->
          <div v-if="ordersLoading" class="flex justify-center py-10">
            <i class="pi pi-spin pi-spinner text-2xl text-indigo-500" />
          </div>

          <!-- Fişler yok -->
          <div v-else-if="!orders.length" class="px-5 py-10 text-center text-paper-500 dark:text-paper-400">
            {{ $t("no_orders_in_session") }}
          </div>

          <div v-else>
            <!-- Özet -->
            <div
              class="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-700 border-t border-paper-300 dark:border-paper-700"
            >
              <div class="bg-paper-50 dark:bg-paper-800 px-5 py-3 text-center">
                <div class="pos-total-label">{{ $t("receipt_count") }}</div>
                <div class="text-xl font-bold text-paper-900 dark:text-paper-100">{{ orders.length }}</div>
              </div>
              <div class="bg-paper-50 dark:bg-paper-800 px-5 py-3 text-center">
                <div class="pos-total-label">{{ $t("total_cash") }}</div>
                <div class="text-xl font-bold text-green-600">{{ fmtCur(selectedSession.totalCash) }}</div>
              </div>
              <div class="bg-paper-50 dark:bg-paper-800 px-5 py-3 text-center">
                <div class="pos-total-label">{{ $t("total_card") }}</div>
                <div class="text-xl font-bold text-blue-600">{{ fmtCur(selectedSession.totalCard) }}</div>
              </div>
            </div>

            <!-- Fiş tablosu -->
            <table class="w-full text-sm">
              <thead class="bg-paper-100 dark:bg-paper-800/60 text-paper-600 dark:text-paper-400">
                <tr>
                  <th class="text-left px-4 py-2">{{ $t("receipt_no") }}</th>
                  <th class="text-left px-4 py-2">{{ $t("date") }}</th>
                  <th class="text-right px-4 py-2">{{ $t("col_value") }}</th>
                  <th class="text-right px-4 py-2">KDV</th>
                  <th class="text-center px-4 py-2">{{ $t("payment_method") }}</th>
                  <th class="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                <template v-for="o in orders" :key="o.id">
                  <!-- Fiş satırı -->
                  <tr
                    class="border-t border-paper-300 dark:border-paper-800 cursor-pointer transition-colors"
                    :class="
                      expandedOrderId === o.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    "
                    @click="toggleOrder(o.id)"
                  >
                    <td class="px-4 py-2 font-semibold text-indigo-500">{{ o.orderNo }}</td>
                    <td class="px-4 py-2 text-paper-600 dark:text-paper-400 text-xs">{{ fmtDateTime(o.date) }}</td>
                    <td class="px-4 py-2 text-right tabular-nums font-semibold">{{ fmtCur(o.totalAmount) }}</td>
                    <td class="px-4 py-2 text-right tabular-nums text-paper-600 dark:text-paper-400">
                      {{ fmtCur(o.totalVat) }}
                    </td>
                    <td class="px-4 py-2 text-center">
                      <span
                        v-for="p in o.payments"
                        :key="p.id"
                        class="badge-base badge-size-xs mr-1"
                        :class="p.paymentMethod === 'CASH' ? 'badge-success' : 'badge-info'"
                      >
                        {{ p.paymentMethod === "CASH" ? $t("cash") : $t("card") }}
                        {{ fmtCur(p.amount) }}
                      </span>
                    </td>
                    <td class="px-4 py-2 text-center text-xs text-indigo-400">
                      <i :class="expandedOrderId === o.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                    </td>
                  </tr>

                  <!-- Kalem detayları -->
                  <tr v-if="expandedOrderId === o.id">
                    <td colspan="6" class="px-0 py-0 bg-indigo-50/50 dark:bg-indigo-950/10">
                      <table class="w-full text-xs">
                        <thead class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                          <tr>
                            <th class="text-left px-8 py-1.5">{{ $t("col_code") }}</th>
                            <th class="text-left px-4 py-1.5">{{ $t("col_description") }}</th>
                            <th class="text-right px-4 py-1.5">{{ $t("col_qty") }}</th>
                            <th class="text-right px-4 py-1.5">{{ $t("col_price") }}</th>
                            <th class="text-right px-4 py-1.5">KDV%</th>
                            <th class="text-right px-4 py-1.5">{{ $t("col_value") }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="item in o.items"
                            :key="item.id"
                            class="border-t border-indigo-100 dark:border-indigo-900/20"
                          >
                            <td class="px-8 py-1.5 font-mono text-paper-600 dark:text-paper-400">
                              {{ item.product?.code ?? "—" }}
                            </td>
                            <td class="px-4 py-1.5 text-paper-700 dark:text-paper-300">
                              {{ item.product?.name ?? "—" }}
                            </td>
                            <td class="px-4 py-1.5 text-right tabular-nums">{{ Number(item.quantity).toFixed(2) }}</td>
                            <td class="px-4 py-1.5 text-right tabular-nums">{{ fmtCur(item.unitPrice) }}</td>
                            <td class="px-4 py-1.5 text-right tabular-nums text-paper-600 dark:text-paper-400">
                              {{ item.vatRate }}%
                            </td>
                            <td class="px-4 py-1.5 text-right tabular-nums font-semibold">
                              {{ fmtCur(item.totalAmount) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
// pages/archive.vue — Kapalı vardiyaların arşivi: fiş ve kalem detayları.
// resyncSession: senkron başarısız vardiyaları main'e yeniden gönderir.
import { formatDateTime as displayDateTime } from "@pro-acc/ui/utils/date";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useSessionSync, syncResultMessage } from "@pro-acc/ui/pos/composables/useSessionSync.js";

const { $api } = useNuxtApp();
const { formatCurrency } = useCurrency();
const { t } = useI18n();
const toast = useAppToast();
const { sessionSyncStatus, notifySyncResult } = useSessionSync();

const loading = ref(true);
const closedSessions = ref([]);
const selectedSession = ref(null);
const orders = ref([]);
const ordersLoading = ref(false);
const expandedOrderId = ref(null);
const resyncingId = ref(null); // Yeniden gönderilen vardiyanın ID'si (spinner için)

const fmtCur = (n) => formatCurrency(n);
const fmtDate = (value) => displayDateTime(value, "—");
const fmtDateTime = (value) => displayDateTime(value, "—", true);

onMounted(async () => {
  try {
    const all = await $api.session.list().catch(() => []);
    closedSessions.value = all.filter((s) => s.closedAt);
  } finally {
    loading.value = false;
  }
});

async function selectSession(session) {
  if (selectedSession.value?.id === session.id) {
    selectedSession.value = null;
    orders.value = [];
    expandedOrderId.value = null;
    return;
  }
  selectedSession.value = session;
  orders.value = [];
  expandedOrderId.value = null;
  ordersLoading.value = true;
  try {
    orders.value = await $api.session.fetchSessionOrders(session.id).catch(() => []);
  } finally {
    ordersLoading.value = false;
  }
}

function toggleOrder(id) {
  expandedOrderId.value = expandedOrderId.value === id ? null : id;
}

/**
 * Senkronize edilemeyen bir vardiyayı main'e yeniden gönderir.
 * Listedeki satır, sunucunun yerelde yazdığı durumla AYNI şekilde güncellenir:
 * synced → senkronize · queued → kuyrukta (hata yok) · failed → hata.
 */
async function resyncSession(session) {
  if (resyncingId.value) return;
  resyncingId.value = session.id;
  try {
    const res = await $api.sync.pushSession(session.id);
    const { level } = syncResultMessage(res);
    const patch =
      level === "success"
        ? { isSyncedToMain: true, syncError: null }
        : level === "info"
          ? { isSyncedToMain: false, syncError: null }
          : { isSyncedToMain: false, syncError: res?.error || "sync_failed" };
    const idx = closedSessions.value.findIndex((s) => s.id === session.id);
    if (idx !== -1) closedSessions.value[idx] = { ...closedSessions.value[idx], ...patch };
    if (selectedSession.value?.id === session.id) {
      selectedSession.value = { ...selectedSession.value, ...patch };
    }
    notifySyncResult(res);
  } catch (e) {
    toast.error(t("session_closed_not_synced"));
  } finally {
    resyncingId.value = null;
  }
}
</script>
