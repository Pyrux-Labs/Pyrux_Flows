import { createAdminClient } from "@/lib/supabase/admin";
import { getMpAccessToken } from "@/lib/mp/token";

const MP_API = "https://api.mercadopago.com";
const ML_API = "https://api.mercadolibre.com";
const AR_TZ = "America/Argentina/Buenos_Aires";

function toArgentinaDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-CA", { timeZone: AR_TZ });
}

interface MpUser {
  id: number;
}

interface MpPayment {
  id: number;
  date_created: string;
  date_approved: string | null;
  status: string;
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

interface ReportListItem {
  id: number;
  status: "processed" | "pending" | string;
  file_name: string;
  last_modified: string;
}

interface MpRule {
  counterpart_id: string;
  type: string;
  project_id: string | null;
  category: string | null;
  is_recurring: boolean;
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MP API error ${res.status}: ${path} — ${body}`);
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

// ── Settlement report helpers ─────────────────────────────────────────────────

/** Fire-and-forget: triggers a new report generation for the next sync cycle */
function triggerReportGeneration(begin: Date, end: Date, token: string): void {
  fetch(`${MP_API}/v1/account/settlement_report`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      begin_date: begin.toISOString(),
      end_date: end.toISOString(),
    }),
    cache: "no-store",
  }).catch(() => {
    // Non-critical: next sync will try again
  });
}

/** Returns the most recently modified processed report file name, or null */
async function getLatestProcessedReport(token: string): Promise<string | null> {
  try {
    const list = await apiFetch<ReportListItem[]>("/v1/account/settlement_report/list", token);
    const processed = list
      .filter((r) => r.status === "processed" && r.file_name)
      .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());
    return processed[0]?.file_name ?? null;
  } catch {
    return null;
  }
}

async function downloadReportCsv(fileName: string, token: string): Promise<string> {
  const res = await fetch(`${MP_API}/v1/account/settlement_report/${fileName}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  return res.text();
}

interface CsvMovement {
  mp_id: string;
  type: "credit" | "debit";
  amount: number;
  currency: "ARS" | "USD";
  date: string;
}

function parseSettlementCsv(csv: string): CsvMovement[] {
  const lines = csv.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(";").map((h) => h.trim());
  const iAmount = headers.indexOf("TRANSACTION_AMOUNT");
  const iDate = headers.indexOf("TRANSACTION_DATE");
  const iSource = headers.indexOf("SOURCE_ID");
  const iPaymentMethod = headers.indexOf("PAYMENT_METHOD_TYPE");

  if (iAmount === -1 || iDate === -1 || iSource === -1) return [];

  const movements: CsvMovement[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(";");
    const rawAmount = parseFloat(cols[iAmount] ?? "0");
    const sourceId = (cols[iSource] ?? "").trim();
    const dateStr = (cols[iDate] ?? "").trim();
    const paymentMethod = iPaymentMethod !== -1 ? (cols[iPaymentMethod] ?? "").trim() : "";

    // Skip interest/rendimiento rows (no payment method = daily balance interest)
    if (!paymentMethod) continue;

    if (!sourceId || !dateStr || rawAmount === 0) continue;

    movements.push({
      mp_id: sourceId,
      type: rawAmount > 0 ? "credit" : "debit",
      amount: Math.abs(rawAmount),
      currency: "ARS",
      date: toArgentinaDate(dateStr),
    });
  }

  return movements;
}

// ── Main sync ─────────────────────────────────────────────────────────────────

export async function runMercadoPagoSync(): Promise<{ synced: number }> {
  const supabase = createAdminClient();
  const token = await getMpAccessToken();

  // 1. Get own MP user ID
  const me = await fetch(`${ML_API}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then((r) => r.json() as Promise<MpUser>);
  const myUserId = me.id;

  // 2. Determine sync window
  const { data: lastSyncSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "last_sync_at")
    .single();

  const beginDate = lastSyncSetting?.value
    ? new Date(lastSyncSetting.value)
    : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days on first sync

  const endDate = new Date();

  const dateParams =
    `&range=date_created` +
    `&begin_date=${beginDate.toISOString()}` +
    `&end_date=${endDate.toISOString()}` +
    `&limit=300`;

  // 3. In parallel: fetch payments (fast, with descriptions) + get latest report
  const [inbound, outbound, reportFileName] = await Promise.all([
    apiFetch<MpSearchResponse>(
      `/v1/payments/search?sort=date_created&criteria=desc${dateParams}`,
      token,
    ),
    apiFetch<MpSearchResponse>(
      `/v1/payments/search?payer.id=${myUserId}&sort=date_created&criteria=desc${dateParams}`,
      token,
    ),
    getLatestProcessedReport(token),
  ]);

  // 4. Load mp_rules
  const { data: rules } = await supabase.from("mp_rules").select("*");
  const ruleMap = buildRuleMap((rules ?? []) as MpRule[]);

  // 5. Build movements from payments/search (with descriptions)
  const creditMovements = inbound.results
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
        currency: (p.currency_id === "ARS" ? "ARS" : "USD") as "ARS" | "USD",
        description: p.description ?? null,
        date: toArgentinaDate(p.date_approved ?? p.date_created),
        counterpart_id: counterpartId,
        counterpart_name: counterpartName,
        project_id: rule?.project_id ?? null,
        category: rule?.category ?? null,
        is_recurring: rule?.is_recurring ?? false,
      };
    });

  const purchaseMovements = outbound.results
    .filter((p) => p.status === "approved" && p.transaction_amount > 0)
    .map((p) => {
      const counterpartId = p.collector_id != null ? String(p.collector_id) : null;
      const rule = counterpartId ? ruleMap.get(`${counterpartId}:debit`) : undefined;
      return {
        mp_id: String(p.id),
        type: "debit" as const,
        amount: p.transaction_amount,
        currency: (p.currency_id === "ARS" ? "ARS" : "USD") as "ARS" | "USD",
        description: p.description ?? null,
        date: toArgentinaDate(p.date_approved ?? p.date_created),
        counterpart_id: counterpartId,
        counterpart_name: null,
        project_id: rule?.project_id ?? null,
        category: rule?.category ?? null,
        is_recurring: false,
      };
    });

  // 6. Upsert payments/search movements first (have descriptions — take priority)
  const paymentsMovements = [...creditMovements, ...purchaseMovements];
  if (paymentsMovements.length > 0) {
    const { error } = await supabase
      .from("movements")
      .upsert(paymentsMovements, { onConflict: "mp_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  // 7. Process latest settlement report (adds money_transfers + interest not in payments/search)
  let settlementCount = 0;
  if (reportFileName) {
    const csv = await downloadReportCsv(reportFileName, token);
    const csvMovements = parseSettlementCsv(csv);

    const knownMpIds = new Set(paymentsMovements.map((m) => m.mp_id));
    const settlementMovements = csvMovements
      .filter((m) => !knownMpIds.has(m.mp_id))
      .map((m) => ({
        mp_id: m.mp_id,
        type: m.type,
        amount: m.amount,
        currency: m.currency,
        description: null,
        date: m.date,
        counterpart_id: null,
        counterpart_name: null,
        project_id: null,
        category: null,
        is_recurring: false,
      }));

    if (settlementMovements.length > 0) {
      const { error } = await supabase
        .from("movements")
        .upsert(settlementMovements, { onConflict: "mp_id", ignoreDuplicates: true });
      if (error) throw error;
      settlementCount = settlementMovements.length;
    }
  }

  // 8. Trigger new report generation for next sync (fire and forget)
  triggerReportGeneration(beginDate, endDate, token);

  // 9. Save sync timestamp
  await supabase.from("settings").upsert(
    { key: "last_sync_at", value: endDate.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  return { synced: paymentsMovements.length + settlementCount };
}
