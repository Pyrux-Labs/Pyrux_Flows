import { z } from "zod";

export const projectPayloadSchema = z.object({
  client_id: z.string().min(1),
  service_id: z.string().min(1).nullable().optional(),
  name: z.string().min(1),
  status: z.enum(["desarrollo", "pausado", "completado", "cancelado", "mantenimiento"]),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.enum(["ARS", "USD"]).default("USD"),
  notes: z.string().nullable().optional(),
  maintenance_amount: z.number().nonnegative().nullable().optional(),
  maintenance_currency: z.enum(["ARS", "USD"]).default("USD"),
  maintenance_since: z.string().nullable().optional(),
  maintenance_price_updated_at: z.string().nullable().optional(),
});

export type ProjectPayloadSchema = z.infer<typeof projectPayloadSchema>;
