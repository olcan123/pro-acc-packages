<!-- layouts/pos.vue — Tam ekran satış ekranı kabuğu: Topbar + Subbar + içerik. -->
<template>
  <div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden">
    <LayoutPosTopbar />
    <LayoutPosSubbar />
    <div class="flex-1 min-h-0">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Satış ekranı için tam ekran düzen (sidebar yok).
</script>
