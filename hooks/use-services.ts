import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createService,
  updateService,
  deleteService,
  type ServicePayload,
} from "@/app/(dashboard)/tarifas/actions";
import type { Service } from "@/lib/types/database.types";

const QUERY_KEY = ["services"];

export function useServices() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Service[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => createService(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Service[]>(QUERY_KEY);
      const tempService = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Service;
      queryClient.setQueryData<Service[]>(QUERY_KEY, (old = []) => [tempService, ...old]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) =>
      updateService(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Service[]>(QUERY_KEY);
      queryClient.setQueryData<Service[]>(QUERY_KEY, (old = []) =>
        old.map((s) => (s.id === id ? { ...s, ...payload } : s))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Service[]>(QUERY_KEY);
      queryClient.setQueryData<Service[]>(QUERY_KEY, (old = []) =>
        old.filter((s) => s.id !== id)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
