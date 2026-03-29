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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserCheck } from "lucide-react";
import type { Prospect } from "@/lib/types/database.types";

interface ClientTableProps {
  clients: Prospect[];
  projectCounts: Record<string, number>;
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

export function ClientTable({
  clients,
  projectCounts,
  isLoading,
  onEdit,
}: ClientTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!clients.length) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Sin clientes todavía"
        description="Cuando un prospecto pase a estado 'Cerrado', aparecerá acá."
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
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Proyectos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const count = projectCounts[client.id] ?? 0;
            return (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => onEdit(client)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {client.business ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {client.email ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {client.phone ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={count > 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {count}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
