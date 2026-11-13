# @pro-acc/ui

Pro-Acc'ın ortak Vue arayüzlerini sunan Nuxt 4 modülü. Güncel sürüm: **0.0.2**.
Temel Field bileşenleri, ortak modal, giriş formu, para/tarih yardımcıları, tasarım
token'ları, yerel fontlar ve isteğe bağlı ERP/POS arayüzleri aynı pakettedir.

## Kurulum

```sh
npm install @pro-acc/ui@0.0.2 @nuxtjs/i18n @pinia/nuxt nuxt-toast
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
`@pro-acc/ui/components/form/FieldTextInput.vue` gibi doğrudan import edilebilir.

## Bileşenler

| Grup | İçerik |
| --- | --- |
| Temel | FormFieldTextInput, TextArea, Select, PasswordInput, NumberInput, ImageUpload, HeaderActions, DropdownItem, Dropdown, DateInput, ConfirmDialog, Checkbox, Button, Badge, Autocomplete; AuthLoginForm; SharedReportAmountCell, SharedUpdateNotice, SharedModal |
| ERP (`erp: true`) | SharedBaseForm, BaseList, AnalyticsReport, AttachmentPanel, BookView, DateRangeFilter, ExcelImport, FormLineCard, ImportGuide, IndirectCostFields, LedgerTable, RecordHistory, ReportSearchBar, RoutingTable; PagesHeader ve destek bileşenleri |
| POS (`pos: true`) | PosActionPanel, CardPaymentModal, CashCountPanel, CustomerPicker, Modal, PaymentModal, SaleEntryRow, SaleGrid, TotalsBar; LayoutPosTopbar, PosSubbar, SyncHealthBadge; ortak POS store/composable'ları |

İsimlerde tablodaki grup öneki devam eder: örneğin `SharedBaseList`,
`PosPaymentModal`, `LayoutPosSubbar`. Kesin dağıtım listesi `runtime/inventory.json` içindedir.

## Uygulama bağlantıları

Temel alanlar Vue/vee-validate üzerinden çalışır. ERP/POS seçenekleri Pro-Acc
uygulama sözleşmelerini kullanır; bir veritabanı veya sunucu kurmaz:

- ERP rapor/ek/işlem geçmişi bileşenleri tüketicinin `/api` uçlarını çağırır.
  SharedBaseForm kaydetme işini `create-action`/`update-action` fonksiyonlarından alır.
- SharedIndirectCostFields için uygulama `useGlAccountStore` composable'ını
  auto-import etmeli; store `glAccounts` ve `fetchAccounts` sunmalıdır.
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

Kaynaklar bu bağımsız depodaki runtime/ dizininde tutulur; başka bir uygulama deposundan dosya üretilmez.

```sh
pnpm install
pnpm test
npm pack
npm publish --access public
```

[GitHub kaynakları](https://github.com/olcan123/pro-acc-packages/tree/main/packages/ui) · [npm](https://www.npmjs.com/package/@pro-acc/ui)

Fontların OFL lisansları runtime/public/fonts, SheetJS 0.20.3 Apache-2.0 lisansı runtime/vendor altındadır. Paket kodu UNLICENSED (tüm hakları saklıdır).
