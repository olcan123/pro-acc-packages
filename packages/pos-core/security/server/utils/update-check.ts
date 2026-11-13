// update-check.ts — Docker Hub'daki en yeni imaj sürümünü çalışan sürümle karşılaştırır (main + pos + restoran ortak).
//
// Uygulama kendini GÜNCELLEMEZ: yalnız "yeni sürüm var" bilgisini döner; güncellemeyi
// kurulum klasöründeki guncelle.bat / guncelle.sh yapar (önce yedek alır).
// İnternet yoksa (POS offline) veya imaj adı tanımlı değilse (dev) sessizce "yok" döner.

export type AppUpdateInfo = {
  enabled: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
};

/** Yalnız sayısal sürüm etiketleri sürüm sayılır (1.0.03, 0.0.2); "latest" vb. elenir. */
const VERSION_TAG = /^\d+(\.\d+)*$/;

/** "1.0.10" > "1.0.9" — parça parça sayısal karşılaştırma (baştaki sıfırlar önemsiz: 03 = 3). */
export function compareAppVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** Docker Hub etiket listesinden en yüksek sayısal sürümü seçer; yoksa null. */
export function pickLatestVersionTag(tags: string[]): string | null {
  const versions = tags.filter((tag) => VERSION_TAG.test(tag));
  if (versions.length === 0) return null;
  return versions.reduce((max, tag) => (compareAppVersions(tag, max) > 0 ? tag : max));
}

/** "ocn315/main" → Docker Hub etiket API adresi. Geçersiz adda null. */
export function dockerHubTagsUrl(image: string): string | null {
  const match = image.trim().match(/^([a-z0-9._-]+)\/([a-z0-9._-]+)$/);
  if (!match) return null;
  return `https://hub.docker.com/v2/repositories/${match[1]}/${match[2]}/tags?page_size=100`;
}

// Docker Hub'ı her istekte sorgulamamak için önbellek: başarılı sonuç 6 saat, hata 30 dk.
const SUCCESS_TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 60 * 1000;
let cache: { image: string; latest: string | null; expiresAt: number } | null = null;

/** Önbelleği sıfırlar (yalnız testler için). */
export function resetAppUpdateCache() {
  cache = null;
}

/** En yeni sürümü Docker Hub'dan okur (5 sn zaman aşımı); başarısızsa null. */
async function fetchLatestVersion(image: string, fetcher: typeof fetch): Promise<string | null> {
  const url = dockerHubTagsUrl(image);
  if (!url) return null;
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const body = (await response.json()) as { results?: { name?: string }[] };
    return pickLatestVersionTag((body.results ?? []).map((r) => String(r.name ?? "")));
  } catch {
    return null;
  }
}

/**
 * Çalışan sürümü Docker Hub'daki en yeni sürümle karşılaştırır.
 * @param image   Docker Hub imaj adı (ör. "ocn315/main"); boşsa kontrol kapalıdır (dev ortamı).
 * @param current Çalışan uygulamanın sürümü (package.json).
 */
export async function checkForAppUpdate(
  image: string,
  current: string,
  fetcher: typeof fetch = fetch,
  now: number = Date.now(),
): Promise<AppUpdateInfo> {
  if (!image || !current) {
    return { enabled: false, currentVersion: current, latestVersion: null, updateAvailable: false };
  }

  if (!cache || cache.image !== image || cache.expiresAt <= now) {
    const latest = await fetchLatestVersion(image, fetcher);
    cache = { image, latest, expiresAt: now + (latest ? SUCCESS_TTL_MS : FAILURE_TTL_MS) };
  }

  const latestVersion = cache.latest;
  return {
    enabled: true,
    currentVersion: current,
    latestVersion,
    updateAvailable: !!latestVersion && compareAppVersions(latestVersion, current) > 0,
  };
}
