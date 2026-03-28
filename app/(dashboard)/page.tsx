import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfWeek, subMonths, format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Receipt, Users, FolderKanban, Clock } from "lucide-react";
import Link from "next/link";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants/labels";
import { TrendsChart } from "@/components/modules/dashboard/trends-chart";

async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const monthFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const monthTo = format(endOfMonth(now), "yyyy-MM-dd");
  const weekFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Build date range for last 6 months trend
  const trendMonths = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return {
      label: format(d, "MMM", { locale: undefined }),
      from: format(startOfMonth(d), "yyyy-MM-dd"),
      to: format(endOfMonth(d), "yyyy-MM-dd"),
    };
  });
  const trendFrom = trendMonths[0].from;
  const trendTo = trendMonths[5].to;

  const [incomeRes, expensesRes, prospectsThisWeekRes, activeProjectsRes, recentProspectsRes, recentIncomeRes, settingsRes, pendingRes, trendIncomeRes, trendExpensesRes] =
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
      // Pending collections: invoice sent but not yet paid
      supabase
        .from("income")
        .select("amount, currency")
        .eq("invoice_sent", true)
        .eq("paid", false),
      // Trend: income for last 6 months
      supabase
        .from("income")
        .select("amount, currency, date")
        .gte("date", trendFrom)
        .lte("date", trendTo),
      // Trend: expenses for last 6 months
      supabase
        .from("expenses")
        .select("amount, currency, date")
        .gte("date", trendFrom)
        .lte("date", trendTo),
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

  // Pending collections
  const pending = pendingRes.data ?? [];
  const pendingARS = pending.filter((i) => i.currency === "ARS").reduce((s, i) => s + i.amount, 0);
  const pendingUSD = pending.filter((i) => i.currency === "USD").reduce((s, i) => s + i.amount, 0);

  // Monthly trends (convert all to ARS equivalent)
  const trendIncome = trendIncomeRes.data ?? [];
  const trendExpenses = trendExpensesRes.data ?? [];
  const trendsData = trendMonths.map(({ label, from, to }) => {
    const monthIncome = trendIncome.filter((i) => i.date >= from && i.date <= to);
    const monthExpenses = trendExpenses.filter((e) => e.date >= from && e.date <= to);
    const ingresos = monthIncome.reduce(
      (s, i) => s + (i.currency === "USD" ? i.amount * usdRate : i.amount),
      0,
    );
    const gastos = monthExpenses.reduce(
      (s, e) => s + (e.currency === "USD" ? e.amount * usdRate : e.amount),
      0,
    );
    return { month: label.charAt(0).toUpperCase() + label.slice(1), ingresos, gastos };
  });

  return {
    incomeARS,
    incomeUSD,
    expensesARS,
    expensesUSD,
    totalIncome,
    totalExpenses,
    pendingARS,
    pendingUSD,
    trendsData,
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

      {/* Pending collections */}
      {(data.pendingARS > 0 || data.pendingUSD > 0) && (
        <Link
          href="/finanzas"
          className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-colors"
        >
          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-sm text-muted-foreground">Pendiente de cobro:</span>
          <div className="flex gap-3 ml-1">
            {data.pendingARS > 0 && (
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(data.pendingARS, "ARS")}
              </span>
            )}
            {data.pendingUSD > 0 && (
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(data.pendingUSD, "USD")}
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Monthly trends chart */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">
          Evolución últimos 6 meses
        </h2>
        <div className="bg-card border border-border rounded-lg p-4">
          <TrendsChart data={data.trendsData} />
        </div>
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
