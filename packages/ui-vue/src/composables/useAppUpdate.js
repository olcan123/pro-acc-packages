// useAppUpdate.js — Yeni sürüm bildirimi: açılışta bir kez "güncelleyelim mi?" sorar, reddedilince navbar rozeti gösterir.
//
// Modül seviyesinde (singleton) state — useTailwindConfirm ile aynı desen. State YALNIZ
// istemcide (bileşenin onMounted'ında) değişir; SSR'de dokunulmaz → istekler arası sızıntı olmaz.
// "Her açılışta sor": soru tarayıcı OTURUMU başına bir kez sorulur (sessionStorage);
// program yeniden açıldığında güncelleme hâlâ yapılmadıysa yine sorulur.
// Soru yalnız güncellemeyi YAPABİLECEK kullanıcıya sorulur (ask=true); diğerleri yalnız rozeti görür.
import { uiFetch } from "../config.ts";
import { ref, computed } from "vue";

export const UPDATE_ASKED_KEY = "proacc-update-asked";

const info = ref(null);
const dialogOpen = ref(false);
let pending = null;

function wasAskedThisSession(version) {
  try {
    return sessionStorage.getItem(UPDATE_ASKED_KEY) === version;
  } catch {
    return false;
  }
}

function markAsked(version) {
  try {
    sessionStorage.setItem(UPDATE_ASKED_KEY, version);
  } catch {
    // Gizli mod vb. — soru bu oturumda tekrar sorulabilir, sorun değil
  }
}

/** Yeni sürüm varsa, kullanıcı yetkiliyse (ask) ve bu oturumda sorulmadıysa diyaloğu açar. */
function maybeAsk(ask) {
  const result = info.value;
  if (!ask || !result?.updateAvailable || wasAskedThisSession(result.latestVersion)) return;
  markAsked(result.latestVersion);
  dialogOpen.value = true;
}

/** Sunucudan güncelleme bilgisini bir kez alır (sonuç önbellekte tutulur). */
async function check() {
  if (info.value) return info.value;
  if (!pending) {
    pending = uiFetch("/api/system/update-check")
      .catch(() => ({ updateAvailable: false }))
      .then((result) => {
        info.value = result;
        return result;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useAppUpdate() {
  return {
    info,
    dialogOpen,
    updateAvailable: computed(() => !!info.value?.updateAvailable),
    currentVersion: computed(() => info.value?.currentVersion ?? ""),
    latestVersion: computed(() => info.value?.latestVersion ?? ""),
    check,
    maybeAsk,
    openDialog: () => (dialogOpen.value = true),
    closeDialog: () => (dialogOpen.value = false),
    /** Testler için state'i sıfırlar. */
    reset: () => {
      info.value = null;
      dialogOpen.value = false;
      pending = null;
    },
  };
}
