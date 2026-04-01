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

async function apiFetch<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${baseUrl}${path}`);
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

  // 3. Fetch payments from MP — two queries in parallel:
  //    a) payments where we're the collector (inbound/credits)
  //    b) payments where we're the payer (outbound/debits)
  const dateParams =
    `&range=date_created` +
    `&begin_date=${toISOString(beginDate)}` +
    `&end_date=${toISOString(endDate)}` +
    `&limit=300`;

  const [asCollector, asPayer] = await Promise.all([
    apiFetch<MpSearchResponse>(
      MP_API,
      `/v1/payments/search?sort=date_created&criteria=desc${dateParams}`,
    ),
    apiFetch<MpSearchResponse>(
      MP_API,
      `/v1/payments/search?sort=date_created&criteria=desc&payer.id=${myUserId}${dateParams}`,
    ),
  ]);

  // Deduplicate by payment id (a payment can appear in both queries)
  const seen = new Set<number>();
  const allResults: MpPayment[] = [];
  for (const p of [...asCollector.results, ...asPayer.results]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      allResults.push(p);
    }
  }

  console.log(
    `[sync-mp] window: ${toISOString(beginDate)} → ${toISOString(endDate)}, ` +
    `asCollector: ${asCollector.results.length}, asPayer: ${asPayer.results.length}, merged: ${allResults.length}`,
  );

  if (allResults.length === 0) {
    return { synced: 0 };
  }

  // 4. Load mp_rules for auto-assignment
  const { data: rules } = await supabase.from("mp_rules").select("*");
  const ruleMap = buildRuleMap(rules ?? []);

  const approved = allResults.filter((p) => p.status === "approved");
  console.log(
    `[sync-mp] approved: ${approved.length}, ` +
    `statuses: ${[...new Set(allResults.map((p) => p.status))].join(", ")}`,
  );
  console.log(
    `[sync-mp] with collector_id+payer: ${approved.filter((p) => p.collector_id != null && p.payer?.id != null).length}`,
  );

  // 5. Build movements — skip payments without collector_id or payer
  const movements = approved
    .filter((p) => p.collector_id != null && p.payer?.id != null)
    .map((p) => {
      const isCredit = p.collector_id === myUserId;
      const counterpartId = isCredit ? String(p.payer!.id) : String(p.collector_id);
      const counterpartName = isCredit
        ? [p.payer!.first_name, p.payer!.last_name].filter(Boolean).join(" ") || null
        : null;

      const movementType = isCredit ? "credit" : "debit";
      const rule = ruleMap.get(`${counterpartId}:${movementType}`);

      return {
        mp_id: String(p.id),
        type: movementType as "credit" | "debit",
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
