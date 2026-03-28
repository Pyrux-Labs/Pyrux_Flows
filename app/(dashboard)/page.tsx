import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfWeek, format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Receipt, Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants/labels";

async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const monthFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const monthTo = format(endOfMonth(now), "yyyy-MM-dd");
  const weekFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [incomeRes, expensesRes, prospectsThisWeekRes, activeProjectsRes, recentProspectsRes, recentIncomeRes, settingsRes] =
    await Promise.all([
      supabase
        .from("income")
        .select("amount, currency")
        .gte("date", monthFrom)
        .lte("date", monthTo),
      supabase
        .from("expenses")
        .select("amount, currency")
        .gte("date", monthFrom)
        .lte("date", monthTo),
      supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekFrom),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "activo"),
      supabase
        .from("prospects")
        .select("id, name, business, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("income")
        .select("id, description, amount, currency, date")
        .order("date", { ascending: false })
        .limit(5),
      supabase.from("settings").select("key, value"),
    ]);

  const income = incomeRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const settings = Object.fromEntries(
    (settingsRes.data ?? []).map((r) => [r.key, r.value]),
  );
  const usdRate = parseFloat(settings["usd_ars_rate"] ?? "1");

  const incomeARS = income.filter((i) => i.currency === "ARS").reduce((s, i) => s + i.amount, 0);
  const incomeUSD = income.filter((i) => i.currency === "USD").reduce((s, i) => s + i.amount, 0);
  const expensesARS = expenses.filter((e) => e.currency === "ARS").reduce((s, e) => s + e.amount, 0);
  const expensesUSD = expenses.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);

  const totalIncome = incomeARS + incomeUSD * usdRate;
  const totalExpenses = expensesARS + expensesUSD * usdRate;

  return {
    incomeARS,
    incomeUSD,
    expensesARS,
    expensesUSD,
    totalIncome,
    totalExpenses,
    prospectsThisWeek: prospectsThisWeekRes.count ?? 0,
    activeProjects: activeProjectsRes.count ?? 0,
    recentProspects: recentProspectsRes.data ?? [],
    recentIncome: recentIncomeRes.data ?? [],
    usdRate,
  };
}


export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen del mes en curso
        </p>
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget
          icon={TrendingUp}
          label="Ingresos del mes"
          primary={formatCurrency(data.incomeARS, "ARS")}
          secondary={
            data.incomeUSD > 0
              ? formatCurrency(data.incomeUSD, "USD")
              : undefined
          }
          subtext={`≈ ${formatCurrency(data.totalIncome, "ARS")} combinado`}
          href="/finanzas"
        />
        <Widget
          icon={Receipt}
          label="Gastos del mes"
          primary={formatCurrency(data.expensesARS, "ARS")}
          secondary={
            data.expensesUSD > 0
              ? formatCurrency(data.expensesUSD, "USD")
              : undefined
          }
          subtext={`≈ ${formatCurrency(data.totalExpenses, "ARS")} combinado`}
          href="/gastos"
        />
        <Widget
          icon={Users}
          label="Prospectos esta semana"
          primary={String(data.prospectsThisWeek)}
          subtext="nuevos contactos"
          href="/prospectos"
        />
        <Widget
          icon={FolderKanban}
          label="Proyectos activos"
          primary={String(data.activeProjects)}
          subtext="en curso"
          href="/proyectos"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent prospects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Últimos prospectos
            </h2>
            <Link
              href="/prospectos"
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {data.recentProspects.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Sin prospectos.</p>
            ) : (
              data.recentProspects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    {p.business && (
                      <p className="text-xs text-muted-foreground">{p.business}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {PROSPECT_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent income */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Últimos ingresos
            </h2>
            <Link
              href="/finanzas"
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {data.recentIncome.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Sin ingresos.</p>
            ) : (
              data.recentIncome.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(i.date)}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {formatCurrency(i.amount, i.currency as "ARS" | "USD")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Widget({
  icon: Icon,
  label,
  primary,
  secondary,
  subtext,
  href,
}: {
  icon: React.ElementType;
  label: string;
  primary: string;
  secondary?: string;
  subtext?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-lg p-4 space-y-2 hover:border-primary/40 transition-colors block"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{primary}</p>
      {secondary && (
        <p className="text-sm font-semibold text-accent">{secondary}</p>
      )}
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </Link>
  );
}
