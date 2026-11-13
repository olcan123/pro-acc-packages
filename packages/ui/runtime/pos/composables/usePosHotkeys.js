// usePosHotkeys.js — Kasa kısayolları: F2/F3/F4/F5/F7/F9/F11/F12 + Enter/Escape.
// Kullanım: usePosHotkeys({ F5: () => openCash(), Escape: () => close() })
import { onMounted, onUnmounted } from "vue";

export const usePosHotkeys = (map) => {
  const handler = (e) => {
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn(e);
    }
  };
  onMounted(() => window.addEventListener("keydown", handler));
  onUnmounted(() => window.removeEventListener("keydown", handler));
};
