"use client";

import { useState } from "react";
import { startOfMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { MonthNav } from "@/components/shared/month-nav";
import { ExpenseTable } from "./expense-table";
import { ExpenseSummary } from "./expense-summary";
import { ExpenseSheet } from "./expense-sheet";
import { useExpenses } from "@/hooks/use-expenses";
import { useProjects } from "@/hooks/use-projects";
import { useSyncMovements } from "@/hooks/use-movements";
import { usePagination } from "@/hooks/use-pagination";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Movement } from "@/lib/types/database.types";

export function GastosShell() {
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const { data: expenses = [], isLoading } = useExpenses(month);
  const { data: projects = [] } = useProjects();
  const sync = useSyncMovements();
  const { visibleItems: visibleExpenses, hasMore, remaining, loadMore } = usePagination(expenses);

  const totalARS = expenses
    .filter((e) => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUSD = expenses
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0);

  function handleEdit(movement: Movement) {
    setEditingMovement(movement);
    setSheetOpen(true);
  }

  async function handleSync() {
    try {
      const result = await sync.mutateAsync();
      toast.success(`Sincronizado: ${result.synced} movimiento${result.synced !== 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Egresos sincronizados desde Mercado Pago
          </p>
        </div>
        <Button
          onClick={handleSync}
          size="sm"
          variant="outline"
          disabled={sync.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>
      </div>

      {/* Month nav + totals */}
      <div className="flex flex-wrap items-center gap-4">
        <MonthNav month={month} onChange={setMonth} />
        {!isLoading && expenses.length > 0 && (
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
          <ExpenseTable
            expenses={visibleExpenses}
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
          <ExpenseSummary expenses={expenses} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <ExpenseSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingMovement(null);
        }}
        movement={editingMovement}
      />
    </div>
  );
}
