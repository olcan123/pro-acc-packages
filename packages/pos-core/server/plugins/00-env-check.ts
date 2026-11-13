// 00-env-check.ts — POS/Restoran boot uyarısı: oturum sırrı yapılandırılmamışsa görünür log.
// terminalSession.ts sır yoksa rastgele GEÇİCİ sır üretir (güvenli varsayılan) ama oturumlar
// her yeniden başlatmada düşer — operatörün bunu boot logunda net görmesi gerekir.
// Fatal DEĞİLDİR: geçici sır güvenlik açığı yaratmaz, yalnız operasyonel rahatsızlıktır.
export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.POS_SESSION_SECRET || process.env.RESTAURANT_SESSION_SECRET) return;

  console.warn(
    "[env-check][UYARI] POS_SESSION_SECRET / RESTAURANT_SESSION_SECRET tanımlı değil — " +
      "oturum çerezleri her yeniden başlatmada geçersizleşir (kullanıcılar tekrar giriş yapar). " +
      "config/.env.production dosyasına 32+ karakterlik rastgele bir sır ekleyin."
  );
});
