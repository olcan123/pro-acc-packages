// fiscalPrinter.ts — Tremol FLink mali yazıcı protokolü: POS fişini + Z/X-Raporunu izlenen klasöre `.INP` yazar.
// FLink.exe klasörü (örn. C:\Temp) izler, *.INP komut dosyalarını okur ve COM portundan mali cihaza basar.
//
// pos + restoran ORTAK dosyasıdır. Uygulamalar bunu `server/utils/fiscalPrinter.ts` üzerinden yeniden
// dışa aktarır (Nitro auto-import ve testlerdeki `vi.mock("~~/server/utils/fiscalPrinter")` korunsun diye).
// Cihaz protokolünde uygulamaya özel fark YOKTUR — iki kasa da aynı FLink cihazına basar.
//
// BAŞLIK JOKERDİR: "1,______,_,__" — cihaz seri-no / operatör / şifre alanlarını FLink kendisi doldurur.
// Tüm komut satırları aynı joker başlığı kullanır.
//
// Biçim gerçek cihaz çıktısından doğrulandı:
//   Satış:   S,1,______,_,__;<ad>;<fiyat>;<adet>;1;1;<grup>;0;<satırId>;0;
//   Mesaj:   Q,1,______,_,__;1;<mesaj>   ve   Q,1,______,_,__;2;
//   Kapanış: T,1,______,_,__;0;0          (0 = nakit; 0 = tam tutar)
//   Z-Rapor: Z,1,______,_,__;1
//   Çekmece: V,1,______,_,__;j15
// Satır sonları CRLF (\r\n); son satırdan sonra da CRLF.
import fs from "node:fs";
import path from "node:path";

/** Fiş kalemi (mali cihaza basılacak satış satırı). */
export interface FiscalItem {
  name: string;
  unitPrice: number; // KDV DAHİL birim fiyat (perakende "Çmimi me TVSH")
  quantity: number;
  vatRate: number;   // Kosova oranı: 0 | 8 | 18
}

/** Mali cihaza basılacak fiş. */
export interface FiscalOrder {
  fiscalId: string;      // 14 haneli işlem damgası (yyyyMMddHHmmss) — satır ID kökü
  localOrderId?: number; // SQLite Order.id (yalnız dosya adı / izlenebilirlik için)
  items: FiscalItem[];
  footerMessage?: string;
  /** Şirket müşterisi satırı ("NUI 810000001 Firma") — doluysa dip mesajın 1. satırına basılır. */
  customerLine?: string;
}

/** Çözülmüş mali yazıcı yapılandırması (runtimeConfig.fiscal'den türetilir). */
export interface FiscalConfig {
  enabled: boolean;
  watchDir: string;                   // FLink'in izlediği klasör (örn. C:\Temp)
  vatGroups: Record<number, number>;  // KDV oranı → cihaz vergi grubu (0→3, 8→4, 18→5)
  footerMessage?: string;
}

const HEADER = "1,______,_,__"; // joker başlık — değerleri FLink doldurur
const MAX_NAME = 28;            // cihaz ürün adı satır sınırı
const EOL = "\r\n";           // cihaz CRLF kullanır

// Cihaz ASCII gösterir: Arnavutça/Türkçe aksanlı harfleri sadeleştir, kalan ASCII-dışını at.
const FOLD: Record<string, string> = {
  "ë": "e", "Ë": "E", "ç": "c", "Ç": "C", "ş": "s", "Ş": "S", "ğ": "g", "Ğ": "G",
  "ü": "u", "Ü": "U", "ö": "o", "Ö": "O", "ı": "i", "İ": "I",
  "â": "a", "î": "i", "û": "u", "Ä": "A", "ä": "a",
};
/** Metni ASCII'ye indirger (aksanları sadeleştirir, kalan ASCII-dışını siler). */
export function asciiFold(s: string): string {
  return String(s ?? "")
    .replace(/[ëËçÇşŞğĞüÜöÖıİâîûÄä]/g, (c) => FOLD[c] ?? c)
    .replace(/[^\x20-\x7E]/g, "");
}

/** Sayıyı cihaz biçimine çevirir: tamsa ondalıksız, değilse en çok `maxDec` hane (sondaki sıfırlar atılır). */
export function formatNum(n: number, maxDec: number): string {
  const f = 10 ** maxDec;
  const v = Math.round((Number(n) || 0) * f) / f;
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(maxDec).replace(/0+$/, "").replace(/\.$/, "");
}

/** Tarihi 14 haneli mali işlem damgasına çevirir: yyyyMMddHHmmss. */
export function toFiscalId(d: Date = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

/** runtimeConfig.fiscal → FiscalConfig (güvenli varsayılanlarla). */
export function resolveFiscalConfig(rc: any): FiscalConfig {
  const f = (rc && rc.fiscal) || {};
  // DOĞRULANMIŞ eşleme (cihaz vergi tablosu): 0% → grup 3, 8% → grup 4, 18% → grup 5.
  let vatGroups: Record<number, number> = { 0: 3, 8: 4, 18: 5 };
  if (f.vatGroups) {
    try {
      const parsed = typeof f.vatGroups === "string" ? JSON.parse(f.vatGroups) : f.vatGroups;
      const map: Record<number, number> = {};
      for (const [k, v] of Object.entries(parsed)) map[Number(k)] = Number(v);
      if (Object.keys(map).length) vatGroups = map;
    } catch {
      // geçersiz JSON → varsayılan korunur
    }
  }
  return {
    enabled: f.enabled === true || f.enabled === "true",
    watchDir: (f.watchDir && String(f.watchDir)) || "C:\\TEMP",
    vatGroups,
    footerMessage: f.footerMessage ? String(f.footerMessage) : "",
  };
}

/** FLink mali yazıcı servisi: protokol üretimi + atomik dosya yazımı. */
export class FiscalPrinterService {
  constructor(private readonly cfg: FiscalConfig) {}

  /** Ürün adını cihaza uygun hale getirir: ayraç/satırsonu → boşluk, ASCII'ye indir, 28 karaktere kırp. */
  formatName(name: string): string {
    const spaced = String(name ?? "").replace(/[;\r\n\t]+/g, " ");
    return asciiFold(spaced).substring(0, MAX_NAME).trimEnd();
  }

  /** Para tutarı: tamsa ondalıksız, değilse en çok 2 hane (sondaki sıfırsız → 19.5, 3.8, 3.29). */
  formatPrice(n: number): string {
    return formatNum(n, 2);
  }

  /** Miktar: tamsa ondalıksız, değilse en çok 3 hane (sondaki sıfırsız). */
  formatQty(n: number): string {
    return formatNum(n, 3);
  }

  /** KDV oranını cihaz vergi grubuna çevirir; eşleme yoksa hata (yanlış grup basılmasın). */
  vatGroupFor(rate: number): number {
    const g = this.cfg.vatGroups?.[rate];
    if (g == null) throw new Error(`fiscal_vat_group_unmapped:${rate}`);
    return g;
  }

  /** FiscalOrder → FLink `.INP` içeriği (joker başlık, CRLF). */
  buildReceipt(order: FiscalOrder): string {
    if (!order?.items?.length) throw new Error("fiscal_no_items");

    const lines: string[] = [];
    order.items.forEach((it, i) => {
      const name = this.formatName(it.name);
      const price = this.formatPrice(it.unitPrice);
      const qty = this.formatQty(it.quantity);
      const grp = this.vatGroupFor(it.vatRate);
      const lineId = `${order.fiscalId}${i + 1}`; // her satır için benzersiz işlem ID'si
      // S,başlık;ad;fiyat;adet;1;1;kdvGrup;0(iskonto);satırId;0;
      lines.push(`S,${HEADER};${name};${price};${qty};1;1;${grp};0;${lineId};0;`);
    });

    // Önce ayraç/satır sonu boşluğa çevrilir, SONRA ASCII'ye indirilir (formatName ile aynı sıra):
    // tersi yapılırsa asciiFold satır sonunu atar ve iki kelime birbirine yapışır.
    const clean = (s: string) => asciiFold(String(s ?? "").replace(/[;\r\n\t]+/g, " ")).trim();
    const footer = clean((order.footerMessage ?? this.cfg.footerMessage) || "");
    const customer = clean(order.customerLine || "");
    if (customer) {
      // Müşteri satırı 1. dip satırına, mağaza mesajı (varsa) 2. satıra basılır. Cihaz yalnız
      // iki dip satırı taşıdığı için müşterili fişte boş koruma satırı yoktur.
      lines.push(`Q,${HEADER};1;${customer}`);
      lines.push(`Q,${HEADER};2;${footer}`);
    } else if (footer) {
      lines.push(`Q,${HEADER};1;${footer}`);
      lines.push(`Q,${HEADER};2;`); // boş 2. satır — kâğıt bıçağının mesajı kesmemesi için
    }

    lines.push(`T,${HEADER};0;0`); // 0 = nakit; 0 = tam tutar (exact)
    return lines.join(EOL) + EOL;
  }

  /** Z-Raporu (günlük mali kapanış) içeriği: `Z,1,______,_,__;1`. */
  buildZReport(): string {
    return `Z,${HEADER};1${EOL}`;
  }

  /** X-Raporu (vardiya okuma — SIFIRLAMAZ) içeriği: `X,1,______,_,__;1`. */
  buildXReport(): string {
    return `X,${HEADER};1${EOL}`;
  }

  /** Fişin dosya adı kökü (uzantısız). FLink yalnız uzantıya (*.INP) bakar; ad izlenebilirlik içindir. */
  fileNameBase(order: FiscalOrder): string {
    const idPart = order.localOrderId != null ? `_${order.localOrderId}` : "";
    return `Kupon_Fiskal_${order.fiscalId}${idPart}`;
  }

  /** İçeriği izlenen klasöre ATOMİK yazar: önce `.tmp`, sonra `<base>.INP` olarak yeniden adlandırır. */
  private writeCommand(base: string, content: string): string {
    const tmpPath = path.join(this.cfg.watchDir, `${base}.tmp`);
    const finalPath = path.join(this.cfg.watchDir, `${base}.INP`);
    fs.mkdirSync(this.cfg.watchDir, { recursive: true });
    fs.writeFileSync(tmpPath, content, { encoding: "latin1" });
    try { fs.rmSync(finalPath, { force: true }); } catch { /* yoksa sorun değil */ }
    fs.renameSync(tmpPath, finalPath);
    return finalPath;
  }

  /**
   * Satış fişini izlenen klasöre ATOMİK yazar (yarım fiş riski yok).
   * @returns Yazılan `.INP` dosyasının tam yolu.
   */
  printReceipt(order: FiscalOrder): string {
    return this.writeCommand(this.fileNameBase(order), this.buildReceipt(order));
  }

  /**
   * Z-Raporu (günlük mali kapanış) komutunu izlenen klasöre yazar.
   * @param fiscalId  Dosya adını benzersizleştirmek için damga (varsayılan: şu an).
   * @returns Yazılan `.INP` dosyasının tam yolu.
   */
  printZReport(fiscalId: string = toFiscalId()): string {
    return this.writeCommand(`RaportiZ_${fiscalId}`, this.buildZReport());
  }

  /**
   * X-Raporu (vardiya okuma — mali sayaçları SIFIRLAMAZ) komutunu izlenen klasöre yazar.
   * @returns Yazılan `.INP` dosyasının tam yolu.
   */
  printXReport(fiscalId: string = toFiscalId()): string {
    return this.writeCommand(`RaportiX_${fiscalId}`, this.buildXReport());
  }

  /** Çekmeceyi açar (V;j15). @returns Yazılan `.INP` dosyasının tam yolu. */
  openDrawer(): string {
    return this.writeCommand("HapjaSirtarit", `V,${HEADER};j15${EOL}`);
  }
}
