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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SortableHead } from "@/components/shared/sortable-head";
import { StatusBadgeDropdown } from "@/components/shared/status-badge-dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Users, MessageSquare, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { PROSPECT_STATUS_CONFIG, CONTACT_TYPE_LABELS } from "@/lib/constants/labels";
import { useUpdateProspect } from "@/hooks/use-prospects";
import { useSectors } from "@/hooks/use-sectors";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import type { Prospect, ProspectStatus, Contact, ContactType } from "@/lib/types/database.types";

type EditableField = "name" | "phone";

interface EditingCell {
  id: string;
  field: EditableField;
}

type SortColumn = "name" | "sector" | "status" | "contact" | "phone";
type SortDirection = "asc" | "desc";

const PROSPECT_STATUS_ORDER: Record<string, number> = {
  sin_contactar: 0,
  contactado: 1,
  en_negociacion: 2,
  cerrado: 3,
  perdido: 4,
};

function ContactsCell({ contacts, prospectId }: { contacts: Contact[]; prospectId: string }) {
  const [type, setType] = useState<ContactType>("email");
  const [value, setValue] = useState("");
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const firstContact = contacts[0];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    await createContact.mutateAsync({ prospect_id: prospectId, type, value: value.trim() });
    setValue("");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left">
          {firstContact ? (
            <>
              <span className="truncate max-w-[120px]">{firstContact.value}</span>
              {contacts.length > 1 && (
                <span className="text-xs bg-secondary rounded px-1 shrink-0">+{contacts.length - 1}</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground/40 italic">Sin contacto</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3 space-y-2">
        {contacts.length > 0 && (
          <div className="space-y-1.5">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-16 shrink-0">{CONTACT_TYPE_LABELS[c.type]}</span>
                <span className="flex-1 truncate">{c.value}</span>
                <button
                  onClick={() => deleteContact.mutate(c.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {contacts.length > 0 && <div className="border-t border-border" />}
        <form onSubmit={handleAdd} className="flex items-center gap-1.5">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContactType)}
            className="text-xs bg-background border border-input rounded px-1.5 py-1 shrink-0 outline-none"
          >
            {Object.entries(CONTACT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valor"
            className="flex-1 text-xs bg-transparent border-b border-input outline-none py-1 min-w-0"
          />
          <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 shrink-0" disabled={createContact.isPending}>
            <Plus className="h-3 w-3" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

interface ProspectTableProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

function compareStrings(a: string | null | undefined, b: string | null | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, "es");
}

export function ProspectTable({ prospects, isLoading, onEdit }: ProspectTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const updateProspect = useUpdateProspect();
  const { data: sectors = [] } = useSectors();
  const { data: allContacts = [] } = useContacts();
  const inputRef = useRef<HTMLInputElement>(null);

  const contactsByProspectId = useMemo(() => {
    return allContacts.reduce<Record<string, typeof allContacts>>((acc, c) => {
      if (c.prospect_id) {
        if (!acc[c.prospect_id]) acc[c.prospect_id] = [];
        acc[c.prospect_id].push(c);
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
    return [...prospects].sort((a, b) => {
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
        case "status": {
          const orderA = PROSPECT_STATUS_ORDER[a.status] ?? 99;
          const orderB = PROSPECT_STATUS_ORDER[b.status] ?? 99;
          cmp = orderA - orderB;
          break;
        }
        case "contact":
          cmp = compareStrings(
            contactsByProspectId[a.id]?.[0]?.value,
            contactsByProspectId[b.id]?.[0]?.value,
          );
          break;
        case "phone":
          cmp = compareStrings(a.phone, b.phone);
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return compareStrings(a.name, b.name);
    });
  }, [prospects, sortColumn, sortDirection, sectors, contactsByProspectId]);

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
            <SortableHead column="name" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Nombre</SortableHead>
            <SortableHead column="sector" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Sector</SortableHead>
            <SortableHead column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Estado</SortableHead>
            <SortableHead column="contact" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Contacto</SortableHead>
            <SortableHead column="phone" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>Teléfono</SortableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((prospect) => {
            const contacts = contactsByProspectId[prospect.id] ?? [];
            return (
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
                        {prospect.sector
                          ? (sectors.find((s) => s.id === prospect.sector)?.label ?? prospect.sector)
                          : <span className="text-muted-foreground/40 italic">Sin sector</span>}
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
                      {sectors.map(({ id, label }) => (
                        <DropdownMenuItem
                          key={id}
                          onClick={() =>
                            updateProspect.mutate({ id: prospect.id, payload: { sector: id } })
                          }
                          disabled={prospect.sector === id}
                          className="flex items-center gap-2"
                        >
                          {prospect.sector === id && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span className={prospect.sector === id ? "" : "pl-5"}>{label}</span>
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

                {/* Contacto */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ContactsCell contacts={contacts} prospectId={prospect.id} />
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
