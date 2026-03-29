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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteWithUndo } from "@/hooks/use-delete-with-undo";
import { useCreateService, useUpdateService, useDeleteService } from "@/hooks/use-services";
import {
  SERVICE_CATEGORY_LABELS,
  SERVICE_UNIT_LABELS,
} from "@/lib/constants/labels";
import type { Service } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  priceInput: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      "El precio debe ser un número positivo",
    ),
  currency: z.enum(["ARS", "USD"]),
  unit: z.enum(["proyecto", "hora", "mes"]).optional().nullable(),
  category: z
    .enum(["web", "cms", "automatizacion", "mantenimiento", "consultoria"])
    .optional()
    .nullable(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ServiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}


export function ServiceSheet({ open, onOpenChange, service }: ServiceSheetProps) {
  const isEditing = !!service;
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { handleDelete } = useDeleteWithUndo({
    mutateAsync: deleteService.mutateAsync,
    queryKey: ["services"],
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
      description: "",
      priceInput: "",
      currency: "USD",
      unit: null,
      category: null,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        service
          ? {
              name: service.name,
              description: service.description ?? "",
              priceInput: service.price != null ? String(service.price) : "",
              currency: service.currency,
              unit: service.unit ?? null,
              category: service.category ?? null,
              active: service.active,
            }
          : {
              name: "",
              description: "",
              priceInput: "",
              currency: "USD",
              unit: null,
              category: null,
              active: true,
            },
      );
    }
  }, [open, service, reset]);

  const isPending = createService.isPending || updateService.isPending;
  const { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChanges(isDirty, onOpenChange);

  async function onSubmit(values: FormValues) {
    const price =
      values.priceInput && values.priceInput !== ""
        ? parseFloat(values.priceInput)
        : null;
    const payload = {
      name: values.name,
      description: values.description || null,
      price,
      currency: values.currency,
      unit: values.unit ?? null,
      category: values.category ?? null,
      active: values.active,
    };

    try {
      if (isEditing && service) {
        await updateService.mutateAsync({ id: service.id, payload });
        toast.success("Servicio actualizado");
      } else {
        await createService.mutateAsync(payload);
        toast.success("Servicio creado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el servicio");
    }
  }

  const currency = watch("currency");
  const active = watch("active");

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>{isEditing ? "Editar servicio" : "Nuevo servicio"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register("name")} placeholder="Ej: Sitio web corporativo" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Descripción breve del servicio"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="priceInput">Precio</Label>
                <Input
                  id="priceInput"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("priceInput")}
                  placeholder="0"
                />
                {errors.priceInput && (
                  <p className="text-xs text-destructive">{errors.priceInput.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => setValue("currency", v as "ARS" | "USD")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD (U$D)</SelectItem>
                    <SelectItem value="ARS">ARS ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select
                value={watch("unit") ?? "_none"}
                onValueChange={(v) =>
                  setValue("unit", v === "_none" ? null : (v as FormValues["unit"]))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin unidad</SelectItem>
                  {Object.entries(SERVICE_UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={watch("category") ?? "_none"}
                onValueChange={(v) =>
                  setValue("category", v === "_none" ? null : (v as FormValues["category"]))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin categoría</SelectItem>
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Activo</Label>
              <Switch
                id="active"
                checked={active}
                onCheckedChange={(v) => setValue("active", v)}
              />
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-border flex gap-2">
            {isEditing && service && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  handleDelete({ id: service.id, label: service.name });
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
                  "Crear servicio"
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
