import { z } from "zod";
import { SECTOR_VALUES } from "@/lib/constants/labels";

export const prospectPayloadSchema = z.object({
  name: z.string().min(1),
  sector: z.enum(SECTOR_VALUES).nullable().optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(["sin_contactar", "contactado", "en_negociacion", "cerrado", "perdido"]),
  notes: z.string().nullable().optional(),
});

export type ProspectPayloadSchema = z.infer<typeof prospectPayloadSchema>;
