// factory.ts — Frontend API modülleri için generic temel CRUD sınıfı (main deseni).
import type { $Fetch, FetchOptions } from "ofetch";

export default class FetchFactory<T> {
  private $fetch: $Fetch;

  constructor(fetcher: $Fetch) {
    this.$fetch = fetcher;
  }

  /** Liste (GET). */
  async getAll(resource: string, options?: FetchOptions<"json">): Promise<T[]> {
    return this.$fetch<T[]>(resource, { method: "GET", ...options });
  }

  /** Tekil (GET /:id). */
  async getById(resource: string, id: number | string, options?: FetchOptions<"json">): Promise<T> {
    return this.$fetch<T>(`${resource}/${id}`, { method: "GET", ...options });
  }

  /** Oluştur (POST). */
  async create(resource: string, data: any, options?: FetchOptions<"json">): Promise<T> {
    return this.$fetch<T>(resource, { method: "POST", body: data, ...options });
  }

  /** Güncelle (PUT /:id). */
  async update(resource: string, id: number | string, data: any, options?: FetchOptions<"json">): Promise<T> {
    return this.$fetch<T>(`${resource}/${id}`, { method: "PUT", body: data, ...options });
  }

  /** Sil (DELETE /:id). */
  async remove(resource: string, id: number | string, options?: FetchOptions<"json">): Promise<void> {
    return this.$fetch<void>(`${resource}/${id}`, { method: "DELETE", ...options });
  }
}
