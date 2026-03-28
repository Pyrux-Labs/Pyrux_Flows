"use client";

import { useState } from "react";
import { upsertSetting } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

interface ConfiguracionClientProps {
  settings: Record<string, string>;
}

export function ConfiguracionClient({ settings }: ConfiguracionClientProps) {
  const [rate, setRate] = useState(settings["usd_ars_rate"] ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) return;
    setSaving(true);
    try {
      await upsertSetting("usd_ars_rate", rate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">Tipo de cambio</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Usado para convertir montos USD a ARS en el Dashboard.
        </p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="rate">1 USD =</Label>
          <div className="flex items-center gap-2">
            <Input
              id="rate"
              type="number"
              min="1"
              step="1"
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                setSaved(false);
              }}
              placeholder="1200"
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">ARS</span>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !rate}
          size="sm"
          variant={saved ? "outline" : "default"}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Guardado
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </div>
  );
}
