"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectStatus, AssignedTo } from "@/lib/types/database.types";

export interface ProjectPayload {
  name: string;
  client_name: string;
  prospect_id?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  paid: boolean;
  notes?: string | null;
  assigned_to?: AssignedTo | null;
}

export async function createProject(payload: ProjectPayload) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}

export async function updateProject(id: string, payload: Partial<ProjectPayload>) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}
