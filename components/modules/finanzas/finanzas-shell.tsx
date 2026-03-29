"use client";

import { useState } from "react";
import { startOfMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MonthNav } from "@/components/shared/month-nav";
import { IncomeTable } from "./income-table";
import { IncomeSummary } from "./income-summary";
import { IncomeSheet } from "./income-sheet";
import { useIncome } from "@/hooks/use-income";
import { useProjects } from "@/hooks/use-projects";
import { usePagination } from "@/hooks/use-pagination";
import { formatCurrency } from "@/lib/utils";
import type { Income } from "@/lib/types/database.types";

export function FinanzasShell() {
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const { data: income = [], isLoading } = useIncome(month);
  const { data: projects = [] } = useProjects();
  const { visibleItems: visibleIncome, hasMore, remaining, loadMore } = usePagination(income);

  const totalARS = income
    .filter((e) => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUSD = income
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0);

  function handleEdit(entry: Income) {
    setEditingIncome(entry);
    setSheetOpen(true);
  }

  function handleAdd() {
    setEditingIncome(null);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditingIncome(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Finanzas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro de ingresos del estudio
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo ingreso
        </Button>
      </div>

      {/* Month nav + totals */}
      <div className="flex flex-wrap items-center gap-4">
        <MonthNav month={month} onChange={setMonth} />
        {!isLoading && income.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Total:</span>
            {totalARS > 0 && (
              <span className="font-semibold text-foreground">
                {formatCurrency(totalARS, "ARS")}
              </span>
            )}
            {totalARS > 0 && totalUSD > 0 && (
              <span className="text-muted-foreground">·</span>
            )}
            {totalUSD > 0 && (
              <span className="font-semibold text-foreground">
                {formatCurrency(totalUSD, "USD")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tabla">
        <TabsList className="mb-4">
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="space-y-3">
          <IncomeTable
            income={visibleIncome}
            projects={projects}
            isLoading={isLoading}
            onEdit={handleEdit}
          />
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore}>
                Cargar más ({remaining} restantes)
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resumen">
          <IncomeSummary income={income} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <IncomeSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        income={editingIncome}
      />
    </div>
  );
}
