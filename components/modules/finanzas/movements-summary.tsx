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
import { ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  MOVEMENT_CREDIT_CATEGORY_LABELS,
  MOVEMENT_DEBIT_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type { Movement, MovementType } from "@/lib/types/database.types";

interface MovementsSummaryProps {
  movements: Movement[];
  filter: MovementType | "all";
  isLoading: boolean;
}

const CREDIT_COLOR = "var(--chart-1)";  // ingresos ARS — igual que dashboard
const DEBIT_COLOR = "var(--chart-2)";   // gastos ARS   — igual que dashboard
const CREDIT_COLOR_USD = "var(--chart-3)"; // ingresos USD
const DEBIT_COLOR_USD = "var(--chart-4)";  // gastos USD

const EXTENDED_LABELS: Record<MovementType, Record<string, string>> = {
  credit: { ...MOVEMENT_CREDIT_CATEGORY_LABELS, sin_categoria: "Sin categoría" },
  debit: { ...MOVEMENT_DEBIT_CATEGORY_LABELS, sin_categoria: "Sin categoría" },
};

function groupByCategory(
  movements: Movement[],
  type: MovementType,
  currency: "ARS" | "USD",
) {
  const map: Record<string, number> = {};
  for (const e of movements) {
    if (e.type !== type || e.currency !== currency) continue;
    const key = e.category ?? "sin_categoria";
    map[key] = (map[key] ?? 0) + e.amount;
  }
  return Object.entries(map)
    .map(([category, total]) => ({
      category: EXTENDED_LABELS[type][category] ?? category,
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

function CategoryChart({
  data,
  currency,
  color,
  tickFormatter,
}: {
  data: Array<{ category: string; total: number }>;
  currency: "ARS" | "USD";
  color: string;
  tickFormatter: (v: number) => string;
}) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 32}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={tickFormatter}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={110}
          tick={{ fontSize: 12, fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip currency={currency} />}
          cursor={{ fill: "var(--secondary)" }}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TypeSection({
  movements,
  type,
  label,
  arsColor,
  usdColor,
}: {
  movements: Movement[];
  type: MovementType;
  label: string;
  arsColor: string;
  usdColor: string;
}) {
  const filtered = movements.filter((m) => m.type === type);
  const totalARS = filtered
    .filter((e) => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUSD = filtered
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0);
  const arsData = groupByCategory(movements, type, "ARS");
  const usdData = groupByCategory(movements, type, "USD");

  if (!filtered.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">{label}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total ARS</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalARS, "ARS")}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total USD</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalUSD, "USD")}
          </p>
        </div>
      </div>
      {arsData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Desglose por categoría — ARS
          </h3>
          <CategoryChart
            data={arsData}
            currency="ARS"
            color={arsColor}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </div>
      )}
      {usdData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Desglose por categoría — USD
          </h3>
          <CategoryChart
            data={usdData}
            currency="USD"
            color={usdColor}
            tickFormatter={(v) => `U$D${v}`}
          />
        </div>
      )}
    </div>
  );
}

export function MovementsSummary({
  movements,
  filter,
  isLoading,
}: MovementsSummaryProps) {
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

  if (!movements.length) {
    return (
      <EmptyState
        icon={ArrowUpDown}
        title="Sin movimientos este mes"
        description="Sincronizá desde Mercado Pago para ver el resumen."
      />
    );
  }

  // Single-type views reuse the same component as before
  if (filter !== "all") {
    const type = filter;
    const totalARS = movements
      .filter((e) => e.currency === "ARS")
      .reduce((sum, e) => sum + e.amount, 0);
    const totalUSD = movements
      .filter((e) => e.currency === "USD")
      .reduce((sum, e) => sum + e.amount, 0);
    const arsColor = type === "credit" ? CREDIT_COLOR : DEBIT_COLOR;
    const usdColor = type === "credit" ? CREDIT_COLOR_USD : DEBIT_COLOR_USD;
    const arsData = groupByCategory(movements, type, "ARS");
    const usdData = groupByCategory(movements, type, "USD");

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total ARS</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalARS, "ARS")}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total USD</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalUSD, "USD")}
            </p>
          </div>
        </div>
        {arsData.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Desglose por categoría — ARS
            </h3>
            <CategoryChart
              data={arsData}
              currency="ARS"
              color={arsColor}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
          </div>
        )}
        {usdData.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Desglose por categoría — USD
            </h3>
            <CategoryChart
              data={usdData}
              currency="USD"
              color={usdColor}
              tickFormatter={(v) => `U$D${v}`}
            />
          </div>
        )}
      </div>
    );
  }

  // "all" view: show ingresos section then gastos section
  return (
    <div className="space-y-8">
      <TypeSection
        movements={movements}
        type="credit"
        label="Ingresos"
        arsColor={CREDIT_COLOR}
        usdColor={CREDIT_COLOR_USD}
      />
      <TypeSection
        movements={movements}
        type="debit"
        label="Gastos"
        arsColor={DEBIT_COLOR}
        usdColor={DEBIT_COLOR_USD}
      />
    </div>
  );
}
