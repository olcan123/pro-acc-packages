// bank-terminal.validation.ts — BankTerminal (Kart/POS terminali) Zod şemaları.
import { z } from "zod";

export const createBankTerminalSchema = z.object({
  id: z.string().min(1, "v_terminal_id_required"),
  name: z.string().min(1, "v_terminal_name_required"),
  glAccountId: z.coerce.number().int().positive("v_gl_account_invalid"),
  isActive: z.boolean().default(true),
});

export const updateBankTerminalSchema = createBankTerminalSchema.partial();

export const bankTerminalIdSchema = z.object({
  id: z.string().min(1, "v_invalid_id"),
});
