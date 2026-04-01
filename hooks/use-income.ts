import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type { Movement } from "@/lib/types/database.types";

const BASE_KEY = ["income"];

function monthRange(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export function useIncome(month: Date) {
  const { from, to } = monthRange(month);
  return useQuery({
    queryKey: [...BASE_KEY, from, to],
    queryFn: async (): Promise<Movement[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("movements")
        .select("*")
        .eq("type", "credit")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Movement[];
    },
  });
}
