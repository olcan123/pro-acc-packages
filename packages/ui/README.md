# @pro-acc/ui

Pro-Acc'ın ortak arayüzünü Nuxt 4'e kaydeden modül. Sürüm: **0.1.0** (yayındaki: 0.0.2).

0.1.0'dan itibaren paylaşılan bileşen, composable, stil, font ve sözlüklerin TEK kaynağı Nuxt'tan bağımsız
[`@pro-acc/ui-vue`](../ui-vue) paketidir. Bu modül onları aynı otomatik adlarla (`FormFieldTextInput`, `SharedBaseList`,
`PagesHeader` …) Nuxt'a kaydeder, paketin gezinme/dil/HTTP noktalarını `navigateTo` / `$localePath` / `$fetch`'e bağlar ve
POS arayüzünü (`runtime/pos`) sunar.

### 0.0.2 → 0.1.0 göçü

- Derin importlar ui-vue'ya taşındı: `@pro-acc/ui/components/…`, `/erp/…`, `/composables/…`, `/utils/date|cash-count|cash-limit`,
  `/design-tokens`, `/tooltip-directive`, `/tokens.css` → aynı alt yolla `@pro-acc/ui-vue/…`
  (`@pro-acc/ui/runtime/styles/tokens.css` → `@pro-acc/ui-vue/tokens.css`; fontlar `@pro-acc/ui-vue/src/public/fonts`).
- POS yolları (`@pro-acc/ui/pos/…`), `error-page`, `styles.css` aynı kalır; `pos.css` → `@pro-acc/ui/pos.css`.
- `SharedIndirectCostFields` artık uygulama store'una uzanmaz: hesapları `:accounts="glAccounts"` ile verin.
- `SharedRecordHistory` PrimeVue yerine FieldButton/FieldBadge kullanır (PrimeVue bağımlılığı kalktı).
- Tailwind `@source` yolları: `@pro-acc/ui/runtime/components` → `@pro-acc/ui-vue/src/components` (ERP aynı).

## Kurulum

```sh
npm install @pro-acc/ui @nuxtjs/i18n @pinia/nuxt nuxt-toast
```

```ts
// nuxt.config.ts — Ortak Pro-Acc arayüzünü kaydeder.
export default defineNuxtConfig({
  modules: ["@nuxtjs/i18n", "@pinia/nuxt", "nuxt-toast", "@pro-acc/ui"],
  i18n: {
    locales: [{ code: "tr" }, { code: "sq" }, { code: "en" }],
    defaultLocale: "tr",
    strategy: "no_prefix",
  },
  proAccUi: { erp: false, pos: false },
});
```

```vue
<script setup>
// example.vue — Form bağlamı dışında v-model ile kullanılan metin alanı.
const name = ref("");
</script>

<template>
  <FormFieldTextInput v-model="name" label-name="Ad" />
</template>
```

`field-name` verilen alanlar vee-validate formuna bağlanır. FormFieldTextArea ve
FormFieldPasswordInput vee-validate bağlamı gerektirir. Bileşen dosyaları ayrıca
`@pro-acc/ui-vue/components/form/FieldTextInput.vue` gibi doğrudan import edilebilir.

## Bileşenler

| Grup | İçerik |
| --- | --- |
| Temel | FormFieldTextInput, TextArea, Select, PasswordInput, NumberInput, ImageUpload, HeaderActions, DropdownItem, Dropdown, DateInput, ConfirmDialog, Checkbox, Button, Badge, Autocomplete; AuthLoginForm; SharedReportAmountCell, SharedUpdateNotice, SharedModal |
| ERP (`erp: true`) | SharedBaseForm, BaseList, AnalyticsReport, AttachmentPanel, BookView, DateRangeFilter, ExcelImport, FormLineCard, ImportGuide, IndirectCostFields, LedgerTable, RecordHistory, ReportSearchBar, RoutingTable; PagesHeader ve destek bileşenleri |
| POS (`pos: true`) | PosActionPanel, CardPaymentModal, CashCountPanel, CustomerPicker, Modal, PaymentModal, SaleEntryRow, SaleGrid, TotalsBar; LayoutPosTopbar, PosSubbar, SyncHealthBadge; ortak POS store/composable'ları |

İsimlerde tablodaki grup öneki devam eder: örneğin `SharedBaseList`,
`PosPaymentModal`, `LayoutPosSubbar`. Paylaşılan bileşenlerin listesi `@pro-acc/ui-vue/inventory.json` içindedir.

## Uygulama bağlantıları

Temel alanlar Vue/vee-validate üzerinden çalışır. ERP/POS seçenekleri Pro-Acc
uygulama sözleşmelerini kullanır; bir veritabanı veya sunucu kurmaz:

- ERP rapor/ek/işlem geçmişi bileşenleri tüketicinin `/api` uçlarını çağırır.
  SharedBaseForm kaydetme işini `create-action`/`update-action` fonksiyonlarından alır.
- SharedIndirectCostFields GL hesaplarını `accounts` prop'uyla alır.
- POS store'ları tüketicinin `useNuxtApp().$api` nesnesini kullanır: `auth`,
  `product`, `session`, `settings`, `bankTerminal`, `order` modülleri gerekir.
  İşlevlerin kesin imzaları dağıtılan `runtime/pos/stores` ve bileşenlerde bulunur.
- SharedUpdateNotice isteğe bağlı `/api/system/update-check` hizmetini kullanır.
- Toast için `nuxt-toast`; yerelleştirme ve locale route'ları için `@nuxtjs/i18n`
  kullanılır. Paket tr/sq/en mesajlarını ekler; uygulama mesajları önceliklidir.
- Fiyatlar EUR, görünen tarihler `dd.mm.yyyy`, rapor baskısı ve Excel başlıkları
  Arnavutçadır. Genel modal `keep-mounted` seçeneğini destekler.

## Stiller

Modül Tailwind 4 Vite eklentisini, ortak CSS'i, PrimeIcons'u ve yerel fontları
kaydeder. Mevcut Tailwind eklentisi ikinci kez eklenmez. Kendi stil kurulumunu
kullanırken `proAccUi: { css: false }` seçilebilir. `tooltip: false` tooltip
direktifini, `locales: false` paket çevirilerini kapatır.

## Geliştirme ve yayın

Paylaşılan kaynaklar `packages/ui-vue/src`, Nuxt köprüsü ve POS `packages/ui/runtime` altındadır. Önce ui-vue yayınlanır.

```sh
pnpm install
pnpm test
npm pack
npm publish --access public
```

[GitHub kaynakları](https://github.com/olcan123/pro-acc-packages/tree/main/packages/ui) · [npm](https://www.npmjs.com/package/@pro-acc/ui)

Fontların OFL lisansları ve SheetJS lisansı @pro-acc/ui-vue içindedir. Paket kodu UNLICENSED (tüm hakları saklıdır).
