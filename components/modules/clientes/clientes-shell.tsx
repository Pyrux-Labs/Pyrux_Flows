"use client";

import { useMemo } from "react";
import { ClientTable } from "./client-table";
import { ClientSheet } from "./client-sheet";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { usePagination } from "@/hooks/use-pagination";
import { useSheetWithUrl } from "@/hooks/use-sheet-with-url";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Client } from "@/lib/types/database.types";

export function ClientesShell() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  const projectCounts = useMemo(() => {
    return projects.reduce<Record<string, number>>((acc, project) => {
      if (project.client_id) {
        acc[project.client_id] = (acc[project.client_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [projects]);

  const { visibleItems, hasMore, remaining, loadMore } = usePagination(clients);
  const { sheetOpen, editingItem, handleEdit, handleNew, handleSheetChange } =
    useSheetWithUrl<Client>(clients, loadingClients, "/clientes");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Clientes activos y en mantenimiento
          </p>
        </div>
        <Button size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo cliente
        </Button>
      </div>

      <ClientTable
        clients={visibleItems}
        projectCounts={projectCounts}
        isLoading={loadingClients || loadingProjects}
        onEdit={handleEdit}
      />

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore}>
            Cargar más ({remaining} restantes)
          </Button>
        </div>
      )}

      <ClientSheet
        open={sheetOpen}
        onOpenChange={handleSheetChange}
        client={editingItem}
      />
    </div>
  );
}
