import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createContactAction,
  deleteContactAction,
  type ContactPayload,
} from "@/app/(dashboard)/contacts-actions";
import type { Contact } from "@/lib/types/database.types";

const QUERY_KEY = ["contacts"];

export function useContacts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Contact[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContactPayload) => createContactAction(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Contact[]>(QUERY_KEY);
      const optimistic: Contact = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        prospect_id: payload.prospect_id ?? null,
        client_id: payload.client_id ?? null,
        type: payload.type,
        value: payload.value,
      };
      queryClient.setQueryData<Contact[]>(QUERY_KEY, (old = []) => [...old, optimistic]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContactAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Contact[]>(QUERY_KEY);
      queryClient.setQueryData<Contact[]>(QUERY_KEY, (old = []) =>
        old.filter((c) => c.id !== id),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
