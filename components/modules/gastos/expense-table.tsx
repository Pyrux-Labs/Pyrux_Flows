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
import { Pencil, Receipt, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types/database.types";

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  herramientas: "Herramientas",
  hosting: "Hosting",
  marketing: "Marketing",
  servicios: "Servicios",
  impuestos: "Impuestos",
  otro: "Otro",
};

export function ExpenseTable({ expenses, isLoading, onEdit }: ExpenseTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin gastos este mes"
        description="Registrá un gasto para empezar a ver el resumen."
      />
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-center">Recurrente</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-secondary/50">
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCurrency(expense.amount, expense.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(expense.date)}
              </TableCell>
              <TableCell>
                {expense.category ? (
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[expense.category] ?? expense.category}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {expense.recurrent ? (
                  <RefreshCw className="h-3.5 w-3.5 text-primary mx-auto" />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(expense)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
