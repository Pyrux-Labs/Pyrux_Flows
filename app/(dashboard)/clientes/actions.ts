"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { clientPayloadSchema } from "@/lib/validations/client";

export interface ClientPayload {
  name: string;
  sector?: string | null;
  phone?: string | null;
  started_at?: string | null;
  notes?: string | null;
}

export async function createClientAction(payload: ClientPayload) {
  const validated = clientPayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({
    ...validated,
    started_at: validated.started_at ?? new Date().toISOString().split("T")[0],
  });
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function updateClientAction(id: string, payload: Partial<ClientPayload>) {
  const validated = clientPayloadSchema.partial().parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(validated).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}
