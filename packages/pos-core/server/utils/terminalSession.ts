// terminalSession.ts — POS/Restoran ortak yerel oturum token'ı (HMAC-SHA256 imzalı, bağımlılıksız).
// POS, main'den ayrı bir origin (port 3000) olduğundan main JWT çerezini paylaşamaz;
// bu yüzden giriş sonrası kendi imzalı `pos_session` çerezini üretir.
import crypto from "node:crypto";

// Sır: POS_SESSION_SECRET (POS) veya RESTAURANT_SESSION_SECRET (Restoran). Ayarlı değilse BİLİNEN SABİT default KULLANILMAZ (repoda gömülü
// anahtarla pos_session token'ı sahteciliği önlenir); boot'ta rastgele geçici sır üretilir
// (token'lar yeniden başlatmada geçersizleşir → operatörü secret ayarlamaya yönlendirir).
function resolvePosSessionSecret(): string {
  const s = process.env.POS_SESSION_SECRET || process.env.RESTAURANT_SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[GÜVENLİK] POS_SESSION_SECRET / RESTAURANT_SESSION_SECRET ayarlı değil — rastgele geçici sır üretildi. " +
        "Oturumlar yeniden başlatmada kapanır. Lütfen ilgili SESSION_SECRET değişkenini ayarlayın."
    );
  }
  return crypto.randomBytes(32).toString("hex");
}
const SECRET = resolvePosSessionSecret();
/** Oturum süresi (saniye) — kasa vardiyasını kapsayacak şekilde 12 saat. */
export const POS_SESSION_MAX_AGE = 12 * 60 * 60;
export const POS_SESSION_COOKIE = "pos_session";

export interface PosSessionPayload {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  roleKey: string;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

/** Kullanıcı bilgisini imzalı token'a çevirir (exp dahil). */
export function createPosToken(payload: PosSessionPayload): string {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + POS_SESSION_MAX_AGE };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Token'ı doğrular; geçersiz/süresi dolmuşsa null döner. */
export function verifyPosToken(token?: string | null): (PosSessionPayload & { exp: number }) | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expected = sign(data);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const body = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}
