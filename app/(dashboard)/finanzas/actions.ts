"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { incomePayloadSchema } from "@/lib/validations/income";
import type { IncomeCategory, Currency } from "@/lib/types/database.types";

export interface IncomePayload {
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  project_id?: string | null;
  category?: IncomeCategory | null;
  invoice_sent: boolean;
  paid: boolean;
}

export async function createIncome(payload: IncomePayload) {
  const validated = incomePayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("income").insert(validated);
  if (error) throw new Error(error.message);
  revalidatePath("/finanzas");
}

export async function updateIncome(id: string, payload: Partial<IncomePayload>) {
  const validated = incomePayloadSchema.partial().parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("income").update(validated).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/finanzas");
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/finanzas");
}
