"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateOpeningBalance } from "@/app/(dashboard)/configuracion/actions";
import { useSyncMovements } from "@/hooks/use-movements";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  opening_balance_ars: z.string().refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0,
    "Ingresá un número válido",
  ),
  opening_balance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

type FormValues = z.infer<typeof schema>;

interface ConfiguracionShellProps {
  settings: Record<string, string>;
}

export function ConfiguracionShell({ settings }: ConfiguracionShellProps) {
  const [saving, setSaving] = useState(false);
  const sync = useSyncMovements();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      opening_balance_ars: settings["opening_balance_ars"] ?? "0",
      opening_balance_date: settings["opening_balance_date"] ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await updateOpeningBalance({
        opening_balance_ars: parseFloat(values.opening_balance_ars),
        opening_balance_date: values.opening_balance_date,
      });
      toast.success("Configuración guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    try {
      const result = await sync.mutateAsync();
      toast.success(`Sincronizado: ${result.synced} movimiento${result.synced !== 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar");
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ajustes generales de Pyrux OS
        </p>
      </div>

      {/* Opening balance */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Saldo inicial MP</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Saldo de la cuenta al momento de activar la sincronización. Se usa para calcular el saldo actual.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opening_balance_ars">Saldo inicial (ARS)</Label>
            <Input
              id="opening_balance_ars"
              type="number"
              step="0.01"
              min="0"
              {...register("opening_balance_ars")}
            />
            {errors.opening_balance_ars && (
              <p className="text-xs text-destructive">{errors.opening_balance_ars.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_balance_date">Fecha del saldo inicial</Label>
            <Input
              id="opening_balance_date"
              type="date"
              {...register("opening_balance_date")}
            />
            {errors.opening_balance_date && (
              <p className="text-xs text-destructive">{errors.opening_balance_date.message}</p>
            )}
          </div>

          <Button type="submit" size="sm" disabled={saving || !isDirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </form>
      </div>

      {/* Sync */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Sincronización MP</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Último sync:{" "}
            {settings["last_sync_at"]
              ? formatDate(settings["last_sync_at"])
              : "Nunca"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={sync.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`} />
          Sincronizar ahora
        </Button>
      </div>
    </div>
  );
}
