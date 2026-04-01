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
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { PROJECT_STATUS_LABELS } from "@/lib/constants/labels";
import type { ProjectWithClient } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  client_id: z.string().uuid("El cliente es requerido"),
  status: z.enum(["activo", "pausado", "completado", "cancelado", "mantenimiento"]),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  priceInput: z.string().optional().refine(
    (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0),
    "El precio debe ser un número positivo",
  ),
  currency: z.enum(["ARS", "USD"]),
  maintenance_amount_input: z.string().optional().refine(
    (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0),
    "El monto debe ser un número positivo",
  ),
  maintenance_currency: z.enum(["ARS", "USD"]),
  maintenance_since: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectWithClient | null;
}

export function ProjectSheet({ open, onOpenChange, project }: ProjectSheetProps) {
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { handleDelete } = useDeleteWithUndo({
    mutateAsync: deleteProject.mutateAsync,
    queryKey: ["projects"],
  });
  const { data: clients = [] } = useClients();

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
      client_id: "",
      status: "activo",
      start_date: null,
      end_date: null,
      priceInput: "",
      currency: "ARS",
      maintenance_amount_input: "",
      maintenance_currency: "USD",
      maintenance_since: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              name: project.name,
              client_id: project.client_id ?? "",
              status: project.status as FormValues["status"],
              start_date: project.start_date ?? null,
              end_date: project.end_date ?? null,
              priceInput: project.price != null ? String(project.price) : "",
              currency: (project.currency as "ARS" | "USD") ?? "ARS",
              maintenance_amount_input:
                project.maintenance_amount != null
                  ? String(project.maintenance_amount)
                  : "",
              maintenance_currency:
                (project.maintenance_currency as "ARS" | "USD") ?? "USD",
              maintenance_since: project.maintenance_since ?? null,
              notes: project.notes ?? "",
            }
          : {
              name: "",
              client_id: "",
              status: "activo",
              start_date: null,
              end_date: null,
              priceInput: "",
              currency: "ARS",
              maintenance_amount_input: "",
              maintenance_currency: "USD",
              maintenance_since: null,
              notes: "",
            },
      );
    }
  }, [open, project, reset]);

  const isPending = createProject.isPending || updateProject.isPending;
  const { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChanges(isDirty, onOpenChange);
  const status = watch("status");

  async function onSubmit(values: FormValues) {
    const isMantenimiento = values.status === "mantenimiento";
    const payload = {
      name: values.name,
      client_id: values.client_id,
      status: values.status,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      price: values.priceInput ? parseFloat(values.priceInput) : null,
      currency: values.currency,
      maintenance_amount: isMantenimiento && values.maintenance_amount_input
        ? parseFloat(values.maintenance_amount_input)
        : null,
      maintenance_currency: isMantenimiento ? values.maintenance_currency : ("ARS" as const),
      maintenance_since: isMantenimiento ? values.maintenance_since || null : null,
      notes: values.notes || null,
    };

    try {
      if (isEditing && project) {
        await updateProject.mutateAsync({ id: project.id, payload });
        toast.success("Proyecto actualizado");
      } else {
        await createProject.mutateAsync(payload);
        toast.success("Proyecto creado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el proyecto");
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>
            {isEditing ? "Editar proyecto" : "Nuevo proyecto"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del proyecto *</Label>
              <Input id="name" {...register("name")} placeholder="Ej: Sitio web ABC" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={watch("client_id") || "_none"}
                onValueChange={(v) => setValue("client_id", v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Seleccioná un cliente</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-xs text-destructive">{errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Inicio</Label>
                <Input id="start_date" type="date" {...register("start_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fin</Label>
                <Input id="end_date" type="date" {...register("end_date")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
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
                  value={watch("currency")}
                  onValueChange={(v) => setValue("currency", v as "ARS" | "USD")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {status === "mantenimiento" && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Mantenimiento mensual
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="maintenance_amount_input">Monto</Label>
                    <Input
                      id="maintenance_amount_input"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("maintenance_amount_input")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select
                      value={watch("maintenance_currency")}
                      onValueChange={(v) =>
                        setValue("maintenance_currency", v as "ARS" | "USD")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance_since">Desde</Label>
                  <Input
                    id="maintenance_since"
                    type="date"
                    {...register("maintenance_since")}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                {...register("notes")}
                placeholder="Notas opcionales..."
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-border flex gap-2">
            {isEditing && project && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  handleDelete({ id: project.id, label: project.name });
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
                  "Crear proyecto"
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
