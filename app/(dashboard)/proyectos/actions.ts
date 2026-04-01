"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { projectPayloadSchema } from "@/lib/validations/project";
import type { ProjectStatus, Currency } from "@/lib/types/database.types";

export interface ProjectPayload {
  client_id: string;
  service_id?: string | null;
  name: string;
  status: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  price?: number | null;
  currency: Currency;
  notes?: string | null;
  maintenance_amount?: number | null;
  maintenance_currency: Currency;
  maintenance_since?: string | null;
  maintenance_price_updated_at?: string | null;
}

export async function createProject(payload: ProjectPayload) {
  const validated = projectPayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert(validated);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}

export async function updateProject(id: string, payload: Partial<ProjectPayload>) {
  const validated = projectPayloadSchema.partial().parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(validated).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}
