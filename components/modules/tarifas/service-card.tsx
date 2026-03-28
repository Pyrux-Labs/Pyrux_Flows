"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateService } from "@/hooks/use-services";
import type { Service } from "@/lib/types/database.types";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  cms: "CMS",
  automatizacion: "Automatización",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
};

const UNIT_LABELS: Record<string, string> = {
  proyecto: "proyecto",
  hora: "hora",
  mes: "mes",
};

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "—";
  const symbol = currency === "USD" ? "U$D" : "$";
  return `${symbol} ${price.toLocaleString("es-AR")}`;
}

export function ServiceCard({ service, onEdit }: ServiceCardProps) {
  const updateService = useUpdateService();

  function handleToggleActive(active: boolean) {
    updateService.mutate({ id: service.id, payload: { active } });
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground text-sm leading-snug">
          {service.name}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={service.active}
            onCheckedChange={handleToggleActive}
            disabled={updateService.isPending}
            className="scale-90"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(service)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {service.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {service.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="text-sm font-semibold text-foreground">
          {formatPrice(service.price, service.currency)}
          {service.unit && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {UNIT_LABELS[service.unit] ?? service.unit}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {service.category && (
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[service.category] ?? service.category}
            </Badge>
          )}
          {!service.active && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Inactivo
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
