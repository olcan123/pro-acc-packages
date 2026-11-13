// bankTerminal.ts — Banka/POS terminali API modülü ($api.bankTerminal).
import FetchFactory from "../factory.ts";

export class BankTerminalModule extends FetchFactory<any> {
  private RESOURCE = "/api/bank-terminals";

  async fetchTerminals() { return this.getAll(this.RESOURCE); }
  async createTerminal(data: any) { return this.create(this.RESOURCE, data); }
  async updateTerminal(id: string, data: any) { return this.update(this.RESOURCE, id, data); }
  async deleteTerminal(id: string) { return this.remove(this.RESOURCE, id); }
}
