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
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${baseUrl}${path} — ${body}`);
  }
  return res.json() as Promise<T>;
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

  // 1. Get own MP user ID
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

  // 3. Fetch inbound payments (payments/search only returns where we're the collector)
  // Outgoing transfers are captured via webhook — see /api/webhooks/mercadopago
  const { results } = await apiFetch<MpSearchResponse>(
    MP_API,
    `/v1/payments/search?sort=date_created&criteria=desc` +
      `&range=date_created` +
      `&begin_date=${beginDate.toISOString()}` +
      `&end_date=${endDate.toISOString()}` +
      `&limit=300`,
  );

  // 4. Load mp_rules for auto-assignment
  const { data: rules } = await supabase.from("mp_rules").select("*");
  const ruleMap = buildRuleMap(rules ?? []);

  // 5. Build credit movements
  const movements = results
    .filter(
      (p) =>
        p.status === "approved" &&
        p.collector_id === myUserId &&
        p.payer?.id != null,
    )
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

  // 6. Upsert — mp_id unique constraint prevents duplicates
  if (movements.length > 0) {
    const { error } = await supabase
      .from("movements")
      .upsert(movements, { onConflict: "mp_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  // 7. Save sync timestamp only if we got results
  await supabase.from("settings").upsert(
    { key: "last_sync_at", value: endDate.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  return { synced: movements.length };
}
