import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createProject,
  updateProject,
  deleteProject,
  type ProjectPayload,
} from "@/app/(dashboard)/proyectos/actions";
import type { Project } from "@/lib/types/database.types";

const QUERY_KEY = ["projects"];

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPayload) => createProject(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Project[]>(QUERY_KEY);
      const tempProject = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Project;
      queryClient.setQueryData<Project[]>(QUERY_KEY, (old = []) => [tempProject, ...old]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProjectPayload> }) =>
      updateProject(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Project[]>(QUERY_KEY);
      queryClient.setQueryData<Project[]>(QUERY_KEY, (old = []) =>
        old.map((p) => (p.id === id ? { ...p, ...payload } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Project[]>(QUERY_KEY);
      queryClient.setQueryData<Project[]>(QUERY_KEY, (old = []) => old.filter((p) => p.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
