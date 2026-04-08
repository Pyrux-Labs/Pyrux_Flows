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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCheck, MessageSquare, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { useUpdateClient } from "@/hooks/use-clients";
import { SECTOR_LABELS } from "@/lib/constants/labels";
import type { Client, Sector } from "@/lib/types/database.types";

type EditableField = "name" | "email" | "phone";

interface EditingCell {
  id: string;
  field: EditableField;
}

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
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const updateClient = useUpdateClient();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent, client: Client, field: EditableField) {
    e.stopPropagation();
    setEditingCell({ id: client.id, field });
    setEditValue(client[field] ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit() {
    if (!editingCell) return;
    const value = editValue.trim() || null;
    if (editingCell.field === "name" && !value) {
      setEditingCell(null);
      return;
    }
    try {
      await updateClient.mutateAsync({
        id: editingCell.id,
        payload: { [editingCell.field]: value },
      });
    } catch {
      toast.error("No se pudo guardar el cambio");
    } finally {
      setEditingCell(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") setEditingCell(null);
  }

  function isActive(clientId: string, field: EditableField) {
    return editingCell?.id === clientId && editingCell?.field === field;
  }

  function renderCell(client: Client, field: EditableField, placeholder: string) {
    const displayValue = client[field];

    if (isActive(client.id, field)) {
      return (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-primary outline-none text-sm py-0.5"
        />
      );
    }

    return (
      <span
        onClick={(e) => startEdit(e, client, field)}
        className="cursor-text hover:text-foreground transition-colors"
      >
        {displayValue ?? (
          <span className="text-muted-foreground/40 italic">{placeholder}</span>
        )}
      </span>
    );
  }

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
            <TableHead>Sector</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Proyectos</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const count = projectCounts[client.id] ?? 0;
            return (
              <TableRow key={client.id} className="hover:bg-secondary/50">

                {/* Nombre */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {renderCell(client, "name", "Sin nombre")}
                    {client.notes && !isActive(client.id, "name") && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="shrink-0 cursor-default"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{client.notes}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>

                {/* Sector */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        {client.sector
                          ? (SECTOR_LABELS[client.sector] ?? client.sector)
                          : <span className="text-muted-foreground/40 italic">Sin sector</span>}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() =>
                          updateClient.mutate({ id: client.id, payload: { sector: null } })
                        }
                        disabled={!client.sector}
                        className="flex items-center gap-2"
                      >
                        {!client.sector && <Check className="h-3.5 w-3.5 shrink-0" />}
                        <span className={!client.sector ? "" : "pl-5"}>Sin sector</span>
                      </DropdownMenuItem>
                      {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                        <DropdownMenuItem
                          key={value}
                          onClick={() =>
                            updateClient.mutate({ id: client.id, payload: { sector: value as Sector } })
                          }
                          disabled={client.sector === value}
                          className="flex items-center gap-2"
                        >
                          {client.sector === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span className={client.sector === value ? "" : "pl-5"}>{label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* Email */}
                <TableCell className="text-sm text-muted-foreground">
                  {renderCell(client, "email", "Sin email")}
                </TableCell>

                {/* Teléfono */}
                <TableCell className="text-sm text-muted-foreground">
                  {renderCell(client, "phone", "Sin teléfono")}
                </TableCell>

                {/* Proyectos */}
                <TableCell>
                  <Badge
                    variant={count > 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {count}
                  </Badge>
                </TableCell>

                {/* Editar */}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(client)}
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
