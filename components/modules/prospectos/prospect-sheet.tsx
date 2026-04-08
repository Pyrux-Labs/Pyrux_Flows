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
import { useDeleteWithUndo } from "@/hooks/use-delete-with-undo";
import {
  useCreateProspect,
  useUpdateProspect,
  useDeleteProspect,
} from "@/hooks/use-prospects";
import { SECTOR_LABELS, SECTOR_VALUES, PROSPECT_STATUS_LABELS } from "@/lib/constants/labels";
import type { Prospect } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sector: z.enum(SECTOR_VALUES).optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
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
  const { handleDelete } = useDeleteWithUndo({
    mutateAsync: deleteProspect.mutateAsync,
    queryKey: ["prospects"],
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
    defaultValues: {
      name: "",
      sector: null,
      email: "",
      phone: "",
      status: "sin_contactar",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        prospect
          ? {
              name: prospect.name,
              sector: prospect.sector ?? null,
              email: prospect.email ?? "",
              phone: prospect.phone ?? "",
              status: prospect.status as FormValues["status"],
              notes: prospect.notes ?? "",
            }
          : {
              name: "",
              sector: null,
              email: "",
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
      email: values.email || null,
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
                  setValue("sector", v === "_none" ? null : (v as FormValues["sector"]), { shouldDirty: true })
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
