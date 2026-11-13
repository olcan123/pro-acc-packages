// PUT /api/bank-terminals/[id] — Terminal günceller (string id).
import { bankTerminalService } from "~~/server/service/bank-terminal.service";
import { updateBankTerminalSchema } from "../../validation/bank-terminal.validation.ts";
import { assertValid } from "@pro-acc/pos-core/server/utils/apiHandler";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") as string;
  const data = assertValid(updateBankTerminalSchema.safeParse(await readBody(event)));
  return await bankTerminalService.update(id, data);
});
