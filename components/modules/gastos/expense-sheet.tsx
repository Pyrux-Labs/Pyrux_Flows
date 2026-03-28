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
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/use-expenses";
import { todayISO } from "@/lib/utils";
import type { Expense } from "@/lib/types/database.types";

const schema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  amountInput: z
    .string()
    .min(1, "El monto es requerido")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      "El monto debe ser un número positivo",
    ),
  currency: z.enum(["ARS", "USD"]),
  date: z.string().min(1, "La fecha es requerida"),
  category: z
    .enum([
      "herramientas",
      "hosting",
      "marketing",
      "servicios",
      "impuestos",
      "otro",
    ])
    .optional()
    .nullable(),
  recurrent: z.boolean(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  herramientas: "Herramientas",
  hosting: "Hosting",
  marketing: "Marketing",
  servicios: "Servicios",
  impuestos: "Impuestos",
  otro: "Otro",
};

export function ExpenseSheet({ open, onOpenChange, expense }: ExpenseSheetProps) {
  const isEditing = !!expense;
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

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
      description: "",
      amountInput: "",
      currency: "ARS",
      date: todayISO(),
      category: null,
      recurrent: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        expense
          ? {
              description: expense.description,
              amountInput: String(expense.amount),
              currency: expense.currency,
              date: expense.date,
              category: expense.category ?? null,
              recurrent: expense.recurrent,
              notes: expense.notes ?? "",
            }
          : {
              description: "",
              amountInput: "",
              currency: "ARS",
              date: todayISO(),
              category: null,
              recurrent: false,
              notes: "",
            },
      );
    }
  }, [open, expense, reset]);

  const isPending = createExpense.isPending || updateExpense.isPending;
  const currency = watch("currency");
  const recurrent = watch("recurrent");

  async function onSubmit(values: FormValues) {
    const payload = {
      description: values.description,
      amount: parseFloat(values.amountInput),
      currency: values.currency,
      date: values.date,
      category: values.category ?? null,
      recurrent: values.recurrent,
      notes: values.notes || null,
    };

    try {
      if (isEditing && expense) {
        await updateExpense.mutateAsync({ id: expense.id, payload });
        toast.success("Gasto actualizado");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Gasto registrado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el gasto");
    }
  }

  async function onDelete() {
    if (expense) {
      try {
        await deleteExpense.mutateAsync(expense.id);
        toast.success("Gasto eliminado");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar el gasto");
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>{isEditing ? "Editar gasto" : "Nuevo gasto"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Ej: Dominio anual"
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amountInput">Monto *</Label>
                <Input
                  id="amountInput"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amountInput")}
                  placeholder="0"
                />
                {errors.amountInput && (
                  <p className="text-xs text-destructive">
                    {errors.amountInput.message}
                  </p>
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
                    <SelectItem value="ARS">ARS ($)</SelectItem>
                    <SelectItem value="USD">USD (U$D)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={watch("category") ?? "_none"}
                onValueChange={(v) =>
                  setValue(
                    "category",
                    v === "_none" ? null : (v as FormValues["category"]),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin categoría</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="recurrent">Recurrente</Label>
              <Switch
                id="recurrent"
                checked={recurrent}
                onCheckedChange={(v) => setValue("recurrent", v)}
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
                    disabled={deleteExpense.isPending}
                  >
                    {deleteExpense.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                }
                title="¿Eliminar gasto?"
                description="Esta acción no se puede deshacer."
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
                  "Agregar gasto"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
