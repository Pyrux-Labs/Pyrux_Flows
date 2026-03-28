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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/use-expenses";
import { todayISO } from "@/lib/utils";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_FREQUENCY_LABELS } from "@/lib/constants/labels";
import type { Expense, ExpenseFrequency } from "@/lib/types/database.types";

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
  frequency: z.enum(["semanal", "mensual", "anual"]).nullable().optional(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface ExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}


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
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      amountInput: "",
      currency: "ARS",
      date: todayISO(),
      category: null,
      recurrent: false,
      frequency: null,
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
              frequency: expense.frequency ?? null,
              notes: expense.notes ?? "",
            }
          : {
              description: "",
              amountInput: "",
              currency: "ARS",
              date: todayISO(),
              category: null,
              recurrent: false,
              frequency: null,
              notes: "",
            },
      );
    }
  }, [open, expense, reset]);

  const isPending = createExpense.isPending || updateExpense.isPending;
  const { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChanges(isDirty, onOpenChange);
  const currency = watch("currency");
  const recurrent = watch("recurrent");
  const frequency = watch("frequency");

  async function onSubmit(values: FormValues) {
    const payload = {
      description: values.description,
      amount: parseFloat(values.amountInput),
      currency: values.currency,
      date: values.date,
      category: values.category ?? null,
      recurrent: values.recurrent,
      frequency: values.recurrent ? (values.frequency ?? null) : null,
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
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
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
                onCheckedChange={(v) => {
                  setValue("recurrent", v);
                  if (!v) setValue("frequency", null);
                }}
              />
            </div>

            {recurrent && (
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select
                  value={frequency ?? "_none"}
                  onValueChange={(v) =>
                    setValue("frequency", v === "_none" ? null : (v as ExpenseFrequency))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin frecuencia</SelectItem>
                    {Object.entries(EXPENSE_FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  "Agregar gasto"
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
