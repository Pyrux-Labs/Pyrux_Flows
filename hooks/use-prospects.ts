import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  simpleCreateHandlers,
  simpleUpdateHandlers,
  simpleDeleteHandlers,
} from "@/lib/mutations";
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
    ...simpleCreateHandlers<Prospect, ProspectPayload>(
      queryClient,
      QUERY_KEY,
      (payload) => ({
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: payload.phone ?? null,
        sector: payload.sector ?? null,
        notes: payload.notes ?? null,
      } as Prospect),
    ),
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
    ...simpleUpdateHandlers<Prospect, Partial<ProspectPayload>>(queryClient, QUERY_KEY),
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProspect(id),
    ...simpleDeleteHandlers<Prospect>(queryClient, QUERY_KEY),
  });
}
