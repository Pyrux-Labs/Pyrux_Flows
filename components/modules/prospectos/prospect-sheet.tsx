"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDeleteWithUndo } from "@/hooks/use-delete-with-undo";
import {
  useCreateProspect,
  useUpdateProspect,
  useDeleteProspect,
} from "@/hooks/use-prospects";
import { useSectors } from "@/hooks/use-sectors";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import { PROSPECT_STATUS_LABELS, CONTACT_TYPE_VALUES, CONTACT_TYPE_LABELS } from "@/lib/constants/labels";
import type { Prospect, ContactType } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sector: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(["sin_contactar", "contactado", "en_negociacion", "cerrado", "perdido"]),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ProspectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: Prospect | null;
}

export function ProspectSheet({ open, onOpenChange, prospect }: ProspectSheetProps) {
  const isEditing = !!prospect;
  const createProspect = useCreateProspect();
  const updateProspect = useUpdateProspect();
  const deleteProspect = useDeleteProspect();
  const { data: sectors = [] } = useSectors();
  const { data: allContacts = [] } = useContacts();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const { handleDelete } = useDeleteWithUndo({
    mutateAsync: deleteProspect.mutateAsync,
    queryKey: ["prospects"],
  });

  const [addingContact, setAddingContact] = useState(false);
  const [newContactType, setNewContactType] = useState<ContactType>("email");
  const [newContactValue, setNewContactValue] = useState("");

  const contacts = allContacts.filter((c) => c.prospect_id === prospect?.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sector: null,
      phone: "",
      status: "sin_contactar",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      setAddingContact(false);
      setNewContactType("email");
      setNewContactValue("");
      reset(
        prospect
          ? {
              name: prospect.name,
              sector: prospect.sector ?? null,
              phone: prospect.phone ?? "",
              status: prospect.status as FormValues["status"],
              notes: prospect.notes ?? "",
            }
          : {
              name: "",
              sector: null,
              phone: "",
              status: "sin_contactar",
              notes: "",
            },
      );
    }
  }, [open, prospect, reset]);

  const isPending = createProspect.isPending || updateProspect.isPending;
  const { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChanges(isDirty, onOpenChange);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      sector: values.sector ?? null,
      phone: values.phone || null,
      status: values.status,
      notes: values.notes || null,
    };

    try {
      if (isEditing && prospect) {
        await updateProspect.mutateAsync({ id: prospect.id, payload });
        toast.success("Prospecto actualizado");
      } else {
        await createProspect.mutateAsync(payload);
        toast.success("Prospecto agregado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el prospecto");
    }
  }

  async function handleAddContact() {
    if (!prospect || !newContactValue.trim()) return;
    try {
      await createContact.mutateAsync({
        prospect_id: prospect.id,
        type: newContactType,
        value: newContactValue.trim(),
      });
      setNewContactType("email");
      setNewContactValue("");
      setAddingContact(false);
    } catch {
      toast.error("No se pudo agregar el contacto");
    }
  }

  async function handleDeleteContact(id: string) {
    try {
      await deleteContact.mutateAsync(id);
    } catch {
      toast.error("No se pudo eliminar el contacto");
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>
            {isEditing ? "Editar prospecto" : "Nuevo prospecto"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register("name")} placeholder="Nombre o empresa" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sector</Label>
              <Select
                value={watch("sector") ?? "_none"}
                onValueChange={(v) =>
                  setValue("sector", v === "_none" ? null : v, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin sector</SelectItem>
                  {sectors.map(({ id, label }) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} placeholder="+54 11 ..." />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as FormValues["status"], { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROSPECT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                {...register("notes")}
                placeholder="Notas sobre el prospecto..."
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Contactos — solo al editar */}
            {isEditing && prospect && (
              <div className="space-y-2">
                <Label>Contactos</Label>
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
                        onClick={() => handleDeleteContact(c.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {addingContact ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Select
                        value={newContactType}
                        onValueChange={(v) => setNewContactType(v as ContactType)}
                      >
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
                        value={newContactValue}
                        onChange={(e) => setNewContactValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddContact(); }
                          if (e.key === "Escape") setAddingContact(false);
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={handleAddContact}
                        disabled={!newContactValue.trim() || createContact.isPending}
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
                        onClick={() => setAddingContact(false)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingContact(true)}
                      className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar contacto
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="pt-4 border-t border-border flex gap-2">
            {isEditing && prospect && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  handleDelete({ id: prospect.id, label: prospect.name });
                }}
              >
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  "Guardar cambios"
                ) : (
                  "Agregar prospecto"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <AlertDialog open={warningOpen} onOpenChange={cancelDiscard}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
          <AlertDialogDescription>
            Tenés cambios sin guardar. Si cerrás ahora se perderán.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelDiscard}>Seguir editando</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDiscard}>Descartar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
