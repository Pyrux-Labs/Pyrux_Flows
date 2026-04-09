"use client";

import { useState, useRef, useMemo } from "react";
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
import { SortableHead } from "@/components/shared/sortable-head";
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
import { useSectors } from "@/hooks/use-sectors";
import { useContacts } from "@/hooks/use-contacts";
import { CONTACT_TYPE_LABELS } from "@/lib/constants/labels";
import type { Client } from "@/lib/types/database.types";

type EditableField = "name" | "phone";

interface EditingCell {
  id: string;
  field: EditableField;
}

type SortColumn = "name" | "sector" | "contact" | "phone" | "projects";
type SortDirection = "asc" | "desc";

interface ClientTableProps {
  clients: Client[];
  projectCounts: Record<string, number>;
  isLoading: boolean;
  onEdit: (client: Client) => void;
}

function compareStrings(a: string | null | undefined, b: string | null | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, "es");
}

export function ClientTable({
  clients,
  projectCounts,
  isLoading,
  onEdit,
}: ClientTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const updateClient = useUpdateClient();
  const { data: sectors = [] } = useSectors();
  const { data: allContacts = [] } = useContacts();
  const inputRef = useRef<HTMLInputElement>(null);

  const contactsByClientId = useMemo(() => {
    return allContacts.reduce<Record<string, typeof allContacts>>((acc, c) => {
      if (c.client_id) {
        if (!acc[c.client_id]) acc[c.client_id] = [];
        acc[c.client_id].push(c);
      }
      return acc;
    }, {});
  }, [allContacts]);

  function handleSort(column: string) {
    const col = column as SortColumn;
    if (col === sortColumn) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...clients].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name":
          cmp = compareStrings(a.name, b.name);
          break;
        case "sector":
          cmp = compareStrings(
            a.sector ? (sectors.find((s) => s.id === a.sector)?.label ?? a.sector) : null,
            b.sector ? (sectors.find((s) => s.id === b.sector)?.label ?? b.sector) : null,
          );
          break;
        case "contact":
          cmp = compareStrings(
            contactsByClientId[a.id]?.[0]?.value,
            contactsByClientId[b.id]?.[0]?.value,
          );
          break;
        case "phone":
          cmp = compareStrings(a.phone, b.phone);
          break;
        case "projects":
          cmp = (projectCounts[a.id] ?? 0) - (projectCounts[b.id] ?? 0);
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return compareStrings(a.name, b.name);
    });
  }, [clients, projectCounts, sortColumn, sortDirection, sectors, contactsByClientId]);

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
            <SortableHead column="name" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Nombre</SortableHead>
            <SortableHead column="sector" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Sector</SortableHead>
            <SortableHead column="contact" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Contacto</SortableHead>
            <SortableHead column="phone" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Teléfono</SortableHead>
            <SortableHead column="projects" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Proyectos</SortableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((client) => {
            const count = projectCounts[client.id] ?? 0;
            const contacts = contactsByClientId[client.id] ?? [];
            const firstContact = contacts[0];
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
                          ? (sectors.find((s) => s.id === client.sector)?.label ?? client.sector)
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
                      {sectors.map(({ id, label }) => (
                        <DropdownMenuItem
                          key={id}
                          onClick={() =>
                            updateClient.mutate({ id: client.id, payload: { sector: id } })
                          }
                          disabled={client.sector === id}
                          className="flex items-center gap-2"
                        >
                          {client.sector === id && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span className={client.sector === id ? "" : "pl-5"}>{label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* Contacto */}
                <TableCell className="text-sm text-muted-foreground">
                  {firstContact ? (
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[140px]">{firstContact.value}</span>
                      {contacts.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground bg-secondary rounded px-1 cursor-default shrink-0">
                              +{contacts.length - 1}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent align="start" className="space-y-1">
                            {contacts.map((c) => (
                              <p key={c.id} className="text-xs">
                                <span className="text-muted-foreground">{CONTACT_TYPE_LABELS[c.type]}: </span>
                                {c.value}
                              </p>
                            ))}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40 italic">Sin contacto</span>
                  )}
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
