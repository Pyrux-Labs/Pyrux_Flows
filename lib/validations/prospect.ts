import { z } from "zod";

export const prospectPayloadSchema = z.object({
  name: z.string().min(1),
  sector: z
    .enum([
      "contabilidad",
      "construccion",
      "consultoria",
      "dental",
      "educacion",
      "estetica",
      "fitness",
      "gastronomia",
      "inmobiliaria",
      "legal",
      "logistica",
      "medico",
      "moda",
      "ong",
      "retail",
      "tecnologia",
      "turismo",
      "otro",
    ])
    .nullable()
    .optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(["contactado", "en_negociacion", "cerrado", "perdido"]),
  notes: z.string().nullable().optional(),
});

export type ProspectPayloadSchema = z.infer<typeof prospectPayloadSchema>;
