<!-- layout/SyncHealthBadge.vue — Senkron sağlık rozeti: bekleyen vardiya sayısı / son senkron; tıklayınca vardiya listesine gider. -->
<template>
  <ClientOnly>
    <NuxtLink
      to="/sessions"
      class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-colors"
      :class="badgeClass"
      :title="tooltip"
    >
      <span class="relative flex h-2 w-2">
        <span
          v-if="health.pendingCount > 0"
          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"
        />
        <span class="relative inline-flex rounded-full h-2 w-2" :class="dotClass" />
      </span>
      <span v-if="health.pendingCount > 0">{{ health.pendingCount }}</span>
      <i v-else class="pi pi-check text-2xs" />
    </NuxtLink>
  </ClientOnly>
</template>

<script setup>
import { formatDateTime } from "../../../utils/date.ts";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { $api } = useNuxtApp();

const health = ref({ pendingCount: 0, lastError: null, lastSync: null });
let timer;

async function refresh() {
  try {
    health.value = await $api.sync.health();
  } catch {
    /* offline — mevcut değeri koru */
  }
}

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 60_000); // dakikada bir yokla
});
onUnmounted(() => clearInterval(timer));

const dotClass = computed(() =>
  health.value.pendingCount > 0 ? "bg-amber-400" : "bg-emerald-400",
);
const badgeClass = computed(() =>
  health.value.pendingCount > 0
    ? "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
    : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25",
);

const fmt = (value) => formatDateTime(value, "—");

const tooltip = computed(() => {
  const lines = [];
  if (health.value.pendingCount > 0) {
    lines.push(`${t("sync_pending_sessions")}: ${health.value.pendingCount}`);
    if (health.value.lastError) lines.push(`${t("sync_last_error")}: ${health.value.lastError}`);
  } else {
    lines.push(t("sync_up_to_date"));
  }
  lines.push(`${t("sync_last_time")}: ${fmt(health.value.lastSync)}`);
  return lines.join("\n");
});
</script>
