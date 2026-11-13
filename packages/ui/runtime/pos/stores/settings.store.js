// settings.store.js — PosSettings (cihaz + Main bağlantı) durumu.
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const { $api } = useNuxtApp();

  const settings = ref(null);
  const loading = ref(false);

  /** DEFAULT ayarları yükler. */
  async function fetch() {
    loading.value = true;
    try {
      settings.value = await $api.settings.fetch();
      return settings.value;
    } finally {
      loading.value = false;
    }
  }

  /** Ayarları kaydeder. */
  async function save(data) {
    loading.value = true;
    try {
      settings.value = await $api.settings.save(data);
      return settings.value;
    } finally {
      loading.value = false;
    }
  }

  return { settings, loading, fetch, save };
});
