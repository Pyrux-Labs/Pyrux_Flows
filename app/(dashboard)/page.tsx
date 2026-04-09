import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfWeek, subMonths, format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Receipt, Users, FolderKanban, DollarSign, Wallet, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants/labels";
import { TrendsChart } from "@/components/modules/dashboard/trends-chart";

interface DolarBlue {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

async function getDolarBlue(): Promise<DolarBlue | null> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


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

  const [
    dolarBlue,
    creditsRes,
    debitsRes,
    prospectsThisWeekRes,
    activeProjectsRes,
    recentProspectsRes,
    recentCreditsRes,
    trendCreditsRes,
    trendDebitsRes,
    maintenanceProjectsRes,
    maintenanceReceivedRes,
  ] = await Promise.all([
    getDolarBlue(),
    supabase
      .from("movements")
      .select("amount, currency")
      .eq("type", "credit")
      .gte("date", monthFrom)
      .lte("date", monthTo),
    supabase
      .from("movements")
      .select("amount, currency")
      .eq("type", "debit")
      .gte("date", monthFrom)
      .lte("date", monthTo),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekFrom),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "desarrollo"),
    supabase
      .from("prospects")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("movements")
      .select("id, description, counterpart_name, amount, currency, date")
      .eq("type", "credit")
      .order("date", { ascending: false })
      .limit(5),
    // Trend: credits for last 6 months
    supabase
      .from("movements")
      .select("amount, currency, date")
      .eq("type", "credit")
      .gte("date", trendFrom)
      .lte("date", trendTo),
    // Trend: debits for last 6 months
    supabase
      .from("movements")
      .select("amount, currency, date")
      .eq("type", "debit")
      .gte("date", trendFrom)
      .lte("date", trendTo),
    // Maintenance control: expected
    supabase
      .from("projects")
      .select("maintenance_amount, maintenance_currency")
      .eq("status", "mantenimiento"),
    // Maintenance control: received this month
    supabase
      .from("movements")
      .select("amount, currency")
      .eq("type", "credit")
      .eq("category", "mantenimiento")
      .gte("date", monthFrom)
      .lte("date", monthTo),
  ]);

  // Balance: read from settings (saved during sync from bank_report closing balance)
  const { data: balanceSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "mp_balance_ars")
    .single();

  const mpBalanceARS = balanceSetting?.value ? parseFloat(balanceSetting.value) : null;

  const credits = creditsRes.data ?? [];
  const debits = debitsRes.data ?? [];
  const arsToUsd = (ars: number) => (dolarBlue ? ars / dolarBlue.compra : 0);

  const totalIncomeUSD = credits.reduce(
    (s, i) => s + (i.currency === "USD" ? i.amount : arsToUsd(i.amount)),
    0,
  );
  const totalExpensesUSD = debits.reduce(
    (s, e) => s + (e.currency === "USD" ? e.amount : arsToUsd(e.amount)),
    0,
  );
  const netoUSD = totalIncomeUSD - totalExpensesUSD;

  // Monthly trends in USD
  const trendCredits = trendCreditsRes.data ?? [];
  const trendDebits = trendDebitsRes.data ?? [];
  const fallbackRate = dolarBlue?.venta ?? 1;
  const toUSD = (amount: number, currency: string) =>
    currency === "USD" ? amount : amount / fallbackRate;

  const trendsData = trendMonths.map(({ label, from, to }) => {
    const monthCredits = trendCredits.filter((i) => i.date >= from && i.date <= to);
    const monthDebits = trendDebits.filter((e) => e.date >= from && e.date <= to);
    const ingresos = monthCredits.reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
    const gastos = monthDebits.reduce((s, e) => s + toUSD(e.amount, e.currency), 0);
    return { month: label.charAt(0).toUpperCase() + label.slice(1), ingresos, gastos };
  });

  // Maintenance control
  const maintenanceProjects = maintenanceProjectsRes.data ?? [];
  const maintenanceReceived = maintenanceReceivedRes.data ?? [];

  const maintenanceExpected = {
    ARS: maintenanceProjects
      .filter((p) => p.maintenance_currency === "ARS")
      .reduce((s, p) => s + (p.maintenance_amount ?? 0), 0),
    USD: maintenanceProjects
      .filter((p) => p.maintenance_currency === "USD")
      .reduce((s, p) => s + (p.maintenance_amount ?? 0), 0),
  };
  const maintenanceActual = {
    ARS: maintenanceReceived
      .filter((m) => m.currency === "ARS")
      .reduce((s, m) => s + m.amount, 0),
    USD: maintenanceReceived
      .filter((m) => m.currency === "USD")
      .reduce((s, m) => s + m.amount, 0),
  };

  return {
    dolarBlue,
    mpBalanceARS,
    totalIncomeUSD,
    totalExpensesUSD,
    netoUSD,
    trendsData,
    prospectsThisWeek: prospectsThisWeekRes.count ?? 0,
    activeProjects: activeProjectsRes.count ?? 0,
    recentProspects: recentProspectsRes.data ?? [],
    recentIncome: recentCreditsRes.data ?? [],
    maintenanceExpected,
    maintenanceActual,
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Widget
          icon={TrendingUp}
          label="Ingresos del mes"
          primary={formatCurrency(data.totalIncomeUSD, "USD")}
          href="/finanzas"
        />
        <Widget
          icon={Receipt}
          label="Gastos del mes"
          primary={formatCurrency(data.totalExpensesUSD, "USD")}
          href="/gastos"
        />
        <Widget
          icon={data.netoUSD >= 0 ? TrendingUp : Receipt}
          label="Neto del mes"
          primary={formatCurrency(Math.abs(data.netoUSD), "USD")}
          subtext={data.netoUSD >= 0 ? "ganancia" : "pérdida"}
          positive={data.netoUSD >= 0}
          href="/finanzas"
        />
      </div>

      {/* Secondary widgets */}
      <div className="grid grid-cols-2 gap-4">
        <Widget
          icon={Users}
          label="Prospectos esta semana"
          primary={String(data.prospectsThisWeek)}
          subtext="nuevos contactos"
          href="/prospectos"
        />
        <Widget
          icon={FolderKanban}
          label="En desarrollo"
          primary={String(data.activeProjects)}
          subtext="en curso"
          href="/proyectos"
        />
      </div>

      {/* MP Balance */}
      {data.mpBalanceARS !== null && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Saldo Mercado Pago</span>
          </div>
          <div className="flex items-end gap-4">
            <p className={`text-xl font-bold ${data.mpBalanceARS >= 0 ? "text-foreground" : "text-destructive"}`}>
              {formatCurrency(data.mpBalanceARS, "ARS")}
            </p>
            {data.dolarBlue && (
              <p className="text-sm text-muted-foreground mb-0.5">
                ≈ {formatCurrency(data.mpBalanceARS / data.dolarBlue.venta, "USD")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dólar blue */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Dólar blue</span>
          {data.dolarBlue && (
            <span className="text-xs text-muted-foreground ml-auto">
              Actualizado{" "}
              {new Date(data.dolarBlue.fechaActualizacion).toLocaleString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Argentina/Buenos_Aires",
              })}
            </span>
          )}
        </div>
        {data.dolarBlue ? (
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Compra</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(data.dolarBlue.compra, "ARS")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Venta</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(data.dolarBlue.venta, "ARS")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No disponible</p>
        )}
      </div>

      {/* Maintenance control */}
      {(data.maintenanceExpected.ARS > 0 || data.maintenanceExpected.USD > 0) && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Control de mantenimientos</span>
            <span className="text-xs text-muted-foreground ml-auto">este mes</span>
          </div>
          <div className="space-y-2">
            {(["ARS", "USD"] as const).map((currency) => {
              const expected = data.maintenanceExpected[currency];
              const actual = data.maintenanceActual[currency];
              if (expected === 0) return null;
              const diff = actual - expected;
              const complete = diff >= 0;
              return (
                <div key={currency} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground w-10">{currency}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-foreground font-mono">
                      {formatCurrency(actual, currency)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground font-mono">
                      {formatCurrency(expected, currency)}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${complete ? "text-green-400" : "text-yellow-400"}`}>
                    {complete
                      ? "completo"
                      : `falta ${formatCurrency(Math.abs(diff), currency)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
            <Link href="/prospectos" className="text-xs text-primary hover:underline">
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
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
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
            <Link href="/finanzas" className="text-xs text-primary hover:underline">
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
                      {i.description ?? i.counterpart_name ?? "Transferencia recibida"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(i.date)}</p>
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
  subtext,
  href,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  primary: string;
  subtext?: string;
  href: string;
  positive?: boolean;
}) {
  const primaryColor =
    positive === undefined
      ? "text-foreground"
      : positive
        ? "text-green-400"
        : "text-destructive";

  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-lg p-4 space-y-2 hover:border-primary/40 transition-colors block"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${primaryColor}`}>{primary}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </Link>
  );
}
