"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { servicePayloadSchema } from "@/lib/validations/service";
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
  const validated = servicePayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert(validated);
  if (error) throw new Error(error.message);
  revalidatePath("/tarifas");
}

export async function updateService(id: string, payload: Partial<ServicePayload>) {
  const validated = servicePayloadSchema.partial().parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("services").update(validated).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarifas");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarifas");
}
