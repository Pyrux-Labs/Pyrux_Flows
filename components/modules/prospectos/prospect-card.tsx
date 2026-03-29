"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, GripVertical } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/constants/labels";
import type { Prospect } from "@/lib/types/database.types";

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
}

export function ProspectCard({ prospect, onEdit }: ProspectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-md p-3 space-y-2 group cursor-default"
    >
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug truncate">
            {prospect.name}
          </p>
          {prospect.business && (
            <p className="text-xs text-muted-foreground truncate">
              {prospect.business}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onEdit(prospect)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      {prospect.source && (
        <div className="pl-5">
          <span className="text-xs text-muted-foreground truncate">
            {SOURCE_LABELS[prospect.source] ?? prospect.source}
          </span>
        </div>
      )}

      {prospect.last_contact && (
        <p className="text-xs text-muted-foreground pl-5">
          Últ. contacto: {formatDate(prospect.last_contact)}
        </p>
      )}
    </div>
  );
}
