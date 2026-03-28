"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { expensePayloadSchema } from "@/lib/validations/expense";
import type { ExpenseCategory, ExpenseFrequency, Currency } from "@/lib/types/database.types";

export interface ExpensePayload {
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  category?: ExpenseCategory | null;
  recurrent: boolean;
  frequency?: ExpenseFrequency | null;
  notes?: string | null;
}

export async function createExpense(payload: ExpensePayload) {
  const validated = expensePayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert(validated);
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}

export async function updateExpense(id: string, payload: Partial<ExpensePayload>) {
  const validated = expensePayloadSchema.partial().parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(validated).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}
