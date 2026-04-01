"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import type { Prospect, ProspectStatus } from "@/lib/types/database.types";

interface ProspectPipelineProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

const STAGES: { status: ProspectStatus; label: string }[] = [
  { status: "contactado", label: "Contactado" },
  { status: "en_negociacion", label: "En negociación" },
  { status: "cerrado", label: "Cerrado" },
  { status: "perdido", label: "Perdido" },
];

const STAGE_COLORS: Record<ProspectStatus, { bg: string; text: string; bar: string }> = {
  contactado: { bg: "bg-yellow-500/10", text: "text-yellow-400", bar: "bg-yellow-500/60" },
  en_negociacion: { bg: "bg-primary/10", text: "text-primary", bar: "bg-primary/70" },
  cerrado: { bg: "bg-green-500/10", text: "text-green-400", bar: "bg-green-500/60" },
  perdido: { bg: "bg-muted", text: "text-muted-foreground", bar: "bg-muted-foreground/30" },
};

export function ProspectPipeline({
  prospects,
  isLoading,
  onEdit,
}: ProspectPipelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!prospects.length) {
    return (
      <EmptyState
        icon={Users}
        title="Sin prospectos todavía"
        description="Agregá tu primer prospecto para ver el pipeline."
      />
    );
  }

  const total = prospects.length;

  return (
    <div className="space-y-2">
      {STAGES.map((stage) => {
        const stageProspects = prospects.filter((p) => p.status === stage.status);
        const count = stageProspects.length;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const colors = STAGE_COLORS[stage.status];

        return (
          <div
            key={stage.status}
            className={`${colors.bg} rounded-lg p-4 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${colors.text}`}>
                {stage.label}
              </span>
              <span className={`text-xl font-bold ${colors.text}`}>{count}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Prospect names */}
            {count > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {stageProspects.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onEdit(p)}
                    className="text-xs bg-black/20 hover:bg-black/30 rounded px-2 py-0.5 text-foreground transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
                {count > 6 && (
                  <span className="text-xs text-muted-foreground px-1 py-0.5">
                    +{count - 6} más
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
