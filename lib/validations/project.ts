import { z } from "zod";

export const projectPayloadSchema = z.object({
  name: z.string().min(1),
  client_name: z.string().min(1),
  prospect_id: z.string().uuid().nullable().optional(),
  status: z.enum(["activo", "pausado", "completado", "cancelado"]),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  paid: z.boolean(),
  notes: z.string().nullable().optional(),
});

export type ProjectPayloadSchema = z.infer<typeof projectPayloadSchema>;
