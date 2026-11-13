// order.ts — POS fişi API modülü ($api.order).
import FetchFactory from "../factory.ts";

export class OrderModule extends FetchFactory<any> {
  private RESOURCE = "/api/orders";

  /** Açık vardiyanın fişleri. */
  async fetchOrders() { return this.getAll(this.RESOURCE); }

  /** Şirket müşterisi arama (yerel önbellek; NUI ya da ad). */
  async searchCustomers(q: string) { return this.getAll("/api/customers", { query: { q } }); }

  /** Yeni fiş (sepet → fiş). */
  async createOrder(data: any) { return this.create(this.RESOURCE, data); }
}
