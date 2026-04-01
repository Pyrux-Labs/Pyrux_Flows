"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientTable } from "./client-table";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import type { Client } from "@/lib/types/database.types";

export function ClientesShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const openedEditRef = useRef<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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

  useEffect(() => {
    if (!editId || loadingClients || openedEditRef.current === editId) return;
    const client = clients.find((c) => c.id === editId);
    if (client) {
      openedEditRef.current = editId;
      setEditingClient(client);
      setSheetOpen(true);
      router.replace("/clientes");
    }
  }, [editId, loadingClients, clients, router]);

  function handleEdit(client: Client) {
    setEditingClient(client);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Clientes activos y en mantenimiento
        </p>
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
    </div>
  );
}
