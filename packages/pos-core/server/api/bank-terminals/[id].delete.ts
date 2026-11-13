// DELETE /api/bank-terminals/[id] — Terminal siler (string id).
import { bankTerminalService } from "~~/server/service/bank-terminal.service";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") as string;
  await bankTerminalService.delete(id);
  return { success: true };
});
