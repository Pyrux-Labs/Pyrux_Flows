"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const balanceSchema = z.object({
  opening_balance_ars: z.number().min(0),
  opening_balance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function updateOpeningBalance(payload: {
  opening_balance_ars: number;
  opening_balance_date: string;
}) {
  const { opening_balance_ars, opening_balance_date } = balanceSchema.parse(payload);
  const supabase = await createClient();

  await supabase.from("settings").upsert(
    { key: "opening_balance_ars", value: String(opening_balance_ars), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  await supabase.from("settings").upsert(
    { key: "opening_balance_date", value: opening_balance_date, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  revalidatePath("/configuracion");
}

export async function getSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}
