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
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
} from "@/hooks/use-income";
import { useProjects } from "@/hooks/use-projects";
import { todayISO } from "@/lib/utils";
import { INCOME_CATEGORY_LABELS } from "@/lib/constants/labels";
import type { Income } from "@/lib/types/database.types";

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
  project_id: z.string().optional().nullable(),
  category: z
    .enum(["proyecto", "mantenimiento", "consultoria", "otro"])
    .optional()
    .nullable(),
  invoice_sent: z.boolean(),
  paid: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface IncomeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income | null;
}


export function IncomeSheet({ open, onOpenChange, income }: IncomeSheetProps) {
  const isEditing = !!income;
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();
  const { data: projects = [] } = useProjects();

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
      project_id: null,
      category: null,
      invoice_sent: false,
      paid: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        income
          ? {
              description: income.description,
              amountInput: String(income.amount),
              currency: income.currency,
              date: income.date,
              project_id: income.project_id ?? null,
              category: income.category ?? null,
              invoice_sent: income.invoice_sent,
              paid: income.paid,
            }
          : {
              description: "",
              amountInput: "",
              currency: "ARS",
              date: todayISO(),
              project_id: null,
              category: null,
              invoice_sent: false,
              paid: false,
            },
      );
    }
  }, [open, income, reset]);

  const isPending = createIncome.isPending || updateIncome.isPending;
  const { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChanges(isDirty, onOpenChange);
  const currency = watch("currency");
  const invoiceSent = watch("invoice_sent");
  const paid = watch("paid");

  async function onSubmit(values: FormValues) {
    const payload = {
      description: values.description,
      amount: parseFloat(values.amountInput),
      currency: values.currency,
      date: values.date,
      project_id: values.project_id || null,
      category: values.category ?? null,
      invoice_sent: values.invoice_sent,
      paid: values.paid,
    };

    try {
      if (isEditing && income) {
        await updateIncome.mutateAsync({ id: income.id, payload });
        toast.success("Ingreso actualizado");
      } else {
        await createIncome.mutateAsync(payload);
        toast.success("Ingreso registrado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el ingreso");
    }
  }

  async function onDelete() {
    if (income) {
      try {
        await deleteIncome.mutateAsync(income.id);
        toast.success("Ingreso eliminado");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar el ingreso");
      }
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>{isEditing ? "Editar ingreso" : "Nuevo ingreso"}</SheetTitle>
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
                placeholder="Ej: Sitio web cliente ABC"
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
              <Label>Proyecto vinculado</Label>
              <Select
                value={watch("project_id") ?? "_none"}
                onValueChange={(v) =>
                  setValue("project_id", v === "_none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ninguno</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.client_name}
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
                  {Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="invoice_sent">Factura enviada</Label>
              <Switch
                id="invoice_sent"
                checked={invoiceSent}
                onCheckedChange={(v) => setValue("invoice_sent", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="paid">Cobrado</Label>
              <Switch
                id="paid"
                checked={paid}
                onCheckedChange={(v) => setValue("paid", v)}
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
                    disabled={deleteIncome.isPending}
                  >
                    {deleteIncome.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                }
                title="¿Eliminar ingreso?"
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
                  "Agregar ingreso"
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
