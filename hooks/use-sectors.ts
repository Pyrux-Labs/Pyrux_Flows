import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Sector } from "@/lib/types/database.types";

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async (): Promise<Sector[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sectors")
        .select("*")
        .order("label", { ascending: true });
      if (error) throw error;
      return data as Sector[];
    },
    staleTime: Infinity,
  });
}
