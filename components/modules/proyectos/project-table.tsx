"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadgeDropdown } from "@/components/shared/status-badge-dropdown";
import { Pencil, FolderKanban, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "@/lib/constants/labels";
import { useUpdateProject } from "@/hooks/use-projects";
import type { Project, ProjectStatus } from "@/lib/types/database.types";

interface ProjectTableProps {
  projects: Project[];
  isLoading: boolean;
  onEdit: (project: Project) => void;
}

export function ProjectTable({ projects, isLoading, onEdit }: ProjectTableProps) {
  const updateProject = useUpdateProject();
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Sin proyectos todavía"
        description="Creá tu primer proyecto para empezar."
      />
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead className="text-right">Presupuesto</TableHead>
            <TableHead className="text-center">Pagado</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            return (
              <TableRow key={project.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project.client_name}
                </TableCell>
                <TableCell>
                  <StatusBadgeDropdown
                    currentStatus={project.status}
                    statusConfig={PROJECT_STATUS_CONFIG}
                    onStatusChange={(newStatus) =>
                      updateProject.mutate({
                        id: project.id,
                        payload: { status: newStatus as ProjectStatus },
                      })
                    }
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project.start_date ? formatDate(project.start_date) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project.end_date ? formatDate(project.end_date) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {project.budget != null
                    ? formatCurrency(project.budget, "USD")
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {project.paid ? (
                    <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(project)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
