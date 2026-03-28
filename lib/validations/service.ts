import { z } from "zod";

export const servicePayloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  currency: z.enum(["ARS", "USD"]),
  unit: z.enum(["proyecto", "hora", "mes"]).nullable().optional(),
  category: z
    .enum(["web", "cms", "automatizacion", "mantenimiento", "consultoria"])
    .nullable()
    .optional(),
  active: z.boolean(),
});

export type ServicePayloadSchema = z.infer<typeof servicePayloadSchema>;
