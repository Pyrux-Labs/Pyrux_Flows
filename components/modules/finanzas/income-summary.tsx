"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Income } from "@/lib/types/database.types";

interface IncomeSummaryProps {
  income: Income[];
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  proyecto: "Proyecto",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
  otro: "Otro",
  sin_categoria: "Sin categoría",
};

const CHART_COLOR = "hsl(20 100% 62%)";
const CHART_COLOR_USD = "hsl(30 45% 64%)";

function groupByCategory(income: Income[], currency: "ARS" | "USD") {
  const map: Record<string, number> = {};
  for (const e of income) {
    if (e.currency !== currency) continue;
    const key = e.category ?? "sin_categoria";
    map[key] = (map[key] ?? 0) + e.amount;
  }
  return Object.entries(map)
    .map(([category, total]) => ({
      category: CATEGORY_LABELS[category] ?? category,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  currency: "ARS" | "USD";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

export function IncomeSummary({ income, isLoading }: IncomeSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!income.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sin ingresos este mes"
        description="Registrá ingresos para ver el resumen."
      />
    );
  }

  const totalARS = income
    .filter((e) => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUSD = income
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = income.filter((e) => !e.paid).length;

  const arsData = groupByCategory(income, "ARS");
  const usdData = groupByCategory(income, "USD");

  return (
    <div className="space-y-6">
      {/* Monthly totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total ARS
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalARS, "ARS")}
          </p>
          {pendingCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {pendingCount} pendiente{pendingCount > 1 ? "s" : ""} de cobro
            </p>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total USD
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalUSD, "USD")}
          </p>
        </div>
      </div>

      {/* ARS breakdown */}
      {arsData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Desglose por categoría — ARS
          </h3>
          <ResponsiveContainer width="100%" height={arsData.length * 44 + 32}>
            <BarChart
              data={arsData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={110}
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip currency="ARS" />}
                cursor={{ fill: "hsl(var(--secondary))" }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {arsData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLOR} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* USD breakdown */}
      {usdData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Desglose por categoría — USD
          </h3>
          <ResponsiveContainer width="100%" height={usdData.length * 44 + 32}>
            <BarChart
              data={usdData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `U$D${v}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={110}
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip currency="USD" />}
                cursor={{ fill: "hsl(var(--secondary))" }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {usdData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLOR_USD} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
