"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { prospectPayloadSchema } from "@/lib/validations/prospect";
import type { ProspectStatus, Sector } from "@/lib/types/database.types";

export interface ProspectPayload {
  name: string;
  sector?: Sector | null;
  email?: string | null;
  phone?: string | null;
  status: ProspectStatus;
  notes?: string | null;
}

export async function createProspect(payload: ProspectPayload) {
  const validated = prospectPayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").insert(validated);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
}

export async function updateProspect(id: string, payload: Partial<ProspectPayload>) {
  const validated = prospectPayloadSchema.partial().parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").update(validated).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
}

export async function deleteProspect(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
}
