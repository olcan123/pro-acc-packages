// auth.ts — POS kimlik doğrulama API modülü ($api.auth). Kullanıcılar main'den gelir.
import FetchFactory from "../factory.ts";

export class AuthModule extends FetchFactory<any> {
  private RESOURCE = "/api/auth";

  /** E-posta + şifre ile giriş. */
  async login(data: { email: string; password: string }) {
    return this.create(`${this.RESOURCE}/login`, data);
  }

  /** Oturumdaki kullanıcıyı getir (GET /me). */
  async me() {
    return this.getAll(`${this.RESOURCE}/me`);
  }

  /** Çıkış. */
  async logout() {
    return this.create(`${this.RESOURCE}/logout`, {});
  }

  /** Oturumdaki kullanıcının şifresini değiştir (main'e proxy). */
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.create(`${this.RESOURCE}/change-password`, data);
  }
}
