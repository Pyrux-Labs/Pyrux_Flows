import { useMutation, useQueryClient } from "@tanstack/react-query";
import { filteredUpdateHandlers } from "@/lib/mutations";
import {
  enrichMovement,
  syncMovements,
  type EnrichPayload,
} from "@/app/(dashboard)/finanzas/actions";
import type { Movement } from "@/lib/types/database.types";

const INCOME_KEY = ["income"];
const EXPENSES_KEY = ["expenses"];

export function useEnrichMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EnrichPayload }) =>
      enrichMovement(id, payload),
    ...filteredUpdateHandlers<Movement, Partial<EnrichPayload>>(
      queryClient,
      INCOME_KEY,
    ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    },
  });
}

export function useSyncMovements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncMovements(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    },
  });
}
