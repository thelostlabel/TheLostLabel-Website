import { z } from "zod";

export const formFieldSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum(["text", "textarea", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const INVOICE_STATUSES = [
  "draft",
  "pending",
  "viewed",
  "completed",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const createInvoiceSchema = z.object({
  recipientEmail: z.string().email().max(254),
  recipientName: z.string().max(200).optional(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().max(10).default("USD"),
  description: z.string().max(2000).optional(),
  formFields: z.array(formFieldSchema).min(1),
  userId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  sendEmail: z.boolean().default(true),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  id: z.string(),
  recipientEmail: z.string().email().max(254).optional(),
  recipientName: z.string().max(200).optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().max(10).optional(),
  description: z.string().max(2000).optional(),
  formFields: z.array(formFieldSchema).min(1).optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  paymentMethod: z.string().max(100).nullable().optional(),
  paymentRef: z.string().max(200).nullable().optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const submitInvoiceSchema = z.object({
  token: z.string().min(1).max(256),
  formData: z.record(z.string(), z.string()),
});

export type SubmitInvoiceInput = z.infer<typeof submitInvoiceSchema>;

/** Generate sequential invoice number: INV-YYYY-NNN */
export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const num = String(sequence).padStart(3, "0");
  return `INV-${year}-${num}`;
}
