# Pro-Acc Packages

Pro-Acc'tan bağımsız geliştirilen ve npm üzerinden tüketilen paketler. Kaynak kodu bu depodadır; derleme için Pro-Acc deposu gerekmez.

| Paket | Sürüm | Kullanım |
| --- | --- | --- |
| [@pro-acc/ui-vue](https://www.npmjs.com/package/@pro-acc/ui-vue) | 0.1.0 | 36 ortak Vue 3 bileşeni (Nuxt'suz): form, ERP liste/form/rapor, composable'lar, tema, fontlar, tr/sq/en |
| [@pro-acc/ui](https://www.npmjs.com/package/@pro-acc/ui) | 0.0.2 (depoda 0.1.0) | Nuxt modülü: ui-vue bileşenlerini Nuxt'a kaydeder + POS arayüzü |
| [@pro-acc/pos-core](https://www.npmjs.com/package/@pro-acc/pos-core) | 0.0.3 | POS/Restoran katmanı, ortak security ve eşzamanlı GET birleştirmesi |

## Geliştirme

Node 22+ ve pnpm 12.10.1 ile:

```sh
pnpm install
pnpm test
pnpm build
```

UI'nın kanonik kaynakları packages/ui-vue/src altındadır (Nuxt'tan bağımsız). packages/ui yalnız Nuxt köprüsü ve POS arayüzüdür. POS çekirdeği UI paketini kullanır. Uygulama verisi ve kimlik bilgileri depoda tutulmaz.

## Yayın

Paket sürümünü artırın, testleri çalıştırın, ilgili paket dizininde npm publish --access public kullanın. npm hesabı yayın sırasında 2FA ister. Npm sayfalarındaki repository/homepage bağlantıları bu depoyu gösterir.

Paket belgeleri: [UI](packages/ui/README.md), [POS core](packages/pos-core/README.md).
