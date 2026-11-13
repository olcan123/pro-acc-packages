// POST /api/auth/logout — POS oturum çerezini siler.
import { POS_SESSION_COOKIE } from "../../utils/terminalSession.ts";

export default defineEventHandler((event) => {
  deleteCookie(event, POS_SESSION_COOKIE, { path: "/" });
  return { ok: true };
});
