<template>
  <div ref="dropdownRef" class="relative inline-block">
    <FieldButton
      type="button"
      variant="primary"
      size="md"
      :class="customClass"
      :shadow="shadow"
      @click="toggleDropdown"
    >
      <slot name="trigger">
        <span>{{ $t('actions') || 'İşlemler' }}</span>
        <i :class="['pi pi-chevron-down ml-2 transition-transform duration-200', isOpen ? 'rotate-180' : '']"/>
      </slot>
    </FieldButton>

    <transition name="scale-fade">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 z-50 min-w-[12rem] overflow-visible rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-gray-800 dark:bg-gray-900"
      >
        <ul class="py-1.5 px-1.5 text-sm text-gray-700 dark:text-gray-300">
          <FieldDropdownItem
            v-for="(item, index) in items"
            :key="index"
            :item="item"
            @item-click="isOpen = false"
          />
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
// FieldDropdown.vue — Özel dropdown menüsü: FieldButton trigger + özel slot içerikli menü listesi.
import { ref, onMounted, onUnmounted } from "vue";
import FieldButton from "./FieldButton.vue";
import FieldDropdownItem from "./FieldDropdownItem.vue";

defineProps({
  items:       { type: Array,   required: true },
  customClass: { type: String,  default: "" },
  shadow:      { type: Boolean, default: true },
});

const isOpen = ref(false);
const dropdownRef = ref(null);

const toggleDropdown = () => { isOpen.value = !isOpen.value; };

const closeOnClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target))
    isOpen.value = false;
};

onMounted(() => document.addEventListener("click", closeOnClickOutside));
onUnmounted(() => document.removeEventListener("click", closeOnClickOutside));
</script>

<style scoped>
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
