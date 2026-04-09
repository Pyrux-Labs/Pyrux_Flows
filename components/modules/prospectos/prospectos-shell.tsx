"use client";

import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProspectTable } from "./prospect-table";
import { ProspectKanban } from "./prospect-kanban";
import { ProspectPipeline } from "./prospect-pipeline";
import { ProspectSheet } from "./prospect-sheet";
import { useProspects } from "@/hooks/use-prospects";
import { usePagination } from "@/hooks/use-pagination";
import { useSheetWithUrl } from "@/hooks/use-sheet-with-url";
import type { Prospect } from "@/lib/types/database.types";

export function ProspectosShell() {
  const { data: allProspects = [], isLoading } = useProspects();
  const prospects = useMemo(
    () => allProspects.filter((p) => p.status !== "cerrado"),
    [allProspects],
  );
  const { visibleItems: visibleProspects, hasMore, remaining, loadMore } = usePagination(prospects);
  const { sheetOpen, editingItem, handleEdit, handleNew, handleSheetChange } =
    useSheetWithUrl<Prospect>(allProspects, isLoading, "/prospectos");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Prospectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            CRM — seguimiento de clientes potenciales
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo prospecto
        </Button>
      </div>

      <Tabs defaultValue="tabla">
        <TabsList className="mb-4">
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="space-y-3">
          <ProspectTable
            prospects={visibleProspects}
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

        <TabsContent value="kanban">
          <ProspectKanban prospects={prospects} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="pipeline">
          <ProspectPipeline prospects={prospects} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      <ProspectSheet
        open={sheetOpen}
        onOpenChange={handleSheetChange}
        prospect={editingItem}
      />
    </div>
  );
}
