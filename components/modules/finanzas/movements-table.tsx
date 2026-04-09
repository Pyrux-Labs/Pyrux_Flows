"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pencil, TrendingUp, RefreshCw, AlertCircle, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MOVEMENT_CREDIT_CATEGORY_LABELS,
  MOVEMENT_DEBIT_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type { Movement, MovementType, ProjectWithClient } from "@/lib/types/database.types";

interface MovementsTableProps {
  movements: Movement[];
  projects: ProjectWithClient[];
  isLoading: boolean;
  filter: MovementType | "all";
  onEdit: (movement: Movement) => void;
}

const CATEGORY_LABELS: Record<MovementType, Record<string, string>> = {
  credit: MOVEMENT_CREDIT_CATEGORY_LABELS,
  debit: MOVEMENT_DEBIT_CATEGORY_LABELS,
};

export function MovementsTable({
  movements,
  projects,
  isLoading,
  filter,
  onEdit,
}: MovementsTableProps) {
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const emptyTitle =
    filter === "credit"
      ? "Sin ingresos este mes"
      : filter === "debit"
        ? "Sin gastos este mes"
        : "Sin movimientos este mes";

  if (!movements.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={emptyTitle}
        description="Los movimientos se sincronizan automáticamente desde Mercado Pago."
      />
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {filter === "all" && <TableHead className="w-24">Tipo</TableHead>}
            <TableHead>Descripción</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((entry) => {
            const project = entry.project_id ? projectMap[entry.project_id] : null;
            const isUnclassified = !entry.category && !entry.project_id;
            const categoryLabels = CATEGORY_LABELS[entry.type];
            return (
              <TableRow key={entry.id} className="hover:bg-secondary/50">
                {filter === "all" && (
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        entry.type === "credit"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-red-400 border-red-500/30 bg-red-500/10"
                      }
                    >
                      {entry.type === "credit" ? "↑ Ingreso" : "↓ Gasto"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {isUnclassified && (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[200px]">
                      {entry.description ?? entry.counterpart_name ?? (entry.type === "credit" ? "Transferencia recibida" : "Transferencia enviada")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project ? (
                    <span className="text-foreground">{project.name}</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(entry.amount, entry.currency)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {entry.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[entry.category] ?? entry.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                    {entry.is_recurring && (
                      <RefreshCw className="h-3 w-3 text-primary shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
