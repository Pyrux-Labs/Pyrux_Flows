"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServiceCategory, ServiceUnit, Currency } from "@/lib/types/database.types";

export interface ServicePayload {
  name: string;
  description?: string | null;
  price?: number | null;
  currency: Currency;
  unit?: ServiceUnit | null;
  category?: ServiceCategory | null;
  active: boolean;
}

export async function createService(payload: ServicePayload) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/tarifas");
}

export async function updateService(id: string, payload: Partial<ServicePayload>) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarifas");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarifas");
}
