// order.validation.ts — POS fişi (Order) oluşturma Zod şemaları.
// Sepet → fiş: sunucu toplam/KDV'yi yeniden hesaplar (istemciye güvenilmez).
import { z } from "zod";
import { POS_PAYMENT_METHODS, POS_CARD_METHODS, normalizePaymentMethod } from "../utils/tender.ts";
import { isValidFiscalNumber, isValidVatNumber } from "../utils/customer.ts";

/**
 * Ödeme satırı: SEF ödeme yöntemi + tutar (kart ise terminal opsiyonel).
 * Yöntem kuralları (izinli küme, eski "CARD" → CARD_CREDIT) `server/utils/tender.ts`'dedir.
 */
export const paymentSchema = z.object({
  paymentMethod: z
    .string({ required_error: "v_payment_method_required" })
    .transform(normalizePaymentMethod)
    .refine((v) => (POS_PAYMENT_METHODS as readonly string[]).includes(v), {
      message: "v_payment_method_required",
    }),
  amount: z.coerce.number().min(0, "v_amount_negative"),
  bankTerminalId: z.string().nullable().optional(),
});

/** Geriye dönük uyumluluk: kart ailesi artık tender.ts'de tanımlı. */
export { POS_CARD_METHODS };

/** Ödeme listesi (en az 1 satır) — POS fişi ve restoran masa kapanışı ortak kullanır. */
export const paymentListSchema = z.array(paymentSchema).min(1, "v_at_least_one_payment_required");

// Fiş kalemi: ürün + miktar + birim fiyat + KDV (+ opsiyonel iskonto %).
export const orderItemSchema = z.object({
  productId: z.coerce.number({ required_error: "v_product_id_invalid" }).int().positive("v_product_id_invalid"),
  quantity: z.coerce.number({ required_error: "v_quantity_required" }).positive("v_quantity_positive"),
  unitPrice: z.coerce.number({ required_error: "v_price_required" }).min(0, "v_price_negative"),
  vatRate: z.coerce.number().int().min(0).max(100).default(18),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
});

/**
 * Şirket müşterisi (isteğe bağlı). Mali numara (NUI) ZORUNLUDUR: fişe yazılır ve main cariyi
 * bununla bulur. Boş KDV numarası kabul edilir; doluysa biçimi denetlenir.
 */
export const orderCustomerSchema = z.object({
  id: z.coerce.number().int().positive().nullable().optional(),
  name: z.string({ required_error: "v_customer_name_required" }).trim().min(1, "v_customer_name_required").max(200),
  fiscalNumber: z
    .string({ required_error: "v_customer_fiscal_number_invalid" })
    .trim()
    .refine(isValidFiscalNumber, { message: "v_customer_fiscal_number_invalid" }),
  vatNumber: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((v) => !v || isValidVatNumber(v), { message: "v_customer_vat_number_invalid" }),
});

// Fiş oluşturma: en az 1 kalem ve 1 ödeme zorunlu; müşteri isteğe bağlı.
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "v_at_least_one_item_required"),
  payments: paymentListSchema,
  customer: orderCustomerSchema.nullable().optional(),
});

/** Vardiya kapanışı kasa sayımı girdisi (isteğe bağlı; hesap pos-ui/utils/cash-count.ts'de). */
export const cashCountInputSchema = z.object({
  openingFloat: z.coerce.number().min(0, "v_amount_negative").optional().default(0),
  counts: z.record(z.coerce.number().int().min(0)).optional(),
  countedTotal: z.union([z.coerce.number().min(0, "v_amount_negative"), z.null()]).optional(),
});

export const closeSessionSchema = z.object({
  sessionId: z.coerce.number().int().positive().optional(),
  zReportNo: z.coerce.number().int().optional(),
  cashCount: cashCountInputSchema.nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
