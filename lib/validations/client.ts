import { z } from "zod";

export const clientPayloadSchema = z.object({
  name: z.string().min(1),
  sector: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ClientPayloadSchema = z.infer<typeof clientPayloadSchema>;
