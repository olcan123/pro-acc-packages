<!--
  SharedModal.vue — Genel amaçlı modal/dialog: PrimeVue Dialog yerine kullanılır.
  Tasarım: backdrop + teleport, FieldConfirmDialog ile aynı görsel dil.

  Kullanım:
    <SharedModal v-model:visible="open" :header="$t('import')" max-width="600px">
      <SlotIçeriği />
      <template #footer>...</template>
    </SharedModal>

  Props:
    visible      v-model:visible — modal açık/kapalı
    header       Başlık metni (üst bar)
    maxWidth     Maks. genişlik (CSS değeri); default '700px'
    closeOnEsc   Esc ile kapatma; default true
    closeOnBackdrop  Backdrop tıkınca kapat; default true
    showHeader   Başlık barı göster; default true
    showClose    Üst sağ X butonu göster; default true
    keepMounted  true → v-show ile gizle (DOM'da kalır); iç form alanları değerini korur. default false

  Events:
    @update:visible    — v-model bağı için
    @hide              — modal kapanırken (esc/backdrop/X) tetiklenir
-->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <!-- keepMounted=true → v-if her zaman doğru (DOM'da kalır), görünürlük v-show ile yönetilir;
           böylece iç FieldAutocomplete (vee-validate) modal kapanınca değer kaybetmez.
           keepMounted=false (varsayılan) → v-if ile aç/kapan (kapanınca unmount). -->
      <div
        v-if="keepMounted || visible"
        v-show="visible"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="onBackdropClick"
      >
        <div
          class="bg-paper-50 max-h-modal-max w-full overflow-y-auto rounded-2xl border border-gray-200 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          :style="{ maxWidth }"
          @click.stop
        >
          <!-- Başlık -->
          <div
            v-if="showHeader"
            class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800"
          >
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              <slot name="header">{{ header }}</slot>
            </h3>
            <button
              v-if="showClose"
              type="button"
              class="text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
              :aria-label="$t('close')"
              @click="close"
            >
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- İçerik -->
          <div class="px-6 py-4">
            <slot />
          </div>

          <!-- Footer (opsiyonel) -->
          <div
            v-if="$slots.footer"
            class="flex justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  header: { type: String, default: "" },
  maxWidth: { type: String, default: "700px" },
  closeOnEsc: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  // keepMounted: true → modal v-show ile gizlenir (DOM'da kalır). İç FieldAutocomplete
  // (vee-validate) gibi alanlar modal kapanınca değerini korur. Varsayılan: v-if (unmount).
  keepMounted: { type: Boolean, default: false },
});

const emit = defineEmits(["update:visible", "hide"]);

const close = () => {
  emit("update:visible", false);
  emit("hide");
};

const onBackdropClick = () => {
  if (props.closeOnBackdrop) close();
};

// Esc ile kapatma
const onKeydown = (e) => {
  if (e.key === "Escape" && props.visible && props.closeOnEsc) close();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

// Modal açıkken body scroll'unu kilitle (kullanıcı arkayı yanlışlıkla kaydırmasın)
watch(
  () => props.visible,
  (open) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
  },
);
</script>
