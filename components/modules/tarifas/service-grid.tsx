"use client";

import { useState } from "react";
import { useCreateShortcut } from "@/hooks/use-create-shortcut";
import { useServices } from "@/hooks/use-services";
import { usePagination } from "@/hooks/use-pagination";
import { ServiceCard } from "./service-card";
import { ServiceSheet } from "./service-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";
import type { Service } from "@/lib/types/database.types";

export function ServiceGrid() {
  const { data: services = [], isLoading } = useServices();
  const { visibleItems: visibleServices, hasMore, remaining, loadMore } = usePagination(services);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  function handleEdit(service: Service) {
    setEditingService(service);
    setSheetOpen(true);
  }

  function handleAdd() {
    setEditingService(null);
    setSheetOpen(true);
  }

  useCreateShortcut(handleAdd);

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditingService(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tarifas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Catálogo de servicios y precios
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo servicio
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : !services?.length ? (
        <EmptyState
          icon={Tag}
          title="Sin servicios todavía"
          description="Agregá tus primeros servicios al catálogo."
          action={
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo servicio
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleServices.map((service) => (
              <ServiceCard key={service.id} service={service} onEdit={handleEdit} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore}>
                Cargar más ({remaining} restantes)
              </Button>
            </div>
          )}
        </div>
      )}

      <ServiceSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        service={editingService}
      />
    </div>
  );
}
