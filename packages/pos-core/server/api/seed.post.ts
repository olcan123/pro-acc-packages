// POST /api/seed — Geliştirme/ilk kurulum: demo ürünler + DEFAULT ayar + örnek terminal.
// pos + restoran ORTAK; model/alan farkları `~~/server/utils/localDb` profilinden gelir.
import { localDb, TERMINAL_NAME_FIELD } from "~~/server/utils/localDb";
import { settingsService } from "~~/server/service/settings.service";

// Demo katalog (fiyatlar KDV DAHİL)
const DEMO_PRODUCTS = [
  { id: 1, code: "3830024962292", name: "2IN1 MAX TRAKA", sellPrice: 10.0, vatRate: 18, unitId: 1 },
  { id: 2, code: "8606017512345", name: "PURE MAGNESIUM 5", sellPrice: 8.5, vatRate: 8, unitId: 1 },
  { id: 3, code: "3850000000017", name: "MENTOCAINA-R", sellPrice: 3.2, vatRate: 8, unitId: 1 },
  { id: 4, code: "3850000000024", name: "DIAREXYL SUSPENSION", sellPrice: 4.75, vatRate: 8, unitId: 1 },
  { id: 5, code: "3850000000031", name: "VITAMIN C 500", sellPrice: 2.9, vatRate: 8, unitId: 1 },
  { id: 6, code: "3850000000048", name: "PROPOLI PLUS", sellPrice: 6.4, vatRate: 8, unitId: 1 },
];

export default defineEventHandler(async () => {
  for (const p of DEMO_PRODUCTS) {
    await localDb.products.upsert({
      where: { id: p.id },
      create: { ...p, isActive: true },
      update: { ...p, isActive: true },
    });
  }

  await localDb.client.bankTerminal.upsert({
    where: { id: "POS-1" },
    create: { id: "POS-1", name: "BKT POS", glAccountId: 1, isActive: true },
    update: {},
  });

  await settingsService.getOrInit();
  // Offline gösterim için makul varsayılan adlar (main bootstrap bunları günceller)
  const settings = await settingsService.update({
    [TERMINAL_NAME_FIELD]: "ARKA-1", // cihaz kimliği (orderNo: POS-ARKA-1-Z{n})
    defaultAccountId: 1, // Blerësi Fizik (main'de force id=1) → Z-rapor'da accountId=1 gönderilir
    defaultAccountName: "Blerësi Fizik",
  });

  return { ok: true, products: DEMO_PRODUCTS.length, settings };
});
