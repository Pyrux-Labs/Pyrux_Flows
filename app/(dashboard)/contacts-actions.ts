"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ContactType } from "@/lib/types/database.types";

const contactSchema = z.object({
  prospect_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  type: z.enum(["email", "instagram", "facebook", "whatsapp", "telefono", "linkedin", "otro"]),
  value: z.string().min(1),
});

export interface ContactPayload {
  prospect_id?: string | null;
  client_id?: string | null;
  type: ContactType;
  value: string;
}

export async function createContactAction(payload: ContactPayload) {
  const validated = contactSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert(validated);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
  revalidatePath("/clientes");
}

export async function deleteContactAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospectos");
  revalidatePath("/clientes");
}
