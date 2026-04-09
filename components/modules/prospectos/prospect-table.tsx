"use client";

import { useMemo } from "react";
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
import { ContactsCell } from "@/components/shared/contacts-cell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Users, MessageSquare, Check } from "lucide-react";
import { PROSPECT_STATUS_CONFIG } from "@/lib/constants/labels";
import { useUpdateProspect } from "@/hooks/use-prospects";
import { useSectors } from "@/hooks/use-sectors";
import { useContacts } from "@/hooks/use-contacts";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { useTableSort } from "@/hooks/use-table-sort";
import { compareStrings } from "@/lib/utils";
import type { Prospect, ProspectStatus } from "@/lib/types/database.types";

type SortColumn = "name" | "sector" | "status" | "contact" | "phone";

const PROSPECT_STATUS_ORDER: Record<string, number> = {
  sin_contactar: 0,
  contactado: 1,
  en_negociacion: 2,
  cerrado: 3,
  perdido: 4,
};

interface ProspectTableProps {
  prospects: Prospect[];
  isLoading: boolean;
  onEdit: (prospect: Prospect) => void;
}

export function ProspectTable({ prospects, isLoading, onEdit }: ProspectTableProps) {
  const updateProspect = useUpdateProspect();
  const { data: sectors = [] } = useSectors();
  const { data: allContacts = [] } = useContacts();
  const { sortColumn, sortDirection, handleSort, dir } = useTableSort<SortColumn>("status");

  const contactsByProspectId = useMemo(() => {
    return allContacts.reduce<Record<string, typeof allContacts>>((acc, c) => {
      if (c.prospect_id) {
        if (!acc[c.prospect_id]) acc[c.prospect_id] = [];
        acc[c.prospect_id].push(c);
      }
      return acc;
    }, {});
  }, [allContacts]);

  const { isActive, renderCell } = useInlineEdit<Prospect, "name" | "phone">({
    getValue: (item, field) => item[field],
    onCommit: (id, field, value) =>
      updateProspect.mutateAsync({ id, payload: { [field]: value } }),
    requiredFields: ["name"],
  });

  const sorted = useMemo(() => {
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
  }, [prospects, sortColumn, dir, sectors, contactsByProspectId]);

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
          {sorted.map((prospect) => (
            <TableRow key={prospect.id} className="hover:bg-secondary/50">

              {/* Nombre */}
              <TableCell className="font-medium">
                <div className="flex items-center gap-1.5">
                  {renderCell(prospect, "name", "Sin nombre")}
                  {prospect.notes && !isActive(prospect.id, "name") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="shrink-0 cursor-default" onClick={(e) => e.stopPropagation()}>
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
                      onClick={() => updateProspect.mutate({ id: prospect.id, payload: { sector: null } })}
                      disabled={!prospect.sector}
                      className="flex items-center gap-2"
                    >
                      {!prospect.sector && <Check className="h-3.5 w-3.5 shrink-0" />}
                      <span className={!prospect.sector ? "" : "pl-5"}>Sin sector</span>
                    </DropdownMenuItem>
                    {sectors.map(({ id, label }) => (
                      <DropdownMenuItem
                        key={id}
                        onClick={() => updateProspect.mutate({ id: prospect.id, payload: { sector: id } })}
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
                    updateProspect.mutate({ id: prospect.id, payload: { status: newStatus as ProspectStatus } })
                  }
                />
              </TableCell>

              {/* Contacto */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <ContactsCell entityId={prospect.id} entityType="prospect" />
              </TableCell>

              {/* Teléfono */}
              <TableCell className="text-sm text-muted-foreground">
                {renderCell(prospect, "phone", "Sin teléfono")}
              </TableCell>

              {/* Editar */}
              <TableCell>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(prospect)}>
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
