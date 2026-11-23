# @pro-acc/ui-vue

Pro-Acc'ın ortak Vue 3 arayüzü — **Nuxt gerektirmez**. Güncel sürüm: **0.1.0**.

İçerik: Field form alanları, ERP liste/form/rapor bileşenleri (BaseList, LedgerTable, BaseForm, BookView, DateRangeFilter,
ExcelImport …), composable'lar (useAppToast, useConfirmDelete, useCurrency, useExcelExport, useReportPrint …), tarih/nakit
yardımcıları, `v-tooltip`, tasarım token'ları (`tokens.css`), yerel fontlar ve tr/sq/en sözlüğü.

Nuxt uygulamaları bunu doğrudan değil, aynı bileşenleri Nuxt'a otomatik kaydeden [`@pro-acc/ui`](../ui) modülü üzerinden
kullanır. Kaynak tek yerdedir: bu paket.

## Kurulum (Vue 3 + Vite)

```sh
npm install @pro-acc/ui-vue vue-router vue-i18n
```

```ts
// main.ts — paketin gezinme/HTTP noktalarını uygulamaya bağlar ve v-tooltip'i kaydeder.
import { ProAccUi } from "@pro-acc/ui-vue";
import "izitoast/dist/css/iziToast.min.css";

app.use(router);
app.use(ProAccUi, { router }); // isteğe bağlı: localePath, fetch, tooltip: false
```

```vue
<script setup lang="ts">
// UnitList.vue — liste motoru + silme onayı. Bileşenler Nuxt'taki adlarıyla da dışa aktarılır (FormFieldButton …).
import { BaseList, FieldButton, useConfirmDelete } from "@pro-acc/ui-vue";
</script>

<template>
  <BaseList :title="$t('units')" create-route="/products/units/create" :data="rows" :columns="columns" />
</template>
```

Uygulama kökünde onay diyaloğu bir kez bulunur: `<FieldConfirmDialog />`.

### Vite yapılandırması (zorunlu)

Paket kaynak (`.vue`) olarak dağıtılır. Geliştirmede ön paketlemeye alınırsa `.vue` dosyaları ham kalır ve içlerindeki
CommonJS bağımlılık (iziToast) "does not provide an export named 'default'" hatasıyla uygulamayı açılışta düşürür:

```ts
// vite.config.ts
optimizeDeps: {
  exclude: ["@pro-acc/ui-vue"],
  include: ["@pro-acc/ui-vue > izitoast", "@pro-acc/ui-vue > currency.js", "@pro-acc/ui-vue > xlsx-js-style"],
},
resolve: { dedupe: ["vue", "vue-router", "vue-i18n", "vee-validate"] },
// Vitest: test.server.deps.inline: [/@pro-acc[\\/]ui-vue/]
```

### Stil ve fontlar

```css
/* main.css */
@import "tailwindcss";
@import "primeicons/primeicons.css";
@import "@pro-acc/ui-vue/tokens.css";
@plugin "@tailwindcss/forms";
@source "../../node_modules/@pro-acc/ui-vue/src/components";
@source "../../node_modules/@pro-acc/ui-vue/src/erp/components";
```

`tokens.css` fontları `/fonts/*.woff2` adresinden ister: `node_modules/@pro-acc/ui-vue/src/public` klasörünü statik olarak
sunun (Vite: `publicDir`).

### Sözlük

`@pro-acc/ui-vue/locales/{tr,sq,en}.json` temel katmandır; uygulamanın kendi mesajlarını üstüne birleştirin (uygulama
anahtarı kazanır). en kısmidir, eksikler fallback dile düşer.

## Uygulamaya bağlı noktalar

Paket yalnız üç şeyi uygulamadan alır (`configureProAccUi` ya da `app.use(ProAccUi, …)`):

| Nokta | Vue varsayılanı | Nuxt (`@pro-acc/ui`) |
| --- | --- | --- |
| `navigate` (BaseList "ekle", dropdown öğeleri) | `router.push` (router verilirse) | `navigateTo` |
| `localePath` (dil öneki) | yol aynen | `$localePath` (`/sq/…`) |
| `fetch` (ek dosya, kayıt geçmişi, rapor, görsel yükleme) | `ofetch`, cookie ile | `$fetch` |

Bazı ERP bileşenleri uygulamanın `/api` uçlarını çağırır (AttachmentPanel → `/api/attachments`, RecordHistory →
`/api/changelog/record`, RoutingTable → `/api/work-centers`, UpdateNotice → `/api/system/update-check`).
`IndirectCostFields` GL hesaplarını `accounts` prop'uyla alır (`{ id, code, name }[]`).

Kaynak olarak dağıtılır (`.vue` / `.ts`): Vite veya Nuxt gibi bir derleyiciyle kullanılır.

## Geliştirme

```sh
pnpm install
pnpm --filter @pro-acc/ui-vue test   # Nuxt'suzluk denetimi + Vue çalışma testleri
npm publish --access public          # packages/ui-vue içinde
```

`tests/standalone.test.ts` her kaynak dosyayı Vue derleyicisinden geçirir: import edilmeden kullanılan bir Nuxt/Vue adı
(navigateTo, useI18n, $fetch …), şablonda import edilmemiş bileşen, `#app`/`#imports` ya da PrimeVue bulunursa düşer.

Fontların OFL lisansları `src/public/fonts`, SheetJS 0.20.3 Apache-2.0 lisansı `src/vendor` altındadır. Paket kodu
UNLICENSED (tüm hakları saklıdır).
