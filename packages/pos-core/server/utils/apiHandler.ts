// apiHandler.ts — Nitro yardımcıları: id parse, hata standardizasyonu, Zod doğrulama assert.
import type { H3Event } from "h3";

/** Route parametresinden integer ID parse eder; geçersizse 400 fırlatır. */
export function parseId(event: H3Event, param = "id"): number {
  const raw = getRouterParam(event, param);
  const parsed = parseInt(raw as string);
  if (isNaN(parsed))
    throw createError({ statusCode: 400, statusMessage: "Geçersiz ID formatı" });
  return parsed;
}

/** Yakalanan hatayı standart H3 hatasına dönüştürür (mevcut statusCode korunur). */
export function handleApiError(error: any, fallback = "Internal Server Error"): never {
  throw createError({
    statusCode: error.statusCode || 500,
    statusMessage: error.statusMessage || error.message || fallback,
    message: error.message,
  });
}

/** Zod safeParse sonucunu doğrular; başarısızsa 400 fırlatır, başarılıysa veriyi döner. */
export function assertValid<T>(result: { success: boolean; data?: T; error?: any }): T {
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.errors?.[0]?.message || "Validation Error",
      data: result.error?.format?.(),
    });
  }
  return result.data as T;
}
