import { z } from "zod";

export const movementEnrichSchema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  category: z.string().nullable().optional(),
  is_recurring: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  // If true, saves a rule for this counterpart so future movements are auto-assigned
  save_as_rule: z.boolean().default(false),
});

export type MovementEnrichPayload = z.infer<typeof movementEnrichSchema>;
