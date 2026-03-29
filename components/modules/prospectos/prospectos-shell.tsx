"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProspectTable } from "./prospect-table";
import { ProspectKanban } from "./prospect-kanban";
import { ProspectPipeline } from "./prospect-pipeline";
import { ProspectSheet } from "./prospect-sheet";
import { useProspects } from "@/hooks/use-prospects";
import { usePagination } from "@/hooks/use-pagination";
import type { Prospect } from "@/lib/types/database.types";

export function ProspectosShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const openedEditRef = useRef<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  const { data: allProspects = [], isLoading } = useProspects();
  const prospects = useMemo(
    () => allProspects.filter((p) => p.status !== "cerrado"),
    [allProspects],
  );
  const { visibleItems: visibleProspects, hasMore, remaining, loadMore } = usePagination(prospects);

  useEffect(() => {
    if (!editId || isLoading || openedEditRef.current === editId) return;
    const prospect = allProspects.find((p) => p.id === editId);
    if (prospect) {
      openedEditRef.current = editId;
      setEditingProspect(prospect);
      setSheetOpen(true);
      router.replace("/prospectos");
    }
  }, [editId, isLoading, allProspects, router]);

  function handleEdit(prospect: Prospect) {
    setEditingProspect(prospect);
    setSheetOpen(true);
  }

  function handleAdd() {
    setEditingProspect(null);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditingProspect(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Prospectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            CRM — seguimiento de clientes potenciales
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
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
          <ProspectKanban
            prospects={prospects}
            isLoading={isLoading}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="pipeline">
          <ProspectPipeline
            prospects={prospects}
            isLoading={isLoading}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>

      <ProspectSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        prospect={editingProspect}
      />
    </div>
  );
}
