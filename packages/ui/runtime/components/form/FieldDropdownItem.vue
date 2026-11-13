<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->
<template>
  <li
    class="relative list-none"
    :class="[isHovered ? 'z-[100]' : 'z-auto']"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Action Button / Link -->
    <button
      v-if="!item.separator"
      type="button"
      class="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
      :class="[isHovered ? 'bg-gray-100/90 text-gray-900 dark:bg-gray-800/90 dark:text-white' : '']"
      @click="handleItemClick(item)"
    >
      <div class="flex items-center gap-3">
        <i
          v-if="item.icon"
          :class="[item.icon, isHovered ? 'text-blue-600' : 'text-gray-400', 'transition-colors']"
        />
        <span>{{ item.label }}</span>
      </div>

      <!-- Submenu Indicator -->
      <i v-if="item.items && item.items.length > 0" class="pi pi-chevron-right text-2xs text-gray-400"/>
    </button>

    <!-- Separator -->
    <div v-else class="my-1 border-t border-gray-100 dark:border-gray-800 mx-2"/>

    <!-- Recursive Submenu -->
    <div
      v-if="item.items && item.items.length > 0 && isHovered"
      :key="`submenu-${item.label}`"
      class="absolute right-[calc(100%+0.25rem)] top-[-0.25rem] z-[120] min-w-[13rem] overflow-visible rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
    >
      <ul class="py-1 text-sm text-gray-700 dark:text-gray-300">
        <FieldDropdownItem
          v-for="(subItem, idx) in item.items"
          :key="`${item.label}-sub-${idx}`"
          :item="subItem"
          @item-click="$emit('item-click', $event)"
        />
      </ul>
    </div>
  </li>
</template>

<script setup>
// FieldDropdownItem.vue — Dropdown menü öğesi: ikon + etiket + tıklama event'i.
import { navigateTo } from "#app";
import { ref } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const isHovered = ref(false);
const emit = defineEmits(["item-click"]);

const localePath = useLocalePath();
const handleItemClick = (item) => {
  if (item.items && item.items.length > 0) {
    // If it has sub-items, we don't trigger the action or close the menu.
    return;
  }

  if (item.action) {
    item.action();
  } else if (item.to) {
    navigateTo(localePath(item.to));
  }

  emit("item-click", item);
};
</script>
