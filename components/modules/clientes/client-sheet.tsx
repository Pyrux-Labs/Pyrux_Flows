"use client";

import { useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UnsavedChangesDialog } from "@/components/shared/unsaved-changes-dialog";
import { ContactsManager } from "@/components/shared/contacts-manager";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useDeleteWithUndo } from "@/hooks/use-delete-with-undo";
import { useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/use-clients";
import { useSectors } from "@/hooks/use-sectors";
import { DatePickerField } from "@/components/shared/date-picker-field";
import type { Client } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sector: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  started_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientSheet({ open, onOpenChange, client }: ClientSheetProps) {
  const isEditing = !!client;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { data: sectors = [] } = useSectors();
  const { handleDelete } = useDeleteWithUndo({
    mutateAsync: deleteClient.mutateAsync,
    queryKey: ["clients"],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", sector: null, phone: "", started_at: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name,
              sector: client.sector ?? null,
              phone: client.phone ?? "",
              started_at: client.started_at ?? "",
              notes: client.notes ?? "",
            }
          : { name: "", sector: null, phone: "", started_at: "", notes: "" },
      );
    }
  }, [open, client, reset]);

  const isPending = createClient.isPending || updateClient.isPending;
  const { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChanges(isDirty, onOpenChange);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      sector: values.sector ?? null,
      phone: values.phone || null,
      started_at: values.started_at || null,
      notes: values.notes || null,
    };
    try {
      if (isEditing && client) {
        await updateClient.mutateAsync({ id: client.id, payload });
        toast.success("Cliente actualizado");
      } else {
        await createClient.mutateAsync(payload);
        toast.success("Cliente agregado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el cliente");
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Nombre o empresa" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Sector</Label>
                <Select
                  value={watch("sector") ?? "_none"}
                  onValueChange={(v) => setValue("sector", v === "_none" ? null : v, { shouldDirty: true })}
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
                <Label>Cliente desde</Label>
                <DatePickerField
                  value={watch("started_at")}
                  onChange={(v) => setValue("started_at", v)}
                  placeholder="Seleccionar fecha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Notas internas sobre el cliente..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              {isEditing && client && (
                <div className="space-y-2">
                  <Label>Contactos</Label>
                  <ContactsManager entityId={client.id} entityType="client" />
                </div>
              )}
            </div>

            <SheetFooter className="pt-4 border-t border-border flex gap-2">
              {isEditing && client && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => { onOpenChange(false); handleDelete({ id: client.id, label: client.name }); }}
                >
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEditing ? "Guardar cambios" : "Agregar cliente"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <UnsavedChangesDialog
        open={warningOpen}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  );
}
