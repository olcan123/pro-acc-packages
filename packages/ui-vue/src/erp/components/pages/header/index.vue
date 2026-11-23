<!-- eslint-disable no-unused-vars, vue/require-default-prop -->
<!-- eslint-disable no-unused-vars, vue/require-default-prop -->
<template>
  <!-- Sayfa başlığı bileşeni: sol taraf başlık/alt başlık, sağ taraf aksiyon butonları.
       PagesHeaderContent + FieldHeaderActions'ı birleştirir. -->
  <!-- Defter dili: başlığın altında ince kural çizgisi (sayfa "açılışı").
       Mobilde dikey yığılır — başlık ve aksiyonlar dar ekranda yan yana sığmıyordu. -->
  <div
    class="border-paper-300 dark:border-paper-800 mb-5 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
  >
    <!-- Left: Content -->
    <PagesHeaderContent :title="title" :subtitle="subtitle" />

    <!-- Right: Buttons -->
    <FieldHeaderActions
      v-if="showButton"
      :show-back-button="showBackButton"
      :items="items"
      :button-text="buttonText"
      :button-icon="buttonIcon"
      :button-type="buttonType"
      :form-id="formId"
      :search-term="searchTerm"
      :search-placeholder="searchPlaceholder"
      :force-dropdown="forceDropdown"
      @update:search-term="$emit('update:searchTerm', $event)"
      @click="$emit('click')"
    >
      <template v-if="$slots.action" #action>
        <slot name="action" />
      </template>
    </FieldHeaderActions>
  </div>
</template>

<script setup>
// pages/header/index.vue — Sayfa başlığı bileşeni: başlık metni, arama kutusu ve eylem butonu/dropdown.

import { useI18n } from "vue-i18n";
import PagesHeaderContent from "./content.vue";
import FieldHeaderActions from "../../../../components/form/FieldHeaderActions.vue";
const { t } = useI18n();

defineProps({
  title: String,
  subtitle: String,
  buttonText: String,
  buttonIcon: String,
  buttonType: {
    type: String,
    default: "submit",
  },
  items: Array,
  formId: String,
  showBackButton: Boolean,
  showButton: {
    type: Boolean,
    default: true,
  },
  searchTerm: String,
  searchPlaceholder: String,
  forceDropdown: Boolean,
});

defineEmits(["click", "update:searchTerm"]);
</script>
