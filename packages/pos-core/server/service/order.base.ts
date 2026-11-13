// order.base.ts — Fiş (Order) iş mantığı — pos + restoran ORTAK.
// Sepet → fiş, toplam/KDV hesabı, vardiya toplamı güncellemesi ve mali fiş basımı.
// Fiyatlar KDV DAHİL (perakende "Çmimi me TVSH"): vat = gross * rate / (100 + rate).
// orderNo üretimi: SQLite auto-increment id kullanır → P2002 çakışması matematiksel olarak imkânsızdır.
import { localDb } from "~~/server/utils/localDb";
import { splitCashCard } from "../utils/tender.ts";
import { calcLine, round2 } from "../utils/orderMath.ts";
import { sessionService } from "~~/server/service/session.service";
import { settingsService } from "~~/server/service/settings.service";
import { FiscalPrinterService, toFiscalId, type FiscalItem } from "~~/server/utils/fiscalPrinter";
import { customerOrderFields, customerReceiptLine, type OrderCustomerInput } from "../utils/customer.ts";

type OrderInput = { items: any[]; payments: any[]; customer?: OrderCustomerInput | null };

export class OrderService {
  /**
   * Yeni fiş oluşturur. Açık vardiya yoksa otomatik açar.
   * Yazım kendi transaction'ında yapılır (bkz. writeOrder); ardından mali fiş basılır.
   *
   * @param {object} input - { items[], payments[], skipFiscal? }
   *   skipFiscal=true → mali fiş BASILMAZ (restoran akışı: kupon tur başına basılır,
   *   masa kapanışında yeniden basılmaz; yalnız satış kaydı + vardiya toplamı yazılır).
   *   POS bu bayrağı kullanmaz → her satışta fiş basılır.
   * @returns Oluşturulan fiş (items + payments dahil)
   */
  async createOrder(input: OrderInput & { skipFiscal?: boolean }) {
    const session = await sessionService.open();

    // Şirket müşterisi seçildiyse fişe anlık kopya olarak yazılır (boşsa nihai tüketici).
    const order = await localDb.client.$transaction((tx: any) =>
      this.writeOrder(tx, session, input, customerOrderFields(input.customer)),
    );

    // Satış kaydedildikten sonra mali yazıcıya (FLink) fiş gönder.
    // Best-effort: fiş basımı başarısız olsa bile satış kaydı korunur (asla throw etmez).
    // Restoran akışında kupon tur başına (adisyon.placeRound) basıldığından kapanışta atlanır.
    if (!input.skipFiscal) await this.emitFiscalReceipt(order, input.items);

    return order;
  }

  /**
   * Fişi VERİLEN transaction içinde yazar: fiş + kalemler + ödemeler + vardiya yürüyen toplamı.
   * Çağıran, fişle birlikte başka kayıtları da aynı transaction'da yazabilir (ör. restoran
   * adisyon kapanışı) → ya hepsi yazılır ya hiçbiri; tekrar denemede çift fiş oluşmaz.
   *
   * orderNo stratejisi:
   *   1. Önce geçici (benzersiz timestamp) bir orderNo ile kaydı yaz → SQLite id atar.
   *   2. Atanan id ile asıl orderNo'yu güncelle: "Z{zReportNo}-{id}" (P2002 imkânsız).
   *
   * @param tx         Prisma transaction istemcisi
   * @param session    Açık Z-vardiyası ({ id, zReportNo })
   * @param input      { items[], payments[] } — ödemeler doğrulanmış/normalize olmalı
   * @param extraData  Fiş kaydına eklenecek uygulamaya özel alanlar (restoran: tableSessionId)
   */
  async writeOrder(
    tx: any,
    session: { id: number; zReportNo: number },
    input: OrderInput,
    extraData: Record<string, unknown> = {},
  ) {
    // Kalem toplamları (KDV dahil) — satır formülü orderMath.ts'de
    const lines = input.items.map((it) => {
      const { gross, vat } = calcLine(it);
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        totalAmount: gross,
        _vat: vat,
      };
    });
    const totalAmount = round2(lines.reduce((s, l) => s + l.totalAmount, 0));
    const totalVat = round2(lines.reduce((s, l) => s + l._vat, 0));

    // Ödeme dağılımı (nakit/kart) — vardiya toplamları için (kart ailesi kuralı tender.ts'de)
    const { cash, card } = splitCashCard(input.payments);

    // 1. Geçici (benzersiz timestamp) orderNo ile kayıt oluştur → id atanır
    const draft = await tx.order.create({
      data: {
        sessionId: session.id,
        zReportNo: session.zReportNo,
        orderNo: `DRAFT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // benzersiz geçici değer
        totalAmount,
        totalVat,
        ...extraData,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            totalAmount: l.totalAmount,
          })),
        },
        payments: {
          create: input.payments.map((p) => ({
            paymentMethod: p.paymentMethod,
            amount: p.amount,
            bankTerminalId: p.bankTerminalId ?? null,
          })),
        },
      },
      include: { items: true, payments: true },
    });

    // 2. Atanan id ile kalıcı orderNo'yu yaz — id benzersizdir, P2002 imkânsız
    const orderNo = `Z${session.zReportNo}-${draft.id}`;
    const order = await tx.order.update({
      where: { id: draft.id },
      data: { orderNo },
      include: { items: true, payments: true },
    });

    // 3. Vardiya yürüyen toplamlarını güncelle
    await tx.zReportSession.update({
      where: { id: session.id },
      data: {
        totalAmount: { increment: totalAmount },
        totalVat: { increment: totalVat },
        totalCash: { increment: cash },
        totalCard: { increment: card },
      },
    });

    return order;
  }

  /**
   * Kaydedilen fişi Tremol FLink mali yazıcısına gönderir (izlenen klasöre `.INP` yazar).
   * Yapılandırma `runtimeConfig.fiscal`ten gelir; kapalıysa (varsayılan) hiçbir şey yapmaz.
   * Hatalar yutulur ve loglanır — mali yazıcı sorunu satışı engellememelidir.
   */
  protected async emitFiscalReceipt(
    order: { id?: number; date?: Date; customerName?: string | null; customerFiscalNumber?: string | null },
    lines: { productId: number; quantity: number; unitPrice: number; vatRate: number }[],
  ): Promise<void> {
    try {
      const cfg = await settingsService.getFiscalConfig();
      if (!cfg.enabled) return;

      // Ürün adları cihaz fişinde gösterilir; OrderItem yalnız productId tutar → adları çöz.
      const ids = [...new Set(lines.map((l) => l.productId))];
      const products = await localDb.products.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      const nameById = new Map<number, string>(products.map((p: any) => [p.id, p.name]));

      const items: FiscalItem[] = lines.map((l) => ({
        name: nameById.get(l.productId) ?? `#${l.productId}`,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        vatRate: l.vatRate,
      }));

      const printer = new FiscalPrinterService(cfg);
      const file = printer.printReceipt({
        fiscalId: toFiscalId(order.date ? new Date(order.date) : new Date()),
        localOrderId: order.id,
        items,
        // Şirket müşterisi: mali numara (NUI) fişin dip satırına yazılır.
        customerLine: customerReceiptLine({ name: order.customerName, fiscalNumber: order.customerFiscalNumber }),
      });
      console.log(`[fiscal] Mali fiş yazıldı: ${file}`);
    } catch (err) {
      console.error("[fiscal] Mali fiş yazılamadı (satış kaydı korundu):", err);
    }
  }

  /** Açık vardiyanın fişleri. */
  async listForCurrentSession() {
    const session = await sessionService.getCurrent();
    if (!session) return [];
    return await localDb.client.order.findMany({
      where: { sessionId: session.id },
      include: { items: true, payments: true },
      orderBy: { id: "desc" },
    });
  }
}

export const orderService = new OrderService();
