"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientTable } from "./client-table";
import { ProspectSheet } from "@/components/modules/prospectos/prospect-sheet";
import { useProspects } from "@/hooks/use-prospects";
import { useProjects } from "@/hooks/use-projects";
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import type { Prospect } from "@/lib/types/database.types";

export function ClientesShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const openedEditRef = useRef<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  const { data: allProspects = [], isLoading: loadingProspects } = useProspects();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  const clients = useMemo(
    () => allProspects.filter((p) => p.status === "cerrado"),
    [allProspects],
  );

  const projectCounts = useMemo(() => {
    return projects.reduce<Record<string, number>>((acc, project) => {
      if (project.prospect_id) {
        acc[project.prospect_id] = (acc[project.prospect_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [projects]);

  const { visibleItems, hasMore, remaining, loadMore } = usePagination(clients);

  useEffect(() => {
    if (!editId || loadingProspects || openedEditRef.current === editId) return;
    const client = allProspects.find((p) => p.id === editId);
    if (client) {
      openedEditRef.current = editId;
      setEditingProspect(client);
      setSheetOpen(true);
      router.replace("/clientes");
    }
  }, [editId, loadingProspects, allProspects, router]);

  function handleEdit(prospect: Prospect) {
    setEditingProspect(prospect);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditingProspect(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Prospectos cerrados — clientes activos
        </p>
      </div>

      <ClientTable
        clients={visibleItems}
        projectCounts={projectCounts}
        isLoading={loadingProspects || loadingProjects}
        onEdit={handleEdit}
      />

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore}>
            Cargar más ({remaining} restantes)
          </Button>
        </div>
      )}

      <ProspectSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        prospect={editingProspect}
      />
    </div>
  );
}
