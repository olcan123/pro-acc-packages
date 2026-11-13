<!-- pos/Modal.vue — POS ödeme/işlem modallarının ortak kabuğu: mavi başlık bandı + backdrop + geçiş.
     PaymentModal ve CardPaymentModal bu kabuğu kullanır; gövde ve footer slot ile verilir. -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="onBackdrop"
      >
        <div class="w-full rounded-2xl bg-paper-50 dark:bg-paper-900 shadow-2xl overflow-hidden" :class="maxWidthClass">
          <!-- Başlık (mavi bant): kısayol rozeti + ikon + başlık -->
          <div class="bg-blue-700 text-white px-5 py-3 flex items-center gap-2 font-bold">
            <span v-if="kbd" class="text-xs bg-blue-900/60 rounded px-1.5 py-0.5">{{ kbd }}</span>
            <i v-if="icon" :class="icon" />
            {{ title }}
          </div>

          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// pos/Modal.vue — Ödeme/işlem modalları için ortak kabuk (PaymentModal, CardPaymentModal).
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: "" },
  kbd: { type: String, default: "" },           // başlıktaki kısayol rozeti (F5, F11 ...)
  icon: { type: String, default: "" },           // PrimeIcons sınıfı (pi pi-wallet ...)
  maxWidthClass: { type: String, default: "max-w-md" },
  closeOnBackdrop: { type: Boolean, default: true },
});
const emit = defineEmits(["update:visible"]);

function onBackdrop() {
  if (props.closeOnBackdrop) emit("update:visible", false);
}
</script>
