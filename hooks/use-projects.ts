import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  simpleCreateHandlers,
  simpleUpdateHandlers,
  simpleDeleteHandlers,
} from "@/lib/mutations";
import {
  createProject,
  updateProject,
  deleteProject,
  type ProjectPayload,
} from "@/app/(dashboard)/proyectos/actions";
import type { ProjectWithClient } from "@/lib/types/database.types";

const QUERY_KEY = ["projects"];

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ProjectWithClient[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:clients(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProjectWithClient[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPayload) => createProject(payload),
    ...simpleCreateHandlers<ProjectWithClient, ProjectPayload>(
      queryClient,
      QUERY_KEY,
      (payload) =>
        ({
          ...payload,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client: { id: payload.client_id, name: "" },
        }) as ProjectWithClient,
    ),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProjectPayload>;
    }) => updateProject(id, payload),
    ...simpleUpdateHandlers<ProjectWithClient, Partial<ProjectPayload>>(
      queryClient,
      QUERY_KEY,
    ),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    ...simpleDeleteHandlers<ProjectWithClient>(queryClient, QUERY_KEY),
  });
}
