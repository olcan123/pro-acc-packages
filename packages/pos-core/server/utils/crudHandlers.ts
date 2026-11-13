// crudHandlers.ts — Tekrar kullanılabilir CRUD route handler factory'leri.
// Standart CRUD uçlarındaki id/body doğrulama + 404/FK yönetimini tek yerde toplar.
import type { H3Event } from "h3";
import type { ZodSchema, ZodTypeDef } from "zod";

// Router girdisi metin olabilir; dönüşümden sonra id'nin sayı olması yeterlidir.
type IdSchema = ZodSchema<{ id: number }, ZodTypeDef, unknown>;

/** Router param `id`'yi zod ile doğrular; geçersizse 400. */
function parseId(event: H3Event, idSchema: IdSchema): number {
  const r = idSchema.safeParse({ id: getRouterParam(event, "id") });
  if (!r.success) {
    throw createError({ statusCode: 400, statusMessage: r.error.errors[0]?.message ?? "v_invalid_id" });
  }
  return r.data.id;
}

/** Request body'yi zod ile doğrular; geçersizse 400. */
function parseBody<T>(body: unknown, schema: ZodSchema<T>): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    throw createError({
      statusCode: 400,
      statusMessage: r.error.errors[0]?.message ?? "validation_error",
      data: r.error.errors,
    });
  }
  return r.data;
}

interface GetByIdOpts {
  service: Record<string, any>;
  idSchema: IdSchema;
  findMethod?: string;
  notFoundMessage: string;
}
/** GET /<x>/[id] — tekil kayıt; bulunamazsa 404. */
export const makeGetByIdHandler = (opts: GetByIdOpts) =>
  defineEventHandler(async (event) => {
    const id = parseId(event, opts.idSchema);
    const item = await opts.service[opts.findMethod ?? "findById"](id);
    if (!item) throw createError({ statusCode: 404, statusMessage: opts.notFoundMessage });
    return item;
  });

interface CreateOpts {
  service: Record<string, any>;
  schema: ZodSchema<any>;
  createMethod?: string;
}
/** POST /<x> — body doğrula + oluştur. */
export const makeCreateHandler = (opts: CreateOpts) =>
  defineEventHandler(async (event) => {
    const data = parseBody(await readBody(event), opts.schema);
    return await opts.service[opts.createMethod ?? "create"](data);
  });

interface UpdateOpts {
  service: Record<string, any>;
  idSchema: IdSchema;
  schema: ZodSchema<any>;
  updateMethod?: string;
}
/** PUT /<x>/[id] — id + body doğrula, güncelle. */
export const makeUpdateHandler = (opts: UpdateOpts) =>
  defineEventHandler(async (event) => {
    const id = parseId(event, opts.idSchema);
    const data = parseBody(await readBody(event), opts.schema);
    return await opts.service[opts.updateMethod ?? "update"](id, data);
  });

interface DeleteOpts {
  service: Record<string, any>;
  idSchema: IdSchema;
  deleteMethod?: string;
  inUseMessage?: string;
  inUseCode?: string;
}
/** DELETE /<x>/[id] — sil; FK kısıtında inUseMessage ile 400. */
export const makeDeleteHandler = (opts: DeleteOpts) =>
  defineEventHandler(async (event) => {
    const id = parseId(event, opts.idSchema);
    try {
      await opts.service[opts.deleteMethod ?? "delete"](id);
      return { success: true };
    } catch (error: any) {
      if (opts.inUseMessage && error?.code === (opts.inUseCode ?? "P2003")) {
        throw createError({ statusCode: 400, statusMessage: opts.inUseMessage });
      }
      throw error;
    }
  });

interface ListOpts {
  service: Record<string, any>;
  listMethod?: string;
}
/** GET /<x> — düz liste. */
export const makeListHandler = (opts: ListOpts) =>
  defineEventHandler(async () => opts.service[opts.listMethod ?? "findAll"]());
