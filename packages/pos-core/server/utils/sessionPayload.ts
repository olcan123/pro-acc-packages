// sessionPayload.ts — Vardiya (Z-rapor) → main yükünün saf yapı taşları — pos + restoran ORTAK.
// DB'ye dokunmaz: kalem gruplama, şirket müşterisi fişleri ve kasa sayımı alanları.
import { toNumber } from "./decimal.ts";
import { groupPaymentsForMain } from "./tender.ts";
import { hasCustomer } from "./customer.ts";
import { computeCashCount, type CashCountInput } from "@pro-acc/ui/utils/cash-count";

type PaymentContext = Parameters<typeof groupPaymentsForMain>[1];

/** Fiş kalemlerini ürün + birim fiyat + KDV bazında gruplar (main tarafı net'e çevirir). */
export function groupItemsForMain(orders: any[]): any[] {
  const itemMap = new Map<string, any>();
  for (const o of orders) {
    for (const it of o.items) {
      const unitPrice = toNumber(it.unitPrice);
      const key = `${it.productId}|${unitPrice}|${it.vatRate}`;
      const prev = itemMap.get(key);
      if (prev) {
        prev.quantity += toNumber(it.quantity);
        prev.totalAmount += toNumber(it.totalAmount);
      } else {
        itemMap.set(key, {
          productId: it.productId,
          code: it.product?.code ?? String(it.productId),
          quantity: toNumber(it.quantity),
          unitPrice, // KDV DAHİL birim fiyat
          vatRate: it.vatRate,
          totalAmount: toNumber(it.totalAmount),
        });
      }
    }
  }
  return Array.from(itemMap.values());
}

/**
 * ŞİRKET MÜŞTERİSİ FİŞLERİ — vardiya toplamının İÇİNDE de gönderilir, AYRICA burada listelenir.
 * Main yeni sürümdeyse bunları toplamdan düşüp carinin kendi belgesi yapar; eski sürümdeyse
 * bu alanı yok sayar ve satış toplamda kalır → hiçbir satış kaybolmaz.
 */
export function customerSalesForMain(orders: any[], paymentCtx: PaymentContext): any[] {
  return orders.filter(hasCustomer).map((o: any) => ({
    uuid: String(o.uuid ?? o.id),
    orderNo: o.orderNo,
    date: o.date,
    accountId: o.customerId ?? null,
    name: o.customerName || o.customerFiscalNumber,
    fiscalNumber: o.customerFiscalNumber ?? null,
    vatNumber: o.customerVatNumber ?? null,
    items: groupItemsForMain([o]),
    payments: groupPaymentsForMain(o.payments ?? [], paymentCtx),
  }));
}

/** Kapanışta kasiyerin girdiği sayım (beklenen nakit sunucuda hesaplanır — istemciye güvenilmez). */
export type CashCountEntry = Pick<CashCountInput, "openingFloat" | "counts" | "countedTotal">;

/** Sayım sonucunu ZReportSession alanlarına çevirir (sayım yoksa boş nesne → alanlar NULL kalır). */
export function cashCountSessionFields(entry: CashCountEntry | null | undefined, cashSales: number) {
  const result = entry ? computeCashCount({ ...entry, cashSales }) : null;
  if (!result) return {};
  return {
    openingFloat: result.openingFloat,
    expectedCash: result.expected,
    countedCash: result.counted,
    cashDifference: result.difference,
    cashCountJson: JSON.stringify(result.breakdown),
  };
}

/** Vardiyanın kasa sayımını main yüküne çevirir (sayım yapılmadıysa null). */
export function cashCountForMain(session: any) {
  if (session?.countedCash === null || session?.countedCash === undefined) return null;
  let breakdown: Record<string, number> | undefined;
  try {
    breakdown = session.cashCountJson ? JSON.parse(session.cashCountJson) : undefined;
  } catch {
    breakdown = undefined;
  }
  return {
    openingFloat: toNumber(session.openingFloat),
    expected: toNumber(session.expectedCash),
    counted: toNumber(session.countedCash),
    difference: toNumber(session.cashDifference),
    ...(breakdown && Object.keys(breakdown).length > 0 && { breakdown }),
  };
}
