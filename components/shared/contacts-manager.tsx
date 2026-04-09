"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import { CONTACT_TYPE_VALUES, CONTACT_TYPE_LABELS } from "@/lib/constants/labels";
import type { ContactType } from "@/lib/types/database.types";

interface ContactsManagerProps {
  entityId: string;
  entityType: "client" | "prospect";
}

export function ContactsManager({ entityId, entityType }: ContactsManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<ContactType>("email");
  const [newValue, setNewValue] = useState("");

  const { data: allContacts = [] } = useContacts();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const contacts = allContacts.filter((c) =>
    entityType === "client" ? c.client_id === entityId : c.prospect_id === entityId,
  );

  async function handleAdd() {
    if (!newValue.trim()) return;
    try {
      await createContact.mutateAsync({
        [entityType === "client" ? "client_id" : "prospect_id"]: entityId,
        type: newType,
        value: newValue.trim(),
      });
      setNewType("email");
      setNewValue("");
      setAdding(false);
    } catch {
      toast.error("No se pudo agregar el contacto");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContact.mutateAsync(id);
    } catch {
      toast.error("No se pudo eliminar el contacto");
    }
  }

  return (
    <div className="rounded-md border border-border divide-y divide-border">
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center gap-2 px-3 py-2">
          <Badge variant="secondary" className="text-xs shrink-0">
            {CONTACT_TYPE_LABELS[c.type] ?? c.type}
          </Badge>
          <span className="flex-1 truncate text-sm">{c.value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(c.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <Select value={newType} onValueChange={(v) => setNewType(v as ContactType)}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TYPE_VALUES.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {CONTACT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-7 text-sm flex-1"
            placeholder="Valor"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
              if (e.key === "Escape") setAdding(false);
            }}
            autoFocus
          />
          <Button
            type="button"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleAdd}
            disabled={!newValue.trim() || createContact.isPending}
          >
            {createContact.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Plus className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setAdding(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar contacto
        </button>
      )}
    </div>
  );
}
