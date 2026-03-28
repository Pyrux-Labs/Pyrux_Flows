// Factory functions for React Query optimistic update handlers.
// Eliminates boilerplate from mutation hooks by generating onMutate/onError/onSettled.

import type { QueryClient, QueryKey } from "@tanstack/react-query";

// --- Simple list queries (single query key: projects, prospects, services) ---

type SimpleContext<T> = { previous: T[] | undefined };

/**
 * Returns optimistic handlers for delete on a simple list query.
 * Removes the item immediately; rolls back if the server action fails.
 */
export function simpleDeleteHandlers<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return {
    onMutate: async (id: string): Promise<SimpleContext<T>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData<T[]>(queryKey, (old = []) =>
        old.filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (
      _err: unknown,
      _id: string,
      context: SimpleContext<T> | undefined,
    ) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}

/**
 * Returns optimistic handlers for update on a simple list query.
 * Patches the item immediately; rolls back if the server action fails.
 */
export function simpleUpdateHandlers<T extends { id: string }, P>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return {
    onMutate: async ({
      id,
      payload,
    }: {
      id: string;
      payload: P;
    }): Promise<SimpleContext<T>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData<T[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === id ? { ...item, ...payload } : item)),
      );
      return { previous };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      context: SimpleContext<T> | undefined,
    ) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}

/**
 * Returns optimistic handlers for create on a simple list query.
 * Prepends a temp item immediately; onSettled syncs the real item from the server.
 */
export function simpleCreateHandlers<T extends { id: string }, P>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  buildTempItem: (payload: P) => T,
) {
  return {
    onMutate: async (payload: P): Promise<SimpleContext<T>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData<T[]>(queryKey, (old = []) => [
        buildTempItem(payload),
        ...old,
      ]);
      return { previous };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      context: SimpleContext<T> | undefined,
    ) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}

// --- Filtered queries (multiple cache entries: expenses, income) ---

type FilteredContext<T> = { previousQueries: [QueryKey, T[] | undefined][] };

/**
 * Returns optimistic handlers for delete on filtered queries (e.g. month-based).
 * Removes the item across all active cache entries for the base key.
 */
export function filteredDeleteHandlers<T extends { id: string }>(
  queryClient: QueryClient,
  baseKey: string[],
) {
  return {
    onMutate: async (id: string): Promise<FilteredContext<T>> => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousQueries = queryClient.getQueriesData<T[]>({
        queryKey: baseKey,
      });
      queryClient.setQueriesData<T[]>({ queryKey: baseKey }, (old = []) =>
        old.filter((item) => item.id !== id),
      );
      return { previousQueries };
    },
    onError: (
      _err: unknown,
      _id: string,
      context: FilteredContext<T> | undefined,
    ) => {
      context?.previousQueries.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: baseKey }),
  };
}

/**
 * Returns optimistic handlers for update on filtered queries.
 * Patches the item across all active cache entries for the base key.
 */
export function filteredUpdateHandlers<T extends { id: string }, P>(
  queryClient: QueryClient,
  baseKey: string[],
) {
  return {
    onMutate: async ({
      id,
      payload,
    }: {
      id: string;
      payload: P;
    }): Promise<FilteredContext<T>> => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousQueries = queryClient.getQueriesData<T[]>({
        queryKey: baseKey,
      });
      queryClient.setQueriesData<T[]>({ queryKey: baseKey }, (old = []) =>
        old.map((item) => (item.id === id ? { ...item, ...payload } : item)),
      );
      return { previousQueries };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      context: FilteredContext<T> | undefined,
    ) => {
      context?.previousQueries.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: baseKey }),
  };
}

/**
 * Returns optimistic handlers for create on filtered queries.
 * Prepends a temp item across all active cache entries for the base key.
 */
export function filteredCreateHandlers<T extends { id: string }, P>(
  queryClient: QueryClient,
  baseKey: string[],
  buildTempItem: (payload: P) => T,
) {
  return {
    onMutate: async (payload: P): Promise<FilteredContext<T>> => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousQueries = queryClient.getQueriesData<T[]>({
        queryKey: baseKey,
      });
      queryClient.setQueriesData<T[]>({ queryKey: baseKey }, (old = []) => [
        buildTempItem(payload),
        ...old,
      ]);
      return { previousQueries };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      context: FilteredContext<T> | undefined,
    ) => {
      context?.previousQueries.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: baseKey }),
  };
}
