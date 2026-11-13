// useReportPrint.ts — Rapor tablolarını yazdırma/PDF çıktısına çevirir.
// Excel export ile AYNI satır eşlemesini (anahtar = sütun başlığı) kullanır; gizli iframe'e
// A4 baskı düzeni yazıp window.print() çağırır — kullanıcı "PDF olarak kaydet" seçebilir.
// Baskı çerçevesi (başlık/tarih) Arnavutça (sq) — proje baskı kuralı.
//
// Baskı CSS'i ARTIK BURADA GÖMÜLÜ DEĞİL: iframe uygulamanın Tailwind'ini görmediği
// için stil, tasarım token'larından ÜRETİLİR (printCss). Böylece ekran ve kâğıt tek
// kaynaktan beslenir; ham hex kopyalamak gerekmez.
import { formatDate as displayDate } from "../../utils/date.ts";
import { printCss } from "../../design-tokens.ts";

export interface ReportPrintOptions {
  /** Rapor başlığı (baskıda büyük başlık) */
  title: string;
  /** Alt başlık — genelde dönem/cari bilgisi (ops.) */
  subtitle?: string;
  /** Satırlar: anahtar = sütun başlığı (Excel export map'iyle aynı yapı) */
  rows: Array<Record<string, unknown>>;
  /** Kalın toplam satırı (ops.) — anahtarlar rows ile aynı */
  totals?: Record<string, unknown>;
  /** Yatay (landscape) baskı — geniş tablolar için */
  landscape?: boolean;
  /** Şirket adı (başlıkta) — verilmezse composable /api/public/settings'ten çeker */
  companyName?: string;
}

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtCell = (v: unknown): string => {
  if (typeof v === "number") {
    // EUR para formatı: €1.234,56 (sayısal hücreler)
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "EUR",
    }).format(v);
  }
  return esc(v);
};

const fmtToday = () => displayDate(new Date(), "-");

/**
 * Baskı HTML'ini üretir — saf fonksiyon (birim test edilir).
 * Sütunlar ilk satırın anahtarlarından çıkarılır; sayısal hücreler sağa yaslanır.
 */
export function buildReportHtml(opts: ReportPrintOptions): string {
  const columns = opts.rows.length > 0 ? Object.keys(opts.rows[0]!) : [];
  const numericCols = new Set(
    columns.filter((c) => opts.rows.some((r) => typeof r[c] === "number")),
  );

  const headCells = columns
    .map((c) => `<th class="${numericCols.has(c) ? "num" : ""}">${esc(c)}</th>`)
    .join("");

  const bodyRows = opts.rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => `<td class="${numericCols.has(c) ? "num" : ""}">${fmtCell(r[c])}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const totalsRow = opts.totals
    ? `<tr class="totals">${columns
        .map(
          (c) =>
            `<td class="${numericCols.has(c) ? "num" : ""}">${
              opts.totals && c in opts.totals ? fmtCell(opts.totals[c]) : ""
            }</td>`,
        )
        .join("")}</tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<title>${esc(opts.title)}</title>
<style>
${printCss({ landscape: opts.landscape })}
</style>
</head>
<body>
  <header>
    <div class="company">${esc(opts.companyName || "")}</div>
    <div class="meta">Data: ${fmtToday()}</div>
  </header>
  <h1>${esc(opts.title)}</h1>
  ${opts.subtitle ? `<div class="subtitle">${esc(opts.subtitle)}</div>` : ""}
  ${
    opts.rows.length === 0
      ? `<div class="empty">Nuk u gjetën të dhëna</div>`
      : `<table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}${totalsRow}</tbody></table>`
  }
</body>
</html>`;
}

/** Raporu gizli iframe üzerinden yazdırır (tarayıcının "PDF olarak kaydet" seçeneğiyle PDF alınır). */
export const useReportPrint = () => {
  const printReport = async (opts: ReportPrintOptions) => {
    let companyName = opts.companyName;
    if (!companyName) {
      try {
        const res = await $fetch<{ appName?: string }>("/api/public/settings");
        companyName = res?.appName || "";
      } catch {
        companyName = "";
      }
    }

    const html = buildReportHtml({ ...opts, companyName });

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    // Render otursun diye ufak gecikme; baskı bitince iframe temizlenir.
    await new Promise((r) => setTimeout(r, 150));
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 2000);
  };

  return { printReport };
};
