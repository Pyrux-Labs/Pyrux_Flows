"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { movementEnrichSchema } from "@/lib/validations/movement-enrich";

export interface EnrichPayload {
  project_id?: string | null;
  category?: string | null;
  is_recurring?: boolean;
  notes?: string | null;
  save_as_rule?: boolean;
}

export async function enrichMovement(id: string, payload: EnrichPayload) {
  const { save_as_rule, ...rest } = movementEnrichSchema.parse(payload);
  const supabase = await createClient();

  const { data: movement, error: fetchError } = await supabase
    .from("movements")
    .select("counterpart_id, counterpart_name, type")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase.from("movements").update(rest).eq("id", id);
  if (error) throw new Error(error.message);

  if (save_as_rule && movement?.counterpart_id) {
    await supabase.from("mp_rules").upsert(
      {
        counterpart_id: movement.counterpart_id,
        counterpart_name: movement.counterpart_name,
        type: movement.type,
        project_id: rest.project_id ?? null,
        category: rest.category ?? null,
        is_recurring: rest.is_recurring ?? false,
      },
      { onConflict: "counterpart_id,type" },
    );
  }

  revalidatePath("/finanzas");
  revalidatePath("/gastos");
}

export async function syncMovements() {
  const { runMercadoPagoSync } = await import("@/lib/sync/sync-mercadopago");
  const result = await runMercadoPagoSync();
  revalidatePath("/finanzas");
  revalidatePath("/gastos");
  return result;
}
