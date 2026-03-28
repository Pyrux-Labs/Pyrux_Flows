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
  month: string; // "Ene", "Feb", etc.
  ingresos: number;
  gastos: number;
}

interface TrendsChartProps {
  data: MonthlyPoint[];
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
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value ?? 0), "ARS")}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="ingresos" name="Ingresos" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
