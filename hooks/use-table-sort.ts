"use client";

import { useState } from "react";

export function useTableSort<C extends string>(
  defaultColumn: C,
  defaultDirection: "asc" | "desc" = "asc",
) {
  const [sortColumn, setSortColumn] = useState<C>(defaultColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultDirection);

  function handleSort(column: string) {
    const col = column as C;
    if (col === sortColumn) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  }

  return {
    sortColumn,
    sortDirection,
    handleSort,
    dir: sortDirection === "asc" ? 1 : -1,
  };
}
