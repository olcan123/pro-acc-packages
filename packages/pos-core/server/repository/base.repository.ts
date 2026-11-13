// base.repository.ts — Tüm POS servisleri için generic Prisma CRUD temel sınıfı.
// Her servis (ProductService, OrderService vb.) bu sınıfı extend eder.

/**
 * Generic Prisma repository temel sınıfı.
 * T = Prisma model delegate tipi (örn. typeof posPrisma.localProduct / restaurantPrisma.localMenuItem)
 */
export class BaseRepository<T> {
  protected model: T;

  constructor(model: T) {
    this.model = model;
  }

  /** Filtre/sıralama/sayfalama/include destekli liste. */
  async findAll(
    params: { where?: any; orderBy?: any; skip?: number; take?: number; include?: any } = {},
  ) {
    return await (this.model as any).findMany(params);
  }

  /** ID ile tek kayıt (string ise number'a çevrilir). */
  async findById(id: number | string, include?: any) {
    const parsedId = typeof id === "string" ? Number(id) : id;
    if (isNaN(parsedId)) {
      throw createError({ statusCode: 400, message: "Geçersiz ID" });
    }
    return await (this.model as any).findUnique({ where: { id: parsedId }, include });
  }

  /** Yeni kayıt. */
  async create(data: any) {
    return await (this.model as any).create({ data });
  }

  /** Güncelle. */
  async update(id: number | string, data: any) {
    const parsedId = typeof id === "string" ? Number(id) : id;
    return await (this.model as any).update({ where: { id: parsedId }, data });
  }

  /** Sil. */
  async delete(id: number | string) {
    const parsedId = typeof id === "string" ? Number(id) : id;
    return await (this.model as any).delete({ where: { id: parsedId } });
  }

  /** Filtreye uyan kayıt sayısı. */
  async count(where?: any) {
    return await (this.model as any).count({ where });
  }
}
