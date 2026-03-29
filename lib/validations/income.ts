import { z } from "zod";

export const incomePayloadSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["ARS", "USD"]),
  date: z.string().min(1),
  project_id: z.string().uuid().nullable().optional(),
  category: z
    .enum(["proyecto", "mantenimiento", "consultoria", "otro"])
    .nullable()
    .optional(),
  invoice_sent: z.boolean(),
  paid: z.boolean(),
  exchange_rate: z.number().positive().nullable().optional(),
});

export type IncomePayloadSchema = z.infer<typeof incomePayloadSchema>;
