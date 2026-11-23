// vitest.config.ts — @pro-acc/ui-vue testleri: happy-dom + düz Vue eklentisi (Nuxt YOK, otomatik import YOK).
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
  },
});
