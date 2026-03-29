"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyPoint {
  month: string;
  ingresos: number;
  gastos: number;
}

interface TrendsChartProps {
  data: MonthlyPoint[];
}

interface TooltipEntry {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipEntry) {
  if (!active || !payload?.length) return null;

  const ingresos = payload.find((p) => p.dataKey === "ingresos")?.value ?? 0;
  const gastos = payload.find((p) => p.dataKey === "gastos")?.value ?? 0;
  const resultado = ingresos - gastos;
  const positivo = resultado >= 0;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md space-y-1.5 min-w-[160px]">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Ingresos</span>
        <span className="font-mono text-foreground">{formatCurrency(ingresos, "USD")}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Gastos</span>
        <span className="font-mono text-foreground">{formatCurrency(gastos, "USD")}</span>
      </div>
      <div className="border-t border-border pt-1.5 flex justify-between gap-4">
        <span className="text-muted-foreground">{positivo ? "Ganancia" : "Pérdida"}</span>
        <span className={`font-mono font-semibold ${positivo ? "text-green-400" : "text-destructive"}`}>
          {positivo ? "+" : ""}{formatCurrency(resultado, "USD")}
        </span>
      </div>
    </div>
  );
}

export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--secondary)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Bar dataKey="ingresos" name="Ingresos" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
