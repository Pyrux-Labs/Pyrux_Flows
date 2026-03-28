"use client";

import { useState, useEffect } from "react";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Client-side "load more" pagination.
 * Slices the full items array to show only visibleCount items.
 * Resets automatically when the items array reference changes (e.g. month filter).
 */
export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset when the data source changes (month navigation, refetch, etc.)
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;
  const remaining = items.length - visibleCount;

  function loadMore() {
    setVisibleCount((prev) => prev + pageSize);
  }

  return { visibleItems, hasMore, remaining, total: items.length, loadMore };
}
