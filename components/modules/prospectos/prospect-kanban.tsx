"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { ProspectCard } from "./prospect-card";
import { useUpdateProspect } from "@/hooks/use-prospects";
import { useQueryClient } from "@tanstack/react-query";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants/labels";
import type { Prospect, ProspectStatus } from "@/lib/types/database.types";

interface ProspectKanbanProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

const COLUMNS = (Object.entries(PROSPECT_STATUS_LABELS) as [ProspectStatus, string][]).map(
  ([status, label]) => ({ status, label }),
);

const COLUMN_COLORS: Record<ProspectStatus, string> = {
  sin_contactar: "bg-slate-500/20 text-slate-400",
  contactado: "bg-yellow-500/20 text-yellow-400",
  en_negociacion: "bg-primary/20 text-primary",
  cerrado: "bg-green-500/20 text-green-400",
  perdido: "bg-muted text-muted-foreground",
};

function DroppableColumn({
  status,
  label,
  prospects,
  onEdit,
}: {
  status: ProspectStatus;
  label: string;
  prospects: Prospect[];
  onEdit: (p: Prospect) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span
          className={`text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${COLUMN_COLORS[status]}`}
        >
          {label}
        </span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {prospects.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[120px] rounded-md p-1 transition-colors ${
          isOver ? "bg-secondary/60" : ""
        }`}
      >
        <SortableContext
          items={prospects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {prospects.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} onEdit={onEdit} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function ProspectKanban({
  prospects,
  isLoading,
  onEdit,
}: ProspectKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateProspect = useUpdateProspect();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!prospects.length) {
    return (
      <EmptyState
        icon={Users}
        title="Sin prospectos todavía"
        description="Agregá tu primer prospecto para ver el kanban."
      />
    );
  }

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = prospects
        .filter((p) => p.status === col.status)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      return acc;
    },
    {} as Record<ProspectStatus, Prospect[]>,
  );

  const activeProspect = activeId
    ? prospects.find((p) => p.id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    // over.id is either a column status or another card's id
    const targetStatus = COLUMNS.find((c) => c.status === overId)?.status;
    const targetCardStatus = prospects.find((p) => p.id === overId)?.status;
    const newStatus = targetStatus ?? targetCardStatus;

    if (!newStatus) return;

    const dragged = prospects.find((p) => p.id === draggedId);
    if (!dragged || dragged.status === newStatus) return;

    // Optimistic update
    queryClient.setQueryData(["prospects"], (old: Prospect[] | undefined) =>
      old
        ? old.map((p) => (p.id === draggedId ? { ...p, status: newStatus } : p))
        : old,
    );

    // Server action in background
    updateProspect.mutate(
      { id: draggedId, payload: { status: newStatus } },
      {
        onError: () => {
          // revert on error
          queryClient.setQueryData(["prospects"], (old: Prospect[] | undefined) =>
            old
              ? old.map((p) =>
                  p.id === draggedId ? { ...p, status: dragged.status } : p,
                )
              : old,
          );
        },
      },
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.status}
            status={col.status}
            label={col.label}
            prospects={grouped[col.status] ?? []}
            onEdit={onEdit}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect ? (
          <div className="opacity-90 rotate-1">
            <ProspectCard prospect={activeProspect} onEdit={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
