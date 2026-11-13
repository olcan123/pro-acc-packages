// POST /api/auth/change-password — Oturumdaki POS kullanıcısının şifresini değiştirir.
// Main kaynaktır → ONLINE gerektirir; başarıda yerel hash de güncellenir.
import { z } from "zod";
import { posAuthService } from "~~/server/service/auth.service";
import { requirePosAuth } from "../../utils/posAuth.ts";

const schema = z.object({
  currentPassword: z.string().min(1, "v_current_password_required"),
  newPassword: z
    .string()
    .min(8, "v_password_min")
    .max(128, "v_password_max")
    .regex(/[A-Z]/, "v_password_uppercase")
    .regex(/[a-z]/, "v_password_lowercase")
    .regex(/[0-9]/, "v_password_digit"),
});

export default defineEventHandler(async (event) => {
  const payload = requirePosAuth(event);

  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? "validation_error" });
  }

  return posAuthService.changePassword(payload.email, parsed.data.currentPassword, parsed.data.newPassword);
});
