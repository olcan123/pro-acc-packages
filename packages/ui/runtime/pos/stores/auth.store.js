// auth.store.js — POS oturum durumu. Kullanıcılar main'den senkronlanır; giriş offline çalışır.
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // ---- State ----
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // ---- Getters ----
  const isAuthenticated = computed(() => !!user.value);
  const userName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}`.trim() : "",
  );
  // Üst barda gösterim: "13-MELDA" yerine "<id>-<AD>"
  const userTag = computed(() =>
    user.value ? `${user.value.userId}-${(user.value.firstName || "").toUpperCase()}` : "",
  );

  // ---- Actions ----

  // Oturumu çerezden doğrular (yalnız bir kez).
  async function fetchMe() {
    if (isInitialized.value) return user.value;
    loading.value = true;
    try {
      const { $api } = useNuxtApp();
      const data = await $api.auth.me();
      user.value = data.user;
    } catch {
      user.value = null; // 401 → oturum yok, normal
    } finally {
      isInitialized.value = true;
      loading.value = false;
    }
    return user.value;
  }

  // E-posta + şifre ile giriş.
  async function login(credentials) {
    loading.value = true;
    error.value = null;
    try {
      const { $api } = useNuxtApp();
      const data = await $api.auth.login(credentials);
      user.value = data.user;
      isInitialized.value = true;
      return data;
    } catch (e) {
      error.value = e?.data?.statusMessage || e?.message || "login_failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Çıkış: çerezi sil, login'e dön.
  async function logout() {
    try {
      const { $api } = useNuxtApp();
      await $api.auth.logout();
    } catch {
      // yoksay — kullanıcı her koşulda çıkarılır
    }
    user.value = null;
    await navigateTo("/login");
  }

  // Şifre değiştir (main'e proxy; online gerektirir).
  async function changePassword(data) {
    const { $api } = useNuxtApp();
    return $api.auth.changePassword(data);
  }

  return {
    user, loading, error, isInitialized,
    isAuthenticated, userName, userTag,
    fetchMe, login, logout, changePassword,
  };
});
