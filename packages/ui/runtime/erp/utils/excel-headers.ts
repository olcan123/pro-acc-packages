// excel-headers.ts — Excel çıktılarının sütun başlıklarını arayüz dilinden bağımsız olarak ARNAVUTÇA'ya çevirir.
//
// NEDEN VAR: dışa aktarılan Excel dosyaları resmi/müşteri çıktısıdır ve ATK standardı gereği Arnavutça (sq) olmalıdır.
// Başlıklar ise 26 farklı yerde (BaseList sütunları, rapor bileşenleri, props) o anki arayüz diliyle `t()`
// üretildiği için arayüz Türkçeyken Türkçe çıkıyordu. Her çağrı yerini tek tek değiştirmek yerine çeviri,
// dışa aktarma anında merkezi olarak yapılır: her `tr.json` değeri → aynı anahtarın `sq.json` değeri.
//
// SINIRLAR (bilinçli):
//   • Yalnız BAŞLIKLAR çevrilir (nesne anahtarları / AOA'nın başlık satırları / sayfa adı); hücre verisine dokunulmaz.
//   • Sözlükte olmayan metin (firma adı, tarih, dinamik başlık) olduğu gibi kalır.
//   • Aynı Türkçe metne giden birden çok anahtar varsa ilk anahtarın karşılığı kullanılır.
export type MessageMap = Record<string, unknown>;

// "Birim Fiyat (€)" → taban "Birim Fiyat", ek " (€)": taban çevrilir, parantezli ek korunur.
const TRAILING_PAREN_RE = /^(.*?)(\s*\([^)]*\))$/;

/**
 * Kaynak dillerdeki her değeri, aynı anahtarın Arnavutça değerine eşleyen ters sözlük kurar.
 *
 * @param {MessageMap[]} sources - Çevrilecek diller (ör. [tr]); Arnavutça'nın kendisi eklenmez
 * @param {MessageMap} sq - Arnavutça mesajlar
 * @returns {Map<string, string>} kaynak metin (kırpılmış) → Arnavutça metin
 */
export function buildSqReverseMap(sources: MessageMap[], sq: MessageMap): Map<string, string> {
  const map = new Map<string, string>();
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      const from = source[key];
      const to = sq[key];
      if (typeof from !== "string" || typeof to !== "string") continue;
      const fromKey = from.trim();
      if (!fromKey || map.has(fromKey)) continue;
      map.set(fromKey, to.trim());
    }
  }
  return map;
}

/**
 * Çeviri FONKSİYONLARINDAN ters sözlük kurar (vue-i18n `t(key, {}, { locale })` gibi).
 * Locale dosyasının biçiminden (düz string, derlenmiş AST, mesaj fonksiyonu) bağımsızdır;
 * tarayıcıda @nuxtjs/i18n mesajları derlediği için uygulama bu yolu kullanır.
 * Çeviri anahtarın kendisini döndürürse (eksik mesaj) o anahtar atlanır.
 *
 * @param {string[]} keys - Mesaj anahtarları
 * @param {(key: string) => unknown} fromText - Kaynak dildeki metin
 * @param {(key: string) => unknown} toSq - Arnavutça metin
 */
export function buildSqReverseMapFromTranslator(
  keys: string[],
  fromText: (key: string) => unknown,
  toSq: (key: string) => unknown,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of keys) {
    const from = fromText(key);
    const to = toSq(key);
    if (typeof from !== "string" || typeof to !== "string") continue;
    const fromKey = from.trim();
    if (!fromKey || from === key || to === key || map.has(fromKey)) continue;
    map.set(fromKey, to.trim());
  }
  return map;
}

/**
 * Tek bir başlığı Arnavutça'ya çevirir; eşleşme yoksa AYNEN döndürür.
 *
 * @param {unknown} value - Başlık metni (string olmayan değerler dokunulmadan döner)
 * @param {Map<string, string>} map - buildSqReverseMap çıktısı
 */
export function toSqHeader<T>(value: T, map: Map<string, string>): T | string {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const direct = map.get(trimmed);
  if (direct !== undefined) return direct;
  const paren = TRAILING_PAREN_RE.exec(trimmed);
  if (paren) {
    const base = map.get(paren[1]!.trim());
    if (base !== undefined) return `${base}${paren[2]}`;
  }
  return value;
}

/**
 * Nesne dizisinin anahtarlarını (= sütun başlıkları) çevirir; sütun sırası korunur.
 * İki başlık aynı Arnavutça metne düşerse ikincisi ORİJİNAL adıyla kalır (veri kaybolmasın).
 *
 * @param {Array<Record<string, unknown>>} rows - Dışa aktarılacak satırlar
 * @param {Map<string, string>} map - buildSqReverseMap çıktısı
 */
export function translateRowKeys(rows: Array<Record<string, unknown>>, map: Map<string, string>) {
  if (!rows.length || !map.size) return rows;
  const keyMap = new Map<string, string>();
  const used = new Set<string>();
  const columns = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
  for (const key of columns) {
    const translated = String(toSqHeader(key, map));
    const finalKey = used.has(translated) ? key : translated;
    used.add(finalKey);
    keyMap.set(key, finalKey);
  }
  return rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(row)) next[keyMap.get(key)!] = row[key];
    return next;
  });
}

/**
 * Dizi-dizisi (AOA) çıktısının İLK `headerRows` satırını çevirir; gövdeye dokunmaz.
 *
 * @param {Array<Array<unknown>>} aoa - Satır dizisi
 * @param {number} headerRows - Başlık satırı sayısı
 * @param {Map<string, string>} map - buildSqReverseMap çıktısı
 */
export function translateHeaderRows(aoa: Array<Array<unknown>>, headerRows: number, map: Map<string, string>) {
  if (!headerRows || !map.size) return aoa;
  return aoa.map((row, index) => (index < headerRows ? row.map((cell) => toSqHeader(cell, map)) : row));
}
