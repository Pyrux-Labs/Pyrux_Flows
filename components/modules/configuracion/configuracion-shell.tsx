"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSyncMovements } from "@/hooks/use-movements";
import { formatDate } from "@/lib/utils";

interface ConfiguracionShellProps {
  settings: Record<string, string>;
}

export function ConfiguracionShell({ settings }: ConfiguracionShellProps) {
  const sync = useSyncMovements();

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
