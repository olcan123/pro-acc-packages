<!-- eslint-disable no-unused-vars, vue/require-default-prop -->
<!-- eslint-disable no-unused-vars, vue/require-default-prop -->
<template>
  <div class="flex items-center flex-nowrap gap-3">
    <FieldTextInput
      v-if="searchPlaceholder"
      :model-value="searchTerm"
      :placeholder="searchPlaceholder"
      size="normal"
      class="w-48 sm:w-64"
      @update:model-value="$emit('update:searchTerm', $event)"
    />

    <FieldButton
      v-if="showBackButton"
      variant="secondary"
      icon="pi pi-arrow-left"
      class="hidden sm:inline-flex"
      :label="$t('go_back') || 'Geri Dön'"
      @click="$router.back()"
    />

    <slot name="action" />

    <template v-if="!hasSlotContent">
      <!-- DİKKAT: sarmalayıcıda overflow-hidden KULLANMA — FieldDropdown menüsü bu
           kapsayıcının içinde absolute açılır, overflow-hidden menüyü kırpıp görünmez yapar.
           Köşe yuvarlama butonların kendisinde (rounded-r-none / rounded-l-none). -->
      <div v-if="buttonText && items && items.length > 0" class="flex items-center -space-x-px shadow-sm rounded-lg border border-blue-500/20">
        <FieldButton
          :label="buttonText"
          :icon="buttonIcon || 'pi pi-plus'"
          variant="primary"
          :shadow="false"
          :type="buttonType"
          :form="formId"
          class="rounded-r-none border-r border-white/20 h-[42px]"
          @click="$emit('click')"
        />
        <FieldDropdown
          :items="items"
          :shadow="false"
          custom-class="rounded-l-none h-[42px]"
        >
          <template #trigger>
            <div class="px-1 flex items-center justify-center">
              <i class="pi pi-chevron-down text-xs transition-transform"/>
            </div>
          </template>
        </FieldDropdown>
      </div>

      <template v-else-if="items && items.length > 0">
        <FieldDropdown v-if="forceDropdown || items.length > 1" :items="items" />
        <template v-else>
          <FieldButton
            v-for="(item, index) in items"
            :key="index"
            :label="item.label"
            :icon="item.icon"
            :variant="item.severity === 'secondary' ? 'secondary' : 'primary'"
            :disabled="item.disabled"
            @click="handleClick(item)"
          />
        </template>
      </template>

      <FieldButton
        v-else-if="buttonText"
        :type="buttonType"
        :form="formId"
        :label="buttonText"
        :icon="buttonIcon"
        @click="$emit('click')"
      />
    </template>
  </div>
</template>

<script setup>
// FieldHeaderActions.vue — Sayfa başlığı eylem butonları: birden fazla aksiyon için dropdown veya düz buton.
import { useSlots, computed } from "vue";
import { uiNavigate } from "../../config.ts";
import FieldButton from "./FieldButton.vue";
import FieldDropdown from "./FieldDropdown.vue";
import FieldTextInput from "./FieldTextInput.vue";

const props = defineProps({
  showBackButton:    { type: Boolean },
  items:             { type: Array,  default: () => [] },
  buttonText:        { type: String },
  buttonIcon:        { type: String },
  buttonType:        { type: String, default: "submit" },
  formId:            { type: String },
  searchTerm:        { type: String },
  searchPlaceholder: { type: String },
  forceDropdown:     { type: Boolean },
});

const emit = defineEmits(["click", "update:searchTerm"]);

const slots = useSlots();
const hasSlotContent = computed(() => !!slots.action);

const handleClick = (item) => {
  if (item.action) item.action();
  else if (item.to) uiNavigate(item.to);
};
</script>
