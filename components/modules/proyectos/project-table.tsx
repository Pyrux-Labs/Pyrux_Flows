"use client";

import { useState, useRef, useMemo } from "react";
import { useTableSort } from "@/hooks/use-table-sort";
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
import { SortableHead } from "@/components/shared/sortable-head";
import { StatusBadgeDropdown } from "@/components/shared/status-badge-dropdown";
import { Pencil, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, compareStrings } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "@/lib/constants/labels";
import { useUpdateProject } from "@/hooks/use-projects";
import type { ProjectWithClient, ProjectStatus } from "@/lib/types/database.types";

type SortColumn = "name" | "client" | "status" | "start_date" | "end_date" | "price";

const PROJECT_STATUS_ORDER: Record<string, number> = {
  desarrollo: 0,
  pausado: 1,
  completado: 2,
  cancelado: 3,
  mantenimiento: 4,
};

interface ProjectTableProps {
  projects: ProjectWithClient[];
  isLoading: boolean;
  onEdit: (project: ProjectWithClient) => void;
}

function compareDates(a: string | null | undefined, b: string | null | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function ProjectTable({ projects, isLoading, onEdit }: ProjectTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const updateProject = useUpdateProject();
  const inputRef = useRef<HTMLInputElement>(null);
  const { sortColumn, sortDirection, handleSort, dir } = useTableSort<SortColumn>("status");

  const sorted = useMemo(() => {
    return [...projects].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name":
          cmp = compareStrings(a.name, b.name);
          break;
        case "client":
          cmp = compareStrings(a.client?.name, b.client?.name);
          break;
        case "status": {
          const orderA = PROJECT_STATUS_ORDER[a.status] ?? 99;
          const orderB = PROJECT_STATUS_ORDER[b.status] ?? 99;
          cmp = orderA - orderB;
          break;
        }
        case "start_date":
          cmp = compareDates(a.start_date, b.start_date);
          break;
        case "end_date":
          cmp = compareDates(a.end_date, b.end_date);
          break;
        case "price":
          cmp = (a.price ?? 0) - (b.price ?? 0);
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return compareStrings(a.name, b.name);
    });
  }, [projects, sortColumn, dir]);

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
            <SortableHead column="name" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Nombre</SortableHead>
            <SortableHead column="client" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Cliente</SortableHead>
            <SortableHead column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Estado</SortableHead>
            <SortableHead column="start_date" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Inicio</SortableHead>
            <SortableHead column="end_date" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Fin</SortableHead>
            <SortableHead column="price" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-right">Precio</SortableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((project) => (
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

              <TableCell className="text-right text-sm">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-mono">
                    {project.price != null
                      ? formatCurrency(project.price, project.currency)
                      : "—"}
                  </span>
                  {project.maintenance_amount != null && (
                    <span className="text-xs text-primary font-mono">
                      {formatCurrency(project.maintenance_amount, project.maintenance_currency)}/mes
                    </span>
                  )}
                </div>
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
