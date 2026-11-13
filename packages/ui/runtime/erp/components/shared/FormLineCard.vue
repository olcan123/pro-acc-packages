<template>
  <!-- Kalem satırı kartı — mobilde tablo satırının yerini alır.
       Auto-import adı: <SharedFormLineCard /> -->
  <div class="card-panel space-y-2 p-3">
    <!-- Başlık şeridi: sıra no + satır aksiyonları -->
    <div class="flex items-center justify-between">
      <span class="text-2xs text-paper-500 dark:text-paper-400 font-bold tracking-widest"> #{{ index + 1 }} </span>
      <slot name="actions" />
    </div>

    <!-- Alanlar -->
    <slot />

    <!-- Satır özeti (satır değeri, yürüyen bakiye vb.) — kural çizgisiyle ayrılır -->
    <div
      v-if="$slots.summary"
      class="border-paper-300 dark:border-paper-700 flex justify-between border-t pt-2 text-sm"
    >
      <slot name="summary" />
    </div>
  </div>
</template>

<script setup>
// FormLineCard.vue — Kalem/satır formlarının mobil kart iskeleti.
//
// NEDEN AYRI BİLEŞEN:
// Mobil "fiş kartı" düzeni iki yerde birebir tekrarlanıyordu
// (InvoiceForm/line.vue ve JournalEntryForm/line.vue): aynı kart kabuğu, aynı
// sıra-no + sil şeridi, aynı özet satırı. Kabuk buraya alındı; tüketiciler
// yalnız KENDİ alanlarını yazar. Yeni bir kalem formu eklendiğinde düzen
// kopyalanmaz, bu bileşen kullanılır.
//
// Tailwind önerisi de bu yönde: tekrar eden markup'ı `@apply` ile yeni bir CSS
// sınıfına sarmak yerine BİLEŞENE çıkar — sınıf listesi tek yerde kalır ve
// yapı da (slot'lar) paylaşılır.
defineProps({
  /** 0 tabanlı satır dizini — kartta 1 tabanlı gösterilir */
  index: { type: Number, required: true },
});
</script>
