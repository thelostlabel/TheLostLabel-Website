import { z } from "zod";

const numericInputSchema = z.union([z.number(), z.string()]);
const stringOrNullSchema = z.union([z.string(), z.null()]);

export const withdrawBodySchema = z.object({
  amount: numericInputSchema.optional(),
  method: stringOrNullSchema.optional(),
  notes: stringOrNullSchema.optional(),
});

export const adminArtistBalanceBodySchema = z.object({
  artistId: z.string().optional(),
  amount: numericInputSchema.optional(),
  reason: stringOrNullSchema.optional(),
  currency: z.string().optional(),
});

export const paymentCreateBodySchema = z.object({
  userId: z.string().optional(),
  artistId: z.string().optional(),
  amount: numericInputSchema.optional(),
  currency: z.string().optional(),
  method: stringOrNullSchema.optional(),
  reference: stringOrNullSchema.optional(),
  notes: stringOrNullSchema.optional(),
  status: z.string().optional(),
});

export const paymentUpdateBodySchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  artistId: z.string().optional(),
  amount: numericInputSchema.optional(),
  method: stringOrNullSchema.optional(),
  reference: stringOrNullSchema.optional(),
  notes: stringOrNullSchema.optional(),
  status: z.string().optional(),
  adminNote: stringOrNullSchema.optional(),
});

export const earningsDeleteBodySchema = z.object({
  artistId: z.string().optional(),
  userId: z.string().optional(),
  deleteType: z.string().optional(),
});

export const earningCreateBodySchema = z.object({
  contractId: z.string().optional(),
  period: z.string().optional(),
  grossAmount: numericInputSchema.optional(),
  currency: z.string().optional(),
  streams: numericInputSchema.optional(),
  source: z.string().optional(),
  expenseAmount: numericInputSchema.optional(),
});

export const earningBulkItemSchema = z.object({
  contractId: z.string().optional(),
  period: z.string().optional(),
  grossAmount: numericInputSchema.optional(),
  currency: z.string().optional(),
  streams: numericInputSchema.optional(),
  source: z.string().optional(),
});

export const earningsBulkBodySchema = z.object({
  earnings: z.array(earningBulkItemSchema).optional(),
});

export const earningUpdateBodySchema = z.object({
  grossAmount: numericInputSchema.optional(),
  expenseAmount: numericInputSchema.optional(),
  period: z.string().optional(),
  streams: numericInputSchema.optional(),
  source: z.string().optional(),
  contractId: z.string().optional(),
});

export type WithdrawBody = z.infer<typeof withdrawBodySchema>;
export type AdminArtistBalanceBody = z.infer<typeof adminArtistBalanceBodySchema>;
export type PaymentCreateBody = z.infer<typeof paymentCreateBodySchema>;
export type PaymentUpdateBody = z.infer<typeof paymentUpdateBodySchema>;
export type EarningsDeleteBody = z.infer<typeof earningsDeleteBodySchema>;
export type EarningCreateBody = z.infer<typeof earningCreateBodySchema>;
export type EarningBulkItemBody = z.infer<typeof earningBulkItemSchema>;
export type EarningsBulkBody = z.infer<typeof earningsBulkBodySchema>;
export type EarningUpdateBody = z.infer<typeof earningUpdateBodySchema>;
