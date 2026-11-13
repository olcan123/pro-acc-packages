// rateLimit.ts — Paylaşılan in-memory brute-force sınırlayıcı (login/şifre uçları; 3 uygulama da kullanır).
// Framework-bağımsızdır (h3/createError bilmez): engel bilgisini DÖNER, 429'u tüketici fırlatır
// (main → h3 createError, pos-core → Nitro auto-import createError). Tek-kutu Docker
// dağıtımları hedeflendiğinden in-memory yeterlidir; çoklu-instance için Redis gerekir.
export interface RateLimiterOptions {
  /** Engelleme eşiği: bu sayıda başarısız denemeden sonra anahtar bloklanır (vars. 5). */
  max?: number;
  /** Engel süresi ms (vars. 15 dakika). */
  blockMs?: number;
  /** Bellek sınırı: kayıt sayısı bunu aşarsa en eski kayıtlar düşürülür (vars. 1000). */
  maxEntries?: number;
}

export interface BlockInfo {
  blockedUntil: number;
  remainingMs: number;
  /** Kullanıcıya gösterilecek yukarı yuvarlanmış dakika. */
  remainingMinutes: number;
}

export interface RateLimiter {
  /** Anahtar engelliyse bilgiyi döner; değilse null. Süresi dolmuş engeli temizler. */
  isBlocked(key: string): BlockInfo | null;
  /** Başarısız denemeyi kaydeder; eşik aşılırsa engeli başlatır. */
  recordFailure(key: string): void;
  /** Başarılı girişte sayacı sıfırlar. */
  clear(key: string): void;
  /** İzlenen kayıt sayısı (test/teşhis). */
  size(): number;
}

interface AttemptRecord {
  count: number;
  blockedUntil: number;
  lastAttempt: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}): RateLimiter {
  const max = options.max ?? 5;
  const blockMs = options.blockMs ?? 15 * 60 * 1000;
  const maxEntries = options.maxEntries ?? 1000;
  const attempts = new Map<string, AttemptRecord>();

  // Süresi dolmuş (engel bitmiş + eski) kayıtları at; hâlâ doluysa en eskiden düşür.
  // Map ekleme sıralı olduğundan ilk anahtarlar en eski kayıtlardır → sınırlı bellek garantisi.
  function prune(now: number): void {
    for (const [key, rec] of attempts) {
      if (rec.blockedUntil <= now && now - rec.lastAttempt > blockMs) attempts.delete(key);
    }
    while (attempts.size >= maxEntries) {
      const oldest = attempts.keys().next().value;
      if (oldest === undefined) break;
      attempts.delete(oldest);
    }
  }

  return {
    isBlocked(key) {
      const now = Date.now();
      const rec = attempts.get(key);
      if (!rec) return null;
      if (rec.blockedUntil > now) {
        const remainingMs = rec.blockedUntil - now;
        return { blockedUntil: rec.blockedUntil, remainingMs, remainingMinutes: Math.ceil(remainingMs / 60000) };
      }
      // Engel süresi doldu → temiz sayfa
      if (rec.count >= max) attempts.delete(key);
      return null;
    },

    recordFailure(key) {
      const now = Date.now();
      if (!attempts.has(key)) prune(now);
      const rec = attempts.get(key) ?? { count: 0, blockedUntil: 0, lastAttempt: now };
      rec.count += 1;
      rec.lastAttempt = now;
      if (rec.count >= max) rec.blockedUntil = now + blockMs;
      attempts.set(key, rec);
    },

    clear(key) {
      attempts.delete(key);
    },

    size() {
      return attempts.size;
    },
  };
}
