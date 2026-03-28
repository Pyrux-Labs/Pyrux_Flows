"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory, Currency } from "@/lib/types/database.types";

export interface ExpensePayload {
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  category?: ExpenseCategory | null;
  recurrent: boolean;
  notes?: string | null;
}

export async function createExpense(payload: ExpensePayload) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}

export async function updateExpense(id: string, payload: Partial<ExpensePayload>) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}
