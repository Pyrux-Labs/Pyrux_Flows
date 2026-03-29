import { useRef, useCallback } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

interface DeleteWithUndoOptions {
  mutateAsync: (id: string) => Promise<unknown>;
  queryKey?: QueryKey;
  baseKey?: string[];
}

interface TriggerOptions {
  id: string;
  label: string;
}

export function useDeleteWithUndo({ mutateAsync, queryKey, baseKey }: DeleteWithUndoOptions) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDelete = useCallback(
    ({ id, label }: TriggerOptions) => {
      let snapshot: unknown;

      if (baseKey) {
        const entries = queryClient.getQueriesData<{ id: string }[]>({ queryKey: baseKey });
        snapshot = entries;
        queryClient.setQueriesData<{ id: string }[]>(
          { queryKey: baseKey },
          (old = []) => old.filter((item) => item.id !== id),
        );
      } else if (queryKey) {
        snapshot = queryClient.getQueryData(queryKey);
        queryClient.setQueryData<{ id: string }[]>(queryKey, (old = []) =>
          old.filter((item) => item.id !== id),
        );
      }

      function restoreSnapshot(snap: unknown) {
        if (baseKey && Array.isArray(snap)) {
          (snap as [QueryKey, unknown][]).forEach(([key, data]) => {
            queryClient.setQueryData(key, data);
          });
        } else if (queryKey && snap !== undefined) {
          queryClient.setQueryData(queryKey, snap);
        }
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await mutateAsync(id);
          if (baseKey) {
            queryClient.invalidateQueries({ queryKey: baseKey });
          } else if (queryKey) {
            queryClient.invalidateQueries({ queryKey });
          }
        } catch {
          restoreSnapshot(snapshot);
          toast.error(`Error al eliminar "${label}"`);
        }
      }, 5000);

      toast(`"${label}" eliminado`, {
        duration: 5000,
        action: {
          label: "Deshacer",
          onClick: () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            restoreSnapshot(snapshot);
          },
        },
      });
    },
    [mutateAsync, queryKey, baseKey, queryClient],
  );

  return { handleDelete };
}
