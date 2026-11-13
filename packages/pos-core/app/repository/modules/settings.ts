// settings.ts — PosSettings API modülü ($api.settings).
import FetchFactory from "../factory.ts";

export class SettingsModule extends FetchFactory<any> {
  private RESOURCE = "/api/settings";

  /** DEFAULT ayarları getir. */
  async fetch() { return this.getAll(this.RESOURCE); }

  /** Ayarları güncelle (PUT /api/settings). */
  async save(data: any) {
    return this.create(this.RESOURCE, data, { method: "PUT" } as any);
  }
}
