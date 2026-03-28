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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCreateProspect,
  useUpdateProspect,
  useDeleteProspect,
} from "@/hooks/use-prospects";
import {
  SECTOR_LABELS,
  SOURCE_LABELS,
  PROSPECT_STATUS_LABELS,
} from "@/lib/constants/labels";
import type { Prospect } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  business: z.string().optional().nullable(),
  sector: z
    .enum([
      "contabilidad",
      "legal",
      "medico",
      "estetica",
      "gastronomia",
      "fitness",
      "dental",
      "otro",
    ])
    .optional()
    .nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  source: z
    .enum([
      "word_of_mouth",
      "instagram",
      "linkedin",
      "cold_email",
      "whatsapp",
      "otro",
    ])
    .optional()
    .nullable(),
  status: z.enum([
    "nuevo",
    "contactado",
    "en_negociacion",
    "cerrado",
    "perdido",
  ]),
  notes: z.string().optional().nullable(),
  assigned_to: z.enum(["juanma", "gino"]).optional().nullable(),
  last_contact: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ProspectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: Prospect | null;
}


export function ProspectSheet({
  open,
  onOpenChange,
  prospect,
}: ProspectSheetProps) {
  const isEditing = !!prospect;
  const createProspect = useCreateProspect();
  const updateProspect = useUpdateProspect();
  const deleteProspect = useDeleteProspect();

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
      business: "",
      sector: null,
      email: "",
      phone: "",
      source: null,
      status: "nuevo",
      notes: "",
      assigned_to: null,
      last_contact: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        prospect
          ? {
              name: prospect.name,
              business: prospect.business ?? "",
              sector: prospect.sector ?? null,
              email: prospect.email ?? "",
              phone: prospect.phone ?? "",
              source: prospect.source ?? null,
              status: prospect.status,
              notes: prospect.notes ?? "",
              assigned_to: prospect.assigned_to ?? null,
              last_contact: prospect.last_contact ?? null,
            }
          : {
              name: "",
              business: "",
              sector: null,
              email: "",
              phone: "",
              source: null,
              status: "nuevo",
              notes: "",
              assigned_to: null,
              last_contact: null,
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
      business: values.business || null,
      sector: values.sector ?? null,
      email: values.email || null,
      phone: values.phone || null,
      source: values.source ?? null,
      status: values.status,
      notes: values.notes || null,
      assigned_to: values.assigned_to ?? null,
      last_contact: values.last_contact || null,
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

  async function onDelete() {
    if (prospect) {
      try {
        await deleteProspect.mutateAsync(prospect.id);
        toast.success("Prospecto eliminado");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar el prospecto");
      }
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
              <Input id="name" {...register("name")} placeholder="Nombre completo" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business">Empresa</Label>
              <Input
                id="business"
                {...register("business")}
                placeholder="Nombre de la empresa"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select
                  value={watch("sector") ?? "_none"}
                  onValueChange={(v) =>
                    setValue("sector", v === "_none" ? null : (v as FormValues["sector"]))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin sector</SelectItem>
                    {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fuente</Label>
                <Select
                  value={watch("source") ?? "_none"}
                  onValueChange={(v) =>
                    setValue("source", v === "_none" ? null : (v as FormValues["source"]))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin fuente</SelectItem>
                    {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contacto@empresa.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} placeholder="+54 11 ..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) =>
                    setValue("status", v as FormValues["status"])
                  }
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
                <Label>Asignado a</Label>
                <Select
                  value={watch("assigned_to") ?? "_none"}
                  onValueChange={(v) =>
                    setValue(
                      "assigned_to",
                      v === "_none" ? null : (v as FormValues["assigned_to"]),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin asignar</SelectItem>
                    <SelectItem value="juanma">Juanma</SelectItem>
                    <SelectItem value="gino">Gino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_contact">Último contacto</Label>
              <Input id="last_contact" type="date" {...register("last_contact")} />
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
          </div>

          <SheetFooter className="pt-4 border-t border-border flex gap-2">
            {isEditing && (
              <ConfirmDialog
                trigger={
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteProspect.isPending}
                  >
                    {deleteProspect.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                }
                title="¿Eliminar prospecto?"
                description="Se eliminarán también los proyectos vinculados."
                confirmLabel="Eliminar"
                destructive
                onConfirm={onDelete}
              />
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
