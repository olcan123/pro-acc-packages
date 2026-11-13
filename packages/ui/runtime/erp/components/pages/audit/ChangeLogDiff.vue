<template>
  <div class="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden text-sm">
    <table class="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
      <thead class="bg-surface-50 dark:bg-surface-800">
        <tr>
          <th scope="col" class="px-4 py-2.5 text-left font-semibold text-surface-900 dark:text-surface-100 w-1/3">
            {{ $t("field_name") }}
          </th>
          <th scope="col" class="px-4 py-2.5 text-left font-semibold text-surface-900 dark:text-surface-100 w-1/3">
            {{ $t("old_value") }}
          </th>
          <th scope="col" class="px-4 py-2.5 text-left font-semibold text-surface-900 dark:text-surface-100 w-1/3">
            {{ $t("new_value") }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-200 dark:divide-surface-700 bg-surface-0 dark:bg-surface-900">
        <tr v-for="(val, key) in formattedChanges" :key="key" class="hover:bg-surface-50 dark:hover:bg-surface-800/50">
          <td class="px-4 py-2.5 whitespace-nowrap font-medium text-surface-900 dark:text-surface-100">
            {{ key }}
          </td>
          <td class="px-4 py-2.5 bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 break-all">
            <span v-if="val.from === null || val.from === undefined" class="italic text-surface-400 dark:text-surface-500">
              (Boş)
            </span>
            <span v-else>{{ val.from }}</span>
          </td>
          <td class="px-4 py-2.5 bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-400 break-all">
            <span v-if="val.to === null || val.to === undefined" class="italic text-surface-400 dark:text-surface-500">
              (Boş)
            </span>
            <span v-else>{{ val.to }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  changes: {
    type: Object,
    required: true,
  },
});

const formattedChanges = computed(() => {
  if (!props.changes) return {};
  const result = {};
  for (const [key, val] of Object.entries(props.changes)) {
    result[key] = {
      from: formatValue(val.from),
      to: formatValue(val.to),
    };
  }
  return result;
});

function formatValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
}
</script>
