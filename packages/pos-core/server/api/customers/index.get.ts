// GET /api/customers?q= — Şirket müşterisi arama (yerel önbellek; NUI ya da ad). pos + restoran ORTAK.
import { customerService } from "../../service/customer.base.ts";

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);
  return await customerService.search(String(q ?? ""));
});
