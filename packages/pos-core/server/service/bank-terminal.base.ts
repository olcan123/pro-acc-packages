// bank-terminal.base.ts — BankTerminal (Kart/POS terminali) iş mantığı — pos + restoran ORTAK.
// id String olduğu için BaseRepository (number id) yerine doğrudan delegasyon kullanılır.
// Prisma istemcisi `~~/server/utils/localDb` üzerinden gelir → her uygulama kendi DB'sini kullanır.
import { localDb } from "~~/server/utils/localDb";

export class BankTerminalService {
  /** Tüm terminaller (ada göre). */
  async getAll() {
    return await localDb.client.bankTerminal.findMany({ orderBy: { name: "asc" } });
  }

  /** Tek terminal (string id). */
  async findById(id: string) {
    return await localDb.client.bankTerminal.findUnique({ where: { id } });
  }

  /** Yeni terminal. */
  async create(data: any) {
    return await localDb.client.bankTerminal.create({ data });
  }

  /** Terminal güncelle. */
  async update(id: string, data: any) {
    return await localDb.client.bankTerminal.update({ where: { id }, data });
  }

  /** Terminal sil. */
  async delete(id: string) {
    return await localDb.client.bankTerminal.delete({ where: { id } });
  }
}

export const bankTerminalService = new BankTerminalService();
