// terminal.store.js — Banka/POS terminalleri (Kart ödeme seçimi için).
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useTerminalStore = defineStore("terminal", () => {
  const { $api } = useNuxtApp();

  const terminals = ref([]);

  const active = computed(() => terminals.value.filter((t) => t.isActive));

  async function fetch() {
    terminals.value = await $api.bankTerminal.fetchTerminals();
    return terminals.value;
  }

  return { terminals, active, fetch };
});
