// design-tokens.ts — "Editoryal Defter" tasarım kimliğinin TEK KAYNAĞI (ham hex değerleri).
//
// Bu dosya Nuxt'tan bağımsız düz TypeScript'tir; üç yerden tüketilir:
//   1. packages/pos-ui/app/assets/css/tokens.css  → Tailwind @theme token'ları (elle yazılır,
//      main/tests/unit/design/design-tokens.test.ts iki dosyanın eşitliğini doğrular)
//   2. printCss()                                 → iframe/baskı CSS'i (Tailwind göremez)
//
// Paket kökünde durmasının sebebi: nuxt.config.ts dosyaları Nuxt alias'larına tabi değildir,
// göreli yolla import edilmeleri gerekir.
//
// KİMLİK: muhasebe defteri. Sıcak kağıt zemini, mürekkep metni, ince defter kuralı çizgileri,
// tek keskin kiremit aksan, tabular hizalı rakamlar, toplam satırında çift çizgi.

/** Bir renk rampasının 11 kademesi (Tailwind sözleşmesi: 50 → 950) */
export type Ramp = Readonly<Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>>;

// ─── RAMPALAR ─────────────────────────────────────────────────────────────────

/**
 * paper — sıcak nötr. Saf beyaz/gri DEĞİL; kremli kağıt tonu.
 * Tailwind'in gray/slate/zinc/neutral/stone ailelerinin TAMAMI buraya eşlenir,
 * böylece uygulamadaki üç ayrı nötr ailesi tek dile iner.
 *
 * ⚠ PARLAKLIK KİLİTLİ — bu değerleri "biraz açalım/koyulaştıralım" diye elle oynama.
 * Her kademe Tailwind gray'in AYNI kademesiyle %1 içinde eşit rölatif parlaklıkta
 * üretilmiştir. Sebebi: uygulamadaki 2000+ sınıf (`text-gray-500`, `text-gray-600`,
 * `dark:text-gray-400` ...) bu parlaklıklara göre yazılmış. İlk denemede rampa
 * sistematik olarak ~2× açık kaldı ve tüm ikincil metinler okunamaz hâle geldi.
 *
 * Sıcaklık parlaklık SABİT tutularak eklenir (renk yönü kontrastı değiştirmez),
 * bu yüzden kimlik korunurken WCAG AA garantili kalır.
 * Doğrulama: main/tests/unit/design/contrast.test.ts
 */
export const paper: Ramp = {
  50:  "#FFF9F1",
  100: "#FFF2E0",  // sayfa zemini — sıcak krem
  200: "#F3E5D2",
  300: "#DFD3C1",  // defter kuralı çizgisi
  400: "#ABA193",  // koyu modda ikincil metin
  500: "#756E65",  // açık modda ikincil metin + güçlü kural çizgisi
  600: "#59534C",
  700: "#44403A",
  800: "#2B2824",
  900: "#1F1B16",  // koyu mod yüzeyi
  950: "#14110C",  // mürekkep — siyah değil, koyu kahve-siyah
};

/**
 * accent — kiremit kırmızısı. Tek keskin vurgu: birincil buton, aktif menü, bağlantı, focus ring.
 * Tailwind blue-* ailesi buraya eşlenir (uygulamanın 377+ mavi kullanımı tek hamlede döner).
 *
 * DİKKAT: accent bir MARKA rengidir, "negatif tutar" değil. Negatif tutarlar `negative`
 * rampasını kullanır — turuncuya çalan kiremit ile maviye çalan oxblood arasında hem hue
 * hem açıklık farkı vardır, ayrıca negatif tutarlar `(-)` öneki taşır.
 */
export const accent: Ramp = {
  50:  "#FDF5F2",
  100: "#FAE6DF",
  200: "#F3C9BB",
  300: "#E9A490",
  400: "#DC7A5F",  // koyu modda aksan
  500: "#C9563A",
  600: "#B4331F",  // MERKEZ — marka rengi
  700: "#942716",
  800: "#762012",
  900: "#5E1B11",
  950: "#350D07",
};

/** positive — defter yeşili. Alacak/kâr/pozitif bakiye. emerald/green/teal buraya eşlenir. */
export const positive: Ramp = {
  50:  "#F1F8F4",
  100: "#DBEDE3",
  200: "#B7DAC7",
  300: "#8AC0A6",
  400: "#55A882",  // koyu modda
  500: "#2F8A64",
  600: "#1F6F52",  // MERKEZ
  700: "#185943",
  800: "#144736",
  900: "#11392C",
  950: "#081F18",
};

/**
 * negative — oxblood (maviye çalan koyu kırmızı). Borç/zarar/negatif bakiye VE hata durumu.
 * accent'ten kasten daha koyu ve daha az turuncu: solid kiremit buton ile oxblood metin
 * ekranda karışmaz. rose/red aileleri buraya eşlenir.
 */
export const negative: Ramp = {
  50:  "#FCF3F3",
  100: "#F7E1E2",
  200: "#EDC0C3",
  300: "#DE979C",
  400: "#C86A72",  // koyu modda
  500: "#A8444E",
  600: "#7C1D24",  // MERKEZ
  700: "#67181E",
  800: "#551419",
  900: "#451115",
  950: "#26080B",
};

/** ochre — sıcak okra. Uyarı/bekleyen/düzenle. amber/orange/yellow buraya eşlenir. */
export const ochre: Ramp = {
  50:  "#FDF8EE",
  100: "#F9EDD4",
  200: "#F1D8A6",
  300: "#E4BC71",
  400: "#D19E44",
  500: "#B87F27",
  600: "#9A661C",  // MERKEZ
  700: "#7A4F17",
  800: "#613F15",
  900: "#4F3413",
  950: "#2B1B09",
};

/** ink — mürekkep mavisi. İkincil bilgi/rozet/grafik serisi. indigo/sky/cyan buraya eşlenir. */
export const ink: Ramp = {
  50:  "#F1F5F9",
  100: "#DEE8F0",
  200: "#BCD0E1",
  300: "#8FB0C9",
  400: "#5C8AAC",
  500: "#3A6A8E",
  600: "#2C5578",  // MERKEZ
  700: "#244461",
  800: "#1F394F",
  900: "#1B3043",
  950: "#0E1A26",
};

/** plum — koyu erik. Rapor aksanı/grafik üçüncü seri. violet/purple/fuchsia buraya eşlenir. */
export const plum: Ramp = {
  50:  "#F9F4F8",
  100: "#F0E4EE",
  200: "#DFC7DB",
  300: "#C6A2C1",
  400: "#A87AA3",
  500: "#8A5885",
  600: "#70456B",  // MERKEZ
  700: "#5B3A5E",
  800: "#4A314D",
  900: "#3D2940",
  950: "#221624",
};

/** Tüm rampalar — testlerin ve preset'in üzerinde döneceği kayıt */
export const ramps = { paper, accent, positive, negative, ochre, ink, plum } as const;

export type RampName = keyof typeof ramps;

// ─── TİPOGRAFİ ────────────────────────────────────────────────────────────────

/**
 * Font aileleri. Üçü de OFL 1.1 lisanslı ve latin-ext içerir → Türkçe (ğ ı İ ş) ve
 * Arnavutça (ë ç) tam kapsanır. Baskılar sq olduğu için bu şart.
 *
 * Dosyalar packages/pos-ui/public/fonts/ altında self-host edilir; CDN KULLANILMAZ
 * (offline/USB dağıtımında müşteri makinesinde internet olmayabilir).
 */
export const fonts = {
  /** Gövde/UI — mühendislik karakterli, gerçek tabular figür (tnum) desteği var */
  sans: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  /** Başlık/display — editoryal serif, defter kimliğinin taşıyıcısı */
  serif: '"Source Serif 4", Georgia, "Times New Roman", serif',
  /** Rakam/kod — IBM Plex Sans'ın metrik kardeşi, toplam satırı gövdeyle hizalanır */
  mono: '"IBM Plex Mono", ui-monospace, "Courier New", monospace',
} as const;

/**
 * Unicode alt küme aralıkları (@fontsource / Google Fonts bölümlemesiyle birebir).
 *
 * KRİTİK: iki alt küme de ZORUNLU.
 *   - Arnavutça ë (U+00EB) ve ç (U+00E7) → "latin" (U+0000-00FF)
 *   - Türkçe ğ (U+011F), ş (U+015F), İ (U+0130) → "latin-ext" (U+0100-02BA)
 *   - Türkçe ı (U+0131) → "latin" (aralıkta ayrıca sayılmış)
 * Yalnız birini almak, baskıda (sq) veya arayüzde (tr) harf düşmesine yol açar.
 */
export const unicodeRanges = {
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308," +
    "U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  latinExt:
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308," +
    "U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0," +
    "U+2113,U+2C60-2C7F,U+A720-A7FF",
} as const;

/**
 * public/fonts altındaki dosyalar — @font-face ve preload bu listeden türer.
 * Kaynak: @fontsource/* devDependency'leri (packages/pos-ui/package.json),
 * dosyalar oradan public/fonts/'a kopyalanır ve repoya commit edilir
 * (offline/USB dağıtımı için CDN kullanılamaz). Toplam ~276 KB.
 */
export const fontFiles = [
  // Gövde — IBM Plex Sans 400/500/600
  { family: "IBM Plex Sans",  file: "ibm-plex-sans-latin-400-normal.woff2",     weight: 400, subset: "latin" },
  { family: "IBM Plex Sans",  file: "ibm-plex-sans-latin-ext-400-normal.woff2", weight: 400, subset: "latinExt" },
  { family: "IBM Plex Sans",  file: "ibm-plex-sans-latin-500-normal.woff2",     weight: 500, subset: "latin" },
  { family: "IBM Plex Sans",  file: "ibm-plex-sans-latin-ext-500-normal.woff2", weight: 500, subset: "latinExt" },
  { family: "IBM Plex Sans",  file: "ibm-plex-sans-latin-600-normal.woff2",     weight: 600, subset: "latin" },
  { family: "IBM Plex Sans",  file: "ibm-plex-sans-latin-ext-600-normal.woff2", weight: 600, subset: "latinExt" },
  // Rakam/mono — IBM Plex Mono 400/500
  { family: "IBM Plex Mono",  file: "ibm-plex-mono-latin-400-normal.woff2",     weight: 400, subset: "latin" },
  { family: "IBM Plex Mono",  file: "ibm-plex-mono-latin-ext-400-normal.woff2", weight: 400, subset: "latinExt" },
  { family: "IBM Plex Mono",  file: "ibm-plex-mono-latin-500-normal.woff2",     weight: 500, subset: "latin" },
  { family: "IBM Plex Mono",  file: "ibm-plex-mono-latin-ext-500-normal.woff2", weight: 500, subset: "latinExt" },
  // Başlık/serif — Source Serif 4 400/600
  { family: "Source Serif 4", file: "source-serif-4-latin-400-normal.woff2",     weight: 400, subset: "latin" },
  { family: "Source Serif 4", file: "source-serif-4-latin-ext-400-normal.woff2", weight: 400, subset: "latinExt" },
  { family: "Source Serif 4", file: "source-serif-4-latin-600-normal.woff2",     weight: 600, subset: "latin" },
  { family: "Source Serif 4", file: "source-serif-4-latin-ext-600-normal.woff2", weight: 600, subset: "latinExt" },
] as const;

/**
 * İlk boyamada kritik dosyalar — nuxt.config app.head.link preload'una girer.
 * Arayüz Türkçe olduğu için latin-ext de ilk ekranda gerekiyor; bu yüzden
 * gövde ve başlık fontunun HER İKİ alt kümesi de preload edilir (~76 KB).
 */
export const preloadFonts = [
  "ibm-plex-sans-latin-400-normal.woff2",
  "ibm-plex-sans-latin-ext-400-normal.woff2",
  "source-serif-4-latin-600-normal.woff2",
  "source-serif-4-latin-ext-600-normal.woff2",
] as const;

// ─── RADIUS ───────────────────────────────────────────────────────────────────

/**
 * Kağıt gibi, balon gibi değil. Uygulamada bugün 6 farklı radius yaşıyor
 * (rounded-md/lg/xl/2xl/3xl); bu ölçek hepsini 1–8px aralığına sıkıştırır.
 * rounded-full (9999px) dokunulmaz — avatar/pill için gerekli.
 */
export const radius = {
  xs: "1px",
  sm: "2px",
  md: "3px",
  lg: "4px",   // fiili standart
  xl: "5px",
  "2xl": "6px",
  "3xl": "8px",
  "4xl": "8px",
} as const;

// ─── SEMANTİK KISAYOLLAR ──────────────────────────────────────────────────────

/**
 * Grafik serisi renkleri (Unovis / nuxt-charts).
 *
 * NEDEN BURADA: grafik renkleri JS değeri olarak veriliyor, Tailwind sınıfı değil —
 * yani `@theme` remap'i onlara ULAŞMAZ. Dashboard'da ham hex (#10b981, #f43f5e,
 * #6366f1) kalmıştı ve kimlik değişince tek başlarına eski paletle kalıyorlardı.
 *
 * 500 kademesi seçildi: hem sıcak kağıt hem kararmış mürekkep zemininde
 * grafik çizgisi için gereken 3:1 kontrastı geçer (tek renk iki temada da çalışır).
 */
export const chartSeries = {
  /** gelir, kâr, özkaynak */
  positive: positive[500],
  /** gider, yükümlülük, iade */
  negative: negative[500],
  /** satış hacmi, varlık — nötr birincil seri */
  neutral: ink[500],
  /** üçüncü seri */
  alt: plum[500],
  /** uyarı serisi */
  warning: ochre[500],
} as const;

/** Grafik eksen/ızgara renkleri — açık ve koyu tema ayrı */
export const chartAxis = {
  tickLight: paper[500],
  tickDark: paper[400],
  gridLight: "rgba(0, 0, 0, 0.06)",
  gridDark: "rgba(255, 255, 255, 0.06)",
} as const;

// ─── BASKI ────────────────────────────────────────────────────────────────────

/**
 * Baskı paleti. Ekran paletinden AYRIDIR ve bilerek böyledir:
 *
 *   - Kâğıt GERÇEKTEN beyazdır (#FFFFFF). Ekrandaki sıcak krem (paper-50) yazıcıdan
 *     kirli/sarımsı çıkar ve resmî belgede kabul edilmez.
 *   - Mürekkep saf siyaha yakındır; ekrandaki kahve-siyah düşük DPI'da soluk basar.
 *   - Çizgiler ekrandakinden koyudur; ince gri kurallar birçok yazıcıda kaybolur.
 *
 * Yalnız ANLAM renkleri (pozitif/negatif) defter rampasından gelir — böylece
 * ekranda yeşil gördüğün tutar kâğıtta da yeşil çıkar.
 */
export const printPalette = {
  paper: "#FFFFFF",
  ink: "#111111",
  inkMuted: "#555555",
  rule: "#999999",
  ruleStrong: "#333333",
  headBg: "#EEEEEE",
  totalBg: "#F5F5F5",
  positive: positive[700],
  negative: negative[700],
} as const;

/**
 * Baskı CSS'i — iframe ve `@media print` için.
 *
 * NEDEN FONKSİYON: baskı çıktısı gizli bir iframe'e ham HTML olarak yazılır;
 * o belge uygulamanın Tailwind'ini GÖRMEZ. Bu yüzden CSS, JS sabitlerinden
 * ÜRETİLİR — tek token kaynağı korunur.
 *
 * ⚠ SINIF ADLARI SÖZLEŞMEDİR: `.num`, `.totals`, `.company`, `.meta`, `.subtitle`,
 * `.empty` — useReportPrint bunları HTML üretirken kullanır ve
 * tests/unit/app/composables/useReportPrint.test.ts doğrular. Adları değiştirme.
 */
export function printCss(opts: { landscape?: boolean } = {}): string {
  const p = printPalette;
  const fontFaces = fontFiles
    .filter((f) => f.family !== "IBM Plex Mono") // baskıda mono gerekmez, dosya küçülsün
    .map(
      // font-display: swap — BLOCK DEĞİL.
      // Baskı, belge iframe'e yazıldıktan hemen sonra tetiklenir. `block` fontu
      // beklerken metni GÖRÜNMEZ tutar; font o anda hazır değilse fatura boş
      // basılabilir. `swap` en kötü durumda yedek fontla basar — resmî belgede
      // yanlış font, eksik metinden çok daha az zararlıdır.
      // (Pratikte fontlar ana sayfada zaten yüklü ve aynı URL'den önbellekli.)
      (f) => `@font-face{font-family:"${f.family}";` +
        `src:url("/fonts/${f.file}") format("woff2");` +
        `font-weight:${f.weight};font-style:normal;font-display:swap;` +
        `unicode-range:${f.subset === "latin" ? unicodeRanges.latin : unicodeRanges.latinExt};}`,
    )
    .join("\n");

  return `${fontFaces}
  @page { size: A4 ${opts.landscape ? "landscape" : "portrait"}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: ${fonts.sans}; font-size: 10px; color: ${p.ink}; background: ${p.paper}; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: baseline;
           border-bottom: 2px solid ${p.ruleStrong}; padding-bottom: 6px; margin-bottom: 10px; }
  .company { font-family: ${fonts.serif}; font-size: 14px; font-weight: 600; }
  .meta { text-align: right; font-size: 10px; color: ${p.inkMuted}; }
  h1 { font-family: ${fonts.serif}; font-size: 13px; font-weight: 600; margin: 0 0 2px; }
  .subtitle { color: ${p.inkMuted}; margin-bottom: 8px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { border: 1px solid ${p.rule}; padding: 3px 5px; text-align: left; vertical-align: top; }
  th { background: ${p.headBg}; font-weight: 600; }
  td.num, th.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr.totals td { font-weight: 700; background: ${p.totalBg}; border-top: 3px double ${p.ruleStrong}; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  .empty { text-align: center; color: ${p.inkMuted}; padding: 24px 0; }`;
}

/** Rol bazlı tek değerler — baskı CSS'i ve PrimeVue preset'i bunları kullanır */
export const semantic = {
  /** Açık tema */
  light: {
    canvas: paper[100],       // sayfa zemini — sıcak kağıt
    surface: paper[50],       // kart/tablo yüzeyi
    surfaceAlt: paper[200],   // tablo başlığı, dip toplam
    text: paper[950],         // mürekkep
    textMuted: paper[600],
    rule: paper[300],         // ince defter kuralı
    ruleStrong: paper[500],   // toplam satırı çift çizgisi
    accent: accent[600],
    positive: positive[600],
    negative: negative[600],
  },
  /** Koyu tema — beyaz kağıt değil, KARARMIŞ MÜREKKEP */
  dark: {
    canvas: paper[950],
    surface: paper[900],
    surfaceAlt: paper[800],
    text: paper[200],
    textMuted: paper[400],
    rule: paper[800],
    ruleStrong: paper[600],
    accent: accent[400],      // koyu zeminde açılır (AA kontrast)
    positive: positive[400],
    negative: negative[400],
  },
} as const;
