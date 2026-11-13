# Pro-Acc UI tasarım sözleşmesi

Kanonik bileşenler runtime/components, runtime/erp/components ve runtime/pos/components içindedir. Ortak renk/font/ölçü sözleşmesi runtime/styles/tokens.css ve runtime/design-tokens.ts dosyalarındadır.

- field-*, btn-*, badge-* sınıf adları dış sözleşmedir; sürüm artırmadan değiştirilmez.
- Tarihler dd.mm.yyyy, tutarlar EUR; rapor baskısı ve Excel başlıkları Arnavutçadır.
- Form alanları vee-validate field-name veya desteklenen bağımsız v-model yoluyla kullanılır.
- Ağır Excel okuyucuları yalnız kullanım anında import edilir.
- Bileşen değişikliği için pnpm test çalıştırılır; tüketici uygulamalar da kendi entegrasyon testlerini çalıştırır.
