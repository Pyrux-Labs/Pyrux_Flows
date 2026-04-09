"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useSheetWithUrl<T extends { id: string }>(
  items: T[],
  isLoading: boolean,
  redirectPath: string,
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const openedEditRef = useRef<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  useEffect(() => {
    if (!editId || isLoading || openedEditRef.current === editId) return;
    const item = items.find((i) => i.id === editId);
    if (item) {
      openedEditRef.current = editId;
      setEditingItem(item);
      setSheetOpen(true);
      router.replace(redirectPath);
    }
  }, [editId, isLoading, items, router, redirectPath]);

  function handleEdit(item: T) {
    setEditingItem(item);
    setSheetOpen(true);
  }

  function handleNew() {
    setEditingItem(null);
    setSheetOpen(true);
  }

  function handleSheetChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditingItem(null);
  }

  return { sheetOpen, editingItem, handleEdit, handleNew, handleSheetChange };
}
