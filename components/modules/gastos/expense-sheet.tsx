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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEnrichMovement } from "@/hooks/use-movements";
import { useProjects } from "@/hooks/use-projects";
import { MOVEMENT_DEBIT_CATEGORY_LABELS } from "@/lib/constants/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Movement } from "@/lib/types/database.types";

const schema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  category: z.string().nullable().optional(),
  is_recurring: z.boolean(),
  notes: z.string().nullable().optional(),
  save_as_rule: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: Movement | null;
}

export function ExpenseSheet({ open, onOpenChange, movement }: ExpenseSheetProps) {
  const enrich = useEnrichMovement();
  const { data: projects = [] } = useProjects();

  const { handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: null,
      category: null,
      is_recurring: false,
      notes: "",
      save_as_rule: false,
    },
  });

  useEffect(() => {
    if (open && movement) {
      reset({
        project_id: movement.project_id ?? null,
        category: movement.category ?? null,
        is_recurring: movement.is_recurring,
        notes: movement.notes ?? "",
        save_as_rule: false,
      });
    }
  }, [open, movement, reset]);

  async function onSubmit(values: FormValues) {
    if (!movement) return;
    try {
      await enrich.mutateAsync({ id: movement.id, payload: values });
      toast.success("Movimiento actualizado");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>Clasificar gasto</SheetTitle>
        </SheetHeader>

        {movement && (
          <div className="py-3 px-1 border-b border-border space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {movement.description ?? movement.counterpart_name ?? "Sin descripción"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(movement.amount, movement.currency)} · {formatDate(movement.date)}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select
                value={watch("project_id") ?? "_none"}
                onValueChange={(v) =>
                  setValue("project_id", v === "_none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin proyecto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.client?.name ? ` — ${p.client.name}` : ""}
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
                  setValue("category", v === "_none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin categoría</SelectItem>
                  {Object.entries(MOVEMENT_DEBIT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Recurrente</Label>
                <p className="text-xs text-muted-foreground">
                  Se incluye en el forecast mensual
                </p>
              </div>
              <Switch
                checked={watch("is_recurring")}
                onCheckedChange={(v) => setValue("is_recurring", v)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                value={watch("notes") ?? ""}
                onChange={(e) => setValue("notes", e.target.value)}
                placeholder="Notas opcionales..."
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {movement?.counterpart_id && (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label>Recordar asignación</Label>
                  <p className="text-xs text-muted-foreground">
                    Aplicar automáticamente a futuros gastos de este origen
                  </p>
                </div>
                <Switch
                  checked={watch("save_as_rule")}
                  onCheckedChange={(v) => setValue("save_as_rule", v)}
                />
              </div>
            )}
          </div>

          <SheetFooter className="pt-4 border-t border-border">
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enrich.isPending}>
                {enrich.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
