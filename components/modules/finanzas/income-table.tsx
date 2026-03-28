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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pencil, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUpdateIncome } from "@/hooks/use-income";
import type { Income, Project } from "@/lib/types/database.types";

interface IncomeTableProps {
  income: Income[];
  projects: Project[];
  isLoading: boolean;
  onEdit: (income: Income) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  proyecto: "Proyecto",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
  otro: "Otro",
};

export function IncomeTable({
  income,
  projects,
  isLoading,
  onEdit,
}: IncomeTableProps) {
  const updateIncome = useUpdateIncome();

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  function handleToggle(id: string, field: "invoice_sent" | "paid", value: boolean) {
    updateIncome.mutate({ id, payload: { [field]: value } });
  }

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
        description="Registrá un ingreso para empezar a ver el resumen."
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
            <TableHead className="text-center">Factura</TableHead>
            <TableHead className="text-center">Cobrado</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {income.map((entry) => {
            const project = entry.project_id ? projectMap[entry.project_id] : null;
            return (
              <TableRow key={entry.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium">{entry.description}</TableCell>
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
                  {entry.category ? (
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[entry.category] ?? entry.category}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={entry.invoice_sent}
                    onCheckedChange={(v) =>
                      handleToggle(entry.id, "invoice_sent", Boolean(v))
                    }
                    disabled={updateIncome.isPending}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={entry.paid}
                    onCheckedChange={(v) =>
                      handleToggle(entry.id, "paid", Boolean(v))
                    }
                    disabled={updateIncome.isPending}
                  />
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
