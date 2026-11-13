// POST /api/auth/login — POS/Restoran girişi. Yerel kullanıcı önbelleğine karşı doğrular (offline),
// başarıda imzalı pos_session çerezi set eder. Kullanıcılar yalnız main'den gelir.
// Brute-force koruması: IP başına 5 başarısız deneme → 10 dakika engel (paylaşılan rateLimit).
import { z } from "zod";
import { posAuthService } from "~~/server/service/auth.service";
import { createRateLimiter } from "@pro-acc/pos-core/security/server/utils/rateLimit";
import { createPosToken, POS_SESSION_COOKIE, POS_SESSION_MAX_AGE } from "../../utils/terminalSession.ts";

const schema = z.object({
  email: z.string().email("v_email_invalid"),
  password: z.string().min(1, "v_password_required"),
});

// Anahtar: soket uzak adresi — x-forwarded-for istemcice taklit edilebildiğinden KULLANILMAZ.
const loginLimiter = createRateLimiter({ max: 5, blockMs: 10 * 60 * 1000 });

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? "validation_error" });
  }

  const rateKey = event.node?.req?.socket?.remoteAddress || "unknown";
  const block = loginLimiter.isBlocked(rateKey);
  if (block) {
    throw createError({
      statusCode: 429,
      statusMessage: "v_too_many_attempts",
      message: `Çok fazla başarısız giriş denemesi. Lütfen ${block.remainingMinutes} dakika bekleyiniz.`,
    });
  }

  let user;
  try {
    user = await posAuthService.login(parsed.data.email, parsed.data.password);
  } catch (err) {
    loginLimiter.recordFailure(rateKey);
    throw err;
  }
  loginLimiter.clear(rateKey);

  const token = createPosToken(user);

  setCookie(event, POS_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: POS_SESSION_MAX_AGE,
    path: "/",
  });

  return { user };
});
