import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import {
  filteredCreateHandlers,
  filteredUpdateHandlers,
  filteredDeleteHandlers,
} from "@/lib/mutations";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpensePayload,
} from "@/app/(dashboard)/gastos/actions";
import type { Expense } from "@/lib/types/database.types";

const BASE_KEY = ["expenses"];

function monthRange(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export function useExpenses(month: Date) {
  const { from, to } = monthRange(month);
  return useQuery({
    queryKey: [...BASE_KEY, from, to],
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
    ...filteredCreateHandlers<Expense, ExpensePayload>(
      queryClient,
      BASE_KEY,
      (payload) => ({
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Expense),
    ),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExpensePayload> }) =>
      updateExpense(id, payload),
    ...filteredUpdateHandlers<Expense, Partial<ExpensePayload>>(queryClient, BASE_KEY),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    ...filteredDeleteHandlers<Expense>(queryClient, BASE_KEY),
  });
}
