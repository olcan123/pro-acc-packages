<!-- pos/ActionPanel.vue — Sağ aksiyon paneli: sadece Nakit + Kart ödeme (resimdeki sade düzen) + Z-Rapor/Yeni satış. -->
<template>
  <aside class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-2">
    <div class="text-2xs font-bold text-paper-500 dark:text-paper-400 uppercase tracking-widest px-1 pb-2">
      {{ $t("actions") }}
    </div>

    <!-- Ödeme (Karma) -->
    <div class="grid grid-cols-1 gap-2">
      <button class="pos-action-btn pos-action-primary min-h-[120px]" @click="$emit('pay')">
        <span class="pos-action-kbd">F9</span>
        <i class="pi pi-wallet text-3xl" />
        <span class="text-base">{{ $t("payment") }}</span>
      </button>
    </div>

    <div class="flex-1" />

    <!-- Z-Rapor (gün kapat) -->
    <button class="pos-action-btn pos-action-accent mt-2" @click="$emit('close-session')">
      <span class="pos-action-kbd">F10</span>
      <i class="pi pi-flag-fill text-xl" />
      <span>{{ $t("close_session") }}</span>
    </button>

    <!-- Yeni satış -->
    <button class="pos-action-btn pos-action-soft mt-2" @click="$emit('new-sale')">
      <i class="pi pi-plus-circle text-xl" />
      <span>{{ $t("new_sale") }}</span>
    </button>
  </aside>
</template>

<script setup>
// Yalnız ödeme (Karma) + vardiya kontrolleri. Diğer butonlar kaldırıldı.
defineEmits(["pay", "close-session", "new-sale"]);
</script>
