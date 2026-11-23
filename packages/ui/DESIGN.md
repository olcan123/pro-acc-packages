# Pro-Acc UI tasarım sözleşmesi

Kanonik bileşenler @pro-acc/ui-vue içindedir (src/components, src/erp/components); POS bileşenleri bu paketin runtime/pos/components klasöründedir. Ortak renk/font/ölçü sözleşmesi @pro-acc/ui-vue src/styles/tokens.css ve src/design-tokens.ts dosyalarındadır.

- field-*, btn-*, badge-* sınıf adları dış sözleşmedir; sürüm artırmadan değiştirilmez.
- Tarihler dd.mm.yyyy, tutarlar EUR; rapor baskısı ve Excel başlıkları Arnavutçadır.
- Form alanları vee-validate field-name veya desteklenen bağımsız v-model yoluyla kullanılır.
- Ağır Excel okuyucuları yalnız kullanım anında import edilir.
- Bileşen değişikliği için pnpm test çalıştırılır; tüketici uygulamalar da kendi entegrasyon testlerini çalıştırır.
