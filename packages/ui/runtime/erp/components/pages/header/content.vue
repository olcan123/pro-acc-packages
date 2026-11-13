<template>
  <!-- Sayfa başlığı metin bölümü: büyük başlık + opsiyonel alt başlık. -->
  <!-- Başlık editoryal serif: "Editoryal Defter" kimliğinin taşıyıcısı.
       35 liste/form sayfası bu bileşenden geçer. -->
  <div class="flex min-w-0 flex-col gap-0.5">
    <h1 class="text-paper-950 dark:text-paper-100 truncate font-serif text-2xl font-semibold tracking-tight">
      {{ title }}
    </h1>
    <p v-if="subtitle" class="text-paper-600 dark:text-paper-400 text-sm">
      {{ subtitle }}
    </p>
  </div>
</template>

<script setup>
// pages/header/content.vue — Sayfa başlığı içerik alanı: ikon, başlık ve açıklama.
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
});
</script>
