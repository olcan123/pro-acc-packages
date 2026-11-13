// GET /api/bank-terminals — Tüm banka/POS terminalleri.
import { bankTerminalService } from "~~/server/service/bank-terminal.service";

export default defineEventHandler(async () => {
  return await bankTerminalService.getAll();
});
