<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="reject"
      >
        <div class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-4 mb-5">
            <div
              v-if="options?.icon"
              :class="[
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                options.icon.includes('pi-exclamation') || options.icon.includes('pi-trash')
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              ]"
            >
              <i :class="[options.icon, 'text-2xl']"/>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ options?.header || $t('confirmation') }}
            </h3>
          </div>

          <div class="mb-8">
            <p class="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ options?.message }}
            </p>
          </div>

          <div class="flex justify-end gap-3">
            <FieldButton
              :label="options?.rejectLabel || $t('cancel') || 'İptal'"
              variant="secondary"
              size="md"
              @click="reject"
            />
            <FieldButton
              :label="options?.acceptLabel || $t('confirm') || 'Onayla'"
              :variant="options?.acceptClass?.includes('danger') ? 'danger' : 'primary'"
              size="md"
              @click="accept"
            />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
// FieldConfirmDialog.vue — Tailwind tabanlı özel onay dialog'u. useTailwindConfirm composable'ı ile kontrol edilir.
import { useTailwindConfirm } from "../../composables/useTailwindConfirm.ts";
import FieldButton from "./FieldButton.vue";

// Arka plana tıklama (backdrop) `close` DEĞİL `reject` çağırır: "diyaloğu kapatmak"
// kullanıcı açısından "iptal"dir ve çağıranın reject callback'i çalışmalıdır.
// Öncesinde close() kullanılıyordu → reject HİÇ tetiklenmiyordu; Promise ile
// sarmalanmış onaylarda (ör. fiş kaydetme döngüsü) söz hiç çözülmüyor ve akış
// sessizce KİLİTLENİYORDU. useTailwindConfirm'in kendi dokümanı da reject'in
// "diyalog dışına tıklandığında" çağrılacağını söylüyordu.
const { isVisible, options, accept, reject } = useTailwindConfirm();
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
