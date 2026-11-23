<template>
  <span :class="['badge-base', badgeClass, badgeSizeClass]">
    <i v-if="icon" :class="[icon, value ? 'mr-1.5' : '']"/>
    <slot>{{ value }}</slot>
  </span>
</template>

<script setup>
// FieldBadge.vue — Renkli durum etiketi (badge). severity: primary|success|danger|warning|info|secondary. size: xs|sm|md|lg.
import { computed } from "vue";
import { useFieldBadge } from "../../composables/useFormStyles.js";

const props = defineProps({
  value:    { type: [String, Number], default: "" },
  icon:     { type: String, default: "" },
  severity: { type: String, default: "primary" },
  size:     { type: String, default: "md" },
});

// badgeClass + badgeSizeClass — useFieldBadge composable'dan gelir
const { badgeClass, badgeSizeClass } = useFieldBadge(
  computed(() => props.severity),
  computed(() => props.size),
);
</script>
