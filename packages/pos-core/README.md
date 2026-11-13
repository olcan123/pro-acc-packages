# @pro-acc/pos-core

Pro-Acc POS/Restoran ortak Nuxt 4 katmanı. UI uygulaması ve veritabanı bu paketten bağımsızdır; tüketici kendi Prisma istemcisini, server/service sınıflarını ve API plugin'ini sağlar.

```sh
pnpm add @pro-acc/ui@0.0.2 @pro-acc/pos-core@0.0.2
```

POS/Restoran Nuxt yapılandırması extends: ["@pro-acc/pos-core"] kullanır. Bu katman @pro-acc/ui modülünü pos:true ile kaydeder. Paylaşılan route'lar hizmetleri tüketici kökü üzerinden (~~/server/service) çağırır; uygulama override davranışı korunur.

Yalnız HTTP güvenliği ve güncelleme kontrolü isteyen uygulama extends: ["@pro-acc/pos-core/security"] kullanabilir; bu alt katman POS API'larını kurmaz.

UI bileşenleri/store'ları yalnız @pro-acc/ui paketinde tanımlıdır. Bu paket ortak sayfalar, repository modülleri ve Nitro servis/API kodunu tutar. Hesap/DB anahtarları tüketici runtimeConfig ile sağlanır.

CRUD factory 0.0.2 ile aynı Nuxt fetcher'ındaki eşzamanlı, eşit GET sorgularını birleştirir. Tamamlanan yanıtlar önbellekte tutulmaz; mutasyon eski uçuşları geçersizleştirir. Özel headers/signal/hook taşıyan istekler paylaşılmaz. Farklı fetcher/Nuxt örnekleri birbirinden izoledir. Main aynı factory'yi `@pro-acc/pos-core/app/repository/factory` export'undan kullanabilir.

[GitHub kaynakları](https://github.com/olcan123/pro-acc-packages/tree/main/packages/pos-core) · [npm](https://www.npmjs.com/package/@pro-acc/pos-core)
