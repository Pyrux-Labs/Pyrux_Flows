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
import { UserCheck, MessageSquare } from "lucide-react";
import type { Client } from "@/lib/types/database.types";

interface ClientTableProps {
  clients: Client[];
  projectCounts: Record<string, number>;
  isLoading: boolean;
  onEdit: (client: Client) => void;
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
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Proyectos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const count = projectCounts[client.id] ?? 0;
            return (
              <TableRow key={client.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => onEdit(client)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {client.name}
                    {client.notes && (
                      <span title={client.notes} className="shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    )}
                  </div>
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
