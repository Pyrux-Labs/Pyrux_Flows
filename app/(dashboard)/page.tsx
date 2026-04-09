import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfWeek, subMonths, addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
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

  // Maintenance control — everything normalized to USD via dólar blue
  const maintenanceProjects = maintenanceProjectsRes.data ?? [];
  const maintenanceReceived = maintenanceReceivedRes.data ?? [];
  const blueRate = dolarBlue?.venta ?? null;

  const maintenanceExpectedUSD = maintenanceProjects.reduce((s, p) => {
    const amount = p.maintenance_amount ?? 0;
    if (p.maintenance_currency === "USD") return s + amount;
    if (blueRate) return s + amount / blueRate;
    return s;
  }, 0);

  const maintenanceActualUSD = maintenanceReceived.reduce((s, m) => {
    if (m.currency === "USD") return s + m.amount;
    if (blueRate) return s + m.amount / blueRate;
    return s;
  }, 0);

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
    maintenanceExpectedUSD,
    maintenanceActualUSD,
    nextMonthName: format(addMonths(now, 1), "MMMM", { locale: es }),
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

      {/* Compact stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <CompactWidget
          icon={TrendingUp}
          label="Ingresos"
          primary={formatCurrency(data.totalIncomeUSD, "USD")}
          subtext="este mes"
          href="/finanzas"
        />
        <CompactWidget
          icon={Receipt}
          label="Gastos"
          primary={formatCurrency(data.totalExpensesUSD, "USD")}
          subtext="este mes"
          href="/gastos"
        />
        <CompactWidget
          icon={data.netoUSD >= 0 ? TrendingUp : Receipt}
          label="Neto"
          primary={formatCurrency(Math.abs(data.netoUSD), "USD")}
          subtext={data.netoUSD >= 0 ? "ganancia" : "pérdida"}
          positive={data.netoUSD >= 0}
          href="/finanzas"
        />
        <CompactWidget
          icon={Users}
          label="Prospectos"
          primary={String(data.prospectsThisWeek)}
          subtext="esta semana"
          href="/prospectos"
        />
        <CompactWidget
          icon={FolderKanban}
          label="En desarrollo"
          primary={String(data.activeProjects)}
          subtext="proyectos"
          href="/proyectos"
        />
      </div>

      {/* Middle row: Saldo MP | Control este mes | Próximo mes | Dólar blue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Saldo MP */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Saldo MP</span>
          </div>
          {data.mpBalanceARS !== null ? (
            <>
              <p className={`text-lg font-bold ${data.mpBalanceARS >= 0 ? "text-foreground" : "text-destructive"}`}>
                {formatCurrency(data.mpBalanceARS, "ARS")}
              </p>
              {data.dolarBlue && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formatCurrency(data.mpBalanceARS / data.dolarBlue.venta, "USD")}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        {/* Control mantenimientos este mes */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Mantenimiento</span>
            <span className="text-xs text-muted-foreground ml-auto">este mes</span>
          </div>
          {data.maintenanceExpectedUSD > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(data.maintenanceActualUSD, "USD")}
                </p>
                <p className="text-xs text-muted-foreground">
                  / {formatCurrency(data.maintenanceExpectedUSD, "USD")}
                </p>
              </div>
              {(() => {
                const diff = data.maintenanceActualUSD - data.maintenanceExpectedUSD;
                return (
                  <p className={`text-xs font-medium ${diff >= 0 ? "text-green-400" : "text-yellow-400"}`}>
                    {diff >= 0 ? "✓ Completo" : `Falta ≈ ${formatCurrency(Math.abs(diff), "USD")}`}
                  </p>
                );
              })()}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin mantenimientos</p>
          )}
        </div>

        {/* Próximo mes */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground capitalize">{data.nextMonthName}</span>
          </div>
          {data.maintenanceExpectedUSD > 0 ? (
            <>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(data.maintenanceExpectedUSD, "USD")}
              </p>
              <p className="text-xs text-muted-foreground">esperado en mantenimiento</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin mantenimientos</p>
          )}
        </div>

        {/* Dólar blue */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Dólar blue</span>
          </div>
          {data.dolarBlue ? (
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Compra</p>
                <p className="text-base font-bold text-foreground">
                  {formatCurrency(data.dolarBlue.compra, "ARS")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Venta</p>
                <p className="text-base font-bold text-foreground">
                  {formatCurrency(data.dolarBlue.venta, "ARS")}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No disponible</p>
          )}
        </div>
      </div>

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

function CompactWidget({
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
      className="bg-card border border-border rounded-lg p-3 hover:border-primary/40 transition-colors block"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <p className={`text-lg font-bold ${primaryColor}`}>{primary}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </Link>
  );
}
