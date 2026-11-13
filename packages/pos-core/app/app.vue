<!-- app.vue — POS/Restoran ortak kök bileşen (pos-core layer): NuxtLayout + NuxtPage + global onay diyaloğu.
     Uygulama adı app.config.ts → appTitle ile belirlenir (pos: "Pro-Acc POS", restoran: "Pro-Acc Restoran"). -->
<template>
  <NuxtLayout>
    <NuxtPage />
    <!-- @pro-acc/pos-ui katmanından auto-import (FormFieldXxx) -->
    <FormFieldConfirmDialog />
  </NuxtLayout>
</template>

<script setup>
const appConfig = useAppConfig();
const appTitle = appConfig.appTitle || "Pro-Acc POS";
useHead({
  titleTemplate: (title) => (title ? `${title} | ${appTitle}` : appTitle),
});

// Dev modda eski PWA service worker'larını otomatik sil.
// Tarayıcıda kalan workbox SW'lar Vite HMR ile çakışıp "Failed to fetch dynamically
// imported module" hatasına yol açar. Production'da SW Nuxt PWA modülü tarafından
// doğru şekilde yönetildiğinden buradaki kod çalışmaz.
if (import.meta.client && import.meta.dev) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
}
</script>
