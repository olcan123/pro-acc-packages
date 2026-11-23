// useAnalyticsReport.js — Analitik rapor sayfalarının ortak durumu: dönem filtresi, veri çekme,
// yükleniyor bayrağı ve sayı biçimleme. 24 rapor sayfasında birebir tekrarlanan bloğu tek yerde toplar.
//
// Tablo düzenli raporlar bunu doğrudan değil, SharedAnalyticsReport bileşeni üzerinden kullanır.
// Özel gövdeli raporlar (ısı haritası, nakit döngüsü kartları) bu composable'ı doğrudan çağırır.

import { uiFetch } from "../../config.ts";
import { ref, watch, onMounted } from "vue";

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Dönem ön ayarından başlangıç/bitiş tarihi üretir ('YYYY-MM-DD').
 * @param {"month"|"ytd"|"last90"|"last30"|null} preset
 * @returns {{from: string|null, to: string|null}}
 */
export function periodRange(preset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  switch (preset) {
    // İçinde bulunulan ay (ayın 1'i → ayın son günü)
    case "month":
      return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}` };
    // Yılbaşından bugüne
    case "ytd":
      return { from: `${y}-01-01`, to: iso(now) };
    case "last90":
      return { from: iso(new Date(y, now.getMonth(), now.getDate() - 90)), to: iso(now) };
    // Takvim bazlı son 3 ay (90 gün değil) — ölü stok gibi "şu kadar aydır hareketsiz" raporları için
    case "last3m":
      return { from: iso(new Date(y, now.getMonth() - 3, now.getDate())), to: iso(now) };
    case "last30":
      return { from: iso(new Date(y, now.getMonth(), now.getDate() - 30)), to: iso(now) };
    default:
      return { from: null, to: null };
  }
}

/**
 * Rapor tablolarının standart sayı biçimi (varsayılan 2 ondalık, binlik ayraçlı).
 * maxDigits verilirse üst sınır ayrı olur (örn. birim fiyatlarda 2–4 ondalık).
 */
export const formatNumber = (n, digits = 2, maxDigits = null) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: maxDigits ?? digits,
  }).format(Number(n) || 0);

/**
 * Analitik rapor veri kaynağı.
 *
 * @param {string} endpoint - Rapor API yolu (örn. "/api/reports/analytics/top-products").
 * @param {object} [options]
 * @param {"month"|"ytd"|"last90"|"last30"|null} [options.period="month"] - Varsayılan dönem;
 *        null verilirse tarih filtresi hiç kurulmaz (dönemsiz rapor, örn. kritik stok).
 * @param {() => object} [options.extraQuery] - İsteğe eklenecek ek sorgu parametreleri.
 * @param {string} [options.errorLabel] - Konsol hata mesajı öneki.
 * @returns {{dateFrom, dateTo, loading, rows, totals, data, fetchData, fmt}}
 */
export function useAnalyticsReport(endpoint, options = {}) {
  const { period = "month", extraQuery = null, errorLabel = "Rapor" } = options;

  const initial = periodRange(period);
  const dateFrom = ref(initial.from);
  const dateTo = ref(initial.to);

  const loading = ref(false);
  const rows = ref([]);
  const totals = ref(null);
  const data = ref(null); // ham yanıt — tabloya sığmayan alanlar için (matrix, kartlar vb.)

  const fetchData = async () => {
    loading.value = true;
    try {
      const q = { ...(extraQuery ? extraQuery() : {}) };
      if (dateFrom.value) q.startDate = new Date(dateFrom.value).toISOString();
      if (dateTo.value) q.endDate = new Date(dateTo.value).toISOString();

      const res = await uiFetch(endpoint, { query: q });
      if (res?.success) {
        data.value = res;
        rows.value = res.rows || [];
        totals.value = res.totals || null;
      }
    } catch (e) {
      console.error(`${errorLabel} yüklenemedi:`, e);
    } finally {
      loading.value = false;
    }
  };

  // Dönemli raporlar tarih değişiminde yeniden çeker; dönemsizler yalnız bir kez yüklenir.
  if (period === null) onMounted(fetchData);
  else watch([dateFrom, dateTo], fetchData, { immediate: true });

  return { dateFrom, dateTo, loading, rows, totals, data, fetchData, fmt: formatNumber };
}
