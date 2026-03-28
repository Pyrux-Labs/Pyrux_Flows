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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { useProspects } from "@/hooks/use-prospects";
import type { Project } from "@/lib/types/database.types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  client_name: z.string().min(1, "El cliente es requerido"),
  prospect_id: z.string().optional().nullable(),
  status: z.enum(["activo", "pausado", "completado", "cancelado"]),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budgetInput: z.string().optional().refine(
    (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0),
    "El presupuesto debe ser un número positivo",
  ),
  paid: z.boolean(),
  notes: z.string().optional().nullable(),
  assigned_to: z.enum(["juanma", "gino", "ambos"]).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  pausado: "Pausado",
  completado: "Completado",
  cancelado: "Cancelado",
};

const ASSIGNED_LABELS: Record<string, string> = {
  juanma: "Juanma",
  gino: "Gino",
  ambos: "Ambos",
};

export function ProjectSheet({ open, onOpenChange, project }: ProjectSheetProps) {
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { data: prospects = [] } = useProspects();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      client_name: "",
      prospect_id: null,
      status: "activo",
      start_date: null,
      end_date: null,
      budgetInput: "",
      paid: false,
      notes: "",
      assigned_to: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              name: project.name,
              client_name: project.client_name,
              prospect_id: project.prospect_id ?? null,
              status: project.status,
              start_date: project.start_date ?? null,
              end_date: project.end_date ?? null,
              budgetInput: project.budget != null ? String(project.budget) : "",
              paid: project.paid,
              notes: project.notes ?? "",
              assigned_to: project.assigned_to ?? null,
            }
          : {
              name: "",
              client_name: "",
              prospect_id: null,
              status: "activo",
              start_date: null,
              end_date: null,
              budgetInput: "",
              paid: false,
              notes: "",
              assigned_to: null,
            },
      );
    }
  }, [open, project, reset]);

  const isPending = createProject.isPending || updateProject.isPending;

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      client_name: values.client_name,
      prospect_id: values.prospect_id || null,
      status: values.status,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      budget: values.budgetInput ? parseFloat(values.budgetInput) : null,
      paid: values.paid,
      notes: values.notes || null,
      assigned_to: values.assigned_to ?? null,
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

  async function onDelete() {
    if (project) {
      try {
        await deleteProject.mutateAsync(project.id);
        toast.success("Proyecto eliminado");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar el proyecto");
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <Label htmlFor="client_name">Cliente *</Label>
              <Input
                id="client_name"
                {...register("client_name")}
                placeholder="Nombre del cliente"
              />
              {errors.client_name && (
                <p className="text-xs text-destructive">
                  {errors.client_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Prospecto vinculado</Label>
              <Select
                value={watch("prospect_id") ?? "_none"}
                onValueChange={(v) =>
                  setValue("prospect_id", v === "_none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ninguno</SelectItem>
                  {prospects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.business ? ` — ${p.business}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
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
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fin</Label>
                <Input id="end_date" type="date" {...register("end_date")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetInput">Presupuesto</Label>
              <Input
                id="budgetInput"
                type="number"
                step="0.01"
                min="0"
                {...register("budgetInput")}
                placeholder="0"
              />
              {errors.budgetInput && (
                <p className="text-xs text-destructive">
                  {errors.budgetInput.message}
                </p>
              )}
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
                  {Object.entries(ASSIGNED_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="paid">Pagado</Label>
              <Switch
                id="paid"
                checked={watch("paid")}
                onCheckedChange={(v) => setValue("paid", v)}
              />
            </div>

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
            {isEditing && (
              <ConfirmDialog
                trigger={
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteProject.isPending}
                  >
                    {deleteProject.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                }
                title="¿Eliminar proyecto?"
                description="Se eliminarán también los ingresos vinculados al proyecto."
                confirmLabel="Eliminar"
                destructive
                onConfirm={onDelete}
              />
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
  );
}
