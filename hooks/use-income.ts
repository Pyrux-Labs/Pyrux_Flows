import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import {
  createIncome,
  updateIncome,
  deleteIncome,
  type IncomePayload,
} from "@/app/(dashboard)/finanzas/actions";
import type { Income } from "@/lib/types/database.types";

function monthRange(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export function useIncome(month: Date) {
  const { from, to } = monthRange(month);
  return useQuery({
    queryKey: ["income", from, to],
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
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["income"] });
      const previousQueries = queryClient.getQueriesData<Income[]>({ queryKey: ["income"] });
      const tempIncome = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Income;
      queryClient.setQueriesData<Income[]>({ queryKey: ["income"] }, (old = []) => [
        tempIncome,
        ...old,
      ]);
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IncomePayload> }) =>
      updateIncome(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["income"] });
      const previousQueries = queryClient.getQueriesData<Income[]>({ queryKey: ["income"] });
      queryClient.setQueriesData<Income[]>({ queryKey: ["income"] }, (old = []) =>
        old.map((i) => (i.id === id ? { ...i, ...payload } : i))
      );
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["income"] });
      const previousQueries = queryClient.getQueriesData<Income[]>({ queryKey: ["income"] });
      queryClient.setQueriesData<Income[]>({ queryKey: ["income"] }, (old = []) =>
        old.filter((i) => i.id !== id)
      );
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["income"] }),
  });
}
