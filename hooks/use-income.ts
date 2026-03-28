import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import {
  filteredCreateHandlers,
  filteredUpdateHandlers,
  filteredDeleteHandlers,
} from "@/lib/mutations";
import {
  createIncome,
  updateIncome,
  deleteIncome,
  type IncomePayload,
} from "@/app/(dashboard)/finanzas/actions";
import type { Income } from "@/lib/types/database.types";

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
    queryFn: async (): Promise<Income[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("income")
        .select("*")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Income[];
    },
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncomePayload) => createIncome(payload),
    ...filteredCreateHandlers<Income, IncomePayload>(
      queryClient,
      BASE_KEY,
      (payload) => ({
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Income),
    ),
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IncomePayload> }) =>
      updateIncome(id, payload),
    ...filteredUpdateHandlers<Income, Partial<IncomePayload>>(queryClient, BASE_KEY),
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    ...filteredDeleteHandlers<Income>(queryClient, BASE_KEY),
  });
}
