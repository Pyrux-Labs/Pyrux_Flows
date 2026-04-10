"use client";

import { useState, useEffect } from "react";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Client-side "load more" pagination.
 * Slices the full items array to show only visibleCount items.
 * Pass a `resetKey` to reset pagination when a filter/month changes explicitly.
 * Without resetKey, pagination survives refetches (avoids scroll-to-top on mutations).
 */
export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE, resetKey?: unknown) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Only reset when an explicit key changes (e.g. filter or month), not on every refetch.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;
  const remaining = items.length - visibleCount;

  function loadMore() {
    setVisibleCount((prev) => prev + pageSize);
  }

  return { visibleItems, hasMore, remaining, total: items.length, loadMore };
}
