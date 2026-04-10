"use client";

import { useState } from "react";
import { startOfMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { MonthNav } from "@/components/shared/month-nav";
import { MovementsTable } from "./movements-table";
import { MovementsSummary } from "./movements-summary";
import { MovementSheet } from "./movement-sheet";
import { useMovements, useSyncMovements } from "@/hooks/use-movements";
import { useProjects } from "@/hooks/use-projects";
import { usePagination } from "@/hooks/use-pagination";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Movement, MovementType } from "@/lib/types/database.types";

type Filter = MovementType | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "credit", label: "Ingresos" },
  { value: "debit", label: "Gastos" },
];

export function MovementsShell() {
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const { data: movements = [], isLoading } = useMovements(
    month,
    filter === "all" ? undefined : filter,
  );
  const { data: projects = [] } = useProjects();
  const sync = useSyncMovements();
  const { visibleItems, hasMore, remaining, loadMore } = usePagination(movements, 20, `${month.getTime()}-${filter}`);

  const totalARS = movements
    .filter((e) => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUSD = movements
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0);

  function handleEdit(movement: Movement) {
    setEditingMovement(movement);
    setSheetOpen(true);
  }

  async function handleSync() {
    try {
      const result = await sync.mutateAsync();
      toast.success(
        `Sincronizado: ${result.synced} movimiento${result.synced !== 1 ? "s" : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Finanzas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Movimientos sincronizados desde Mercado Pago
          </p>
        </div>
        <Button
          onClick={handleSync}
          size="sm"
          variant="outline"
          disabled={sync.isPending}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`}
          />
          Sincronizar
        </Button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        <MonthNav month={month} onChange={setMonth} />

        {/* Type filter */}
        <div className="flex items-center rounded-md border border-border bg-card p-0.5 gap-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!isLoading && movements.length > 0 && (
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
          <MovementsTable
            movements={visibleItems}
            projects={projects}
            isLoading={isLoading}
            filter={filter}
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
          <MovementsSummary
            movements={movements}
            filter={filter}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <MovementSheet
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
