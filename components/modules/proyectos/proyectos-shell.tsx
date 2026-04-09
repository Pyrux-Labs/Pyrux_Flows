"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectTable } from "./project-table";
import { ProjectKanban } from "./project-kanban";
import { ProjectSheet } from "./project-sheet";
import { useProjects } from "@/hooks/use-projects";
import { usePagination } from "@/hooks/use-pagination";
import { useSheetWithUrl } from "@/hooks/use-sheet-with-url";
import type { ProjectWithClient } from "@/lib/types/database.types";

export function ProyectosShell() {
  const { data: projects = [], isLoading } = useProjects();
  const { visibleItems: visibleProjects, hasMore, remaining, loadMore } = usePagination(projects);
  const { sheetOpen, editingItem, handleEdit, handleNew, handleSheetChange } =
    useSheetWithUrl<ProjectWithClient>(projects, isLoading, "/proyectos");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Clientes activos y proyectos en curso
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo proyecto
        </Button>
      </div>

      <Tabs defaultValue="tabla">
        <TabsList className="mb-4">
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="space-y-3">
          <ProjectTable
            projects={visibleProjects}
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
          <ProjectKanban projects={projects} isLoading={isLoading} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      <ProjectSheet
        open={sheetOpen}
        onOpenChange={handleSheetChange}
        project={editingItem}
      />
    </div>
  );
}
