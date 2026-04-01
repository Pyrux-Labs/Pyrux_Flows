import { createAdminClient } from "@/lib/supabase/admin";
import type { MpRule } from "@/lib/types/database.types";

const MP_API = "https://api.mercadopago.com";
const ML_API = "https://api.mercadolibre.com";

interface MpUser {
  id: number;
  first_name: string;
  last_name: string;
}

interface MpPayment {
  id: number;
  date_created: string;
  date_approved: string | null;
  status: string;
  operation_type: string;
  transaction_amount: number;
  currency_id: string;
  description: string | null;
  collector_id: number | null;
  payer: { id?: number; first_name?: string; last_name?: string } | null;
}

interface MpSearchResponse {
  results: MpPayment[];
  paging: { total: number; limit: number; offset: number };
}

// Account movements API (api.mercadolibre.com — no /v1/ prefix)
// Returns ALL account events including outgoing transfers not visible in payments/search
interface MpAccountMovement {
  id: number;
  user_id: number;
  type: "income" | "expense";
  detail: string; // "payment", "money_transfer", "bank_transfer", etc.
  amount: number; // positive for income, negative for expense
  currency_id: string;
  reference_id: number | null;
  status: string; // "available" | "unavailable"
  date_created: string;
  date_released: string | null;
}

interface MpMovementsResponse {
  results: MpAccountMovement[];
  paging: { total: number; limit: number; offset: number };
}

async function apiFetch<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${baseUrl}${path} — ${body}`);
  }
  return res.json() as Promise<T>;
}

// Some older ML endpoints require the token as a query param instead of Bearer header
async function mlFetch<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `${ML_API}${path}${separator}access_token=${process.env.MP_ACCESS_TOKEN}`,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${ML_API}${path} — ${body}`);
  }
  return res.json() as Promise<T>;
}

function toISOString(date: Date): string {
  return date.toISOString();
}

function buildRuleMap(rules: MpRule[]): Map<string, MpRule> {
  const map = new Map<string, MpRule>();
  for (const rule of rules) {
    map.set(`${rule.counterpart_id}:${rule.type}`, rule);
  }
  return map;
}

export async function runMercadoPagoSync(): Promise<{ synced: number }> {
  const supabase = createAdminClient();

  // 1. Get own MP user ID (Mercado Libre API, no /v1 prefix)
  const me = await apiFetch<MpUser>(ML_API, "/users/me");
  const myUserId = me.id;

  // 2. Determine sync window
  const { data: lastSyncSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "last_sync_at")
    .single();

  const beginDate = lastSyncSetting?.value
    ? new Date(lastSyncSetting.value)
    : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months back on first sync

  const endDate = new Date();

  const dateParams =
    `&range=date_created` +
    `&begin_date=${toISOString(beginDate)}` +
    `&end_date=${toISOString(endDate)}` +
    `&limit=300`;

  // 3a. Credits: payments/search (has full counterpart info)
  // 3b. Debits:  account movements API — the only source for outgoing transfers
  const [paymentsRes, debitsRes] = await Promise.all([
    apiFetch<MpSearchResponse>(
      MP_API,
      `/v1/payments/search?sort=date_created&criteria=desc${dateParams}`,
    ),
    mlFetch<MpMovementsResponse>(
      `/mercadopago_account/movements/search?type=expense&status=available${dateParams}`,
    ),
  ]);

  console.log(
    `[sync-mp] window: ${toISOString(beginDate)} → ${toISOString(endDate)}, ` +
    `payments: ${paymentsRes.results.length}, expense_movements: ${debitsRes.results.length}`,
  );

  // 4. Load mp_rules for auto-assignment
  const { data: rules } = await supabase.from("mp_rules").select("*");
  const ruleMap = buildRuleMap(rules ?? []);

  // 5a. Build credit movements from payments/search
  const approvedPayments = paymentsRes.results.filter((p) => p.status === "approved");
  const creditMovements = approvedPayments
    .filter((p) => p.collector_id === myUserId && p.payer?.id != null)
    .map((p) => {
      const counterpartId = String(p.payer!.id);
      const counterpartName =
        [p.payer!.first_name, p.payer!.last_name].filter(Boolean).join(" ") || null;
      const rule = ruleMap.get(`${counterpartId}:credit`);
      return {
        mp_id: String(p.id),
        type: "credit" as const,
        amount: p.transaction_amount,
        currency: p.currency_id === "ARS" ? "ARS" : "USD",
        description: p.description ?? null,
        date: (p.date_approved ?? p.date_created).split("T")[0],
        counterpart_id: counterpartId,
        counterpart_name: counterpartName,
        project_id: rule?.project_id ?? null,
        category: rule?.category ?? null,
        is_recurring: rule?.is_recurring ?? false,
      };
    });

  // 5b. Build debit movements from account movements API
  // Use reference_id as mp_id so it deduplicates against any payment that may also be in payments/search
  const debitMovements = debitsRes.results.map((m) => {
    const mpId = String(m.reference_id ?? m.id);
    const rule = ruleMap.get(`${mpId}:debit`);
    return {
      mp_id: `debit_${mpId}`,
      type: "debit" as const,
      amount: Math.abs(m.amount),
      currency: m.currency_id === "ARS" ? "ARS" : "USD",
      description: m.detail ?? null,
      date: (m.date_released ?? m.date_created).split("T")[0],
      counterpart_id: null,
      counterpart_name: null,
      project_id: rule?.project_id ?? null,
      category: rule?.category ?? null,
      is_recurring: rule?.is_recurring ?? false,
    };
  });

  const movements = [...creditMovements, ...debitMovements];

  console.log(
    `[sync-mp] credits: ${creditMovements.length}, debits: ${debitMovements.length}, total: ${movements.length}`,
  );

  // 6. Upsert — mp_id unique constraint prevents duplicates
  const { error } = await supabase
    .from("movements")
    .upsert(movements, { onConflict: "mp_id", ignoreDuplicates: true });

  if (error) throw error;

  // 7. Update last sync timestamp
  await supabase.from("settings").upsert(
    { key: "last_sync_at", value: endDate.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  return { synced: movements.length };
}
