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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadgeDropdown } from "@/components/shared/status-badge-dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Users, MessageSquare, Check } from "lucide-react";
import { toast } from "sonner";
import {
  PROSPECT_STATUS_CONFIG,
  SECTOR_LABELS,
} from "@/lib/constants/labels";
import { useUpdateProspect } from "@/hooks/use-prospects";
import type { Prospect, ProspectStatus, Sector } from "@/lib/types/database.types";

type EditableField = "name" | "email" | "phone";

interface EditingCell {
  id: string;
  field: EditableField;
}

interface ProspectTableProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

export function ProspectTable({ prospects, isLoading, onEdit }: ProspectTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const updateProspect = useUpdateProspect();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent, prospect: Prospect, field: EditableField) {
    e.stopPropagation();
    setEditingCell({ id: prospect.id, field });
    setEditValue(prospect[field] ?? "");
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
      await updateProspect.mutateAsync({
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

  function isActive(prospectId: string, field: EditableField) {
    return editingCell?.id === prospectId && editingCell?.field === field;
  }

  function renderCell(prospect: Prospect, field: EditableField, placeholder: string) {
    const displayValue = prospect[field];

    if (isActive(prospect.id, field)) {
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
        onClick={(e) => startEdit(e, prospect, field)}
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

              {/* Nombre */}
              <TableCell className="font-medium">
                <div className="flex items-center gap-1.5">
                  {renderCell(prospect, "name", "Sin nombre")}
                  {prospect.notes && !isActive(prospect.id, "name") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="shrink-0 cursor-default"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{prospect.notes}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>

              {/* Sector */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {prospect.sector ? (SECTOR_LABELS[prospect.sector] ?? prospect.sector) : <span className="text-muted-foreground/40 italic">Sin sector</span>}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() =>
                        updateProspect.mutate({ id: prospect.id, payload: { sector: null } })
                      }
                      disabled={!prospect.sector}
                      className="flex items-center gap-2"
                    >
                      {!prospect.sector && <Check className="h-3.5 w-3.5 shrink-0" />}
                      <span className={!prospect.sector ? "" : "pl-5"}>Sin sector</span>
                    </DropdownMenuItem>
                    {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() =>
                          updateProspect.mutate({ id: prospect.id, payload: { sector: value as Sector } })
                        }
                        disabled={prospect.sector === value}
                        className="flex items-center gap-2"
                      >
                        {prospect.sector === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                        <span className={prospect.sector === value ? "" : "pl-5"}>{label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

              {/* Estado */}
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

              {/* Email */}
              <TableCell className="text-sm text-muted-foreground">
                {renderCell(prospect, "email", "Sin email")}
              </TableCell>

              {/* Teléfono */}
              <TableCell className="text-sm text-muted-foreground">
                {renderCell(prospect, "phone", "Sin teléfono")}
              </TableCell>

              {/* Editar */}
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
