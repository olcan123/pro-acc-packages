// factory.ts — Frontend API modülleri için generic temel CRUD sınıfı (main deseni).
import type { $Fetch, FetchOptions } from "ofetch";

const coalescers = new WeakMap<$Fetch, $Fetch>();

/** Yalnız sade JSON sorgularını kararlı anahtara çevirir; sinyal/özel başlıklar paylaşılmaz. */
export function readRequestKey(
  resource: unknown,
  options: Record<string, any> = {},
): string | undefined {
  if (
    typeof resource !== "string" ||
    Object.keys(options).some((key) => !["method", "query", "params"].includes(key))
  )
    return;
  if (String(options.method || "GET").toUpperCase() !== "GET") return;
  const seen = new Set<object>();
  const normalize = (value: any): any => {
    if (value === null || ["string", "boolean", "undefined"].includes(typeof value)) return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (value instanceof Date) return value.toISOString();
    if (!value || typeof value !== "object" || seen.has(value))
      throw new Error("Paylaşılmayan sorgu");
    seen.add(value);
    try {
      if (Array.isArray(value)) return value.map(normalize);
      if (Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Özel sorgu nesnesi");
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, normalize(value[key])]),
      );
    } finally {
      seen.delete(value);
    }
  };
  try {
    return JSON.stringify([resource, normalize(options.query), normalize(options.params)]);
  } catch {
    return;
  }
}

/** Sadece uçuşta olan GET'leri fetcher/Nuxt örneği içinde paylaşır; tamamlanan veri saklanmaz. */
function coalesceReads(fetcher: $Fetch): $Fetch {
  const existing = coalescers.get(fetcher);
  if (existing) return existing;
  const pending = new Map<string, Promise<any>>();
  const wrapped = new Proxy(fetcher, {
    apply(target, receiver, args) {
      const [resource, options = {}] = args;
      const method = String(options.method || "GET").toUpperCase();
      if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        pending.clear();
        try {
          return Promise.resolve(Reflect.apply(target, receiver, args)).finally(() =>
            pending.clear(),
          );
        } catch (error) {
          pending.clear();
          throw error;
        }
      }
      const key = readRequestKey(resource, options);
      if (key === undefined) return Reflect.apply(target, receiver, args);
      const inFlight = pending.get(key);
      // İki tüketicinin JSON sonucunu yerelde değiştirmesi birbirini etkilemez.
      if (inFlight) return inFlight.then((value) => structuredClone(value));
      const request = Promise.resolve(Reflect.apply(target, receiver, args)).finally(() => {
        if (pending.get(key) === request) pending.delete(key);
      });
      pending.set(key, request);
      return request;
    },
  });
  coalescers.set(fetcher, wrapped);
  coalescers.set(wrapped, wrapped);
  return wrapped;
}

export default class FetchFactory<T> {
  private $fetch: $Fetch;

  constructor(fetcher: $Fetch) {
    this.$fetch = coalesceReads(fetcher);
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
  async update(
    resource: string,
    id: number | string,
    data: any,
    options?: FetchOptions<"json">,
  ): Promise<T> {
    return this.$fetch<T>(`${resource}/${id}`, { method: "PUT", body: data, ...options });
  }

  /** Sil (DELETE /:id). */
  async remove(
    resource: string,
    id: number | string,
    options?: FetchOptions<"json">,
  ): Promise<void> {
    return this.$fetch<void>(`${resource}/${id}`, { method: "DELETE", ...options });
  }
}
