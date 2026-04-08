"use client";

import { useState, useRef } from "react";
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
import { Pencil, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "@/lib/constants/labels";
import { useUpdateProject } from "@/hooks/use-projects";
import type { ProjectWithClient, ProjectStatus } from "@/lib/types/database.types";

interface ProjectTableProps {
  projects: ProjectWithClient[];
  isLoading: boolean;
  onEdit: (project: ProjectWithClient) => void;
}

export function ProjectTable({ projects, isLoading, onEdit }: ProjectTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const updateProject = useUpdateProject();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent, project: ProjectWithClient) {
    e.stopPropagation();
    setEditingId(project.id);
    setEditValue(project.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit() {
    if (!editingId) return;
    const value = editValue.trim();
    if (!value) { setEditingId(null); return; }
    try {
      await updateProject.mutateAsync({ id: editingId, payload: { name: value } });
    } catch {
      toast.error("No se pudo guardar el cambio");
    } finally {
      setEditingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") setEditingId(null);
  }

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
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="hover:bg-secondary/50">

              {/* Nombre */}
              <TableCell className="font-medium">
                {editingId === project.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent border-b border-primary outline-none text-sm py-0.5"
                  />
                ) : (
                  <span
                    onClick={(e) => startEdit(e, project)}
                    className="cursor-text hover:text-foreground transition-colors"
                  >
                    {project.name}
                  </span>
                )}
              </TableCell>

              <TableCell className="text-muted-foreground text-sm">
                {project.client?.name ?? "—"}
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
                {project.price != null
                  ? formatCurrency(project.price, project.currency)
                  : "—"}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
