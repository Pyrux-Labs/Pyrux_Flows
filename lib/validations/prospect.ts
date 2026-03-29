import { z } from "zod";

export const prospectPayloadSchema = z.object({
  name: z.string().min(1),
  business: z.string().nullable().optional(),
  sector: z
    .enum([
      "contabilidad",
      "legal",
      "medico",
      "estetica",
      "gastronomia",
      "fitness",
      "dental",
      "otro",
    ])
    .nullable()
    .optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  source: z
    .enum([
      "word_of_mouth",
      "instagram",
      "linkedin",
      "cold_email",
      "whatsapp",
      "otro",
    ])
    .nullable()
    .optional(),
  status: z.enum(["nuevo", "contactado", "en_negociacion", "cerrado", "perdido"]),
  notes: z.string().nullable().optional(),
  last_contact: z.string().nullable().optional(),
});

export type ProspectPayloadSchema = z.infer<typeof prospectPayloadSchema>;
