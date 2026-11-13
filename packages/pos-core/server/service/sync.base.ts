// sync.base.ts — Terminal ↔ Main senkronizasyonu — pos + restoran ORTAK.
//   pushSession: Z-Rapor kapanınca oturumu main'e tek Order + ürün bazında OrderItem olarak gönderir.
//   pullProducts: main'den ürün/menü kataloğunu çeker (yerel katalog upsert).
// Main bağlantısı (mainApiUrl + syncKey) ayar kaydı > env önceliğiyle çözülür; istekler x-pos-key taşır.
//
// Uygulama farkları `~~/server/utils/localDb` profilinden gelir:
//   TERMINAL_KIND        → /api/pos/* ↔ /api/restaurant/*
//   PRODUCTS_ENDPOINT    → /api/pos/products ↔ /api/restaurant/menu
//   TERMINAL_NAME_FIELD  → payload'daki posName ↔ restaurantName
//   SYNC_PAYLOAD_EXTRA   → restoranda kind:"restaurant" (main'i çift-satır üreticiye yönlendirir)
//   mapExtraProductFields→ restoranda categoryId + hasRecipe
//   prepareProductRelations → ürün yazılmadan önce yerel ilişkileri hazırlar (restoranda menü kategorisi)
import { randomUUID } from "node:crypto";
import {
  localDb,
  TERMINAL_KIND,
  TERMINAL_NAME_FIELD,
  PRODUCTS_ENDPOINT,
  SYNC_PAYLOAD_EXTRA,
  mapExtraProductFields,
  prepareProductRelations,
} from "~~/server/utils/localDb";
import { toNumber } from "../utils/decimal.ts";
import { groupPaymentsForMain } from "../utils/tender.ts";
import { settingsService } from "~~/server/service/settings.service";
import { customerService } from "./customer.base.ts";
import { groupItemsForMain, customerSalesForMain, cashCountForMain } from "../utils/sessionPayload.ts";

export class SyncService {
  /** Main API alan kökü: `/api/pos` ya da `/api/restaurant`. */
  protected get apiBase() {
    return `/api/${TERMINAL_KIND}`;
  }

  /**
   * Senkron sağlık özeti (üst bar rozeti): kapalı ama main'e senkronlanmamış vardiya
   * sayısı, son hata ve son başarılı senkron zamanı.
   * @returns {{ pendingCount, lastError, lastSync }}
   */
  async getHealth() {
    const unsynced = await localDb.client.zReportSession.findMany({
      where: { isSyncedToMain: false, closedAt: { not: null } },
      orderBy: { closedAt: "desc" },
      select: { id: true, zReportNo: true, syncError: true, closedAt: true },
    });
    const settings = await localDb.settings.findUnique({
      where: { id: "DEFAULT" },
      select: { lastSync: true },
    });
    return {
      pendingCount: unsynced.length,
      lastError: unsynced[0]?.syncError || null,
      lastSync: settings?.lastSync || null,
    };
  }

  /**
   * Kapalı bir vardiyayı main'e gönderir.
   * Kalemler ürün bazında (productId+unitPrice+vatRate) gruplanır.
   *
   * Sonuç `status` alanı üç durumdan biridir (ekranlar YALNIZ buna bakar):
   *   "synced" → main işledi (orderId var); yerelde isSyncedToMain=true
   *   "queued" → main kuyruğa aldı / yeniden deniyor; yerelde isSyncedToMain=false, syncError=null
   *   "failed" → kesin hata; yerelde syncError yazılı ("Tekrar Gönder" gerekir)
   * Aynı durum yerel ZReportSession alanlarına da yazılır → sayfa yenilense de aynı görünür.
   * @returns {{ ok: boolean, status: "synced"|"queued"|"failed", orderId?: number, error?: string }}
   */
  async pushSession(sessionId: number) {
    const { mainApiUrl, syncKey, settings } = await settingsService.resolveMainConnection();

    if (!mainApiUrl) {
      const error = "main_api_url_missing";
      await localDb.client.zReportSession.update({ where: { id: sessionId }, data: { syncError: error } });
      return { ok: false, status: "failed" as const, error };
    }

    const session = await localDb.client.zReportSession.findUnique({
      where: { id: sessionId },
      include: { orders: { include: { items: { include: { product: true } }, payments: true } } },
    });
    if (!session) return { ok: false, status: "failed" as const, error: "session_not_found" };

    // Benzersiz senkron kimliği (UUID): idempotans anahtarı. Şema default ile üretir; eski
    // satırlar backfill edildi — yine de boşsa burada üretip kalıcılaştır (garanti).
    let syncUuid: string = session.syncUuid;
    if (!syncUuid) {
      syncUuid = randomUUID();
      await localDb.client.zReportSession.update({ where: { id: sessionId }, data: { syncUuid } });
    }

    // Kalemleri ürün bazında grupla — vardiyanın TÜM satışları (şirket müşterisi fişleri dahil).
    const items = groupItemsForMain(session.orders);

    // Ödemeleri normalize yöntem + GL hesabına göre grupla (kural tender.ts'de):
    //   CASH → kasa hesabı · CARD_CREDIT / CARD_DEBIT (+ eski CARD) → terminalin hesabı
    const terminals = await localDb.client.bankTerminal.findMany();
    const paymentCtx = {
      cashGlAccountId: settings.cashGlAccountId,
      terminalGlById: new Map(terminals.map((t: any) => [t.id, t.glAccountId])),
    };
    const payments = groupPaymentsForMain(session.orders.flatMap((o: any) => o.payments), paymentCtx);

    // Şirket müşterisi fişleri ayrıca listelenir (toplamda da dururlar — bkz. sessionPayload.ts).
    const customerSales = customerSalesForMain(session.orders, paymentCtx);
    const cashCount = cashCountForMain(session);

    const payload = {
      syncUuid, // idempotans anahtarı — main aynı vardiyayı iki kez işlemez
      ...SYNC_PAYLOAD_EXTRA,
      [TERMINAL_NAME_FIELD]: settings[TERMINAL_NAME_FIELD],
      fiscalNumber: settings.fiscalNumber,
      vatNumber: settings.vatNumber,
      warehouseId: settings.warehouseId,
      accountId: settings.defaultAccountId ?? null,
      zReportNo: session.zReportNo,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      totalAmount: toNumber(session.totalAmount),
      totalVat: toNumber(session.totalVat),
      items,
      payments,
      ...(cashCount && { cashCount }),
      ...(customerSales.length && { customerSales }),
    };

    try {
      const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/sessions`, {
        method: "POST",
        headers: { "x-pos-key": syncKey },
        body: payload,
      });

      // Yanıt iki biçimde gelebilir:
      //   { orderId }            → main vardiyayı (zaten) işlemiş (idempotent) → synced işaretle.
      //   { queued:true, ... }   → bekleme salonuna alındı (HTTP 202). Worker arka planda işleyecek.
      //                            Durumu kısa süre poll ederek teyit et; teyit gelmezse "beklemede"
      //                            bırak (HATA DEĞİL) — tekrar gönderim idempotenttir.
      let orderId: number | undefined = res && typeof res.orderId === "number" ? res.orderId : undefined;

      if (orderId === undefined && res?.queued) {
        orderId = await this.confirmQueued(mainApiUrl, syncKey, syncUuid);
        if (orderId === undefined) {
          // Henüz işlenmedi → beklemede (hata yok). UI "Tekrar Gönder" ile yeniden poll/enqueue eder.
          await localDb.client.zReportSession.update({
            where: { id: sessionId },
            data: { isSyncedToMain: false, syncError: null },
          });
          return { ok: true, status: "queued" as const, queued: true, syncUuid };
        }
      }

      // Beklenmeyen yanıt (örn. yanlış URL → login HTML): ne orderId ne queued → başarısız say.
      if (orderId === undefined) {
        throw new Error("unexpected_response");
      }

      await localDb.client.zReportSession.update({
        where: { id: sessionId },
        data: { isSyncedToMain: true, syncedOrderId: orderId, syncError: null },
      });
      await localDb.settings.update({ where: { id: "DEFAULT" }, data: { lastSync: new Date() } }).catch(() => {});
      return { ok: true, status: "synced" as const, orderId };
    } catch (e: any) {
      const error = e?.data?.statusMessage || e?.statusMessage || e?.message || "sync_failed";
      await localDb.client.zReportSession.update({
        where: { id: sessionId },
        data: { isSyncedToMain: false, syncError: String(error) },
      });
      return { ok: false, status: "failed" as const, error: String(error) };
    }
  }

  /**
   * Kuyruğa alınan (202) vardiyanın işlenmesini kısa süre poll eder.
   * main GET /api/<kind>/sessions/status?uuid=... → DONE olunca Order.id döner.
   * @returns orderId (işlendiyse) veya undefined (henüz beklemede / başarısız).
   */
  protected async confirmQueued(
    mainApiUrl: string,
    syncKey: string,
    syncUuid: string,
    attempts = 6,
    delayMs = 500,
  ): Promise<number | undefined> {
    for (let i = 0; i < attempts; i++) {
      await new Promise((r) => setTimeout(r, delayMs));
      let st: any;
      try {
        st = await $fetch(`${mainApiUrl}${this.apiBase}/sessions/status`, {
          headers: { "x-pos-key": syncKey },
          query: { uuid: syncUuid },
        });
      } catch {
        // geçici ağ hatası — bir sonraki denemede yeniden poll et
        continue;
      }
      if (st?.status === "DONE" && typeof st.orderId === "number") return st.orderId;
      // FAILED iki anlama gelir (main pos-sync.service.getStatus):
      //   retryExhausted:false → main işçisi yeniden deneyecek → KESİN HATA DEĞİL, beklemeye devam
      //   retryExhausted:true veya alan yok (eski main) → kesin hata; syncError'da görünür kıl
      if (st?.status === "FAILED" && st.retryExhausted !== false) {
        throw new Error(st.lastError || "sync_failed");
      }
    }
    return undefined;
  }

  /**
   * Main'den kurulum bilgisini çeker (firma adı, depo adı, "Blerësi Fizik" carisi)
   * ve ayar kaydına önbelleğe alır (üst bar / MAĞAZA / MÜŞTERİ alanları için).
   * @returns {{ ok, company, warehouse, account }}
   */
  async bootstrap() {
    const { mainApiUrl, syncKey, settings } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) throw createError({ statusCode: 400, statusMessage: "main_api_url_missing" });

    const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/bootstrap`, {
      headers: { "x-pos-key": syncKey },
    });
    if (!res || !res.company) throw createError({ statusCode: 502, statusMessage: "unexpected_response" });

    const warehouses: any[] = res.warehouses || [];
    const wh = warehouses.find((w) => w.id === settings.warehouseId) || warehouses[0];

    await settingsService.update({
      companyName: res.company?.name ?? null,
      warehouseName: wh?.name ?? null,
      defaultAccountId: res.defaultAccount?.id ?? settings.defaultAccountId ?? null,
      defaultAccountName: res.defaultAccount?.name ?? settings.defaultAccountName ?? "Blerësi Fizik",
    });

    return { ok: true, company: res.company?.name, warehouse: wh?.name, account: res.defaultAccount?.name, warehouses };
  }

  /**
   * Main'den banka/kasa GL hesaplarını (kod 1000–1050) çeker.
   * Banka terminali eklerken hesap seçimi için kullanılır.
   * @returns {Array<{id,code,name}>}
   */
  async fetchBankAccounts() {
    const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) throw createError({ statusCode: 400, statusMessage: "main_api_url_missing" });
    const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/gl-accounts`, {
      headers: { "x-pos-key": syncKey },
    });
    return Array.isArray(res) ? res : [];
  }

  /** Main'den depoları çeker. */
  async fetchWarehouses() {
    return (await this.fetchBootstrapField("warehouses")) as any[];
  }

  /** Main'den şirketleri çeker. */
  async fetchCompanies() {
    return (await this.fetchBootstrapField("companies")) as any[];
  }

  /** Main'den carileri çeker. */
  async fetchAccounts() {
    return (await this.fetchBootstrapField("accounts")) as any[];
  }

  /** bootstrap yanıtından tek bir listeyi güvenle okur (bağlantı yoksa boş dizi). */
  private async fetchBootstrapField(field: string) {
    const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) return [];
    const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/bootstrap`, {
      headers: { "x-pos-key": syncKey },
    }).catch(() => null);
    return res?.[field] || [];
  }

  /**
   * Main'den terminalde giriş yapabilecek kullanıcıları çeker ve yerel önbelleğe upsert eder.
   * (Yalnız POS rolü (pos.use) + SUPER_ADMIN; passwordHash dahil → OFFLINE giriş.)
   * Artık eligible olmayan yerel kullanıcılar pasifleştirilir (silinmez).
   * @returns {{ count: number }}
   */
  async pullUsers() {
    const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) throw createError({ statusCode: 400, statusMessage: "main_api_url_missing" });

    const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/users`, {
      headers: { "x-pos-key": syncKey },
    });
    const list: any[] = Array.isArray(res) ? res : (res?.items ?? []);

    const seenIds: number[] = [];
    for (const u of list) {
      const data = {
        id: Number(u.id),
        email: String(u.email).toLowerCase().trim(),
        firstName: String(u.firstName ?? ""),
        lastName: String(u.lastName ?? ""),
        passwordHash: String(u.passwordHash),
        roleKey: String(u.roleKey ?? "POS_OPERATOR"),
        isActive: u.isActive ?? true,
      };
      if (!data.passwordHash) continue;
      await localDb.users.upsert({ where: { id: data.id }, create: data, update: data });
      seenIds.push(data.id);
    }

    // Main'de artık yetkili olmayanları yerelde pasifleştir
    if (seenIds.length) {
      await localDb.users.updateMany({
        where: { id: { notIn: seenIds } },
        data: { isActive: false },
      });
    }
    return { count: seenIds.length };
  }

  /**
   * Main'den şirket müşterilerini çeker ve yerel önbelleğe yazar (çevrimdışı arama için).
   * Main eski sürümdeyse `customers` alanı gelmez → önbelleğe DOKUNULMAZ.
   * @returns {{ count: number }}
   */
  async pullCustomers() {
    const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) throw createError({ statusCode: 400, statusMessage: "main_api_url_missing" });
    const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/bootstrap`, { headers: { "x-pos-key": syncKey } });
    if (!Array.isArray(res?.customers)) return { count: 0 };
    return await customerService.replaceFromMain(res.customers);
  }

  /**
   * Main'den ürün/menü kataloğunu çeker ve yerel katalog modeline upsert eder.
   * @returns {{ count: number }}
   */
  async pullProducts() {
    const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) throw createError({ statusCode: 400, statusMessage: "main_api_url_missing" });

    const res: any = await $fetch(`${mainApiUrl}${this.apiBase}/${PRODUCTS_ENDPOINT}`, {
      headers: { "x-pos-key": syncKey },
    });
    const list: any[] = Array.isArray(res) ? res : (res?.items ?? []);

    let count = 0;
    for (const p of list) {
      const data = {
        id: Number(p.id),
        code: String(p.code),
        name: String(p.name),
        sellPrice: toNumber(p.sellPrice),
        vatRate: Number(p.vatRate ?? 18),
        unitId: Number(p.unitId ?? 1),
        // SEF ölçü birimi (Njësia Matëse) — main kataloğundan taşınır; yoksa null
        unitCode: p.unitCode ?? null,
        unitSymbol: p.unitSymbol ?? null,
        // SEF mal/hizmet kategori kodu — main kataloğundan taşınır; yoksa null
        sefCategoryCode: p.sefCategoryCode ?? null,
        isActive: p.isActive ?? true,
        ...mapExtraProductFields(p),
      };
      // Yerel FK hedefleri (ör. restoran MenuCategory) ürün yazılmadan ÖNCE var olmalı —
      // yoksa boş bir terminalde ilk katalog senkronu yabancı anahtar hatasıyla düşer.
      await prepareProductRelations(p);
      await localDb.products.upsert({ where: { id: data.id }, create: data, update: data });
      count++;
    }
    return { count };
  }
}

export const syncService = new SyncService();
