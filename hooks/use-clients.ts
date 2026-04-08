import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  simpleCreateHandlers,
  simpleUpdateHandlers,
  simpleDeleteHandlers,
} from "@/lib/mutations";
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
  type ClientPayload,
} from "@/app/(dashboard)/clientes/actions";
import type { Client } from "@/lib/types/database.types";

const QUERY_KEY = ["clients"];

export function useClients() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Client[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => createClientAction(payload),
    ...simpleCreateHandlers<Client, ClientPayload>(
      queryClient,
      QUERY_KEY,
      (payload) =>
        ({
          ...payload,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          prospect_id: null,
          started_at: payload.started_at ?? new Date().toISOString().split("T")[0],
          sector: payload.sector ?? null,
          email: payload.email ?? null,
          phone: payload.phone ?? null,
          notes: payload.notes ?? null,
        }) as Client,
    ),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ClientPayload>;
    }) => updateClientAction(id, payload),
    ...simpleUpdateHandlers<Client, Partial<ClientPayload>>(queryClient, QUERY_KEY),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClientAction(id),
    ...simpleDeleteHandlers<Client>(queryClient, QUERY_KEY),
  });
}
