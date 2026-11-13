# Pro-Acc Packages

Pro-Acc'tan bağımsız geliştirilen ve npm üzerinden tüketilen paketler. Kaynak kodu bu depodadır; derleme için Pro-Acc deposu gerekmez.

| Paket | Sürüm | Kullanım |
| --- | --- | --- |
| [@pro-acc/ui](https://www.npmjs.com/package/@pro-acc/ui) | 0.0.2 | 48 ortak Nuxt/Vue bileşeni, tema, form, rapor ve POS arayüzü |
| [@pro-acc/pos-core](https://www.npmjs.com/package/@pro-acc/pos-core) | 0.0.2 | POS/Restoran katmanı, ortak security ve eşzamanlı GET birleştirmesi |

## Geliştirme

Node 22+ ve pnpm 12.10.1 ile:

```sh
pnpm install
pnpm test
pnpm build
```

UI'nın kanonik kaynakları packages/ui/runtime altındadır. POS çekirdeği bu UI paketini kullanır. Uygulama verisi ve kimlik bilgileri depoda tutulmaz.

## Yayın

Paket sürümünü artırın, testleri çalıştırın, ilgili paket dizininde npm publish --access public kullanın. npm hesabı yayın sırasında 2FA ister. Npm sayfalarındaki repository/homepage bağlantıları bu depoyu gösterir.

Paket belgeleri: [UI](packages/ui/README.md), [POS core](packages/pos-core/README.md).
