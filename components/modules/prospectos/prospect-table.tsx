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
import { Pencil, Users, MessageSquare } from "lucide-react";
import {
  PROSPECT_STATUS_CONFIG,
  SECTOR_LABELS,
} from "@/lib/constants/labels";
import { useUpdateProspect } from "@/hooks/use-prospects";
import type { Prospect, ProspectStatus } from "@/lib/types/database.types";

interface ProspectTableProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

export function ProspectTable({ prospects, isLoading, onEdit }: ProspectTableProps) {
  const updateProspect = useUpdateProspect();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!prospects.length) {
    return (
      <EmptyState
        icon={Users}
        title="Sin prospectos todavía"
        description="Agregá tu primer prospecto al CRM."
      />
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => (
            <TableRow key={prospect.id} className="hover:bg-secondary/50">
              <TableCell className="font-medium">
                <div className="flex items-center gap-1.5">
                  {prospect.name}
                  {prospect.notes && (
                    <span title={prospect.notes} className="shrink-0">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {prospect.sector ? (
                  <span className="text-sm text-muted-foreground">
                    {SECTOR_LABELS[prospect.sector] ?? prospect.sector}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadgeDropdown
                  currentStatus={prospect.status}
                  statusConfig={PROSPECT_STATUS_CONFIG}
                  onStatusChange={(newStatus) =>
                    updateProspect.mutate({
                      id: prospect.id,
                      payload: { status: newStatus as ProspectStatus },
                    })
                  }
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {prospect.email ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {prospect.phone ?? "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(prospect)}
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
