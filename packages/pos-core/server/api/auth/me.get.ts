// GET /api/auth/me — Geçerli POS oturumundaki kullanıcıyı döner (requirePosAuth; dev'de mock).
import { requirePosAuth } from "../../utils/posAuth.ts";

export default defineEventHandler((event) => {
  const payload = requirePosAuth(event);
  return {
    user: {
      userId: payload.userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roleKey: payload.roleKey,
    },
  };
});
