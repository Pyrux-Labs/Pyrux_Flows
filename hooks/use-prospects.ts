import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createProspect,
  updateProspect,
  deleteProspect,
  type ProspectPayload,
} from "@/app/(dashboard)/prospectos/actions";
import type { Prospect } from "@/lib/types/database.types";

const QUERY_KEY = ["prospects"];

export function useProspects() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Prospect[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Prospect[];
    },
  });
}

export function useCreateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProspectPayload) => createProspect(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Prospect[]>(QUERY_KEY);
      const tempProspect = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Prospect;
      queryClient.setQueryData<Prospect[]>(QUERY_KEY, (old = []) => [tempProspect, ...old]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProspectPayload>;
    }) => updateProspect(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Prospect[]>(QUERY_KEY);
      queryClient.setQueryData<Prospect[]>(QUERY_KEY, (old = []) =>
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

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProspect(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Prospect[]>(QUERY_KEY);
      queryClient.setQueryData<Prospect[]>(QUERY_KEY, (old = []) =>
        old.filter((p) => p.id !== id)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
