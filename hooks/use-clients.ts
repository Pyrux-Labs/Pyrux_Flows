import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
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
