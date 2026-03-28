"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ProspectStatus,
  ProspectSector,
  ProspectSource,
} from "@/lib/types/database.types";

export interface ProspectPayload {
  name: string;
  business?: string | null;
  sector?: ProspectSector | null;
  email?: string | null;
  phone?: string | null;
  source?: ProspectSource | null;
  status: ProspectStatus;
  notes?: string | null;
  assigned_to?: "juanma" | "gino" | null;
  last_contact?: string | null;
}

export async function createProspect(payload: ProspectPayload) {
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
}

export async function updateProspect(id: string, payload: Partial<ProspectPayload>) {
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
}

export async function deleteProspect(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
}
