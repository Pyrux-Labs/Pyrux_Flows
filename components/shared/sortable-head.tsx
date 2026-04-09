"use client";

import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeadProps {
  children: React.ReactNode;
  column: string;
  activeColumn: string;
  direction: "asc" | "desc";
  onSort: (column: string) => void;
  className?: string;
}

export function SortableHead({
  children,
  column,
  activeColumn,
  direction,
  onSort,
  className,
}: SortableHeadProps) {
  const isActive = column === activeColumn;

  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(column)}
        className={cn(
          "flex items-center gap-1 hover:text-foreground transition-colors select-none",
          isActive && "text-foreground",
        )}
      >
        {children}
        {isActive ? (
          direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        )}
      </button>
    </TableHead>
  );
}
