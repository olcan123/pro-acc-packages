// session.store.js — Z-Rapor vardiyası durumu (açık vardiya + aç/kapat).
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSessionStore = defineStore("session", () => {
  const { $api } = useNuxtApp();

  const current = ref(null);
  const loading = ref(false);

  const isOpen = computed(() => !!current.value && !current.value.closedAt);

  /** Açık vardiyayı yükler. */
  async function fetchCurrent() {
    current.value = await $api.session.current();
    return current.value;
  }

  /** Vardiya açar (varsa mevcut döner). */
  async function open() {
    loading.value = true;
    try {
      current.value = await $api.session.open();
      return current.value;
    } finally {
      loading.value = false;
    }
  }

  /** Vardiya kapatır (+ main senkron); { session, sync } döner. zReportNo: mali cihazdan okunan numara. */
  async function close(zReportNo, cashCount = null) {
    loading.value = true;
    try {
      const res = await $api.session.close(current.value?.id, zReportNo, cashCount);
      current.value = null;
      return res;
    } finally {
      loading.value = false;
    }
  }

  return { current, loading, isOpen, fetchCurrent, open, close };
});
