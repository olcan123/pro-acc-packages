// customer.ts — Kasada şirket müşterisi: mali numara (NUI) kuralı ve fişe yazılan anlık kopya.
// Saf modül — pos + restoran ORTAK; DB'ye dokunmaz.

/** Kosova mali numarası (NUI): 9 hane, 6 veya 8 ile başlar. */
export function isValidFiscalNumber(value: unknown): boolean {
  return /^[68]\d{8}$/.test(String(value ?? "").trim());
}

/** Kosova KDV numarası: 9 hane, 3 ile başlar. */
export function isValidVatNumber(value: unknown): boolean {
  return /^3\d{8}$/.test(String(value ?? "").trim());
}

export interface OrderCustomerInput {
  id?: number | null;
  name: string;
  fiscalNumber: string;
  vatNumber?: string | null;
}

/** Fiş kaydına yazılacak müşteri alanları (müşteri yoksa boş nesne → nihai tüketici). */
export function customerOrderFields(customer: OrderCustomerInput | null | undefined): Record<string, unknown> {
  if (!customer) return {};
  return {
    customerId: customer.id ? Number(customer.id) : null,
    customerName: String(customer.name).trim().slice(0, 200),
    customerFiscalNumber: String(customer.fiscalNumber).trim(),
    customerVatNumber: String(customer.vatNumber ?? "").trim() || null,
  };
}

/** Mali fişin dip satırı: "NUI 810000001 Firma Adi" (cihaz satırı dar olduğu için numara önce). */
export function customerReceiptLine(customer: { name?: string | null; fiscalNumber?: string | null } | null | undefined): string {
  const nui = String(customer?.fiscalNumber ?? "").trim();
  if (!nui) return "";
  return `NUI ${nui} ${String(customer?.name ?? "").trim()}`.trim().slice(0, 42);
}

/** Fişte şirket müşterisi var mı? (main'de ayrı belgeye dönüşecek fiş) */
export function hasCustomer(order: { customerFiscalNumber?: string | null; customerId?: number | null }): boolean {
  return !!String(order?.customerFiscalNumber ?? "").trim() || !!order?.customerId;
}
