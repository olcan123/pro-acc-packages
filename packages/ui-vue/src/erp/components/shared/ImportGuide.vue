<template>
  <div class="mb-4">
    <!-- Toggle Butonu -->
    <button
      class="flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-blue-700 transition-colors outline-none hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
      @click="show = !show"
    >
      <i class="pi pi-info-circle text-lg" />
      <span class="text-base font-semibold">{{ title || $t("bulk_import_guide_title", "İçe Aktarım Rehberi") }}</span>
      <i :class="['pi ml-auto transition-transform', show ? 'pi-chevron-up' : 'pi-chevron-down']" />
    </button>

    <!-- Detaylı Rehber İçeriği -->
    <div
      v-if="show"
      class="bg-paper-50 mt-2 overflow-x-auto rounded-lg border border-gray-200 p-4 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <p class="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">
        {{
          description ||
          $t(
            "bulk_import_guide_desc",
            "Excel dosyanızdaki sütun başlıkları ve veriler aşağıdaki formata uygun olmalıdır:",
          )
        }}
      </p>

      <table class="w-full min-w-[650px] border-collapse text-left">
        <thead>
          <tr
            class="border-b border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
          >
            <th class="w-[20%] px-3 py-2.5 font-semibold">{{ $t("data_type", "Veri Tipi") }}</th>
            <th class="w-[25%] px-3 py-2.5 font-semibold">{{ $t("ig_accepted_headers") }}</th>
            <th class="w-[15%] px-3 py-2.5 font-semibold">{{ $t("status", "Durum") }}</th>
            <th class="px-3 py-2.5 font-semibold">{{ $t("ig_desc_format") }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-gray-600 dark:divide-gray-700/50 dark:text-gray-400">
          <tr v-for="(col, i) in columns" :key="i" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
            <td class="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{{ col.label }}</td>
            <td class="px-3 py-2.5 font-mono text-xs text-wrap">{{ col.headers }}</td>
            <td
              :class="[
                'px-3 py-2.5 font-medium',
                col.required ? 'text-red-500' : col.statusColor ? col.statusColor : 'text-gray-400',
              ]"
            >
              {{ col.required ? $t("required", "Zorunlu") : col.statusText || $t("optional", "Opsiyonel") }}
            </td>
            <td class="px-3 py-2.5" v-html="col.description" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  title: { type: String, default: null },
  description: { type: String, default: null },
  columns: {
    type: Array,
    required: true,
  },
});

const show = ref(false);
</script>
