// POST /api/bank-terminals — Yeni terminal oluşturur.
import { bankTerminalService } from "~~/server/service/bank-terminal.service";
import { createBankTerminalSchema } from "../../validation/bank-terminal.validation.ts";
import { assertValid } from "@pro-acc/pos-core/server/utils/apiHandler";

export default defineEventHandler(async (event) => {
  const data = assertValid(createBankTerminalSchema.safeParse(await readBody(event)));
  return await bankTerminalService.create(data);
});
