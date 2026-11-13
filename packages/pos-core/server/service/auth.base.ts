// auth.base.ts — Yerel kimlik doğrulama (OFFLINE çalışır) — pos + restoran ORTAK.
// Kullanıcılar main'den senkronlanır (pos: PosUser · restoran: RestaurantUser); giriş yerel
// bcrypt hash ile doğrulanır. Terminalde kullanıcı OLUŞTURULMAZ — kaynak daima main'dir.
import bcrypt from "bcryptjs";
import { localDb, TERMINAL_KIND } from "~~/server/utils/localDb";
import { settingsService } from "~~/server/service/settings.service";
import { syncService } from "~~/server/service/sync.service";

export class PosAuthService {
  /**
   * E-posta + şifre ile giriş. Yerel kullanıcı önbelleğine karşı bcrypt ile doğrular (offline).
   * Yerelde kullanıcı yoksa ve main erişilebilirse bir kez senkronlayıp tekrar dener (ilk kurulum).
   * @returns {object} Oturum payload'ı (createPosToken için)
   */
  async login(email: string, password: string) {
    const normEmail = email.toLowerCase().trim();
    let user = await localDb.users.findUnique({ where: { email: normEmail } });

    // İlk kurulumda yerel önbellek boş olabilir → online ise bir kez çek
    if (!user) {
      await syncService.pullUsers().catch(() => {});
      user = await localDb.users.findUnique({ where: { email: normEmail } });
    }

    if (!user || !user.isActive) {
      throw createError({ statusCode: 401, statusMessage: "v_invalid_credentials" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw createError({ statusCode: 401, statusMessage: "v_invalid_credentials" });
    }

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleKey: user.roleKey,
    };
  }

  /**
   * Yerel kullanıcı önbelleğinde en az bir kullanıcı var mı?
   * 01-pos-auth middleware'i ilk kurulum (bootstrap) modunu bununla tespit eder.
   */
  async hasUsers(): Promise<boolean> {
    return (await localDb.users.count()) > 0;
  }

  /**
   * Şifre değiştirir. Main kaynaktır → ONLINE gerektirir. Başarıda yerel hash güncellenir.
   * @returns {{ ok: true }}
   */
  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const { mainApiUrl, syncKey } = await settingsService.resolveMainConnection();
    if (!mainApiUrl) throw createError({ statusCode: 400, statusMessage: "main_api_url_missing" });

    const res: any = await $fetch(`${mainApiUrl}/api/${TERMINAL_KIND}/auth/change-password`, {
      method: "POST",
      headers: { "x-pos-key": syncKey },
      body: { email, currentPassword, newPassword },
    });

    // Yeni hash döndüyse yerel önbelleği anında güncelle (offline giriş güncel kalsın)
    if (res?.passwordHash) {
      await localDb.users
        .update({ where: { email: email.toLowerCase().trim() }, data: { passwordHash: res.passwordHash } })
        .catch(() => {});
    }
    return { ok: true };
  }
}

export const posAuthService = new PosAuthService();
