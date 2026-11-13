// session.base.ts — ZReportSession (Z-Rapor vardiyası) iş mantığı — pos + restoran ORTAK.
// Açık vardiya = closedAt null. Kapanışta toplamlar yeniden hesaplanır ve main'e senkron tetiklenir.
// Prisma istemcisi `~~/server/utils/localDb` profilinden gelir → her uygulama kendi DB'sini kullanır.
import { localDb } from "~~/server/utils/localDb";
import { toNumber } from "../utils/decimal.ts";
import { splitCashCard } from "../utils/tender.ts";
import { syncService } from "~~/server/service/sync.service";
import { settingsService } from "~~/server/service/settings.service";
import { FiscalPrinterService } from "~~/server/utils/fiscalPrinter";
import { cashCountSessionFields, type CashCountEntry } from "../utils/sessionPayload.ts";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Bir vardiyanın fişlerinden toplamları hesaplar (Z ve X raporu aynı formülü kullanır). */
function sumOrders(orders: any[]) {
  let totalAmount = 0,
    totalVat = 0;
  for (const o of orders) {
    totalAmount += toNumber(o.totalAmount);
    totalVat += toNumber(o.totalVat);
  }
  // Nakit/kart ayrımı (kart ailesi + eski "CARD") tender.ts'de tek yerde
  const { cash, card } = splitCashCard(orders.flatMap((o) => o.payments));
  return {
    totalAmount: round2(totalAmount),
    totalVat: round2(totalVat),
    totalCash: cash,
    totalCard: card,
  };
}

export class SessionService {
  /** Açık (kapatılmamış) en güncel vardiyayı döner; yoksa null. */
  async getCurrent() {
    return await localDb.client.zReportSession.findFirst({
      where: { closedAt: null },
      orderBy: { id: "desc" },
    });
  }

  /** Bir sonraki Z-Rapor numarası (max + 1, ilk 1). */
  async nextZReportNo() {
    const last = await localDb.client.zReportSession.findFirst({ orderBy: { zReportNo: "desc" } });
    return (last?.zReportNo ?? 0) + 1;
  }

  /** Açık vardiya varsa onu döner; yoksa yeni açar. */
  async open() {
    const existing = await this.getCurrent();
    if (existing) return existing;
    const zReportNo = await this.nextZReportNo();
    return await localDb.client.zReportSession.create({ data: { zReportNo } });
  }

  /**
   * Vardiyayı kapatır: toplamları yeniden hesaplar, closedAt yazar, main'e senkronlar.
   * @param sessionId  Kapatılacak vardiya ID'si (opsiyonel, boşsa açık vardiyayı bulur).
   * @param zReportNo  Kullanıcının mali cihaz ekranından okuduğu Z-Rapor numarası.
   *                   Verilmezse DB'deki mevcut numara korunur.
   * @returns {{ session, sync }} kapanan vardiya + senkron sonucu
   */
  async close(sessionId?: number, zReportNo?: number, cashCount?: CashCountEntry | null) {
    const session = sessionId
      ? await localDb.client.zReportSession.findUnique({ where: { id: sessionId } })
      : await this.getCurrent();
    if (!session) throw createError({ statusCode: 404, statusMessage: "no_open_session" });
    if (session.closedAt) throw createError({ statusCode: 400, statusMessage: "session_already_closed" });

    // Z-Rapor tuşu: mali cihaza Z-Raporu (günlük kapanış) komutunu gönder (best-effort).
    await this.emitFiscalZReport();

    // Toplamların yeniden hesabı + kapanış yazımı tek transaction'da (ya hep ya hiç):
    // fişler okunurken tutarsız bir ara duruma düşmesin, kısmi kapanış oluşmasın.
    const closed = await localDb.client.$transaction(async (tx: any) => {
      const orders = await tx.order.findMany({
        where: { sessionId: session.id },
        include: { payments: true },
      });

      const totals = sumOrders(orders);
      return await tx.zReportSession.update({
        where: { id: session.id },
        data: {
          closedAt: new Date(),
          ...totals,
          ...(zReportNo !== undefined && { zReportNo }),
          // Kasa sayımı: beklenen = açılış nakdi + vardiyanın nakit satışı
          ...cashCountSessionFields(cashCount, totals.totalCash),
        },
      });
    });

    // Z-Rapor kapanınca main'e transfer (Order + OrderItem)
    const sync = await syncService.pushSession(closed.id);
    return { session: closed, sync };
  }

  /**
   * X-Raporu: açık vardiyanın GÜNCEL toplamlarını (fişlerden) döner ve mali cihaza X-Raporu bastırır.
   * Vardiyayı KAPATMAZ, sayaçları SIFIRLAMAZ (ara okuma); Z-Rapor'un aksine main'e senkron YAPMAZ.
   * @returns { session, orderCount, totalAmount, totalVat, totalCash, totalCard }
   */
  async xReport() {
    const session = await this.getCurrent();
    if (!session) throw createError({ statusCode: 404, statusMessage: "no_open_session" });

    const orders = await localDb.client.order.findMany({
      where: { sessionId: session.id },
      include: { payments: true },
    });

    // Mali cihaza X-Raporu bastır (best-effort — okuma; vardiyayı etkilemez).
    await this.emitFiscalXReport();

    return { session, orderCount: orders.length, ...sumOrders(orders) };
  }

  /** X-Rapor (vardiya okuma) komutunu mali cihaza yazar. Best-effort. */
  protected async emitFiscalXReport(): Promise<void> {
    try {
      const cfg = await settingsService.getFiscalConfig();
      if (!cfg.enabled) return;
      const file = new FiscalPrinterService(cfg).printXReport();
      console.log(`[fiscal] X-Raporu komutu yazıldı: ${file}`);
    } catch (err) {
      console.error("[fiscal] X-Raporu yazılamadı:", err);
    }
  }

  /**
   * Vardiya kapanışında (Z-Rapor tuşu) mali cihaza Z-Raporu komutunu yazar (FLink → izlenen klasör).
   * Yapılandırma `runtimeConfig.fiscal`ten gelir; kapalıysa hiçbir şey yapmaz.
   * Best-effort: yazılamazsa loglanır, vardiya kapanışını ENGELLEMEZ.
   */
  protected async emitFiscalZReport(): Promise<void> {
    try {
      const cfg = await settingsService.getFiscalConfig();
      if (!cfg.enabled) return;
      const file = new FiscalPrinterService(cfg).printZReport();
      console.log(`[fiscal] Z-Raporu komutu yazıldı: ${file}`);
    } catch (err) {
      console.error("[fiscal] Z-Raporu yazılamadı (vardiya kapanışı korundu):", err);
    }
  }

  /** Geçmiş vardiyalar (senkron durumu dahil). */
  async list() {
    return await localDb.client.zReportSession.findMany({ orderBy: { id: "desc" } });
  }

  /** Bir vardiyaya ait fişler (arşiv) — kalemler (ürün) + ödemeler (terminal) dahil. */
  async getOrders(sessionId: number) {
    return await localDb.client.order.findMany({
      where: { sessionId },
      include: {
        items: { include: { product: true } },
        payments: { include: { bankTerminal: true } },
      },
      orderBy: { id: "asc" },
    });
  }

  /** Tek vardiya (arşiv başlığı için). */
  async findById(sessionId: number) {
    return await localDb.client.zReportSession.findUnique({ where: { id: sessionId } });
  }
}

export const sessionService = new SessionService();
