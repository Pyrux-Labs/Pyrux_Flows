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
import { Pencil, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INCOME_CATEGORY_LABELS } from "@/lib/constants/labels";
import type { Movement, ProjectWithClient } from "@/lib/types/database.types";

interface IncomeTableProps {
  income: Movement[];
  projects: ProjectWithClient[];
  isLoading: boolean;
  onEdit: (movement: Movement) => void;
}

export function IncomeTable({ income, projects, isLoading, onEdit }: IncomeTableProps) {
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

  if (!income.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sin ingresos este mes"
        description="Los ingresos se sincronizan automáticamente desde Mercado Pago."
      />
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Descripción</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {income.map((entry) => {
            const project = entry.project_id ? projectMap[entry.project_id] : null;
            const isUnclassified = !entry.category && !entry.project_id;
            return (
              <TableRow key={entry.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {isUnclassified && (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[200px]">
                      {entry.description ?? entry.counterpart_name ?? "—"}
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
                        {INCOME_CATEGORY_LABELS[entry.category] ?? entry.category}
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
