import { z } from "zod";
import { SECTOR_VALUES } from "@/lib/constants/labels";

export const clientPayloadSchema = z.object({
  name: z.string().min(1),
  sector: z.enum(SECTOR_VALUES).nullable().optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ClientPayloadSchema = z.infer<typeof clientPayloadSchema>;
