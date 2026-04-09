"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

interface UseInlineEditOptions<T extends { id: string }, F extends string> {
  getValue: (item: T, field: F) => string | null | undefined;
  onCommit: (id: string, field: F, value: string | null) => Promise<void>;
  requiredFields?: F[];
}

export function useInlineEdit<T extends { id: string }, F extends string>({
  getValue,
  onCommit,
  requiredFields = [],
}: UseInlineEditOptions<T, F>) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: F } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent, item: T, field: F) {
    e.stopPropagation();
    setEditingCell({ id: item.id, field });
    setEditValue(getValue(item, field) ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit() {
    if (!editingCell) return;
    const value = editValue.trim() || null;
    if (requiredFields.includes(editingCell.field) && !value) {
      setEditingCell(null);
      return;
    }
    try {
      await onCommit(editingCell.id, editingCell.field, value);
    } catch {
      toast.error("No se pudo guardar el cambio");
    } finally {
      setEditingCell(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") setEditingCell(null);
  }

  function isActive(id: string, field: F) {
    return editingCell?.id === id && editingCell?.field === field;
  }

  function renderCell(item: T, field: F, placeholder: string) {
    if (isActive(item.id, field)) {
      return (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-primary outline-none text-sm py-0.5"
        />
      );
    }
    return (
      <span
        onClick={(e) => startEdit(e, item, field)}
        className="cursor-text hover:text-foreground transition-colors"
      >
        {getValue(item, field) ?? (
          <span className="text-muted-foreground/40 italic">{placeholder}</span>
        )}
      </span>
    );
  }

  return { editingCell, inputRef, startEdit, commitEdit, handleKeyDown, isActive, renderCell };
}
