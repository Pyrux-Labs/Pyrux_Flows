import { z } from "zod";

export const prospectPayloadSchema = z.object({
  name: z.string().min(1),
  sector: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(["sin_contactar", "contactado", "en_negociacion", "cerrado", "perdido"]),
  notes: z.string().nullable().optional(),
});

export type ProspectPayloadSchema = z.infer<typeof prospectPayloadSchema>;
