/**
 * useSessionSync — Z-Rapor vardiyasının main senkron durumunun TEK yorumu (pos + restoran ortak).
 *
 * Sunucu (sync.base.pushSession) sonucu `status: "synced" | "queued" | "failed"` döner ve aynı
 * durumu ZReportSession alanlarına yazar. Ekranlar "senkronize mi?" kararını kendileri vermez:
 *   - rozet için sessionSyncStatus(session)  → kayıtlı alanlardan
 *   - bildirim için notifySyncResult(sync)   → kapanış / tekrar gönder yanıtından
 * useI18n / useAppToast Nuxt auto-import'tan gelir (vue-i18n doğrudan import edilmez).
 */

/**
 * Kayıtlı vardiya alanlarından senkron durumu.
 * @returns {"open"|"synced"|"pending"|"failed"}
 *   pending = kapalı, main kuyruğunda veya henüz gönderilmedi (hata yok)
 */
export function sessionSyncStatus(session) {
  if (!session?.closedAt) return "open";
  if (session.isSyncedToMain) return "synced";
  if (session.syncError) return "failed";
  return "pending";
}

/**
 * pushSession / close yanıtının kullanıcıya gösterilecek mesajı.
 * `status` alanı olmayan eski yanıtlar da ok/queued/orderId'den yorumlanır.
 * @returns {{ level: "success"|"info"|"warning", key: string, detail: string }}
 */
export function syncResultMessage(sync) {
  const status = sync?.status ?? (sync?.ok && sync?.queued ? "queued" : sync?.ok ? "synced" : "failed");
  if (status === "synced") return { level: "success", key: "session_closed_synced", detail: "" };
  if (status === "queued") return { level: "info", key: "session_sync_queued", detail: "" };
  return { level: "warning", key: "session_closed_not_synced", detail: sync?.error ? String(sync.error) : "" };
}

export const useSessionSync = () => {
  const { t } = useI18n();
  const toast = useAppToast();

  /** Senkron sonucunu doğru seviyede bildirir (başarı / kuyrukta / hata). */
  function notifySyncResult(sync) {
    const { level, key, detail } = syncResultMessage(sync);
    toast[level](detail ? `${t(key)}: ${detail}` : t(key));
  }

  return { sessionSyncStatus, notifySyncResult };
};
