import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { filteredUpdateHandlers } from "@/lib/mutations";
import {
  enrichMovement,
  syncMovements,
  type EnrichPayload,
} from "@/app/(dashboard)/finanzas/actions";
import type { Movement, MovementType } from "@/lib/types/database.types";

const MOVEMENTS_KEY = ["movements"];

function monthRange(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export function useMovements(month: Date, type?: MovementType) {
  const { from, to } = monthRange(month);
  return useQuery({
    queryKey: [...MOVEMENTS_KEY, from, to, type ?? "all"],
    queryFn: async (): Promise<Movement[]> => {
      const supabase = createClient();
      let query = supabase
        .from("movements")
        .select("*")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw error;
      return data as Movement[];
    },
  });
}

export function useEnrichMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EnrichPayload }) =>
      enrichMovement(id, payload),
    ...filteredUpdateHandlers<Movement, Partial<EnrichPayload>>(
      queryClient,
      MOVEMENTS_KEY,
    ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_KEY });
    },
  });
}

export function useSyncMovements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncMovements(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_KEY });
    },
  });
}
