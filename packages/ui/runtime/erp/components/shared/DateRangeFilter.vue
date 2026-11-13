<!-- eslint-disable vue/require-prop-types -->
<!-- eslint-disable vue/require-prop-types -->
<template>
  <!-- Liste sayfaları için tarih aralığı filtresi: manuel from/to + tek dönem seçici (aylık/3 aylık/yıllık) -->
  <!-- ARAÇ ÇUBUĞU, KART DEĞİL.
       Önceden kendi kart kabuğunu (beyaz zemin + gölge + kenarlık) taşıyordu; 25 tüketicinin
       çoğunda zaten bir kartın İÇİNDE render edildiği için iç içe kart görünüyordu.
       Artık kabuğu tüketici sağlar; burada yalnız alt kural çizgisiyle ayrılan bir
       filtre satırı var. Mobilde iki kolona iner (yan yana sığmıyordu). -->
  <div
    class="border-paper-300 dark:border-paper-800 mb-4 grid grid-cols-2 items-end gap-x-4 gap-y-2 border-b pb-3 sm:flex sm:flex-wrap"
  >
    <!-- Başlangıç -->
    <div class="flex flex-col">
      <label class="drf-label">{{ $t("date_from") }}</label>
      <input type="date" :value="from || ''" :class="inputClass" @input="onManual('from', $event.target.value)" />
    </div>

    <!-- Bitiş -->
    <div class="flex flex-col">
      <label class="drf-label">{{ $t("date_to") }}</label>
      <input type="date" :value="to || ''" :class="inputClass" @input="onManual('to', $event.target.value)" />
    </div>

    <div class="bg-paper-300 dark:bg-paper-700 mb-1 hidden h-9 w-px self-end sm:block" />

    <!-- Tek dönem seçici: aylık ve 3 aylık seçenekleri yıla göre (bu yıl + geçen yıl) gruplanır -->
    <div class="col-span-2 flex flex-col sm:col-auto">
      <label class="drf-label">{{ $t("period") }}</label>
      <select v-model="periodSel" :class="[inputClass, 'w-full sm:w-60']" @change="applyPeriod">
        <option value="">{{ $t("select_period") }}</option>
        <!-- Aylık: her yıl için ayrı grup -->
        <optgroup v-for="y in years" :key="'m' + y" :label="`${$t('monthly')} ${y}`">
          <option v-for="o in monthsOf(y)" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </optgroup>
        <!-- 3 Aylık: her yıl için ayrı grup -->
        <optgroup v-for="y in years" :key="'q' + y" :label="`${$t('quarterly')} ${y}`">
          <option v-for="o in quartersOf(y)" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </optgroup>
        <!-- Yıllık -->
        <optgroup :label="$t('yearly')">
          <option v-for="y in years" :key="'y' + y" :value="`y:${y}`">{{ y }}</option>
        </optgroup>
      </select>
    </div>

    <!-- Filtreyi temizle -->
    <button
      v-if="from || to"
      type="button"
      class="text-negative-600 dark:text-negative-300 hover:text-negative-700 border-negative-200 dark:border-negative-900 col-span-2 flex items-center justify-center gap-1 self-end rounded-sm border px-2.5 py-1.5 text-sm sm:col-auto"
      @click="clearAll"
    >
      <i class="pi pi-times text-xs" />{{ $t("clear") }}
    </button>
  </div>
</template>

<script setup>
// DateRangeFilter.vue — Tarih aralığı filtresi: manuel from/to girişi + tek select ile aylık/3 aylık/yıllık dönem seçimi.
// Aylık ve 3 aylık seçenekleri yıla göre gruplanır; yalnız bu yıl ve geçen yıl gösterilir (kayan 2 yıllık pencere).
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// v-model:from / v-model:to — 'YYYY-MM-DD' biçiminde string
const from = defineModel("from", { type: String, default: null });
const to = defineModel("to", { type: String, default: null });

const { locale } = useI18n();

// Yüzey rengi paper-50'dir. Tailwind'in "white" sabiti kullanılmaz: remap edilmez
// (#fff) ve sıcak kağıt zeminini deler.
const inputClass =
  "border border-paper-300 dark:border-paper-700 rounded-sm px-2 py-1.5 text-sm " +
  "bg-paper-50 dark:bg-paper-900 text-paper-800 dark:text-paper-200 focus:outline-none " +
  "focus:ring-2 focus:ring-accent-400";

// Seçili dönem değeri ('m:YYYY-MM' | 'q:YYYY-Q' | 'y:YYYY')
const periodSel = ref("");

// 'YYYY-MM-DD' biçiminde tarih üretir
const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
// Verilen yıl/ayın son gününü döndürür
const lastDay = (y, m) => new Date(y, m, 0).getDate();

const curYear = new Date().getFullYear();
// Gösterilecek yıllar: bu yıl ve geçen yıl (yıl ilerledikçe en eski yıl otomatik düşer)
const years = [curYear, curYear - 1];

// Aktif dile göre yerelleştirilmiş ay adı (uzun: "Nisan", kısa: "Oca")
const fmtMonthLong = (y, m) =>
  new Intl.DateTimeFormat(locale.value || "tr", { month: "long" }).format(new Date(y, m - 1, 1));
const fmtMonthShort = (y, m) =>
  new Intl.DateTimeFormat(locale.value || "tr", { month: "short" }).format(new Date(y, m - 1, 1));

// Bir yıla ait 12 aylık seçenek (grup başlığı yılı taşıdığı için etikette yalnız ay adı)
const monthsOf = (y) =>
  Array.from({ length: 12 }, (_, i) => ({
    value: `m:${y}-${String(i + 1).padStart(2, "0")}`,
    label: fmtMonthLong(y, i + 1),
  }));

// Çeyrek tanımları (Ç1..Ç4)
const QUARTERS = [
  { q: 1, start: 1, end: 3 },
  { q: 2, start: 4, end: 6 },
  { q: 3, start: 7, end: 9 },
  { q: 4, start: 10, end: 12 },
];

// Bir yıla ait 4 çeyrek seçenek
const quartersOf = (y) =>
  QUARTERS.map((q) => ({
    value: `q:${y}-${q.q}`,
    label: `${fmtMonthShort(y, q.start)} - ${fmtMonthShort(y, q.end)}`,
  }));

// Seçilen dönemi from/to tarihlerine uygular
const applyPeriod = () => {
  if (!periodSel.value) return;
  const [type, rest] = periodSel.value.split(":");
  if (type === "m") {
    const [y, m] = rest.split("-").map(Number);
    from.value = iso(y, m, 1);
    to.value = iso(y, m, lastDay(y, m));
  } else if (type === "q") {
    const [y, qn] = rest.split("-").map(Number);
    const q = QUARTERS[qn - 1];
    from.value = iso(y, q.start, 1);
    to.value = iso(y, q.end, lastDay(y, q.end));
  } else if (type === "y") {
    const y = Number(rest);
    from.value = iso(y, 1, 1);
    to.value = iso(y, 12, 31);
  }
};

// Manuel tarih girişi → değeri yaz, dönem seçimini sıfırla
const onManual = (which, val) => {
  if (which === "from") from.value = val || null;
  else to.value = val || null;
  periodSel.value = "";
};

// Tüm filtreyi temizle
const clearAll = () => {
  from.value = null;
  to.value = null;
  periodSel.value = "";
};
</script>

<style scoped>
/* Defter fişi etiketi. Renk ham rgb() değil token'dan gelir → tema ve koyu mod
   otomatik doğru olur (önceden rgb(156 163 175) sabitti ve koyu modda solukdu). */
.drf-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-paper-600);
  margin-bottom: 2px;
}
:global(.dark) .drf-label {
  color: var(--color-paper-400);
}
</style>
