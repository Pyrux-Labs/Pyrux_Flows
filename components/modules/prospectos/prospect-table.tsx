"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pencil, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Prospect } from "@/lib/types/database.types";

interface ProspectTableProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  nuevo: { label: "Nuevo", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  contactado: { label: "Contactado", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  en_negociacion: { label: "En negociación", className: "bg-primary/15 text-primary border-primary/20" },
  cerrado: { label: "Cerrado", className: "bg-green-500/15 text-green-400 border-green-500/20" },
  perdido: { label: "Perdido", className: "bg-muted text-muted-foreground border-border" },
};

const SECTOR_LABELS: Record<string, string> = {
  contabilidad: "Contabilidad",
  legal: "Legal",
  medico: "Médico",
  estetica: "Estética",
  gastronomia: "Gastronomía",
  fitness: "Fitness",
  dental: "Dental",
  otro: "Otro",
};

const SOURCE_LABELS: Record<string, string> = {
  word_of_mouth: "Boca a boca",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  cold_email: "Cold email",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

export function ProspectTable({
  prospects,
  isLoading,
  onEdit,
}: ProspectTableProps) {
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
            <TableHead>Empresa</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead>Asignado</TableHead>
            <TableHead>Último contacto</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => {
            const statusCfg = STATUS_CONFIG[prospect.status];
            return (
              <TableRow key={prospect.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium">{prospect.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {prospect.business ?? "—"}
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
                  {statusCfg ? (
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusCfg.className}`}
                    >
                      {statusCfg.label}
                    </Badge>
                  ) : (
                    prospect.status
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {prospect.source
                    ? SOURCE_LABELS[prospect.source] ?? prospect.source
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground capitalize">
                  {prospect.assigned_to ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {prospect.last_contact ? formatDate(prospect.last_contact) : "—"}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
