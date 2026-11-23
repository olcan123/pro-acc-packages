<template>
  <div class="mt-8 border-t border-surface-200 dark:border-surface-700 pt-6">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
        <i class="pi pi-history text-surface-500" />
        {{ $t("record_history", "Değişiklik Geçmişi") }}
      </h3>
      <FieldButton icon="pi pi-refresh" variant="ghost" size="sm" :shadow="false" :loading="loading" @click="fetchHistory" />
    </div>

    <div v-if="loading && records.length === 0" class="flex justify-center p-4">
      <i class="pi pi-spin pi-spinner text-2xl text-primary" />
    </div>

    <div v-else-if="records.length === 0" class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg text-surface-500">
      {{ $t("no_changes", "Değişiklik bulunamadı") }}
    </div>

    <div v-else class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-200 dark:before:via-surface-700 before:to-transparent">
      <div v-for="(record, index) in records" :key="record.id" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

        <!-- Timeline Icon -->
        <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-0 dark:border-surface-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" :class="iconBgColor(record.action)">
          <i :class="iconClass(record.action)" class="text-white text-sm" />
        </div>

        <!-- Card -->
        <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg shadow-sm bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-surface-900 dark:text-surface-100">{{ actionLabel(record.action) }}</span>
              <FieldBadge v-if="record.source !== 'HTTP'" severity="warning" :value="record.source" size="xs" />
            </div>
            <span class="text-xs text-surface-500">{{ formatDate(record.createdAt) }}</span>
          </div>

          <div class="text-sm text-surface-600 dark:text-surface-400 mb-3 flex items-center gap-1.5">
            <template v-if="record.userId">
              <i class="pi pi-user text-xs" /> {{ record.user?.firstName }} {{ record.user?.lastName }}
            </template>
            <template v-else>
              <i class="pi pi-desktop text-xs" /> {{ $t("system_source", "Sistem") }}
            </template>
          </div>

          <div v-if="record.action === 'UPDATE' && record.changes" class="mt-3">
            <PagesAuditChangeLogDiff :changes="record.changes" />
          </div>
          <div v-else-if="record.action === 'CREATE'" class="mt-3 text-xs text-surface-500 italic">
            İlk oluşturulma
          </div>
          <div v-else-if="record.action === 'DELETE'" class="mt-3 text-xs text-red-500 italic">
            Silinme
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { uiFetch } from "../../../config.ts";
import FieldButton from "../../../components/form/FieldButton.vue";
import FieldBadge from "../../../components/form/FieldBadge.vue";
import { formatDateTime as displayDateTime } from "../../../utils/date.ts";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import PagesAuditChangeLogDiff from "../pages/audit/ChangeLogDiff.vue";

const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  recordId: {
    type: [Number, String],
    required: true,
  },
});

const { t } = useI18n();
const loading = ref(false);
const records = ref([]);

function iconClass(action) {
  if (action === "CREATE") return "pi pi-plus";
  if (action === "UPDATE") return "pi pi-pencil";
  if (action === "DELETE") return "pi pi-trash";
  return "pi pi-info";
}

function iconBgColor(action) {
  if (action === "CREATE") return "bg-green-500";
  if (action === "UPDATE") return "bg-blue-500";
  if (action === "DELETE") return "bg-red-500";
  return "bg-gray-500";
}

function actionLabel(action) {
  if (action === "CREATE") return t("change_action_create");
  if (action === "UPDATE") return t("change_action_update");
  if (action === "DELETE") return t("change_action_delete");
  return action;
}

function formatDate(value) {
  return displayDateTime(value, "");
}

async function fetchHistory() {
  if (!props.model || !props.recordId) return;
  loading.value = true;
  try {
    const res = await uiFetch(`/api/changelog/record?model=${props.model}&recordId=${props.recordId}`);
    records.value = res || [];
  } catch (err) {
    console.error("Record history fetch error:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchHistory();
});
</script>
