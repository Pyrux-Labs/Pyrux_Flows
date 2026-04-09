"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pencil, FolderKanban } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_CONFIG } from "@/lib/constants/labels";
import type { ProjectWithClient, ProjectStatus } from "@/lib/types/database.types";

interface ProjectKanbanProps {
  projects: ProjectWithClient[];
  isLoading: boolean;
  onEdit: (project: ProjectWithClient) => void;
}

const COLUMNS = (Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(
  ([status, label]) => ({ status, label }),
);

function ProjectCard({
  project,
  onEdit,
}: {
  project: ProjectWithClient;
  onEdit: (p: ProjectWithClient) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-3 space-y-2 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug">
          {project.name}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onEdit(project)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{project.client?.name ?? "—"}</p>
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex flex-col gap-0.5">
          {project.price != null && (
            <span className="text-xs font-mono text-foreground">
              {formatCurrency(project.price, project.currency)}
            </span>
          )}
          {project.maintenance_amount != null && (
            <span className="text-xs font-mono text-primary">
              {formatCurrency(project.maintenance_amount, project.maintenance_currency)}/mes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectKanban({ projects, isLoading, onEdit }: ProjectKanbanProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-2">
            <Skeleton className="h-6 w-24 rounded" />
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
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

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = projects
        .filter((p) => p.status === col.status)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      return acc;
    },
    {} as Record<ProjectStatus, ProjectWithClient[]>,
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {COLUMNS.map((col) => {
        const colProjects = grouped[col.status] ?? [];
        return (
          <div key={col.status} className="space-y-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className={`text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${PROJECT_STATUS_CONFIG[col.status]?.className ?? "text-muted-foreground"}`}
              >
                {col.label}
              </span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {colProjects.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {colProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
