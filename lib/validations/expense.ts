import { z } from "zod";

export const expensePayloadSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["ARS", "USD"]),
  date: z.string().min(1),
  category: z
    .enum([
      "herramientas",
      "hosting",
      "marketing",
      "servicios",
      "impuestos",
      "otro",
    ])
    .nullable()
    .optional(),
  recurrent: z.boolean(),
  frequency: z.enum(["semanal", "mensual", "anual"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  exchange_rate: z.number().positive().nullable().optional(),
});

export type ExpensePayloadSchema = z.infer<typeof expensePayloadSchema>;
