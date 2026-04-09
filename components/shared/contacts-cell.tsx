"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import { CONTACT_TYPE_LABELS } from "@/lib/constants/labels";
import type { ContactType } from "@/lib/types/database.types";

interface ContactsCellProps {
  entityId: string;
  entityType: "client" | "prospect";
}

export function ContactsCell({ entityId, entityType }: ContactsCellProps) {
  const [type, setType] = useState<ContactType>("email");
  const [value, setValue] = useState("");

  const { data: allContacts = [] } = useContacts();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const contacts = allContacts.filter((c) =>
    entityType === "client" ? c.client_id === entityId : c.prospect_id === entityId,
  );
  const firstContact = contacts[0];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    await createContact.mutateAsync({
      [entityType === "client" ? "client_id" : "prospect_id"]: entityId,
      type,
      value: value.trim(),
    });
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
                <span className="text-xs bg-secondary rounded px-1 shrink-0">
                  +{contacts.length - 1}
                </span>
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
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            disabled={createContact.isPending}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
