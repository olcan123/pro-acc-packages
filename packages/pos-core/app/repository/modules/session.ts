// session.ts — Z-Rapor vardiyası API modülü ($api.session) — pos + restoran ORTAK.
// xReport yalnız restoranda bir uca bağlıdır (POST /api/session/x-report); POS'ta çağrılmaz.
import FetchFactory from "../factory.ts";

export class SessionModule extends FetchFactory<any> {
  protected RESOURCE = "/api/session";

  /** Açık vardiya (yoksa null). */
  async current() { return this.getAll(`${this.RESOURCE}/current`); }

  /** X-Raporu: güncel vardiya toplamları + mali cihaza X-raporu bas (kapatmaz). */
  async xReport() { return this.create(`${this.RESOURCE}/x-report`, {}); }

  /** Vardiya aç. */
  async open() { return this.create(`${this.RESOURCE}/open`, {}); }

  /**
   * Vardiya kapat (+ main senkron). zReportNo: mali cihaz ekranındaki Z numarası.
   * cashCount: kasa sayımı ({ openingFloat, counts | countedTotal }) — yoksa sayım kaydedilmez.
   */
  async close(sessionId?: number, zReportNo?: number, cashCount?: Record<string, unknown> | null) {
    return this.create(`${this.RESOURCE}/close`, {
      sessionId,
      ...(zReportNo !== undefined && { zReportNo }),
      ...(cashCount && { cashCount }),
    });
  }

  /** Geçmiş vardiyalar. */
  async list() { return this.getAll("/api/sessions"); }

  /** Tek vardiya başlığı (arşiv detayı). */
  async fetchSession(sessionId: number) { return this.getById("/api/sessions", sessionId); }

  /** Belirli bir vardiyaya ait fişler (arşiv). */
  async fetchSessionOrders(sessionId: number) { return this.getAll(`/api/sessions/${sessionId}/orders`); }
}
