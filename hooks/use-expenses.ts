import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpensePayload,
} from "@/app/(dashboard)/gastos/actions";
import type { Expense } from "@/lib/types/database.types";

function monthRange(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export function useExpenses(month: Date) {
  const { from, to } = monthRange(month);
  return useQuery({
    queryKey: ["expenses", from, to],
    queryFn: async (): Promise<Expense[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpensePayload) => createExpense(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["expenses"] });
      const previousQueries = queryClient.getQueriesData<Expense[]>({ queryKey: ["expenses"] });
      const tempExpense = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Expense;
      queryClient.setQueriesData<Expense[]>({ queryKey: ["expenses"] }, (old = []) => [
        tempExpense,
        ...old,
      ]);
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExpensePayload> }) =>
      updateExpense(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["expenses"] });
      const previousQueries = queryClient.getQueriesData<Expense[]>({ queryKey: ["expenses"] });
      queryClient.setQueriesData<Expense[]>({ queryKey: ["expenses"] }, (old = []) =>
        old.map((e) => (e.id === id ? { ...e, ...payload } : e))
      );
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["expenses"] });
      const previousQueries = queryClient.getQueriesData<Expense[]>({ queryKey: ["expenses"] });
      queryClient.setQueriesData<Expense[]>({ queryKey: ["expenses"] }, (old = []) =>
        old.filter((e) => e.id !== id)
      );
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
